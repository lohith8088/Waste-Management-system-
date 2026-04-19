const PickupRequest = require("../models/PickupRequest");
const Route = require("../models/Route");
const asyncHandler = require("../utils/asyncHandler");
const { sendSuccess } = require("../utils/apiResponse");
const { createNotification } = require("../services/notificationService");

const getCollectorProfile = asyncHandler(async (req, res) => {
  sendSuccess(res, "Collector profile fetched successfully", { collector: req.user });
});

const applyAsCollector = asyncHandler(async (req, res) => {
  const { name, area, vehicleDetails, notes } = req.body;

  if (!name || !area || !vehicleDetails) {
    res.status(400);
    throw new Error("name, area, and vehicleDetails are required");
  }

  if (req.user.role === "collector" && req.user.collectorApplication?.status === "approved") {
    res.status(400);
    throw new Error("User is already an approved collector");
  }

  req.user.name = name;
  req.user.area = area;
  req.user.collectorApplication = {
    ...req.user.collectorApplication,
    status: "pending",
    area,
    vehicleDetails,
    notes: notes || "",
    rejectionReason: "",
    appliedAt: new Date(),
    reviewedAt: null,
  };

  await req.user.save();

  await createNotification({
    recipientRole: "admin",
    type: "collector_application",
    title: "New collector application",
    message: `${req.user.name || req.user.email} applied to become a collector for ${area}.`,
    relatedEntityType: "User",
    relatedEntityId: req.user._id,
  });

  sendSuccess(res, "Collector application submitted successfully", {
    collectorApplication: req.user.collectorApplication,
    user: req.user,
  });
});

const getCollectorApplicationStatus = asyncHandler(async (req, res) => {
  sendSuccess(res, "Collector application fetched successfully", {
    collectorApplication: req.user.collectorApplication,
    role: req.user.role,
  });
});

const getAssignedTasks = asyncHandler(async (req, res) => {
  const tasks = await PickupRequest.find({
    collectorId: req.user._id,
    status: { $in: ["assigned", "in_progress"] },
  })
    .populate("userId", "name email phone address")
    .sort({ scheduledDate: 1, createdAt: -1 });

  sendSuccess(res, "Assigned tasks fetched successfully", { tasks });
});

const completeTask = asyncHandler(async (req, res) => {
  const { taskId } = req.params;
  const task = await PickupRequest.findOne({ _id: taskId, collectorId: req.user._id });

  if (!task) {
    res.status(404);
    throw new Error("Task not found");
  }

  task.status = "completed";
  task.completedAt = new Date();
  await task.save();

  await createNotification({
    recipientRole: "user",
    recipientId: task.userId,
    type: "pickup_completed",
    title: "Pickup completed",
    message: `Your pickup at ${task.address} has been marked completed.`,
    relatedEntityType: "PickupRequest",
    relatedEntityId: task._id,
  });

  sendSuccess(res, "Task completed successfully", { task });
});

const getDailyRoute = asyncHandler(async (req, res) => {
  const routeDate = req.query.routeDate || new Date().toISOString().slice(0, 10);
  const route = await Route.findOne({ collectorId: req.user._id, routeDate }).populate("stops.userId", "name address");

  sendSuccess(res, "Daily route fetched successfully", { route });
});

module.exports = {
  applyAsCollector,
  getCollectorApplicationStatus,
  getCollectorProfile,
  getAssignedTasks,
  completeTask,
  getDailyRoute,
};
