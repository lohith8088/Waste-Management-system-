const Complaint = require("../models/Complaint");
const PickupRequest = require("../models/PickupRequest");
const Redemption = require("../models/Redemption");
const Route = require("../models/Route");
const User = require("../models/User");
const WasteData = require("../models/WasteData");
const asyncHandler = require("../utils/asyncHandler");
const { sendSuccess } = require("../utils/apiResponse");
const { createNotification } = require("../services/notificationService");

const getDashboardAnalytics = asyncHandler(async (req, res) => {
  const [totalWaste, activeUsers, rewards, complaints, pickupOverview] = await Promise.all([
    WasteData.aggregate([{ $group: { _id: null, totalWeight: { $sum: "$weight" } } }]),
    User.countDocuments({ isActive: true }),
    User.aggregate([{ $group: { _id: null, totalRewards: { $sum: "$rewardBalance" } } }]),
    Complaint.countDocuments(),
    PickupRequest.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
  ]);

  sendSuccess(res, "Dashboard analytics fetched successfully", {
    totalWaste: totalWaste[0]?.totalWeight || 0,
    activeUsers,
    rewardsDistributed: rewards[0]?.totalRewards || 0,
    totalComplaints: complaints,
    pickupOverview,
  });
});

const manageUsers = asyncHandler(async (req, res) => {
  const users = await User.find({ role: "user" }).sort({ createdAt: -1 });
  sendSuccess(res, "Users fetched successfully", { users });
});

const manageCollectors = asyncHandler(async (req, res) => {
  const { collectorId, area, vehicle, applicationStatus, rejectionReason } = req.body;

  if (collectorId) {
    const collector = await User.findById(collectorId);

    if (!collector) {
      res.status(404);
      throw new Error("Collector not found");
    }

    if (applicationStatus) {
      collector.collectorApplication = {
        ...collector.collectorApplication,
        status: applicationStatus,
        rejectionReason: applicationStatus === "rejected" ? rejectionReason || "" : "",
        reviewedAt: new Date(),
      };

      if (applicationStatus === "approved") {
        collector.role = "collector";
        collector.area = collector.collectorApplication.area || collector.area;
      }
    }

    if (area !== undefined) collector.area = area;
    if (vehicle) collector.vehicle = { ...collector.vehicle, ...vehicle };
    await collector.save();

    if (applicationStatus === "approved" || applicationStatus === "rejected") {
      await createNotification({
        recipientRole: "user",
        recipientId: collector._id,
        type: "collector_application_status",
        title: `Collector application ${applicationStatus}`,
        message:
          applicationStatus === "approved"
            ? "Your collector application has been approved. Refresh the app to access collector tools."
            : `Your collector application was rejected${rejectionReason ? `: ${rejectionReason}` : "."}`,
        relatedEntityType: "User",
        relatedEntityId: collector._id,
      });
    }
  }

  const collectors = await User.find({ role: "collector" }).sort({ createdAt: -1 });
  const collectorApplications = await User.find({
    "collectorApplication.status": { $in: ["pending", "rejected", "approved"] },
  }).sort({ "collectorApplication.appliedAt": -1, createdAt: -1 });

  sendSuccess(res, "Collectors managed successfully", { collectors, collectorApplications });
});

const manageComplaints = asyncHandler(async (req, res) => {
  const { complaintId, status, resolutionNote } = req.body;

  if (complaintId) {
    const complaint = await Complaint.findById(complaintId);

    if (!complaint) {
      res.status(404);
      throw new Error("Complaint not found");
    }

    if (status) complaint.status = status;
    if (resolutionNote !== undefined) complaint.resolutionNote = resolutionNote;
    await complaint.save();

    await createNotification({
      recipientRole: "user",
      recipientId: complaint.userId,
      type: "complaint_status",
      title: `Complaint ${complaint.status}`,
      message: `Your complaint "${complaint.title}" is now ${complaint.status.replace(/_/g, " ")}.`,
      relatedEntityType: "Complaint",
      relatedEntityId: complaint._id,
    });
  }

  const complaints = await Complaint.find().populate("userId", "name email").sort({ createdAt: -1 });
  sendSuccess(res, "Complaints managed successfully", { complaints });
});

const manageRedemptions = asyncHandler(async (req, res) => {
  const { redemptionId, status, adminNote } = req.body;

  if (redemptionId) {
    const redemption = await Redemption.findById(redemptionId);

    if (!redemption) {
      res.status(404);
      throw new Error("Redemption request not found");
    }

    redemption.status = status || redemption.status;
    redemption.adminNote = adminNote ?? redemption.adminNote;
    await redemption.save();

    await createNotification({
      recipientRole: "user",
      recipientId: redemption.userId,
      type: "redemption_status",
      title: `Reward redemption ${redemption.status}`,
      message: `Your redemption request for ${redemption.rewardName} is now ${redemption.status}.`,
      relatedEntityType: "Redemption",
      relatedEntityId: redemption._id,
    });
  }

  const redemptions = await Redemption.find().populate("userId", "name email rewardBalance").sort({ createdAt: -1 });
  sendSuccess(res, "Redemptions managed successfully", { redemptions });
});

const getAssignedRoutes = asyncHandler(async (req, res) => {
  const routes = await Route.find().populate("collectorId", "name email area").sort({ routeDate: -1 });
  sendSuccess(res, "Assigned routes fetched successfully", { routes });
});

module.exports = {
  getDashboardAnalytics,
  manageUsers,
  manageCollectors,
  manageComplaints,
  manageRedemptions,
  getAssignedRoutes,
};
