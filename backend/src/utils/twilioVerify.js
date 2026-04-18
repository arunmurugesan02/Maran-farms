import { ApiError } from "./apiError.js";
import { env } from "../config/env.js";

function ensureTwilioConfig() {
  if (!env.twilioAccountSid || !env.twilioAuthToken || !env.twilioVerifyServiceSid) {
    throw new ApiError(500, "OTP service is not configured");
  }
}

function buildAuthHeader() {
  const token = Buffer.from(`${env.twilioAccountSid}:${env.twilioAuthToken}`).toString("base64");
  return `Basic ${token}`;
}

export async function sendOtpViaTwilio({ phone }) {
  ensureTwilioConfig();

  const params = new URLSearchParams();
  params.set("To", phone);
  params.set("Channel", "sms");

  const response = await fetch(
    `https://verify.twilio.com/v2/Services/${env.twilioVerifyServiceSid}/Verifications`,
    {
      method: "POST",
      headers: {
        Authorization: buildAuthHeader(),
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: params
    }
  );

  if (!response.ok) {
    let message = "Unable to send OTP";
    try {
      const data = await response.json();
      message = data?.message || message;
    } catch (_error) {
      // ignore parse errors
    }
    throw new ApiError(502, message);
  }
}

export async function verifyOtpViaTwilio({ phone, otp }) {
  ensureTwilioConfig();

  const params = new URLSearchParams();
  params.set("To", phone);
  params.set("Code", otp);

  const response = await fetch(
    `https://verify.twilio.com/v2/Services/${env.twilioVerifyServiceSid}/VerificationCheck`,
    {
      method: "POST",
      headers: {
        Authorization: buildAuthHeader(),
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: params
    }
  );

  if (!response.ok) {
    let message = "OTP verification failed";
    try {
      const data = await response.json();
      message = data?.message || message;
    } catch (_error) {
      // ignore parse errors
    }
    throw new ApiError(502, message);
  }

  const data = await response.json();
  if (data?.status !== "approved") {
    throw new ApiError(400, "Invalid or expired OTP");
  }
}
