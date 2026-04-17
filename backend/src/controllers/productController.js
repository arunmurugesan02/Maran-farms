import { z } from "zod";
import mongoose from "mongoose";
import { Product } from "../models/Product.js";
import { Review } from "../models/Review.js";
import { Order } from "../models/Order.js";
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
  category: z.string().min(1),
  isActive: z.boolean().optional(),
  lowStockThreshold: z.number().int().nonnegative().optional(),
  bulkPricingTiers: z.array(z.object({
    minQty: z.number().int().positive(),
    discountType: z.enum(["flat", "percent"]),
    discountValue: z.number().nonnegative()
  })).optional()
});

async function findByIdentifier(identifier) {
  if (mongoose.Types.ObjectId.isValid(identifier)) {
    const byObjectId = await Product.findById(identifier);
    if (byObjectId) return byObjectId;
  }
  return Product.findOne({ legacyId: identifier });
}

export const listProducts = asyncHandler(async (req, res) => {
  const { category, type, search, deliveryType, minPrice, maxPrice, lowStockOnly } = req.query;

  const filter = {};
  if (category) filter.category = category;
  if (type) filter.type = type;
  if (search) filter.name = { $regex: search, $options: "i" };
  if (deliveryType) {
    filter.deliveryType = deliveryType === "both" ? "both" : { $in: [deliveryType, "both"] };
  }
  if (lowStockOnly === "true") {
    filter.$expr = { $lte: ["$stock", "$lowStockThreshold"] };
  }
  if (minPrice || maxPrice) {
    filter.price = {};
    if (minPrice) filter.price.$gte = Number(minPrice);
    if (maxPrice) filter.price.$lte = Number(maxPrice);
  }
  filter.isActive = true;

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

export const listProductReviews = asyncHandler(async (req, res) => {
  const product = await findByIdentifier(req.params.id);
  if (!product) throw new ApiError(404, "Product not found");

  const reviews = await Review.find({ product: product._id })
    .populate("user", "name")
    .sort({ createdAt: -1 });

  res.json({ success: true, data: reviews });
});

const reviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().max(1200).optional().default("")
});

export const createReview = asyncHandler(async (req, res) => {
  const parsed = reviewSchema.safeParse(req.body);
  if (!parsed.success) throw new ApiError(400, parsed.error.issues[0].message);

  const product = await findByIdentifier(req.params.id);
  if (!product) throw new ApiError(404, "Product not found");

  const deliveredOrder = await Order.findOne({
    user: req.user._id,
    orderStatus: "delivered",
    "items.product": product._id
  });
  if (!deliveredOrder) {
    throw new ApiError(403, "Only verified buyers can review this product");
  }

  const review = await Review.findOneAndUpdate(
    { user: req.user._id, product: product._id },
    {
      user: req.user._id,
      product: product._id,
      order: deliveredOrder._id,
      rating: parsed.data.rating,
      comment: parsed.data.comment
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  const ratings = await Review.aggregate([
    { $match: { product: product._id } },
    { $group: { _id: "$product", averageRating: { $avg: "$rating" }, ratingsCount: { $sum: 1 } } }
  ]);

  product.averageRating = Number((ratings[0]?.averageRating || 0).toFixed(2));
  product.ratingsCount = ratings[0]?.ratingsCount || 0;
  await product.save();

  res.status(201).json({ success: true, data: review });
});
