const mongoose = require("mongoose");
const { Schema, Types } = mongoose;


const reportSchema = new Schema({
  orderId: {
    type: Types.ObjectId,
    ref: "Order",
    required: true,
  },
  reporterId: {
    type: Types.ObjectId,
    ref: "User",
    required: true,
  },
  reportedUserId: {
    type: Types.ObjectId,
    ref: "User",
  },
  reportedItemId: {
    type: Types.ObjectId,
    ref: "Item",
  },
  reason: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  evidence: {
    type: [String],
    default: [],
  },
  type: {
    type: String,
    enum: ["general", "dispute"],
    default: "dispute",
  },
  status: {
    type: String,
    enum: ["Pending", "Reviewed", "Resolved", "Rejected"],
    default: "Pending",
  },
  resolution: {
    decision: { type: String },
    notes: { type: String },
    refundAmount: { type: Number, default: 0 },
  },
  handledBy: {
    type: Types.ObjectId,
    ref: "User",
  },
  handledAt: {
    type: Date,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});


const Report = mongoose.model("Report", reportSchema);

module.exports = Report;
