const mongoose = require("mongoose");
const { Types } = mongoose;



const orderSchema = new mongoose.Schema(
  {
    orderGuid: {
      type: String,
      default: () => require("crypto").randomUUID(),
      unique: true,
      index: true, 
    },
    renterId: { type: Types.ObjectId, ref: "User", required: true },
    ownerId: { type: Types.ObjectId, ref: "User", required: true },
    itemId: { type: Types.ObjectId, ref: "Item", required: true },
    itemSnapshot: {
      title: String,
      images: [String],
      basePrice: Number,
      priceUnit: String,
    },
    unitCount: { type: Number, default: 1, min: 1 },
    startAt: {
      type: Date,
      required: true,
    },
    endAt: {
      type: Date,
      required: true,
      validate: {
        validator: function (value) {
          return value > this.startAt;
        },
        message: "endAt must be greater than startAt", 
      },
    },
    totalAmount: { type: Number, required: true, min: 0 },
    depositAmount: { type: Number, default: 0, min: 0 },
    serviceFee: { type: Number, default: 0, min: 0 },
    currency: { type: String, default: "VND", enum: ["VND", "USD"] },
    paymentMethod: {
      type: String,
      enum: ["Wallet", "VNPay", "CashOnDelivery"],
      default: "Wallet",
    },
    paymentStatus: {
      type: String,
      enum: ["not_paid", "partial", "paid", "refunded", "failed"],
      default: "not_paid",
      index: true,
    },
    orderStatus: {
      type: String,
      enum: [
        "pending",
        "confirmed",
        "progress",
        "completed",
        "cancelled",
        "disputed",
      ],
      default: "pending",
      index: true,
    },
    contractId: { type: Types.ObjectId, ref: "Contract" },
    isContractSigned: { type: Boolean, default: false },
    returnInfo: {
      returnedAt: Date,
      confirmedBy: { type: Types.ObjectId, ref: "User" },
      conditionStatus: {
        type: String,
        enum: ["Good", "SlightlyDamaged", "HeavilyDamaged", "Lost"],
      },
      notes: String,
      damageFee: { type: Number, default: 0, min: 0 },
    },
    lifecycle: {
      createdAt: { type: Date, default: Date.now },
      confirmedAt: Date,
      startedAt: Date,
      completedAt: Date,
      canceledAt: Date,
    },
    cancelReason: String,
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

orderSchema.index({ renterId: 1, createdAt: -1 });
orderSchema.index({ ownerId: 1, createdAt: -1 });
orderSchema.index({ itemId: 1, orderStatus: 1 });
orderSchema.index({ startAt: 1, endAt: 1 });
orderSchema.index({ isDeleted: 1 });

module.exports = mongoose.model("Order", orderSchema);
