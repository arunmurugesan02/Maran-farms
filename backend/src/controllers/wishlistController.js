import { asyncHandler } from "../utils/asyncHandler.js";
import { Wishlist } from "../models/Wishlist.js";
import { Product } from "../models/Product.js";
import { ApiError } from "../utils/apiError.js";

export const listWishlist = asyncHandler(async (req, res) => {
  const items = await Wishlist.find({ user: req.user._id })
    .populate("product")
    .sort({ createdAt: -1 });

  res.json({ success: true, data: items.map((item) => item.product).filter(Boolean) });
});

export const addWishlist = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.body.productId);
  if (!product) throw new ApiError(404, "Product not found");

  await Wishlist.findOneAndUpdate(
    { user: req.user._id, product: product._id },
    { user: req.user._id, product: product._id },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  res.status(201).json({ success: true, message: "Added to wishlist" });
});

export const removeWishlist = asyncHandler(async (req, res) => {
  await Wishlist.deleteOne({ user: req.user._id, product: req.params.productId });
  res.json({ success: true, message: "Removed from wishlist" });
});
