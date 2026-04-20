import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { pool } from "../config/db.mjs";
import { AppError } from "../utils/AppError.mjs";
import { catchAsync } from "../utils/catchAsync.mjs";

const COOKIE_OPTS = {
  httpOnly: true,
  sameSite: "strict",
  maxAge: 24 * 60 * 60 * 1000, // 1 day
  secure: process.env.NODE_ENV === "production",
};

export const register = catchAsync(async (req, res) => {
  const { username, password } = req.body;
  const hashed = await bcrypt.hash(password, 10);
  const balance = Math.floor(Math.random() * 1201) + 300;
  await pool.query(
    "INSERT INTO users (username, password, balance) VALUES ($1, $2, $3)",
    [username, hashed, balance]
  );
  res.status(201).json({ message: "User registered" });
});

export const login = catchAsync(async (req, res, next) => {
  const { username, password } = req.body;
  const result = await pool.query("SELECT * FROM users WHERE username = $1", [username]);
  const user = result.rows[0];
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return next(new AppError("Invalid credentials", 401));
  }
  const token = jwt.sign({ id: user.id, username: user.username }, process.env.JWT_SECRET, {
    expiresIn: "1d",
  });
  res.cookie("token", token, COOKIE_OPTS);
  res.json({ message: "Logged in", balance: user.balance, username: user.username });
});

export const me = catchAsync(async (req, res) => {
  const result = await pool.query("SELECT id, username, balance, bookings FROM users WHERE id = $1", [
    req.user.id,
  ]);
  res.json(result.rows[0]);
});

export const logout = (req, res) => {
  res.clearCookie("token", COOKIE_OPTS);
  res.json({ message: "Logged out" });
};
