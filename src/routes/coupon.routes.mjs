import { Router } from "express";
import { applyCoupon } from "../controllers/coupon.controller.mjs";
import { authMiddleware } from "../middlewares/auth.middleware.mjs";
import { validate } from "../middlewares/validate.middleware.mjs";
import { couponSchema } from "../schema/validation.mjs";
import { doubleCsrfProtection } from "../middlewares/csrf.middleware.mjs";

const router = Router();

router.post("/", doubleCsrfProtection, authMiddleware, validate(couponSchema), applyCoupon);

export default router;
