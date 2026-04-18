import mongoose from "mongoose";

const quoteItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
    productName: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    note: { type: String, default: "" }
  },
  { _id: false }
);

const quoteRequestSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    items: { type: [quoteItemSchema], required: true },
    contactName: { type: String, required: true },
    phone: { type: String, required: true },
    address: { type: String, default: "" },
    message: { type: String, default: "" },
    status: { type: String, enum: ["open", "quoted", "closed"], default: "open" }
  },
  { timestamps: true }
);

export const QuoteRequest = mongoose.model("QuoteRequest", quoteRequestSchema);
