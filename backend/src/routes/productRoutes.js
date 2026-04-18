import { Router } from "express";
import {
  createMediaUploadSignature,
  createReview,
  createProduct,
  deleteProduct,
  getProductById,
  listProductReviews,
  listProducts,
  updateProduct
} from "../controllers/productController.js";
import { requireAdmin, requireAuth } from "../middlewares/auth.js";

export const productRouter = Router();

productRouter.get("/", listProducts);
productRouter.get("/:id", getProductById);
productRouter.get("/:id/reviews", listProductReviews);
productRouter.post("/:id/reviews", requireAuth, createReview);
productRouter.post("/admin/upload-signature", requireAuth, requireAdmin, createMediaUploadSignature);
productRouter.post("/", requireAuth, requireAdmin, createProduct);
productRouter.patch("/:id", requireAuth, requireAdmin, updateProduct);
productRouter.delete("/:id", requireAuth, requireAdmin, deleteProduct);
