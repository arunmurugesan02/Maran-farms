import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    productName: { type: String, required: true },
    unitPrice: { type: Number, required: true },
    unit: { type: String, required: true },
    image: { type: String, default: "" },
    productType: { type: String, enum: ["grass", "animal"], required: true },
    deliveryType: { type: String, enum: ["delivery", "pickup", "both"], required: true },
    quantity: { type: Number, required: true, min: 1 },
    subtotal: { type: Number, required: true }
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    items: { type: [orderItemSchema], required: true },
    subtotal: { type: Number, required: true },
    deliveryCharge: { type: Number, required: true, default: 0 },
    totalAmount: { type: Number, required: true },
    deliveryType: { type: String, enum: ["delivery", "pickup"], required: true },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed"],
      default: "pending"
    },
    orderStatus: {
      type: String,
      enum: ["pending", "confirmed", "shipped", "delivered"],
      default: "pending"
    },
    deliveryDetails: {
      fullName: { type: String, required: true },
      phone: { type: String, required: true },
      address: { type: String, required: true },
      pincode: { type: String, required: true }
    },
    razorpayOrderId: { type: String },
    razorpayPaymentId: { type: String },
    razorpaySignature: { type: String }
  },
  { timestamps: true }
);

export const Order = mongoose.model("Order", orderSchema);
