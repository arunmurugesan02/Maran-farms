import { Router } from "express";
import {
  cancelMyOrder,
  createCheckoutOrder,
  createQuoteRequest,
  getAdminAnalytics,
  getInvoice,
  getMyOrderById,
  listAllOrders,
  listAllQuoteRequests,
  listMyOrders,
  listMyQuoteRequests,
  reorder,
  updateOrderStatus,
  validateCoupon,
  verifyPayment
} from "../controllers/orderController.js";
import { optionalAuth, requireAdmin, requireAuth } from "../middlewares/auth.js";
import { rateLimit } from "../middlewares/rateLimit.js";

export const orderRouter = Router();

orderRouter.post(
  "/checkout",
  requireAuth,
  rateLimit({ scope: "orders_checkout", windowMs: 60_000, max: 10 }),
  createCheckoutOrder
);
orderRouter.post(
  "/verify-payment",
  requireAuth,
  rateLimit({ scope: "orders_verify", windowMs: 60_000, max: 12 }),
  verifyPayment
);
orderRouter.post("/coupon/validate", validateCoupon);
orderRouter.get("/my", requireAuth, listMyOrders);
orderRouter.get("/my/:id", requireAuth, getMyOrderById);
orderRouter.post("/:id/reorder", requireAuth, reorder);
orderRouter.patch("/:id/cancel", requireAuth, cancelMyOrder);
orderRouter.get("/:id/invoice", requireAuth, getInvoice);
orderRouter.post("/quotes", optionalAuth, createQuoteRequest);
orderRouter.get("/quotes/my", requireAuth, listMyQuoteRequests);

orderRouter.get("/", requireAuth, requireAdmin, listAllOrders);
orderRouter.patch("/:id/status", requireAuth, requireAdmin, updateOrderStatus);
orderRouter.get("/admin/analytics", requireAuth, requireAdmin, getAdminAnalytics);
orderRouter.get("/admin/quotes", requireAuth, requireAdmin, listAllQuoteRequests);
