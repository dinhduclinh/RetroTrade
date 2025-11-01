import { Schema, model, Types } from "mongoose";

const contractSchema = new Schema({
  orderId: { type: Types.ObjectId, ref: "Order", required: true },
  ownerId: { type: Types.ObjectId, ref: "User", required: true },
  renterId: { type: Types.ObjectId, ref: "User", required: true },
  fileUrl: { type: String },
  content: { type: String },
  signedByOwner: { type: Boolean, default: false },
  signedByRenter: { type: Boolean, default: false },
  status: {
    type: String,
    enum: ["Pending", "Active", "Completed"],
    default: "Pending",
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

export default model("Contract", contractSchema);
