const Location = require("../models/Location");
const User = require("../models/User");
const asyncHandler = require("../utils/asyncHandler");
const { sendSuccess } = require("../utils/apiResponse");
const { saveCollectorLocation } = require("../services/trackingService");

const updateCollectorLocation = asyncHandler(async (req, res) => {
  const collectorId = req.user.role === "collector" ? req.user._id : req.body.collectorId;
  const { latitude, longitude, timestamp } = req.body;

  if (!collectorId || latitude === undefined || longitude === undefined) {
    res.status(400);
    throw new Error("collectorId, latitude, and longitude are required");
  }

  const collector = await User.findOne({ _id: collectorId, role: "collector" });

  if (!collector) {
    res.status(404);
    throw new Error("Collector not found");
  }

  const location = await saveCollectorLocation({
    collectorId,
    latitude,
    longitude,
    timestamp,
  });

  sendSuccess(res, "Collector location updated successfully", { location }, 201);
});

const getLiveCollectorLocation = asyncHandler(async (req, res) => {
  const collectorId = req.params.collectorId;
  const collector = await User.findOne({ _id: collectorId, role: "collector" }).select(
    "name email area lastKnownLocation"
  );

  if (!collector) {
    res.status(404);
    throw new Error("Collector not found");
  }

  const recentHistory = await Location.find({ collectorId }).sort({ timestamp: -1 }).limit(20);

  sendSuccess(res, "Live collector location fetched successfully", {
    collector,
    recentHistory,
  });
});

const getAllActiveCollectors = asyncHandler(async (req, res) => {
  const collectors = await User.find({
    role: "collector",
    isActive: true,
    "lastKnownLocation.timestamp": { $ne: null },
  }).select("name email area phone vehicle lastKnownLocation");

  sendSuccess(res, "Active collectors fetched successfully", { collectors });
});

module.exports = {
  updateCollectorLocation,
  getLiveCollectorLocation,
  getAllActiveCollectors,
};
