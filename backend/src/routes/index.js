import { Router } from "express";
import { authRouter } from "./authRoutes.js";
import { productRouter } from "./productRoutes.js";
import { orderRouter } from "./orderRoutes.js";
import { wishlistRouter } from "./wishlistRoutes.js";

export const apiRouter = Router();

apiRouter.use("/auth", authRouter);
apiRouter.use("/products", productRouter);
apiRouter.use("/orders", orderRouter);
apiRouter.use("/wishlist", wishlistRouter);
