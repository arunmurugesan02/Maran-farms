import { z } from "zod";
import { User } from "../models/User.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { signToken } from "../utils/jwt.js";
import { env } from "../config/env.js";

const registerSchema = z.object({
  name: z.string().trim().min(2),
  email: z.string().trim().email(),
  password: z.string().min(6)
});

const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(6)
});

const phoneSchema = z.object({
  phone: z.string().trim().min(10)
});

const verifyOtpSchema = z.object({
  phone: z.string().trim().min(10),
  otp: z.string().trim().regex(/^\d{6}$/),
  name: z.string().trim().min(2).max(80).optional()
});

const OTP_EXPIRY_MS = 5 * 60 * 1000;
const RESEND_COOLDOWN_MS = 30 * 1000;
const otpStore = new Map();

function normalizePhone(phone) {
  const digits = phone.replace(/\D/g, "");

  if (digits.length === 10) return `91${digits}`;
  if (digits.length === 12 && digits.startsWith("91")) return digits;
  throw new ApiError(400, "Enter a valid Indian phone number");
}

function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function responseUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    phone: user.phone,
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

export const requestOtp = asyncHandler(async (req, res) => {
  const parsed = phoneSchema.safeParse(req.body);
  if (!parsed.success) throw new ApiError(400, parsed.error.issues[0].message);

  const normalizedPhone = normalizePhone(parsed.data.phone);
  const now = Date.now();
  const existing = otpStore.get(normalizedPhone);
  if (existing?.cooldownUntil && existing.cooldownUntil > now) {
    throw new ApiError(429, "Please wait before requesting OTP again");
  }

  const otp = generateOtp();
  const expiresAt = now + OTP_EXPIRY_MS;
  const cooldownUntil = now + RESEND_COOLDOWN_MS;

  otpStore.set(normalizedPhone, {
    otp,
    expiresAt,
    cooldownUntil
  });

  console.log(`OTP for ${normalizedPhone}: ${otp}`);

  res.json({
    success: true,
    data: {
      phone: normalizedPhone,
      expiresIn: Math.floor(OTP_EXPIRY_MS / 1000),
      ...(env.nodeEnv !== "production" ? { otp } : {})
    }
  });
});

export const verifyOtp = asyncHandler(async (req, res) => {
  const parsed = verifyOtpSchema.safeParse(req.body);
  if (!parsed.success) throw new ApiError(400, parsed.error.issues[0].message);

  const normalizedPhone = normalizePhone(parsed.data.phone);
  const isAdminPhone = normalizedPhone === env.adminPhone;
  const otpData = otpStore.get(normalizedPhone);

  if (!otpData) throw new ApiError(400, "OTP not requested for this number");
  if (Date.now() > otpData.expiresAt) {
    otpStore.delete(normalizedPhone);
    throw new ApiError(400, "OTP expired. Request a new one");
  }
  if (otpData.otp !== parsed.data.otp) throw new ApiError(400, "Invalid OTP");

  otpStore.delete(normalizedPhone);

  let user = await User.findOne({ phone: normalizedPhone });

  if (!user) {
    const fallbackName = `Customer ${normalizedPhone.slice(-4)}`;
    user = await User.create({
      name: parsed.data.name?.trim() || fallbackName,
      phone: normalizedPhone,
      isAdmin: isAdminPhone
    });
  } else {
    let didUpdate = false;
    if (parsed.data.name && user.name !== parsed.data.name.trim()) {
      user.name = parsed.data.name.trim();
      didUpdate = true;
    }
    if (isAdminPhone && !user.isAdmin) {
      user.isAdmin = true;
      didUpdate = true;
    }
    if (didUpdate) {
      await user.save();
    }
  }

  const token = signToken(user._id.toString());

  res.json({
    success: true,
    data: {
      token,
      user: responseUser(user)
    }
  });
});
