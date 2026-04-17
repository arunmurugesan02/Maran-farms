import { ApiError } from "../utils/apiError.js";

const buckets = new Map();

function buildKey(req, scope) {
  const ip = req.ip || req.headers["x-forwarded-for"] || "unknown";
  const user = req.user?._id?.toString() || "guest";
  return `${scope}:${ip}:${user}`;
}

export function rateLimit({ scope, windowMs, max }) {
  return (req, _res, next) => {
    const key = buildKey(req, scope);
    const now = Date.now();
    const record = buckets.get(key);

    if (!record || now > record.resetAt) {
      buckets.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }

    if (record.count >= max) {
      return next(new ApiError(429, "Too many requests. Please try again shortly."));
    }

    record.count += 1;
    buckets.set(key, record);
    return next();
  };
}
