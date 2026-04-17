import { Router } from "express";
import {
  createProduct,
  deleteProduct,
  getProductById,
  listProducts,
  updateProduct
} from "../controllers/productController.js";
import { requireAdmin, requireAuth } from "../middlewares/auth.js";

export const productRouter = Router();

productRouter.get("/", listProducts);
productRouter.get("/:id", getProductById);
productRouter.post("/", requireAuth, requireAdmin, createProduct);
productRouter.patch("/:id", requireAuth, requireAdmin, updateProduct);
productRouter.delete("/:id", requireAuth, requireAdmin, deleteProduct);
