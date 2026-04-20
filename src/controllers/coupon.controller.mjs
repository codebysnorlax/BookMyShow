import { pool } from "../config/db.mjs";
import { AppError } from "../utils/AppError.mjs";
import { catchAsync } from "../utils/catchAsync.mjs";

const COUPONS = { SNOR99: 100, CHAI50: 50, VIP500: 500 };

export const applyCoupon = catchAsync(async (req, res, next) => {
  const code = req.body.code.toUpperCase();
  const bonus = COUPONS[code];
  if (!bonus) return next(new AppError("Invalid coupon code", 400));

  const insert = await pool.query(
    "INSERT INTO used_coupons (user_id, code) VALUES ($1, $2) ON CONFLICT DO NOTHING",
    [req.user.id, code]
  );
  if (insert.rowCount === 0) return next(new AppError("Coupon already used", 409));

  const result = await pool.query(
    "UPDATE users SET balance = balance + $1 WHERE id = $2 RETURNING balance",
    [bonus, req.user.id]
  );
  res.json({ message: `+$${bonus} added!`, newBalance: result.rows[0].balance });
});
