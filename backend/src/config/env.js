import dotenv from "dotenv";

dotenv.config();

const required = ["MONGODB_URI", "JWT_SECRET"];

for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

export const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT || 4000),
  mongodbUri: process.env.MONGODB_URI,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:8080",
  adminPhone: process.env.ADMIN_PHONE || "919600267271",
  sellerName: process.env.SELLER_NAME || "MARAN FARMS",
  sellerAddress: process.env.SELLER_ADDRESS || "Karur, Tamil Nadu",
  sellerPhone: process.env.SELLER_PHONE || "9600267271",
  razorpayKeyId: process.env.RAZORPAY_KEY_ID || "",
  razorpayKeySecret: process.env.RAZORPAY_KEY_SECRET || "",
  fast2smsApiKey: process.env.FAST2SMS_API_KEY || "",
  cloudinaryCloudName: process.env.CLOUDINARY_CLOUD_NAME || "",
  cloudinaryApiKey: process.env.CLOUDINARY_API_KEY || "",
  cloudinaryApiSecret: process.env.CLOUDINARY_API_SECRET || "",
  cloudinaryUploadFolder: process.env.CLOUDINARY_UPLOAD_FOLDER || "maran-farms"
};
