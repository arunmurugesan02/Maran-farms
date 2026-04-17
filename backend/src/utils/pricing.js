export function applyBulkPricing(product, quantity) {
  const tiers = [...(product.bulkPricingTiers || [])].sort((a, b) => a.minQty - b.minQty);
  const applicable = tiers.filter((tier) => quantity >= tier.minQty).at(-1);

  const baseSubtotal = Number((product.price * quantity).toFixed(2));
  if (!applicable) {
    return {
      unitPrice: product.price,
      subtotal: baseSubtotal,
      savings: 0,
      bulkTier: null
    };
  }

  let discountPerUnit = 0;
  if (applicable.discountType === "flat") {
    discountPerUnit = applicable.discountValue;
  } else {
    discountPerUnit = (product.price * applicable.discountValue) / 100;
  }

  const effectiveUnitPrice = Math.max(0, product.price - discountPerUnit);
  const subtotal = Number((effectiveUnitPrice * quantity).toFixed(2));
  const savings = Number((baseSubtotal - subtotal).toFixed(2));

  return {
    unitPrice: Number(effectiveUnitPrice.toFixed(2)),
    subtotal,
    savings,
    bulkTier: applicable
  };
}

export function applyCoupon({ coupon, subtotal }) {
  if (!coupon) {
    return { discountAmount: 0, couponCode: "" };
  }

  let discountAmount = 0;
  if (coupon.type === "flat") {
    discountAmount = coupon.value;
  } else {
    discountAmount = (subtotal * coupon.value) / 100;
  }

  if (coupon.maxDiscount > 0) {
    discountAmount = Math.min(discountAmount, coupon.maxDiscount);
  }

  discountAmount = Number(Math.min(discountAmount, subtotal).toFixed(2));

  return {
    discountAmount,
    couponCode: coupon.code
  };
}
