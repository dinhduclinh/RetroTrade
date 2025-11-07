const mongoose = require("mongoose");

const ContractTemplateSchema = new mongoose.Schema(
  {
    templateName: { type: String, required: true },
    description: { type: String },
    templateContent: { type: String, required: true },
    isActive: { type: Boolean, default: true },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("ContractTemplate", ContractTemplateSchema);
