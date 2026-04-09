const Route = require("../models/Route");
const User = require("../models/User");
const asyncHandler = require("../utils/asyncHandler");
const { sendSuccess } = require("../utils/apiResponse");

const assignDailyRoute = asyncHandler(async (req, res) => {
  const { collectorId, routeDate, area, stops } = req.body;

  if (!collectorId || !routeDate || !Array.isArray(stops)) {
    res.status(400);
    throw new Error("collectorId, routeDate, and stops are required");
  }

  const collector = await User.findOne({ _id: collectorId, role: "collector" });

  if (!collector) {
    res.status(404);
    throw new Error("Collector not found");
  }

  const route = await Route.findOneAndUpdate(
    { collectorId, routeDate },
    { collectorId, routeDate, area: area || collector.area, stops },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  sendSuccess(res, "Daily route assigned successfully", { route });
});

const getCollectorRoute = asyncHandler(async (req, res) => {
  const collectorId = req.params.collectorId || req.user._id;
  const routeDate = req.query.routeDate || new Date().toISOString().slice(0, 10);

  const route = await Route.findOne({ collectorId, routeDate })
    .populate("collectorId", "name email area")
    .populate("stops.userId", "name address");

  sendSuccess(res, "Collector route fetched successfully", { route });
});

const markLocationVisited = asyncHandler(async (req, res) => {
  const { routeId, stopId, status } = req.body;

  if (!routeId || !stopId || !status) {
    res.status(400);
    throw new Error("routeId, stopId, and status are required");
  }

  const route = await Route.findById(routeId);

  if (!route) {
    res.status(404);
    throw new Error("Route not found");
  }

  const stop = route.stops.id(stopId);

  if (!stop) {
    res.status(404);
    throw new Error("Route stop not found");
  }

  stop.status = status;
  stop.visitedAt = status === "visited" ? new Date() : stop.visitedAt;
  await route.save();

  sendSuccess(res, "Route stop updated successfully", { route });
});

module.exports = {
  assignDailyRoute,
  getCollectorRoute,
  markLocationVisited,
};
