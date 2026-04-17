import { Product, Order } from "@/types";

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
  totalAmount: number;
  paymentStatus: Order["paymentStatus"];
  orderStatus: Order["orderStatus"];
  deliveryType: string;
  createdAt: string;
  deliveryDetails?: Order["deliveryDetails"];
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

  const json = await response.json();

  if (!response.ok) {
    throw new Error(json?.message || "Request failed");
  }

  return json as T;
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
    totalAmount: order.totalAmount,
    paymentStatus: order.paymentStatus,
    orderStatus: order.orderStatus,
    deliveryType: order.deliveryType,
    createdAt: order.createdAt,
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
  const result = await request<ApiEnvelope<{ token: string; user: any }>>("/auth/register", {
    method: "POST",
    body: JSON.stringify(input)
  });
  return result.data;
}

export async function loginApi(input: { email: string; password: string }) {
  const result = await request<ApiEnvelope<{ token: string; user: any }>>("/auth/login", {
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
  const result = await request<ApiEnvelope<{ token: string; user: any }>>("/auth/verify-otp", {
    method: "POST",
    body: JSON.stringify(input)
  });
  return result.data;
}

export async function getMeApi() {
  const result = await request<ApiEnvelope<{ user: any }>>("/auth/me");
  return result.data.user;
}

export async function getProductsApi() {
  const result = await request<ApiEnvelope<RawProduct[]>>("/products");
  return result.data.map(mapProduct);
}

export async function getProductByIdApi(id: string) {
  const result = await request<ApiEnvelope<RawProduct>>(`/products/${id}`);
  return mapProduct(result.data);
}

export async function getMyOrdersApi() {
  const result = await request<ApiEnvelope<RawOrder[]>>("/orders/my");
  return result.data.map(mapOrder);
}

export async function getAllOrdersApi() {
  const result = await request<ApiEnvelope<RawAdminOrder[]>>("/orders");
  return result.data.map(mapAdminOrder);
}

export async function createCheckoutOrderApi(payload: {
  items: Array<{ productId: string; quantity: number }>;
  deliveryType: "delivery" | "pickup";
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
