import crypto from "crypto";
import { env } from "../config/env.js";
import { ApiError } from "./apiError.js";

function ensureCloudinaryConfig() {
  if (!env.cloudinaryCloudName || !env.cloudinaryApiKey || !env.cloudinaryApiSecret) {
    throw new ApiError(500, "Cloudinary is not configured");
  }
}

export function buildCloudinarySignature({ folder, resourceType }) {
  ensureCloudinaryConfig();

  const timestamp = Math.floor(Date.now() / 1000);
  const safeFolder = folder || env.cloudinaryUploadFolder;
  const safeResourceType = resourceType === "video" ? "video" : "image";
  const publicId = `mf-${safeResourceType}-${Date.now()}`;

  const raw = `folder=${safeFolder}&public_id=${publicId}&timestamp=${timestamp}${env.cloudinaryApiSecret}`;
  const signature = crypto.createHash("sha1").update(raw).digest("hex");

  return {
    timestamp,
    folder: safeFolder,
    publicId,
    resourceType: safeResourceType,
    signature,
    cloudName: env.cloudinaryCloudName,
    apiKey: env.cloudinaryApiKey
  };
}
