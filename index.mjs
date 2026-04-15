import express from "express";
import pg from "pg";
import { dirname, join, resolve } from "path";
import { fileURLToPath } from "url";
import cors from "cors";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import "dotenv/config";

const __dirname = dirname(fileURLToPath(import.meta.url));
const port = process.env.PORT || 8080;
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) throw new Error("JWT_SECRET is not set in environment");

const pool = new pg.Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  max: 20,
  connectionTimeoutMillis: 0,
  idleTimeoutMillis: 0,
});

const app = new express();
app.use(cors());
app.use(express.json());

// Auth middleware
function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).send({ error: "No token provided" });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).send({ error: "Invalid token" });
  }
}

app.get("/", (req, res) => {
  const filePath = resolve(join(__dirname, "index.html"));
  if (!filePath.startsWith(__dirname)) return res.status(403).send({ error: "Forbidden" });
  res.sendFile(filePath);
});

// Register
app.post("/register", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).send({ error: "Username and password required" });
  try {
    const hashed = await bcrypt.hash(password, 10);
    await pool.query("INSERT INTO users (username, password) VALUES ($1, $2)", [username, hashed]);
    res.status(201).send({ message: "User registered" });
  } catch (ex) {
    if (ex.code === "23505") return res.status(409).send({ error: "Username already exists" });
    res.status(500).send({ error: "Registration failed" });
  }
});

// Login
app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).send({ error: "Username and password required" });
  const safeUsername = String(username).replace(/[<>&"'/]/g, "");
  const result = await pool.query("SELECT * FROM users WHERE username = $1", [safeUsername]);
  const user = result.rows[0];
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).send({ error: "Invalid credentials" });
  }
  const token = jwt.sign({ id: user.id, username: safeUsername }, JWT_SECRET, { expiresIn: "1d" });
  res.send({ token });
});

// Get all seats
app.get("/seats", async (req, res) => {
  const result = await pool.query("SELECT * FROM seats");
  res.send(result.rows);
});

// Book a seat — protected, uses logged-in user's name
app.put("/:id", authMiddleware, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).send({ error: "Invalid seat ID" });
    const name = String(req.user.username).replace(/[<>&"'/]/g, "");
    const conn = await pool.connect();
    await conn.query("BEGIN");
    const result = await conn.query(
      "SELECT * FROM seats WHERE id = $1 AND isbooked = 0 FOR UPDATE",
      [id]
    );
    if (result.rowCount === 0) {
      await conn.query("ROLLBACK");
      conn.release();
      return res.status(409).send({ error: "Seat already booked" });
    }
    const updateResult = await conn.query(
      "UPDATE seats SET isbooked = 1, name = $2 WHERE id = $1",
      [id, name]
    );
    await conn.query("COMMIT");
    conn.release();
    res.json({ message: `Seat ${id} booked for ${name}` });
  } catch (ex) {
    console.log(ex);
    res.status(500).send({ error: "Booking failed" });
  }
});

app.listen(port, () => console.log("Server starting on port: " + port));
