const mongoose = require("mongoose");

const TagSchema = new mongoose.Schema(
  {
    Name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      maxlength: 200,
    },
    IsDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Tag", TagSchema);
