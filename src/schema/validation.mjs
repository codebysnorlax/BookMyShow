import { z } from "zod";

const username = z
  .string()
  .min(3, "Username must be at least 3 characters")
  .max(30, "Username must be at most 30 characters")
  .regex(/^[a-zA-Z0-9_]+$/, "Username may only contain letters, numbers, and underscores");

const password = z
  .string()
  .min(6, "Password must be at least 6 characters")
  .max(72, "Password must be at most 72 characters");

export const registerSchema = z.object({ username, password });

export const loginSchema = z.object({ username, password });

export const couponSchema = z.object({
  code: z.string().min(1, "Coupon code is required").max(20),
});
