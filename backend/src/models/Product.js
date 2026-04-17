import mongoose from "mongoose";

const bulkPricingTierSchema = new mongoose.Schema(
  {
    minQty: { type: Number, required: true, min: 1 },
    discountType: { type: String, enum: ["flat", "percent"], required: true },
    discountValue: { type: Number, required: true, min: 0 }
  },
  { _id: false }
);

const productSchema = new mongoose.Schema(
  {
    legacyId: { type: String, unique: true, sparse: true },
    name: { type: String, required: true, trim: true },
    type: { type: String, enum: ["grass", "animal"], required: true },
    price: { type: Number, required: true, min: 0 },
    unit: { type: String, required: true },
    stock: { type: Number, required: true, min: 0 },
    minQty: { type: Number, required: true, min: 1 },
    deliveryType: { type: String, enum: ["delivery", "pickup", "both"], required: true },
    description: { type: String, required: true },
    images: { type: [String], default: [] },
    videos: { type: [String], default: [] },
    age: { type: String },
    health: { type: String },
    category: { type: String, required: true },
    isActive: { type: Boolean, default: true },
    lowStockThreshold: { type: Number, default: 10, min: 0 },
    bulkPricingTiers: { type: [bulkPricingTierSchema], default: [] },
    averageRating: { type: Number, default: 0, min: 0, max: 5 },
    ratingsCount: { type: Number, default: 0, min: 0 }
  },
  { timestamps: true }
);

export const Product = mongoose.model("Product", productSchema);
