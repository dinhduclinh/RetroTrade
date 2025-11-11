const mongoose = require("mongoose");

const taxSchema = new mongoose.Schema(
  {
    taxRate: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    },
    description: {
      type: String,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    effectiveFrom: {
      type: Date,
      default: Date.now,
    },
    effectiveTo: {
      type: Date,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    history: [
      {
        taxRate: Number,
        description: String,
        effectiveFrom: Date,
        effectiveTo: Date,
        changedAt: { type: Date, default: Date.now },
        changedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      },
    ],
  },
  {
    timestamps: true,
    collection: "taxes",
  }
);

// Chỉ cho phép 1 tax setting active tại một thời điểm
taxSchema.index({ isActive: 1 });

// Method để lấy tax rate hiện tại (active)
taxSchema.statics.getCurrentTaxRate = async function () {
  const tax = await this.findOne({ isActive: true }).sort({ createdAt: -1 });
  return tax ? tax.taxRate : 3; // Default 3% nếu không có
};


taxSchema.statics.getCurrentTax = async function () {
  return await this.findOne({ isActive: true }).sort({ createdAt: -1 });
};

module.exports = mongoose.model("Tax", taxSchema);

