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
import { requireAdmin, requireAuth } from "../middlewares/auth.js";
import { rateLimit } from "../middlewares/rateLimit.js";

export const orderRouter = Router();

orderRouter.use(requireAuth);

orderRouter.post(
  "/checkout",
  rateLimit({ scope: "orders_checkout", windowMs: 60_000, max: 10 }),
  createCheckoutOrder
);
orderRouter.post(
  "/verify-payment",
  rateLimit({ scope: "orders_verify", windowMs: 60_000, max: 12 }),
  verifyPayment
);
orderRouter.post("/coupon/validate", validateCoupon);
orderRouter.get("/my", listMyOrders);
orderRouter.get("/my/:id", getMyOrderById);
orderRouter.post("/:id/reorder", reorder);
orderRouter.patch("/:id/cancel", cancelMyOrder);
orderRouter.get("/:id/invoice", getInvoice);
orderRouter.post("/quotes", createQuoteRequest);
orderRouter.get("/quotes/my", listMyQuoteRequests);

orderRouter.get("/", requireAdmin, listAllOrders);
orderRouter.patch("/:id/status", requireAdmin, updateOrderStatus);
orderRouter.get("/admin/analytics", requireAdmin, getAdminAnalytics);
orderRouter.get("/admin/quotes", requireAdmin, listAllQuoteRequests);
