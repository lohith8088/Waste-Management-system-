const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      default: "",
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    role: {
      type: String,
      enum: ["user", "collector", "admin"],
      default: "user",
    },
    phone: {
      type: String,
      default: "",
    },
    address: {
      type: String,
      default: "",
    },
    location: {
      latitude: { type: Number, default: null },
      longitude: { type: Number, default: null },
    },
    area: {
      type: String,
      default: "",
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    rewardBalance: {
      type: Number,
      default: 0,
    },
    vehicle: {
      vehicleNumber: { type: String, default: "" },
      vehicleType: { type: String, default: "" },
      capacityKg: { type: Number, default: 0 },
    },
    collectorApplication: {
      status: {
        type: String,
        enum: ["not_applied", "pending", "approved", "rejected"],
        default: "not_applied",
      },
      area: {
        type: String,
        default: "",
      },
      vehicleDetails: {
        type: String,
        default: "",
      },
      notes: {
        type: String,
        default: "",
      },
      rejectionReason: {
        type: String,
        default: "",
      },
      appliedAt: {
        type: Date,
        default: null,
      },
      reviewedAt: {
        type: Date,
        default: null,
      },
    },
    lastKnownLocation: {
      latitude: { type: Number, default: null },
      longitude: { type: Number, default: null },
      timestamp: { type: Date, default: null },
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("User", userSchema);
