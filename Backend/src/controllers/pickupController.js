const PickupRequest = require("../models/PickupRequest");
const User = require("../models/User");
const asyncHandler = require("../utils/asyncHandler");
const { sendSuccess } = require("../utils/apiResponse");
const { createNotification } = require("../services/notificationService");

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

  await createNotification({
    recipientRole: "admin",
    type: "pickup_request",
    title: "New pickup request",
    message: `${req.user.name || req.user.email} created a pickup request for ${address}.`,
    relatedEntityType: "PickupRequest",
    relatedEntityId: pickupRequest._id,
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

  await Promise.all([
    createNotification({
      recipientRole: "collector",
      recipientId: collectorId,
      type: "pickup_assigned",
      title: "New assigned pickup",
      message: `A new pickup has been assigned to you at ${pickupRequest.address}.`,
      relatedEntityType: "PickupRequest",
      relatedEntityId: pickupRequest._id,
    }),
    createNotification({
      recipientRole: "user",
      recipientId: pickupRequest.userId,
      type: "pickup_assigned",
      title: "Collector assigned",
      message: "A collector has been assigned to your pickup request.",
      relatedEntityType: "PickupRequest",
      relatedEntityId: pickupRequest._id,
    }),
  ]);

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

  await Promise.all([
    createNotification({
      recipientRole: "user",
      recipientId: pickupRequest.userId,
      type: "pickup_status",
      title: `Pickup ${status.replace(/_/g, " ")}`,
      message: `Your pickup request at ${pickupRequest.address} is now ${status.replace(/_/g, " ")}.`,
      relatedEntityType: "PickupRequest",
      relatedEntityId: pickupRequest._id,
    }),
    createNotification({
      recipientRole: "admin",
      type: "pickup_status",
      title: "Pickup status updated",
      message: `Pickup at ${pickupRequest.address} was updated to ${status.replace(/_/g, " ")}.`,
      relatedEntityType: "PickupRequest",
      relatedEntityId: pickupRequest._id,
    }),
  ]);

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
