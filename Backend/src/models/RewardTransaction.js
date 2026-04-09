const mongoose = require("mongoose");

const rewardTransactionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: ["earned", "redeemed", "adjusted"],
      required: true,
    },
    points: {
      type: Number,
      required: true,
    },
    description: {
      type: String,
      default: "",
    },
    referenceType: {
      type: String,
      default: "",
    },
    referenceId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("RewardTransaction", rewardTransactionSchema);
