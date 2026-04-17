import { Router } from "express";
import { addWishlist, listWishlist, removeWishlist } from "../controllers/wishlistController.js";
import { requireAuth } from "../middlewares/auth.js";

export const wishlistRouter = Router();

wishlistRouter.use(requireAuth);
wishlistRouter.get("/", listWishlist);
wishlistRouter.post("/", addWishlist);
wishlistRouter.delete("/:productId", removeWishlist);
