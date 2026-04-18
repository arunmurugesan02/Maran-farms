import { z } from "zod";
import { User } from "../models/User.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { signToken } from "../utils/jwt.js";
import { env } from "../config/env.js";
import { sendOtpViaTwilio, verifyOtpViaTwilio } from "../utils/twilioVerify.js";

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
  phone: z.string().trim().regex(/^\d{10}$/, "Enter a valid 10-digit phone number")
});

const verifyOtpSchema = z.object({
  phone: z.string().trim().regex(/^\d{10}$/, "Enter a valid 10-digit phone number"),
  otp: z.string().trim().regex(/^\d{6}$/),
  name: z.string().trim().min(2).max(80)
});
const updateProfileSchema = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  pincode: z.string().trim().min(4).max(10).optional()
});
const addressSchema = z.object({
  label: z.string().trim().min(1).max(30).optional(),
  fullName: z.string().trim().min(2),
  phone: z.string().trim().min(8),
  address: z.string().trim().min(8),
  pincode: z.string().trim().min(4)
});

const OTP_EXPIRY_MS = 5 * 60 * 1000;
const RESEND_COOLDOWN_MS = 60 * 1000;
const otpCooldownStore = new Map();

function normalizePhone(phone) {
  const digits = phone.replace(/\D/g, "");

  if (digits.length === 10) return `91${digits}`;
  throw new ApiError(400, "Enter a valid Indian phone number");
}

function responseUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    pincode: user.pincode || "",
    addresses: user.addresses || [],
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

export const updateProfile = asyncHandler(async (req, res) => {
  const parsed = updateProfileSchema.safeParse(req.body);
  if (!parsed.success) throw new ApiError(400, parsed.error.issues[0].message);

  Object.assign(req.user, parsed.data);
  await req.user.save();

  res.json({
    success: true,
    data: { user: responseUser(req.user) }
  });
});

export const addAddress = asyncHandler(async (req, res) => {
  const parsed = addressSchema.safeParse(req.body);
  if (!parsed.success) throw new ApiError(400, parsed.error.issues[0].message);

  const shouldBeDefault = req.user.addresses.length === 0;
  if (shouldBeDefault) {
    req.user.addresses = req.user.addresses.map((item) => ({ ...item, isDefault: false }));
  }
  req.user.addresses.push({ ...parsed.data, isDefault: shouldBeDefault });
  await req.user.save();

  res.status(201).json({ success: true, data: { addresses: req.user.addresses } });
});

export const updateAddress = asyncHandler(async (req, res) => {
  const parsed = addressSchema.partial().safeParse(req.body);
  if (!parsed.success) throw new ApiError(400, parsed.error.issues[0].message);

  const address = req.user.addresses.id(req.params.addressId);
  if (!address) throw new ApiError(404, "Address not found");

  Object.assign(address, parsed.data);
  await req.user.save();

  res.json({ success: true, data: { addresses: req.user.addresses } });
});

export const setDefaultAddress = asyncHandler(async (req, res) => {
  const address = req.user.addresses.id(req.params.addressId);
  if (!address) throw new ApiError(404, "Address not found");

  req.user.addresses.forEach((item) => {
    item.isDefault = item._id.toString() === req.params.addressId;
  });
  await req.user.save();

  res.json({ success: true, data: { addresses: req.user.addresses } });
});

export const deleteAddress = asyncHandler(async (req, res) => {
  const address = req.user.addresses.id(req.params.addressId);
  if (!address) throw new ApiError(404, "Address not found");
  const wasDefault = address.isDefault;

  address.deleteOne();
  if (wasDefault && req.user.addresses.length > 0) {
    req.user.addresses[0].isDefault = true;
  }
  await req.user.save();

  res.json({ success: true, data: { addresses: req.user.addresses } });
});

export const requestOtp = asyncHandler(async (req, res) => {
  const parsed = phoneSchema.safeParse(req.body);
  if (!parsed.success) throw new ApiError(400, parsed.error.issues[0].message);

  const normalizedPhone = normalizePhone(parsed.data.phone);
  const now = Date.now();
  const existing = otpCooldownStore.get(normalizedPhone);
  if (existing?.cooldownUntil && existing.cooldownUntil > now) {
    const secondsLeft = Math.ceil((existing.cooldownUntil - now) / 1000);
    throw new ApiError(429, `Please wait ${secondsLeft} seconds before requesting OTP again`);
  }

  const cooldownUntil = now + RESEND_COOLDOWN_MS;

  await sendOtpViaTwilio({ phone: `+${normalizedPhone}` });
  otpCooldownStore.set(normalizedPhone, { cooldownUntil });

  res.json({
    success: true,
    data: {
      phone: normalizedPhone,
      expiresIn: Math.floor(OTP_EXPIRY_MS / 1000),
      cooldownSeconds: Math.floor(RESEND_COOLDOWN_MS / 1000)
    }
  });
});

export const verifyOtp = asyncHandler(async (req, res) => {
  const parsed = verifyOtpSchema.safeParse(req.body);
  if (!parsed.success) throw new ApiError(400, parsed.error.issues[0].message);

  const normalizedPhone = normalizePhone(parsed.data.phone);
  const isAdminPhone = normalizedPhone === env.adminPhone;
  await verifyOtpViaTwilio({ phone: `+${normalizedPhone}`, otp: parsed.data.otp });

  let user = await User.findOne({ phone: normalizedPhone });

  if (!user) {
    user = await User.create({
      name: parsed.data.name.trim(),
      phone: normalizedPhone,
      isAdmin: isAdminPhone
    });
  } else {
    let didUpdate = false;
    if (user.name !== parsed.data.name.trim()) {
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
