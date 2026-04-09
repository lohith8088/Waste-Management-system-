const PickupRequest = require("../models/PickupRequest");
const Route = require("../models/Route");
const asyncHandler = require("../utils/asyncHandler");
const { sendSuccess } = require("../utils/apiResponse");

const getCollectorProfile = asyncHandler(async (req, res) => {
  sendSuccess(res, "Collector profile fetched successfully", { collector: req.user });
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

  sendSuccess(res, "Task completed successfully", { task });
});

const getDailyRoute = asyncHandler(async (req, res) => {
  const routeDate = req.query.routeDate || new Date().toISOString().slice(0, 10);
  const route = await Route.findOne({ collectorId: req.user._id, routeDate }).populate("stops.userId", "name address");

  sendSuccess(res, "Daily route fetched successfully", { route });
});

module.exports = {
  getCollectorProfile,
  getAssignedTasks,
  completeTask,
  getDailyRoute,
};
