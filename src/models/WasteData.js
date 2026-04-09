const mongoose = require("mongoose");

const wasteDataSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    wasteType: {
      type: String,
      enum: ["plastic", "organic", "metal", "paper", "glass", "ewaste", "mixed"],
      required: true,
    },
    weight: {
      type: Number,
      required: true,
      min: 0,
    },
    source: {
      type: String,
      enum: ["iot", "manual", "pickup"],
      default: "iot",
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    rewardPoints: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("WasteData", wasteDataSchema);
