import { pool } from "../config/db.mjs";
import { AppError } from "../utils/AppError.mjs";
import { catchAsync } from "../utils/catchAsync.mjs";

export const getSeats = catchAsync(async (req, res) => {
  const result = await pool.query(`
    SELECT s.id, s.isbooked, s.price, s.type, u.username AS booked_by
    FROM seats s
    LEFT JOIN users u ON s.user_id = u.id
    ORDER BY s.id
  `);
  res.json(result.rows);
});

export const bookSeat = catchAsync(async (req, res, next) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return next(new AppError("Invalid seat ID", 400));

  let conn;
  try {
    conn = await pool.connect();
    await conn.query("BEGIN");

    const seatResult = await conn.query(
      "SELECT * FROM seats WHERE id = $1 AND isbooked = 0 FOR UPDATE",
      [id]
    );
    if (seatResult.rowCount === 0) {
      await conn.query("ROLLBACK");
      conn.release();
      return next(new AppError("Seat already booked", 409));
    }

    const seat = seatResult.rows[0];
    const userResult = await conn.query(
      "SELECT balance, bookings FROM users WHERE id = $1 FOR UPDATE",
      [req.user.id]
    );
    const user = userResult.rows[0];

    if (user.bookings > 0 && user.balance < seat.price) {
      await conn.query("ROLLBACK");
      conn.release();
      return next(new AppError(`Insufficient balance. Need $${seat.price}, have $${user.balance}`, 402));
    }

    const newBalance = Math.max(0, user.balance - seat.price);

    await conn.query("UPDATE seats SET isbooked = 1, user_id = $2 WHERE id = $1", [id, req.user.id]);
    await conn.query("UPDATE users SET balance = $1, bookings = bookings + 1 WHERE id = $2", [
      newBalance,
      req.user.id,
    ]);

    await conn.query("COMMIT");
    conn.release();
    res.json({ message: `Seat ${id} booked`, newBalance });
  } catch (ex) {
    try { await conn?.query("ROLLBACK"); } catch {}
    conn?.release();
    throw ex; // let catchAsync/errorMiddleware handle it
  }
});
