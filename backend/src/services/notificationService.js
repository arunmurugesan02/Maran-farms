import { NotificationLog } from "../models/NotificationLog.js";

async function logNotification(channel, eventType, recipient, payload, status = "sent", failureReason = "") {
  await NotificationLog.create({
    channel,
    eventType,
    recipient,
    payload,
    status,
    failureReason
  });
}

export async function sendOrderStatusNotification({ order, status }) {
  const message = `Order ${order.orderNumber} is now ${status}.`;

  await Promise.all([
    logNotification("whatsapp", "order_status", order.deliveryDetails.phone, { message }),
    logNotification("email", "order_status", order.deliveryDetails.phone, { message })
  ]);
}

export async function sendLowStockAlert({ product }) {
  const message = `${product.name} stock is low (${product.stock})`;
  await logNotification("system", "low_stock", "admin", { message });
}

export async function sendNewOrderAlert({ order }) {
  const message = `New order placed: ${order.orderNumber}`;
  await logNotification("system", "new_order", "admin", { message });
}
