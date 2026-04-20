import { Router } from "express";
import { getSeats, bookSeat } from "../controllers/seat.controller.mjs";
import { authMiddleware } from "../middlewares/auth.middleware.mjs";
import { doubleCsrfProtection } from "../middlewares/csrf.middleware.mjs";

const router = Router();

router.get("/", getSeats);
router.put("/:id", doubleCsrfProtection, authMiddleware, bookSeat);

export default router;
