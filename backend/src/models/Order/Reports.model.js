import { Schema, model, Types } from "mongoose";

const reportSchema = new Schema({
  orderId: { type: Types.ObjectId, ref: "Order" },
  reporterId: { type: Types.ObjectId, ref: "User", required: true },
  reportedUserId: { type: Types.ObjectId, ref: "User" },
  reportedItemId: { type: Types.ObjectId, ref: "Item" },
  reason: { type: String, required: true },
  description: { type: String },
  status: {
    type: String,
    enum: ["Pending", "Reviewed", "Resolved", "Rejected"],
    default: "Pending",
  },
  handledBy: { type: Types.ObjectId, ref: "User" },
  handledAt: { type: Date },
  createdAt: { type: Date, default: Date.now },
});

export default model("Report", reportSchema);
