import mongoose from "mongoose";

const notificationLogSchema = new mongoose.Schema(
  {
    channel: { type: String, enum: ["whatsapp", "email", "system"], required: true },
    eventType: { type: String, required: true },
    recipient: { type: String, required: true },
    payload: { type: Object, default: {} },
    status: { type: String, enum: ["pending", "sent", "failed"], default: "pending" },
    failureReason: { type: String, default: "" }
  },
  { timestamps: true }
);

export const NotificationLog = mongoose.model("NotificationLog", notificationLogSchema);
