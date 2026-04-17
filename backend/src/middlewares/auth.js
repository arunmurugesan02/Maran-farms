import { User } from "../models/User.js";
import { ApiError } from "../utils/apiError.js";
import { verifyToken } from "../utils/jwt.js";

export async function requireAuth(req, _res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    return next(new ApiError(401, "Unauthorized"));
  }

  const token = authHeader.split(" ")[1];

  try {
    const payload = verifyToken(token);
    const user = await User.findById(payload.userId).select("-password");
    if (!user) return next(new ApiError(401, "Invalid token"));
    req.user = user;
    return next();
  } catch (_error) {
    return next(new ApiError(401, "Invalid or expired token"));
  }
}

export function requireAdmin(req, _res, next) {
  if (!req.user?.isAdmin) {
    return next(new ApiError(403, "Admin access required"));
  }
  return next();
}
