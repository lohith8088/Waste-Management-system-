const mongoose = require("mongoose");

const routeStopSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    address: {
      type: String,
      required: true,
    },
    location: {
      latitude: { type: Number, default: null },
      longitude: { type: Number, default: null },
    },
    pickupRequestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PickupRequest",
      default: null,
    },
    status: {
      type: String,
      enum: ["pending", "visited", "missed"],
      default: "pending",
    },
    visitedAt: {
      type: Date,
      default: null,
    },
  },
  { _id: true }
);

const routeSchema = new mongoose.Schema(
  {
    collectorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    routeDate: {
      type: String,
      required: true,
    },
    area: {
      type: String,
      default: "",
    },
    stops: [routeStopSchema],
  },
  {
    timestamps: true,
  }
);

routeSchema.index({ collectorId: 1, routeDate: 1 }, { unique: true });

module.exports = mongoose.model("Route", routeSchema);
