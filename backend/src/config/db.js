import mongoose from "mongoose";
import { env } from "./env.js";
import { User } from "../models/User.js";
import { Wishlist } from "../models/Wishlist.js";
import { Review } from "../models/Review.js";
import { Coupon } from "../models/Coupon.js";
import { QuoteRequest } from "../models/QuoteRequest.js";
import { NotificationLog } from "../models/NotificationLog.js";
import { Order } from "../models/Order.js";
import { Product } from "../models/Product.js";

export async function connectDb() {
  mongoose.set("strictQuery", true);
  await mongoose.connect(env.mongodbUri);
  await Promise.all([
    User.syncIndexes(),
    Product.syncIndexes(),
    Order.syncIndexes(),
    Wishlist.syncIndexes(),
    Review.syncIndexes(),
    Coupon.syncIndexes(),
    QuoteRequest.syncIndexes(),
    NotificationLog.syncIndexes()
  ]);
  console.log("MongoDB connected");
}
