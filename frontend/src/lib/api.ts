import { Address, Order, Product, ProductReview, User } from "@/types";

const envApiBaseUrl = import.meta.env.VITE_API_BASE_URL as string | undefined;
const isLanClient = !["localhost", "127.0.0.1"].includes(window.location.hostname);
const API_BASE_URL =
  envApiBaseUrl && !(isLanClient && envApiBaseUrl.includes("localhost"))
    ? envApiBaseUrl
    : `http://${window.location.hostname}:4000/api`;
const TOKEN_KEY = "maran_auth_token";

type ApiEnvelope<T> = {
  success: boolean;
  message?: string;
  data: T;
};

type RawProduct = Product & {
  _id: string;
  legacyId?: string;
};

type RawOrder = {
  _id: string;
  orderNumber?: string;
  items: Array<{
    product: string;
    productName: string;
    unitPrice: number;
    unit: string;
    image: string;
    productType: "grass" | "animal";
    deliveryType: "delivery" | "pickup" | "both";
    quantity: number;
    subtotal: number;
  }>;
  subtotal?: number;
  discountAmount?: number;
  savingsAmount?: number;
  deliveryCharge?: number;
  totalAmount: number;
  pricingSnapshot?: Order["pricingSnapshot"];
  paymentStatus: Order["paymentStatus"];
  orderStatus: Order["orderStatus"];
  deliveryType: string;
  deliverySlot?: "morning" | "evening";
  statusTimeline?: Order["statusTimeline"];
  tracking?: Order["tracking"];
  createdAt: string;
  invoice?: Order["invoice"];
  deliveryDetails?: Order["deliveryDetails"];
  cancellation?: Order["cancellation"];
};

type RawAdminOrder = RawOrder & {
  user?:
    | string
    | {
      _id: string;
      name?: string;
      email?: string;
      phone?: string;
    };
};

export type AdminOrder = Order & {
  user?: {
    id: string;
    name?: string;
    email?: string;
    phone?: string;
  };
};

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getToken();

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers || {})
    }
  });

  let json: any = null;
  try {
    json = await response.json();
  } catch (_error) {
    json = null;
  }

  if (!response.ok) {
    throw new Error(json?.message || "Request failed");
  }

  return json as T;
}

async function requestBlob(path: string): Promise<Blob> {
  const token = getToken();
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    }
  });

  if (!response.ok) {
    let message = "Request failed";
    try {
      const json = await response.json();
      message = json?.message || message;
    } catch (_error) {
      // ignore parsing error for blob responses
    }
    throw new Error(message);
  }

  return response.blob();
}

function mapProduct(product: RawProduct): Product {
  return {
    ...product,
    id: product.legacyId || product._id
  };
}

function mapOrder(order: RawOrder): Order {
  return {
    id: order._id,
    orderNumber: order.orderNumber,
    totalAmount: order.totalAmount,
    subtotal: order.subtotal,
    discountAmount: order.discountAmount,
    savingsAmount: order.savingsAmount,
    deliveryCharge: order.deliveryCharge,
    pricingSnapshot: order.pricingSnapshot,
    paymentStatus: order.paymentStatus,
    orderStatus: order.orderStatus,
    deliveryType: order.deliveryType,
    deliverySlot: order.deliverySlot,
    statusTimeline: order.statusTimeline,
    tracking: order.tracking,
    createdAt: order.createdAt,
    invoice: order.invoice,
    cancellation: order.cancellation,
    deliveryDetails: order.deliveryDetails,
    items: order.items.map((item) => ({
      quantity: item.quantity,
      product: {
        id: item.product,
        name: item.productName,
        price: item.unitPrice,
        unit: item.unit,
        type: item.productType,
        stock: 0,
        minQty: 1,
        deliveryType: item.deliveryType,
        description: "",
        images: item.image ? [item.image] : [],
        videos: [],
        category: ""
      }
    }))
  };
}

function mapAdminOrder(order: RawAdminOrder): AdminOrder {
  const mappedOrder = mapOrder(order);
  const user =
    order.user && typeof order.user === "object"
      ? {
          id: order.user._id,
          name: order.user.name,
          email: order.user.email,
          phone: order.user.phone
        }
      : undefined;

  return {
    ...mappedOrder,
    user
  };
}

export async function registerApi(input: {
  name: string;
  email: string;
  password: string;
}) {
  const result = await request<ApiEnvelope<{ token: string; user: User }>>("/auth/register", {
    method: "POST",
    body: JSON.stringify(input)
  });
  return result.data;
}

export async function loginApi(input: { email: string; password: string }) {
  const result = await request<ApiEnvelope<{ token: string; user: User }>>("/auth/login", {
    method: "POST",
    body: JSON.stringify(input)
  });
  return result.data;
}

export async function requestOtpApi(input: { phone: string }) {
  const result = await request<ApiEnvelope<{ phone: string; expiresIn: number; otp?: string }>>("/auth/request-otp", {
    method: "POST",
    body: JSON.stringify(input)
  });
  return result.data;
}

export async function verifyOtpApi(input: { phone: string; otp: string; name?: string }) {
  const result = await request<ApiEnvelope<{ token: string; user: User }>>("/auth/verify-otp", {
    method: "POST",
    body: JSON.stringify(input)
  });
  return result.data;
}

export async function getMeApi() {
  const result = await request<ApiEnvelope<{ user: User }>>("/auth/me");
  return result.data.user;
}

export async function updateProfileApi(input: { name?: string; pincode?: string }) {
  const result = await request<ApiEnvelope<{ user: User }>>("/auth/me/profile", {
    method: "PUT",
    body: JSON.stringify(input)
  });
  return result.data.user;
}

export async function addAddressApi(input: Omit<Address, "_id" | "isDefault"> & { label?: string }) {
  const result = await request<ApiEnvelope<{ addresses: Address[] }>>("/auth/me/addresses", {
    method: "POST",
    body: JSON.stringify(input)
  });
  return result.data.addresses;
}

export async function updateAddressApi(addressId: string, input: Partial<Address>) {
  const result = await request<ApiEnvelope<{ addresses: Address[] }>>(`/auth/me/addresses/${addressId}`, {
    method: "PATCH",
    body: JSON.stringify(input)
  });
  return result.data.addresses;
}

export async function setDefaultAddressApi(addressId: string) {
  const result = await request<ApiEnvelope<{ addresses: Address[] }>>(`/auth/me/addresses/${addressId}/default`, {
    method: "PUT"
  });
  return result.data.addresses;
}

export async function deleteAddressApi(addressId: string) {
  const result = await request<ApiEnvelope<{ addresses: Address[] }>>(`/auth/me/addresses/${addressId}`, {
    method: "DELETE"
  });
  return result.data.addresses;
}

export async function getProductsApi(params?: {
  category?: string;
  type?: string;
  search?: string;
  deliveryType?: string;
  minPrice?: number;
  maxPrice?: number;
  lowStockOnly?: boolean;
}) {
  const query = new URLSearchParams();
  if (params?.category) query.set("category", params.category);
  if (params?.type) query.set("type", params.type);
  if (params?.search) query.set("search", params.search);
  if (params?.deliveryType) query.set("deliveryType", params.deliveryType);
  if (typeof params?.minPrice === "number") query.set("minPrice", String(params.minPrice));
  if (typeof params?.maxPrice === "number") query.set("maxPrice", String(params.maxPrice));
  if (params?.lowStockOnly) query.set("lowStockOnly", "true");

  const path = query.toString() ? `/products?${query}` : "/products";
  const result = await request<ApiEnvelope<RawProduct[]>>(path);
  return result.data.map(mapProduct);
}

export async function getProductByIdApi(id: string) {
  const result = await request<ApiEnvelope<RawProduct>>(`/products/${id}`);
  return mapProduct(result.data);
}

export async function getProductReviewsApi(id: string) {
  const result = await request<ApiEnvelope<ProductReview[]>>(`/products/${id}/reviews`);
  return result.data;
}

export async function submitProductReviewApi(id: string, payload: { rating: number; comment?: string }) {
  const result = await request<ApiEnvelope<ProductReview>>(`/products/${id}/reviews`, {
    method: "POST",
    body: JSON.stringify(payload)
  });
  return result.data;
}

export async function getMyOrdersApi() {
  const result = await request<ApiEnvelope<RawOrder[]>>("/orders/my");
  return result.data.map(mapOrder);
}

export async function getMyOrderApi(id: string) {
  const result = await request<ApiEnvelope<RawOrder>>(`/orders/my/${id}`);
  return mapOrder(result.data);
}

export async function getAllOrdersApi() {
  const result = await request<ApiEnvelope<RawAdminOrder[]>>("/orders");
  return result.data.map(mapAdminOrder);
}

export async function createCheckoutOrderApi(payload: {
  items: Array<{ productId: string; quantity: number }>;
  deliveryType: "delivery" | "pickup";
  deliverySlot: "morning" | "evening";
  couponCode?: string;
  idempotencyKey: string;
  deliveryDetails: {
    fullName: string;
    phone: string;
    address: string;
    pincode: string;
  };
}) {
  const result = await request<
    ApiEnvelope<{
      orderId: string;
      amount: number;
      currency: string;
      razorpayOrderId: string;
      customer: { name: string; email: string; phone: string };
      pricing: Order["pricingSnapshot"];
    }>
  >("/orders/checkout", {
    method: "POST",
    body: JSON.stringify(payload)
  });

  return result.data;
}

export async function verifyPaymentApi(payload: {
  orderId: string;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}) {
  const result = await request<ApiEnvelope<any>>("/orders/verify-payment", {
    method: "POST",
    body: JSON.stringify(payload)
  });
  return result.data;
}

export async function validateCouponApi(payload: { couponCode: string }) {
  const result = await request<ApiEnvelope<any>>("/orders/coupon/validate", {
    method: "POST",
    body: JSON.stringify(payload)
  });
  return result.data;
}

export async function cancelOrderApi(id: string, reason?: string) {
  const result = await request<ApiEnvelope<RawOrder>>(`/orders/${id}/cancel`, {
    method: "PATCH",
    body: JSON.stringify({ reason: reason || "" })
  });
  return mapOrder(result.data);
}

export async function reorderApi(id: string) {
  const result = await request<ApiEnvelope<{ items: Array<{ productId: string; quantity: number }> }>>(
    `/orders/${id}/reorder`,
    { method: "POST" }
  );
  return result.data;
}

export async function downloadInvoiceApi(orderId: string) {
  return requestBlob(`/orders/${orderId}/invoice`);
}

export async function createQuoteRequestApi(payload: {
  items: Array<{ productId: string; quantity: number; note?: string }>;
  contactName: string;
  phone: string;
  address?: string;
  message?: string;
}) {
  const result = await request<ApiEnvelope<any>>("/orders/quotes", {
    method: "POST",
    body: JSON.stringify(payload)
  });
  return result.data;
}

export async function getMyQuotesApi() {
  const result = await request<ApiEnvelope<any[]>>("/orders/quotes/my");
  return result.data;
}

export async function getAdminAnalyticsApi() {
  const result = await request<ApiEnvelope<any>>("/orders/admin/analytics");
  return result.data;
}

export async function getAdminQuotesApi() {
  const result = await request<ApiEnvelope<any[]>>("/orders/admin/quotes");
  return result.data;
}

export async function updateOrderStatusApi(
  id: string,
  payload: { orderStatus: Order["orderStatus"]; paymentStatus?: Order["paymentStatus"]; note?: string }
) {
  const result = await request<ApiEnvelope<RawOrder>>(`/orders/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify(payload)
  });
  return mapOrder(result.data);
}

export async function createProductApi(payload: Partial<Product>) {
  const result = await request<ApiEnvelope<RawProduct>>("/products", {
    method: "POST",
    body: JSON.stringify(payload)
  });
  return mapProduct(result.data);
}

export async function updateProductApi(id: string, payload: Partial<Product>) {
  const result = await request<ApiEnvelope<RawProduct>>(`/products/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload)
  });
  return mapProduct(result.data);
}

export async function deleteProductApi(id: string) {
  await request<ApiEnvelope<{ message: string }>>(`/products/${id}`, {
    method: "DELETE"
  });
}

export async function getWishlistApi() {
  const result = await request<ApiEnvelope<RawProduct[]>>("/wishlist");
  return result.data.map(mapProduct);
}

export async function addWishlistApi(productId: string) {
  await request<ApiEnvelope<{ message: string }>>("/wishlist", {
    method: "POST",
    body: JSON.stringify({ productId })
  });
}

export async function removeWishlistApi(productId: string) {
  await request<ApiEnvelope<{ message: string }>>(`/wishlist/${productId}`, {
    method: "DELETE"
  });
}
