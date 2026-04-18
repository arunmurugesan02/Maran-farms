import { ApiError } from "./apiError.js";
import { env } from "../config/env.js";

// ── In-memory OTP store ─────────────────────────────────────────────────────
// Map<phone -> { otp: string, expiresAt: number }>
const otpStore = new Map();

const OTP_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes

function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function ensureFast2SmsConfig() {
  if (!env.fast2smsApiKey) {
    throw new ApiError(500, "OTP service is not configured");
  }
}

// ── Send OTP via Quick SMS route ────────────────────────────────────────────
export async function sendOtpViaFast2Sms({ phone }) {
  ensureFast2SmsConfig();

  // phone expected as "91XXXXXXXXXX" — we only need the 10-digit number
  const tenDigit = phone.replace(/^\+?91/, "");

  const otp = generateOtp();
  const expiresAt = Date.now() + OTP_EXPIRY_MS;

  const body = {
    route: "q",
    message: `Your Maran Farms OTP is ${otp}. Valid for 5 minutes. Do not share with anyone.`,
    flash: 0,
    numbers: tenDigit
  };

  const response = await fetch("https://www.fast2sms.com/dev/bulkV2", {
    method: "POST",
    headers: {
      authorization: env.fast2smsApiKey,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok || data?.return === false) {
    const raw = data?.message;
    const message = Array.isArray(raw) ? raw[0] : (raw || "Unable to send OTP");
    console.error("[Fast2SMS DLT] send failed:", JSON.stringify(data));
    throw new ApiError(502, message);
  }

  // Store OTP after successful send
  otpStore.set(phone, { otp, expiresAt });
}

// ── Verify OTP ──────────────────────────────────────────────────────────────
export async function verifyOtpViaFast2Sms({ phone, otp }) {
  const record = otpStore.get(phone);

  if (!record) {
    throw new ApiError(400, "OTP not found. Please request a new one.");
  }

  if (Date.now() > record.expiresAt) {
    otpStore.delete(phone);
    throw new ApiError(400, "OTP has expired. Please request a new one.");
  }

  if (record.otp !== String(otp)) {
    throw new ApiError(400, "Invalid OTP. Please try again.");
  }

  // OTP used — remove from store to prevent reuse
  otpStore.delete(phone);
}
