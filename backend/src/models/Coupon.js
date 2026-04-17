import mongoose from "mongoose";

const couponSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, uppercase: true, unique: true, trim: true },
    type: { type: String, enum: ["flat", "percent"], required: true },
    value: { type: Number, required: true, min: 0 },
    minCartAmount: { type: Number, default: 0, min: 0 },
    maxDiscount: { type: Number, default: 0, min: 0 },
    usageLimit: { type: Number, default: 0, min: 0 },
    usedCount: { type: Number, default: 0, min: 0 },
    isActive: { type: Boolean, default: true },
    expiresAt: { type: Date }
  },
  { timestamps: true }
);

export const Coupon = mongoose.model("Coupon", couponSchema);
