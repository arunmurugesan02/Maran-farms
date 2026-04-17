import { z } from "zod";
import mongoose from "mongoose";
import { Product } from "../models/Product.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";

const createProductSchema = z.object({
  legacyId: z.string().optional(),
  name: z.string().min(2),
  type: z.enum(["grass", "animal"]),
  price: z.number().nonnegative(),
  unit: z.string().min(1),
  stock: z.number().int().nonnegative(),
  minQty: z.number().int().positive(),
  deliveryType: z.enum(["delivery", "pickup", "both"]),
  description: z.string().min(10),
  images: z.array(z.string().url()).optional().default([]),
  videos: z.array(z.string().url()).optional().default([]),
  age: z.string().optional(),
  health: z.string().optional(),
  category: z.string().min(1)
});

async function findByIdentifier(identifier) {
  if (mongoose.Types.ObjectId.isValid(identifier)) {
    const byObjectId = await Product.findById(identifier);
    if (byObjectId) return byObjectId;
  }
  return Product.findOne({ legacyId: identifier });
}

export const listProducts = asyncHandler(async (req, res) => {
  const { category, type, search } = req.query;

  const filter = {};
  if (category) filter.category = category;
  if (type) filter.type = type;
  if (search) filter.name = { $regex: search, $options: "i" };

  const products = await Product.find(filter).sort({ createdAt: -1 });

  res.json({
    success: true,
    data: products
  });
});

export const getProductById = asyncHandler(async (req, res) => {
  const product = await findByIdentifier(req.params.id);
  if (!product) throw new ApiError(404, "Product not found");

  res.json({ success: true, data: product });
});

export const createProduct = asyncHandler(async (req, res) => {
  const parsed = createProductSchema.safeParse(req.body);
  if (!parsed.success) throw new ApiError(400, parsed.error.issues[0].message);

  const product = await Product.create(parsed.data);
  res.status(201).json({ success: true, data: product });
});

export const updateProduct = asyncHandler(async (req, res) => {
  const parsed = createProductSchema.partial().safeParse(req.body);
  if (!parsed.success) throw new ApiError(400, parsed.error.issues[0].message);

  const existing = await findByIdentifier(req.params.id);
  if (!existing) throw new ApiError(404, "Product not found");

  Object.assign(existing, parsed.data);
  const product = await existing.save();

  res.json({ success: true, data: product });
});

export const deleteProduct = asyncHandler(async (req, res) => {
  const product = await findByIdentifier(req.params.id);
  if (!product) throw new ApiError(404, "Product not found");
  await product.deleteOne();

  res.json({ success: true, message: "Product deleted" });
});
