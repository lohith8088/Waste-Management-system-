const Complaint = require("../models/Complaint");
const PickupRequest = require("../models/PickupRequest");
const WasteData = require("../models/WasteData");
const RewardTransaction = require("../models/RewardTransaction");
const asyncHandler = require("../utils/asyncHandler");
const { sendSuccess } = require("../utils/apiResponse");

const getUserProfile = asyncHandler(async (req, res) => {
  sendSuccess(res, "User profile fetched successfully", { user: req.user });
});

const updateUserProfile = asyncHandler(async (req, res) => {
  const { name, phone, address, location } = req.body;

  if (name !== undefined) req.user.name = name;
  if (phone !== undefined) req.user.phone = phone;
  if (address !== undefined) req.user.address = address;
  if (location) {
    req.user.location = {
      latitude: location.latitude ?? req.user.location.latitude,
      longitude: location.longitude ?? req.user.location.longitude,
    };
  }

  await req.user.save();

  sendSuccess(res, "User profile updated successfully", { user: req.user });
});

const getUserDashboard = asyncHandler(async (req, res) => {
  const [wasteStats, pickupRequests, complaints, rewardHistory] = await Promise.all([
    WasteData.aggregate([
      { $match: { userId: req.user._id } },
      {
        $group: {
          _id: "$wasteType",
          totalWeight: { $sum: "$weight" },
          totalPoints: { $sum: "$rewardPoints" },
        },
      },
    ]),
    PickupRequest.find({ userId: req.user._id }).sort({ createdAt: -1 }).limit(10),
    Complaint.find({ userId: req.user._id }).sort({ createdAt: -1 }).limit(10),
    RewardTransaction.find({ userId: req.user._id }).sort({ createdAt: -1 }).limit(10),
  ]);

  sendSuccess(res, "User dashboard fetched successfully", {
    rewardBalance: req.user.rewardBalance,
    wasteStats,
    pickupRequests,
    complaints,
    rewardHistory,
  });
});

module.exports = {
  getUserProfile,
  updateUserProfile,
  getUserDashboard,
};
