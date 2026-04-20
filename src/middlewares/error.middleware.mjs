export function errorMiddleware(err, req, res, next) {
  if (err.isOperational) {
    return res.status(err.statusCode).json({ error: err.message });
  }

  // Postgres unique violation
  if (err.code === "23505") {
    return res.status(409).json({ error: "Username already exists" });
  }

  console.error(err);
  res.status(500).json({ error: "Internal server error" });
}
