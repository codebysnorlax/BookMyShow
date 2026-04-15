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
  host: (process.env.DB_HOST || '').replace(/`/g, ''),
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  max: 20,
});

await pool.query(`
  CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    balance INT NOT NULL DEFAULT 0,
    bookings INT NOT NULL DEFAULT 0
  );
  CREATE TABLE IF NOT EXISTS seats (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255),
    isbooked INT DEFAULT 0,
    price INT NOT NULL DEFAULT 100,
    type VARCHAR(10) NOT NULL DEFAULT 'regular'
  );
  INSERT INTO seats (isbooked, price, type)
  SELECT * FROM (VALUES
    (0, 1400, 'sofa'), (0, 1500, 'sofa'), (0, 1350, 'sofa'), (0, 1450, 'sofa'), (0, 1200, 'sofa'),
    (0, 810, 'regular'), (0, 760, 'regular'), (0, 900, 'regular'), (0, 780, 'regular'), (0, 830, 'regular'),
    (0, 510, 'regular'), (0, 470, 'regular'), (0, 570, 'regular'), (0, 490, 'regular'), (0, 530, 'regular'),
    (0, 260, 'regular'), (0, 230, 'regular'), (0, 310, 'regular'), (0, 240, 'regular'), (0, 280, 'regular'),
    (0, 90, 'regular'), (0, 70, 'regular'), (0, 120, 'regular'), (0, 60, 'regular'), (0, 100, 'regular'),
    (0, 50, 'regular'), (0, 40, 'regular'), (0, 80, 'regular'), (0, 45, 'regular'), (0, 60, 'regular')
  ) AS v(isbooked, price, type)
  WHERE NOT EXISTS (SELECT 1 FROM seats LIMIT 1);
`);

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
    const balance = Math.floor(Math.random() * 1201) + 300; // $300–$1500
    await pool.query("INSERT INTO users (username, password, balance) VALUES ($1, $2, $3)", [username, hashed, balance]);
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
  res.send({ token, balance: user.balance });
});

// Coupons
const COUPONS = {
  SNOR99:  100,
  CHAI50:  50,
  VIP500:  500,
};
const usedCoupons = new Map(); // "userId:code" -> true

app.post("/coupon", authMiddleware, async (req, res) => {
  const code = String(req.body.code || "").toUpperCase().trim();
  const bonus = COUPONS[code];
  if (!bonus) return res.status(400).send({ error: "Invalid coupon code" });
  const key = `${req.user.id}:${code}`;
  if (usedCoupons.has(key)) return res.status(409).send({ error: "Coupon already used" });
  usedCoupons.set(key, true);
  const result = await pool.query("UPDATE users SET balance = balance + $1 WHERE id = $2 RETURNING balance", [bonus, req.user.id]);
  res.send({ message: `+$${bonus} added!`, newBalance: result.rows[0].balance });
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

    // Lock seat
    const seatResult = await conn.query(
      "SELECT * FROM seats WHERE id = $1 AND isbooked = 0 FOR UPDATE",
      [id]
    );
    if (seatResult.rowCount === 0) {
      await conn.query("ROLLBACK");
      conn.release();
      return res.status(409).send({ error: "Seat already booked" });
    }

    const seat = seatResult.rows[0];
    const userResult = await conn.query("SELECT balance, bookings FROM users WHERE id = $1 FOR UPDATE", [req.user.id]);
    const user = userResult.rows[0];

    // Allow booking if first seat (bookings === 0) even if balance is low
    if (user.bookings > 0 && user.balance < seat.price) {
      await conn.query("ROLLBACK");
      conn.release();
      return res.status(402).send({ error: `Insufficient balance. Need $${seat.price}, have $${user.balance}` });
    }

    const deduct = Math.min(seat.price, user.balance); // for first seat, deduct what they have (or full price)
    const newBalance = user.balance - seat.price; // may go negative only on first booking

    await conn.query("UPDATE seats SET isbooked = 1, name = $2 WHERE id = $1", [id, name]);
    await conn.query("UPDATE users SET balance = $1, bookings = bookings + 1 WHERE id = $2", [Math.max(0, newBalance), req.user.id]);

    await conn.query("COMMIT");
    conn.release();
    res.json({ message: `Seat ${id} booked for ${name}`, newBalance: Math.max(0, newBalance) });
  } catch (ex) {
    console.log(ex);
    res.status(500).send({ error: "Booking failed" });
  }
});

app.listen(port, () => console.log("Server starting on port: " + port));
