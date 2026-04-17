import { Router } from "express";
import { login, me, register, requestOtp, verifyOtp } from "../controllers/authController.js";
import { requireAuth } from "../middlewares/auth.js";

export const authRouter = Router();

authRouter.post("/register", register);
authRouter.post("/login", login);
authRouter.post("/request-otp", requestOtp);
authRouter.post("/verify-otp", verifyOtp);
authRouter.get("/me", requireAuth, me);
