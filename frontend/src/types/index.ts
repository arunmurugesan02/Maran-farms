export interface Address {
  _id: string;
  label: string;
  fullName: string;
  phone: string;
  address: string;
  pincode: string;
  isDefault: boolean;
}

export interface User {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  pincode?: string;
  addresses?: Address[];
  isAdmin: boolean;
}

export interface BulkPricingTier {
  minQty: number;
  discountType: "flat" | "percent";
  discountValue: number;
}

export interface Product {
  id: string;
  name: string;
  type: "grass" | "animal";
  price: number;
  unit: string;
  stock: number;
  minQty: number;
  deliveryType: "delivery" | "pickup" | "both";
  description: string;
  images: string[];
  videos: string[];
  age?: string;
  health?: string;
  category: string;
  isActive?: boolean;
  lowStockThreshold?: number;
  bulkPricingTiers?: BulkPricingTier[];
  averageRating?: number;
  ratingsCount?: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface OrderTimeline {
  status: "pending" | "packed" | "shipped" | "delivered" | "cancelled";
  note?: string;
  updatedAt: string;
}

export interface OrderTracking {
  trackingId?: string;
  milestones: Array<{ label: string; timestamp: string }>;
}

export interface Order {
  id: string;
  orderNumber?: string;
  items: CartItem[];
  totalAmount: number;
  subtotal?: number;
  deliveryCharge?: number;
  discountAmount?: number;
  savingsAmount?: number;
  pricingSnapshot?: {
    couponCode?: string;
    subtotal: number;
    discountAmount: number;
    savingsAmount: number;
    deliveryCharge: number;
    totalAmount: number;
  };
  paymentStatus: "pending" | "paid" | "failed";
  orderStatus: "pending" | "packed" | "shipped" | "delivered" | "cancelled";
  deliveryType: string;
  deliverySlot?: "morning" | "evening";
  statusTimeline?: OrderTimeline[];
  tracking?: OrderTracking;
  createdAt: string;
  invoice?: { invoiceNumber: string; generatedAt: string };
  deliveryDetails?: {
    fullName: string;
    phone: string;
    address: string;
    pincode: string;
  };
  cancellation?: {
    cancelledAt?: string;
    reason?: string;
  };
}

export interface ProductReview {
  _id: string;
  rating: number;
  comment: string;
  createdAt: string;
  user?: {
    _id: string;
    name?: string;
  };
}
