const PickupRequest = require("../models/PickupRequest");
const User = require("../models/User");
const asyncHandler = require("../utils/asyncHandler");
const { sendSuccess } = require("../utils/apiResponse");

const createPickupRequest = asyncHandler(async (req, res) => {
  const { scheduledDate, wasteType, address, location, notes } = req.body;

  if (!address) {
    res.status(400);
    throw new Error("address is required");
  }

  const pickupRequest = await PickupRequest.create({
    userId: req.user._id,
    scheduledDate,
    wasteType: wasteType || "mixed",
    address,
    location,
    notes,
  });

  sendSuccess(res, "Pickup request created successfully", { pickupRequest }, 201);
});

const assignCollector = asyncHandler(async (req, res) => {
  const { pickupRequestId, collectorId } = req.body;

  if (!pickupRequestId || !collectorId) {
    res.status(400);
    throw new Error("pickupRequestId and collectorId are required");
  }

  const collector = await User.findOne({ _id: collectorId, role: "collector" });

  if (!collector) {
    res.status(404);
    throw new Error("Collector not found");
  }

  const pickupRequest = await PickupRequest.findById(pickupRequestId);

  if (!pickupRequest) {
    res.status(404);
    throw new Error("Pickup request not found");
  }

  pickupRequest.collectorId = collectorId;
  pickupRequest.status = "assigned";
  await pickupRequest.save();

  sendSuccess(res, "Collector assigned successfully", { pickupRequest });
});

const updatePickupStatus = asyncHandler(async (req, res) => {
  const { pickupRequestId, status } = req.body;

  if (!pickupRequestId || !status) {
    res.status(400);
    throw new Error("pickupRequestId and status are required");
  }

  const pickupRequest = await PickupRequest.findById(pickupRequestId);

  if (!pickupRequest) {
    res.status(404);
    throw new Error("Pickup request not found");
  }

  pickupRequest.status = status;
  if (status === "completed") {
    pickupRequest.completedAt = new Date();
  }
  await pickupRequest.save();

  sendSuccess(res, "Pickup status updated successfully", { pickupRequest });
});

const listPickupRequests = asyncHandler(async (req, res) => {
  const filter = {};

  if (req.user.role === "user") {
    filter.userId = req.user._id;
  }

  if (req.user.role === "collector") {
    filter.collectorId = req.user._id;
  }

  const pickupRequests = await PickupRequest.find(filter)
    .populate("userId", "name email")
    .populate("collectorId", "name email area")
    .sort({ createdAt: -1 });

  sendSuccess(res, "Pickup requests fetched successfully", { pickupRequests });
});

module.exports = {
  createPickupRequest,
  assignCollector,
  updatePickupStatus,
  listPickupRequests,
};
