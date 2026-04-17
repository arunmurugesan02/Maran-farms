import { Router } from "express";
import {
  addAddress,
  deleteAddress,
  login,
  me,
  register,
  requestOtp,
  setDefaultAddress,
  updateAddress,
  updateProfile,
  verifyOtp
} from "../controllers/authController.js";
import { requireAuth } from "../middlewares/auth.js";
import { rateLimit } from "../middlewares/rateLimit.js";

export const authRouter = Router();

authRouter.post("/register", rateLimit({ scope: "auth_register", windowMs: 60_000, max: 5 }), register);
authRouter.post("/login", rateLimit({ scope: "auth_login", windowMs: 60_000, max: 8 }), login);
authRouter.post("/request-otp", rateLimit({ scope: "auth_request_otp", windowMs: 60_000, max: 4 }), requestOtp);
authRouter.post("/verify-otp", rateLimit({ scope: "auth_verify_otp", windowMs: 60_000, max: 8 }), verifyOtp);
authRouter.get("/me", requireAuth, me);
authRouter.put("/me/profile", requireAuth, updateProfile);
authRouter.post("/me/addresses", requireAuth, addAddress);
authRouter.patch("/me/addresses/:addressId", requireAuth, updateAddress);
authRouter.put("/me/addresses/:addressId/default", requireAuth, setDefaultAddress);
authRouter.delete("/me/addresses/:addressId", requireAuth, deleteAddress);
