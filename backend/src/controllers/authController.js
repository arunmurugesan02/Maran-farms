import { z } from "zod";
import { User } from "../models/User.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { signToken } from "../utils/jwt.js";

const registerSchema = z.object({
  name: z.string().trim().min(2),
  email: z.string().trim().email(),
  password: z.string().min(6)
});

const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(6)
});

function responseUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    isAdmin: user.isAdmin
  };
}

export const register = asyncHandler(async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) throw new ApiError(400, parsed.error.issues[0].message);

  const existing = await User.findOne({ email: parsed.data.email });
  if (existing) throw new ApiError(409, "Email already registered");

  const user = await User.create({
    ...parsed.data,
    isAdmin: parsed.data.email === "admin@maranfarms.com"
  });
  const token = signToken(user._id.toString());

  res.status(201).json({
    success: true,
    data: {
      token,
      user: responseUser(user)
    }
  });
});

export const login = asyncHandler(async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) throw new ApiError(400, parsed.error.issues[0].message);

  const user = await User.findOne({ email: parsed.data.email });
  if (!user) throw new ApiError(401, "Invalid credentials");

  const isPasswordValid = await user.comparePassword(parsed.data.password);
  if (!isPasswordValid) throw new ApiError(401, "Invalid credentials");

  const token = signToken(user._id.toString());

  res.json({
    success: true,
    data: {
      token,
      user: responseUser(user)
    }
  });
});

export const me = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    data: { user: responseUser(req.user) }
  });
});
