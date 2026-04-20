import { Router } from "express";
import { register, login, me, logout } from "../controllers/auth.controller.mjs";
import { authMiddleware } from "../middlewares/auth.middleware.mjs";
import { validate } from "../middlewares/validate.middleware.mjs";
import { registerSchema, loginSchema } from "../schema/validation.mjs";
import { doubleCsrfProtection } from "../middlewares/csrf.middleware.mjs";

const router = Router();

router.post("/register", validate(registerSchema), register);
router.post("/login", validate(loginSchema), login);
router.get("/me", authMiddleware, me);
router.post("/logout", doubleCsrfProtection, logout);

export default router;
