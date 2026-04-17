import mongoose from "mongoose";
import { env } from "./env.js";
import { User } from "../models/User.js";

export async function connectDb() {
  mongoose.set("strictQuery", true);
  await mongoose.connect(env.mongodbUri);
  await User.syncIndexes();
  console.log("MongoDB connected");
}
