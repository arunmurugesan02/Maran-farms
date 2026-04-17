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
    orderNumber: { type: String, required: true, unique: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    items: { type: [orderItemSchema], required: true },
    subtotal: { type: Number, required: true },
    discountAmount: { type: Number, required: true, default: 0 },
    savingsAmount: { type: Number, required: true, default: 0 },
    deliveryCharge: { type: Number, required: true, default: 0 },
    totalAmount: { type: Number, required: true },
    deliveryType: { type: String, enum: ["delivery", "pickup"], required: true },
    deliverySlot: { type: String, enum: ["morning", "evening"], default: "morning" },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed"],
      default: "pending"
    },
    orderStatus: {
      type: String,
      enum: ["pending", "packed", "shipped", "delivered", "cancelled"],
      default: "pending"
    },
    statusTimeline: {
      type: [
        {
          status: {
            type: String,
            enum: ["pending", "packed", "shipped", "delivered", "cancelled"],
            required: true
          },
          note: { type: String, default: "" },
          updatedAt: { type: Date, default: Date.now }
        }
      ],
      default: [{ status: "pending", note: "Order created" }]
    },
    tracking: {
      trackingId: { type: String, default: "" },
      milestones: {
        type: [
          {
            label: { type: String, required: true },
            timestamp: { type: Date, default: Date.now }
          }
        ],
        default: []
      }
    },
    pricingSnapshot: {
      couponCode: { type: String, default: "" },
      subtotal: { type: Number, required: true },
      discountAmount: { type: Number, required: true, default: 0 },
      savingsAmount: { type: Number, required: true, default: 0 },
      deliveryCharge: { type: Number, required: true, default: 0 },
      totalAmount: { type: Number, required: true }
    },
    deliveryDetails: {
      fullName: { type: String, required: true },
      phone: { type: String, required: true },
      address: { type: String, required: true },
      pincode: { type: String, required: true }
    },
    cancellation: {
      cancelledAt: { type: Date },
      reason: { type: String, default: "" }
    },
    invoice: {
      invoiceNumber: { type: String, default: "" },
      generatedAt: { type: Date }
    },
    razorpayOrderId: { type: String },
    razorpayPaymentId: { type: String },
    razorpaySignature: { type: String },
    idempotencyKey: { type: String, default: "" }
  },
  { timestamps: true }
);

export const Order = mongoose.model("Order", orderSchema);
