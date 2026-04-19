const Redemption = require("../models/Redemption");
const RewardTransaction = require("../models/RewardTransaction");
const User = require("../models/User");
const asyncHandler = require("../utils/asyncHandler");
const { sendSuccess } = require("../utils/apiResponse");
const { calculatePoints } = require("../services/rewardService");
const { createNotification } = require("../services/notificationService");

const calculateRewards = asyncHandler(async (req, res) => {
  const { wasteType, weight } = req.body;

  if (!wasteType || weight === undefined) {
    res.status(400);
    throw new Error("wasteType and weight are required");
  }

  const points = calculatePoints({ wasteType, weight });
  sendSuccess(res, "Rewards calculated successfully", { points });
});

const getRewardBalance = asyncHandler(async (req, res) => {
  sendSuccess(res, "Reward balance fetched successfully", {
    rewardBalance: req.user.rewardBalance,
  });
});

const redeemRewards = asyncHandler(async (req, res) => {
  const { points, rewardName } = req.body;

  if (!points || !rewardName) {
    res.status(400);
    throw new Error("points and rewardName are required");
  }

  if (req.user.rewardBalance < points) {
    res.status(400);
    throw new Error("Insufficient reward balance");
  }

  const redemption = await Redemption.create({
    userId: req.user._id,
    points,
    rewardName,
  });

  await User.findByIdAndUpdate(req.user._id, { $inc: { rewardBalance: -points } });
  await RewardTransaction.create({
    userId: req.user._id,
    type: "redeemed",
    points: -Math.abs(points),
    description: `Redemption requested for ${rewardName}`,
    referenceType: "Redemption",
    referenceId: redemption._id,
  });

  await createNotification({
    recipientRole: "admin",
    type: "reward_redemption",
    title: "New redemption request",
    message: `${req.user.name || req.user.email} requested redemption for ${rewardName}.`,
    relatedEntityType: "Redemption",
    relatedEntityId: redemption._id,
  });

  sendSuccess(res, "Reward redemption request created successfully", { redemption }, 201);
});

const rewardHistory = asyncHandler(async (req, res) => {
  const transactions = await RewardTransaction.find({ userId: req.user._id }).sort({ createdAt: -1 });
  sendSuccess(res, "Reward history fetched successfully", { transactions });
});

module.exports = {
  calculateRewards,
  getRewardBalance,
  redeemRewards,
  rewardHistory,
};
