import crypto from "crypto";
import Razorpay from "razorpay";
import { env } from "../config/env.js";

const hasRazorpayConfig = Boolean(env.razorpayKeyId && env.razorpayKeySecret);

export const razorpayClient = hasRazorpayConfig
  ? new Razorpay({ key_id: env.razorpayKeyId, key_secret: env.razorpayKeySecret })
  : null;

export function ensureRazorpayEnabled() {
  if (!razorpayClient) {
    throw new Error("Razorpay is not configured. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.");
  }
}

export function verifyRazorpaySignature({ orderId, paymentId, signature }) {
  const body = `${orderId}|${paymentId}`;
  const expectedSignature = crypto
    .createHmac("sha256", env.razorpayKeySecret)
    .update(body)
    .digest("hex");

  return expectedSignature === signature;
}
