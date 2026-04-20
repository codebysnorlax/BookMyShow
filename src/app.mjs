import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

import authRoutes from "./routes/auth.routes.mjs";
import seatRoutes from "./routes/seat.routes.mjs";
import couponRoutes from "./routes/coupon.routes.mjs";
import { errorMiddleware } from "./middlewares/error.middleware.mjs";
import { generateToken, doubleCsrfProtection } from "./middlewares/csrf.middleware.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));

const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.use(express.static(join(__dirname, "../public")));

// Expose CSRF token to frontend
app.get("/csrf-token", (req, res) => {
  res.json({ csrfToken: generateToken(req, res) });
});

app.use("/auth", authRoutes);
app.use(doubleCsrfProtection);
app.use("/seats", seatRoutes);
app.use("/coupon", couponRoutes);

app.use(errorMiddleware);

export default app;
