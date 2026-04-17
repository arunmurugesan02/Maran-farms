import mongoose from "mongoose";

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
    category: { type: String, required: true }
  },
  { timestamps: true }
);

export const Product = mongoose.model("Product", productSchema);
