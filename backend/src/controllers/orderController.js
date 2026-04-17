import { z } from "zod";
import mongoose from "mongoose";
import { Product } from "../models/Product.js";
import { Order } from "../models/Order.js";
import { Coupon } from "../models/Coupon.js";
import { QuoteRequest } from "../models/QuoteRequest.js";
import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  ensureRazorpayEnabled,
  razorpayClient,
  verifyRazorpaySignature
} from "../utils/razorpay.js";
import { applyBulkPricing, applyCoupon } from "../utils/pricing.js";
import { generateInvoicePdf } from "../utils/invoicePdf.js";
import {
  sendLowStockAlert,
  sendNewOrderAlert,
  sendOrderStatusNotification
} from "../services/notificationService.js";

const checkoutSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        quantity: z.number().int().positive()
      })
    )
    .min(1),
  deliveryType: z.enum(["delivery", "pickup"]),
  deliverySlot: z.enum(["morning", "evening"]).optional().default("morning"),
  couponCode: z.string().trim().toUpperCase().optional(),
  idempotencyKey: z.string().trim().min(6),
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
  orderStatus: z.enum(["pending", "packed", "shipped", "delivered", "cancelled"]),
  paymentStatus: z.enum(["pending", "paid", "failed"]).optional(),
  note: z.string().max(240).optional().default("")
});

const cancelSchema = z.object({
  reason: z.string().trim().max(300).optional().default("")
});

const couponSchema = z.object({
  couponCode: z.string().trim().toUpperCase()
});

const quoteSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        quantity: z.number().int().positive(),
        note: z.string().trim().max(300).optional().default("")
      })
    )
    .min(1),
  contactName: z.string().trim().min(2),
  phone: z.string().trim().min(8),
  address: z.string().trim().optional().default(""),
  message: z.string().trim().max(1200).optional().default("")
});

const transitionMap = {
  pending: ["packed", "cancelled"],
  packed: ["shipped"],
  shipped: ["delivered"],
  delivered: [],
  cancelled: []
};

function buildOrderNumber() {
  const stamp = Date.now().toString().slice(-8);
  const random = Math.floor(1000 + Math.random() * 9000);
  return `MF-${stamp}-${random}`;
}

function mapOrder(order) {
  return {
    ...order.toObject(),
    id: order._id
  };
}

async function findProductByIdentifier(identifier) {
  let product = null;
  if (mongoose.Types.ObjectId.isValid(identifier)) {
    product = await Product.findById(identifier);
  }
  if (!product) {
    product = await Product.findOne({ legacyId: identifier });
  }
  return product;
}

async function buildOrderItems(items) {
  const orderItems = [];
  let savingsAmount = 0;

  for (const item of items) {
    const product = await findProductByIdentifier(item.productId);
    if (!product) throw new ApiError(400, "Invalid product in cart");
    if (!product.isActive) throw new ApiError(400, `${product.name} is currently unavailable`);

    if (product.type === "grass" && item.quantity < product.minQty) {
      throw new ApiError(400, `${product.name} minimum quantity is ${product.minQty}`);
    }

    if (item.quantity > product.stock) {
      throw new ApiError(400, `${product.name} has only ${product.stock} in stock`);
    }

    const pricing = applyBulkPricing(product, item.quantity);
    savingsAmount += pricing.savings;

    orderItems.push({
      product: product._id,
      productName: product.name,
      unitPrice: pricing.unitPrice,
      unit: product.unit,
      image: product.images?.[0] || "",
      productType: product.type,
      deliveryType: product.deliveryType,
      quantity: item.quantity,
      subtotal: pricing.subtotal
    });
  }

  return { orderItems, savingsAmount: Number(savingsAmount.toFixed(2)) };
}

async function loadValidCoupon(couponCode, subtotal) {
  if (!couponCode) return null;
  const coupon = await Coupon.findOne({ code: couponCode, isActive: true });
  if (!coupon) throw new ApiError(400, "Invalid coupon code");
  if (coupon.expiresAt && coupon.expiresAt < new Date()) {
    throw new ApiError(400, "Coupon has expired");
  }
  if (coupon.usageLimit > 0 && coupon.usedCount >= coupon.usageLimit) {
    throw new ApiError(400, "Coupon usage limit reached");
  }
  if (subtotal < coupon.minCartAmount) {
    throw new ApiError(400, `Minimum cart value for ${coupon.code} is ₹${coupon.minCartAmount}`);
  }
  return coupon;
}

export const validateCoupon = asyncHandler(async (req, res) => {
  const parsed = couponSchema.safeParse(req.body);
  if (!parsed.success) throw new ApiError(400, parsed.error.issues[0].message);

  const coupon = await Coupon.findOne({ code: parsed.data.couponCode, isActive: true });
  if (!coupon) throw new ApiError(404, "Coupon not found");

  res.json({
    success: true,
    data: {
      code: coupon.code,
      type: coupon.type,
      value: coupon.value,
      minCartAmount: coupon.minCartAmount,
      maxDiscount: coupon.maxDiscount,
      expiresAt: coupon.expiresAt
    }
  });
});

export const createCheckoutOrder = asyncHandler(async (req, res) => {
  const parsed = checkoutSchema.safeParse(req.body);
  if (!parsed.success) throw new ApiError(400, parsed.error.issues[0].message);

  ensureRazorpayEnabled();

  const existing = await Order.findOne({
    user: req.user._id,
    idempotencyKey: parsed.data.idempotencyKey,
    paymentStatus: { $in: ["pending", "paid"] }
  });

  if (existing) {
    return res.json({
      success: true,
      data: {
        orderId: existing._id,
        amount: Math.round(existing.totalAmount * 100),
        currency: "INR",
        razorpayOrderId: existing.razorpayOrderId,
        customer: {
          name: req.user.name,
          email: req.user.email,
          phone: existing.deliveryDetails.phone
        },
        pricing: existing.pricingSnapshot
      }
    });
  }

  const { items, deliveryType, deliverySlot, deliveryDetails, couponCode } = parsed.data;

  const duplicateCutoff = new Date(Date.now() - 90 * 1000);
  const duplicateOrder = await Order.findOne({
    user: req.user._id,
    createdAt: { $gte: duplicateCutoff },
    paymentStatus: "pending"
  });

  if (duplicateOrder) {
    throw new ApiError(409, "A checkout is already in progress. Complete payment or wait before retrying.");
  }

  const { orderItems, savingsAmount } = await buildOrderItems(items);
  const subtotal = Number(orderItems.reduce((sum, item) => sum + item.subtotal, 0).toFixed(2));

  const coupon = await loadValidCoupon(couponCode, subtotal);
  const { discountAmount, couponCode: appliedCouponCode } = applyCoupon({ coupon, subtotal });

  const deliveryCharge = subtotal >= 500 || deliveryType === "pickup" ? 0 : 40;
  const totalAmount = Number((subtotal - discountAmount + deliveryCharge).toFixed(2));

  const order = await Order.create({
    orderNumber: buildOrderNumber(),
    user: req.user._id,
    items: orderItems,
    subtotal,
    discountAmount,
    savingsAmount,
    deliveryCharge,
    totalAmount,
    deliveryType,
    deliverySlot,
    paymentStatus: "pending",
    orderStatus: "pending",
    statusTimeline: [{ status: "pending", note: "Order created" }],
    tracking: {
      milestones: [{ label: "Order placed", timestamp: new Date() }]
    },
    pricingSnapshot: {
      couponCode: appliedCouponCode,
      subtotal,
      discountAmount,
      savingsAmount,
      deliveryCharge,
      totalAmount
    },
    deliveryDetails,
    idempotencyKey: parsed.data.idempotencyKey
  });

  const razorpayOrder = await razorpayClient.orders.create({
    amount: Math.round(totalAmount * 100),
    currency: "INR",
    receipt: order.orderNumber,
    notes: {
      orderId: order._id.toString(),
      userId: req.user._id.toString()
    }
  });

  order.razorpayOrderId = razorpayOrder.id;
  await order.save();

  await sendNewOrderAlert({ order });

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
      },
      pricing: order.pricingSnapshot
    }
  });
});

export const verifyPayment = asyncHandler(async (req, res) => {
  const parsed = verifySchema.safeParse(req.body);
  if (!parsed.success) throw new ApiError(400, parsed.error.issues[0].message);

  const { orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = parsed.data;

  const order = await Order.findOne({ _id: orderId, user: req.user._id });
  if (!order) throw new ApiError(404, "Order not found");

  if (order.paymentStatus === "paid") {
    return res.json({ success: true, message: "Payment already verified", data: mapOrder(order) });
  }

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
  order.orderStatus = "packed";
  order.razorpayPaymentId = razorpayPaymentId;
  order.razorpaySignature = razorpaySignature;
  order.statusTimeline.push({ status: "packed", note: "Payment verified and packed" });
  order.tracking.milestones.push({ label: "Packed", timestamp: new Date() });
  order.invoice = {
    invoiceNumber: `INV-${order.orderNumber}`,
    generatedAt: new Date()
  };

  const stockOps = order.items.map((item) => ({
    updateOne: {
      filter: { _id: item.product },
      update: { $inc: { stock: -item.quantity } }
    }
  }));

  await Promise.all([order.save(), Product.bulkWrite(stockOps)]);

  const products = await Product.find({ _id: { $in: order.items.map((item) => item.product) } });
  await Promise.all(
    products
      .filter((product) => product.stock <= product.lowStockThreshold)
      .map((product) => sendLowStockAlert({ product }))
  );

  if (order.pricingSnapshot.couponCode) {
    await Coupon.findOneAndUpdate(
      { code: order.pricingSnapshot.couponCode },
      { $inc: { usedCount: 1 } }
    );
  }

  res.json({
    success: true,
    message: "Payment verified and order packed",
    data: mapOrder(order)
  });
});

export const listMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
  res.json({ success: true, data: orders.map(mapOrder) });
});

export const getMyOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findOne({ _id: req.params.id, user: req.user._id });
  if (!order) throw new ApiError(404, "Order not found");
  res.json({ success: true, data: mapOrder(order) });
});

export const cancelMyOrder = asyncHandler(async (req, res) => {
  const parsed = cancelSchema.safeParse(req.body);
  if (!parsed.success) throw new ApiError(400, parsed.error.issues[0].message);

  const order = await Order.findOne({ _id: req.params.id, user: req.user._id });
  if (!order) throw new ApiError(404, "Order not found");
  if (order.orderStatus !== "pending") {
    throw new ApiError(400, "Only pending orders can be cancelled");
  }

  order.orderStatus = "cancelled";
  order.cancellation = {
    cancelledAt: new Date(),
    reason: parsed.data.reason
  };
  order.statusTimeline.push({ status: "cancelled", note: parsed.data.reason || "Cancelled by customer" });
  await order.save();

  res.json({ success: true, data: mapOrder(order) });
});

export const reorder = asyncHandler(async (req, res) => {
  const order = await Order.findOne({ _id: req.params.id, user: req.user._id });
  if (!order) throw new ApiError(404, "Order not found");

  const items = order.items.map((item) => ({
    productId: item.product.toString(),
    quantity: item.quantity
  }));

  res.json({ success: true, data: { items } });
});

export const listAllOrders = asyncHandler(async (_req, res) => {
  const orders = await Order.find().populate("user", "name email phone").sort({ createdAt: -1 });
  res.json({ success: true, data: orders.map(mapOrder) });
});

export const updateOrderStatus = asyncHandler(async (req, res) => {
  const parsed = updateStatusSchema.safeParse(req.body);
  if (!parsed.success) throw new ApiError(400, parsed.error.issues[0].message);

  const order = await Order.findById(req.params.id);
  if (!order) throw new ApiError(404, "Order not found");

  if (!transitionMap[order.orderStatus].includes(parsed.data.orderStatus)) {
    throw new ApiError(400, `Invalid status transition from ${order.orderStatus} to ${parsed.data.orderStatus}`);
  }

  order.orderStatus = parsed.data.orderStatus;
  if (parsed.data.paymentStatus) {
    order.paymentStatus = parsed.data.paymentStatus;
  }
  order.statusTimeline.push({ status: parsed.data.orderStatus, note: parsed.data.note || "" });

  if (parsed.data.orderStatus === "shipped") {
    order.tracking.milestones.push({ label: "Shipped", timestamp: new Date() });
  }
  if (parsed.data.orderStatus === "delivered") {
    order.tracking.milestones.push({ label: "Delivered", timestamp: new Date() });
  }

  await order.save();
  await sendOrderStatusNotification({ order, status: parsed.data.orderStatus });

  res.json({ success: true, data: mapOrder(order) });
});

export const getInvoice = asyncHandler(async (req, res) => {
  const order = await Order.findOne({ _id: req.params.id, user: req.user._id });
  if (!order) throw new ApiError(404, "Order not found");
  if (order.paymentStatus !== "paid") throw new ApiError(400, "Invoice available only for paid orders");

  if (!order.invoice?.invoiceNumber) {
    order.invoice = {
      invoiceNumber: `INV-${order.orderNumber}`,
      generatedAt: new Date()
    };
    await order.save();
  }

  const pdfBuffer = generateInvoicePdf(order);
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename=invoice-${order.orderNumber}.pdf`);
  res.send(pdfBuffer);
});

export const getAdminAnalytics = asyncHandler(async (_req, res) => {
  const [orders, products] = await Promise.all([Order.find(), Product.find()]);

  const totalOrders = orders.length;
  const totalRevenue = orders
    .filter((order) => order.paymentStatus === "paid")
    .reduce((sum, order) => sum + order.totalAmount, 0);

  const now = Date.now();
  const dailyCutoff = now - 24 * 60 * 60 * 1000;
  const weeklyCutoff = now - 7 * 24 * 60 * 60 * 1000;
  const monthlyCutoff = now - 30 * 24 * 60 * 60 * 1000;

  const aggregateWindow = (cutoff) =>
    orders
      .filter((order) => new Date(order.createdAt).getTime() >= cutoff)
      .reduce((sum, order) => sum + order.totalAmount, 0);

  const productSales = new Map();
  orders.forEach((order) => {
    order.items.forEach((item) => {
      const current = productSales.get(item.productName) || 0;
      productSales.set(item.productName, current + item.quantity);
    });
  });

  const topProducts = [...productSales.entries()]
    .map(([name, quantity]) => ({ name, quantity }))
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5);

  const lowStockProducts = products.filter((product) => product.stock <= product.lowStockThreshold);

  res.json({
    success: true,
    data: {
      totalOrders,
      totalRevenue: Number(totalRevenue.toFixed(2)),
      sales: {
        daily: Number(aggregateWindow(dailyCutoff).toFixed(2)),
        weekly: Number(aggregateWindow(weeklyCutoff).toFixed(2)),
        monthly: Number(aggregateWindow(monthlyCutoff).toFixed(2))
      },
      topProducts,
      lowStockProducts
    }
  });
});

export const createQuoteRequest = asyncHandler(async (req, res) => {
  const parsed = quoteSchema.safeParse(req.body);
  if (!parsed.success) throw new ApiError(400, parsed.error.issues[0].message);

  const normalizedItems = [];
  for (const item of parsed.data.items) {
    const product = await findProductByIdentifier(item.productId);
    if (!product) throw new ApiError(400, "Invalid product in quote request");

    normalizedItems.push({
      product: product._id,
      productName: product.name,
      quantity: item.quantity,
      note: item.note || ""
    });
  }

  const quote = await QuoteRequest.create({
    user: req.user._id,
    items: normalizedItems,
    contactName: parsed.data.contactName,
    phone: parsed.data.phone,
    address: parsed.data.address,
    message: parsed.data.message
  });

  res.status(201).json({ success: true, data: quote });
});

export const listMyQuoteRequests = asyncHandler(async (req, res) => {
  const quotes = await QuoteRequest.find({ user: req.user._id }).sort({ createdAt: -1 });
  res.json({ success: true, data: quotes });
});

export const listAllQuoteRequests = asyncHandler(async (_req, res) => {
  const quotes = await QuoteRequest.find().populate("user", "name phone email").sort({ createdAt: -1 });
  res.json({ success: true, data: quotes });
});
