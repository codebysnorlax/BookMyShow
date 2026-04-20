import jwt from "jsonwebtoken";
import { AppError } from "../utils/AppError.mjs";

export function authMiddleware(req, res, next) {
  const token = req.cookies?.token;
  if (!token) return next(new AppError("Not authenticated", 401));
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    next(new AppError("Invalid or expired token", 401));
  }
}
