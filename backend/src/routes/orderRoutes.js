import { Router } from "express";
import {
  createCheckoutOrder,
  listAllOrders,
  listMyOrders,
  updateOrderStatus,
  verifyPayment
} from "../controllers/orderController.js";
import { requireAdmin, requireAuth } from "../middlewares/auth.js";

export const orderRouter = Router();

orderRouter.use(requireAuth);

orderRouter.post("/checkout", createCheckoutOrder);
orderRouter.post("/verify-payment", verifyPayment);
orderRouter.get("/my", listMyOrders);
orderRouter.get("/", requireAdmin, listAllOrders);
orderRouter.patch("/:id/status", requireAdmin, updateOrderStatus);
