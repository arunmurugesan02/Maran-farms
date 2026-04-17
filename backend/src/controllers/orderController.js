import { z } from "zod";
import mongoose from "mongoose";
import { Product } from "../models/Product.js";
import { Order } from "../models/Order.js";
import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  ensureRazorpayEnabled,
  razorpayClient,
  verifyRazorpaySignature
} from "../utils/razorpay.js";

const checkoutSchema = z.object({
  items: z.array(
    z.object({
      productId: z.string().min(1),
      quantity: z.number().int().positive()
    })
  ).min(1),
  deliveryType: z.enum(["delivery", "pickup"]),
  deliveryDetails: z.object({
    fullName: z.string().min(2),
    phone: z.string().min(8),
    address: z.string().min(8),
    pincode: z.string().min(4)
  })
});

const verifySchema = z.object({
  orderId: z.string().min(1),
  razorpayOrderId: z.string().min(1),
  razorpayPaymentId: z.string().min(1),
  razorpaySignature: z.string().min(1)
});

const updateStatusSchema = z.object({
  orderStatus: z.enum(["pending", "confirmed", "shipped", "delivered"]),
  paymentStatus: z.enum(["pending", "paid", "failed"]).optional()
});

async function buildOrderItems(items) {
  const orderItems = [];

  for (const item of items) {
    let product = null;
    if (mongoose.Types.ObjectId.isValid(item.productId)) {
      product = await Product.findById(item.productId);
    }
    if (!product) {
      product = await Product.findOne({ legacyId: item.productId });
    }
    if (!product) throw new ApiError(400, "Invalid product in cart");

    if (product.type === "grass" && item.quantity < product.minQty) {
      throw new ApiError(400, `${product.name} minimum quantity is ${product.minQty}`);
    }

    if (item.quantity > product.stock) {
      throw new ApiError(400, `${product.name} has only ${product.stock} in stock`);
    }

    orderItems.push({
      product: product._id,
      productName: product.name,
      unitPrice: product.price,
      unit: product.unit,
      image: product.images?.[0] || "",
      productType: product.type,
      deliveryType: product.deliveryType,
      quantity: item.quantity,
      subtotal: Number((product.price * item.quantity).toFixed(2))
    });
  }

  return orderItems;
}

export const createCheckoutOrder = asyncHandler(async (req, res) => {
  const parsed = checkoutSchema.safeParse(req.body);
  if (!parsed.success) throw new ApiError(400, parsed.error.issues[0].message);

  ensureRazorpayEnabled();

  const { items, deliveryType, deliveryDetails } = parsed.data;
  const orderItems = await buildOrderItems(items);

  const subtotal = orderItems.reduce((sum, item) => sum + item.subtotal, 0);
  const deliveryCharge = subtotal >= 500 ? 0 : 40;
  const totalAmount = Number((subtotal + deliveryCharge).toFixed(2));

  const order = await Order.create({
    user: req.user._id,
    items: orderItems,
    subtotal,
    deliveryCharge,
    totalAmount,
    deliveryType,
    paymentStatus: "pending",
    orderStatus: "pending",
    deliveryDetails
  });

  const razorpayOrder = await razorpayClient.orders.create({
    amount: Math.round(totalAmount * 100),
    currency: "INR",
    receipt: order._id.toString(),
    notes: {
      orderId: order._id.toString(),
      userId: req.user._id.toString()
    }
  });

  order.razorpayOrderId = razorpayOrder.id;
  await order.save();

  res.status(201).json({
    success: true,
    data: {
      orderId: order._id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      razorpayOrderId: razorpayOrder.id,
      customer: {
        name: req.user.name,
        email: req.user.email,
        phone: deliveryDetails.phone
      }
    }
  });
});

export const verifyPayment = asyncHandler(async (req, res) => {
  const parsed = verifySchema.safeParse(req.body);
  if (!parsed.success) throw new ApiError(400, parsed.error.issues[0].message);

  const { orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = parsed.data;

  const order = await Order.findOne({ _id: orderId, user: req.user._id });
  if (!order) throw new ApiError(404, "Order not found");

  if (order.razorpayOrderId !== razorpayOrderId) {
    throw new ApiError(400, "Razorpay order mismatch");
  }

  const isValidSignature = verifyRazorpaySignature({
    orderId: razorpayOrderId,
    paymentId: razorpayPaymentId,
    signature: razorpaySignature
  });

  if (!isValidSignature) {
    order.paymentStatus = "failed";
    await order.save();
    throw new ApiError(400, "Payment verification failed");
  }

  order.paymentStatus = "paid";
  order.orderStatus = "confirmed";
  order.razorpayPaymentId = razorpayPaymentId;
  order.razorpaySignature = razorpaySignature;

  const stockOps = order.items.map((item) => ({
    updateOne: {
      filter: { _id: item.product },
      update: { $inc: { stock: -item.quantity } }
    }
  }));

  await Promise.all([order.save(), Product.bulkWrite(stockOps)]);

  res.json({
    success: true,
    message: "Payment verified and order confirmed",
    data: order
  });
});

export const listMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
  res.json({ success: true, data: orders });
});

export const listAllOrders = asyncHandler(async (_req, res) => {
  const orders = await Order.find()
    .populate("user", "name email")
    .sort({ createdAt: -1 });

  res.json({ success: true, data: orders });
});

export const updateOrderStatus = asyncHandler(async (req, res) => {
  const parsed = updateStatusSchema.safeParse(req.body);
  if (!parsed.success) throw new ApiError(400, parsed.error.issues[0].message);

  const order = await Order.findByIdAndUpdate(req.params.id, parsed.data, {
    new: true,
    runValidators: true
  });

  if (!order) throw new ApiError(404, "Order not found");

  res.json({ success: true, data: order });
});
