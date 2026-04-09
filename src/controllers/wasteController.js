const User = require("../models/User");
const WasteData = require("../models/WasteData");
const asyncHandler = require("../utils/asyncHandler");
const { sendSuccess } = require("../utils/apiResponse");
const { calculatePoints, creditRewards } = require("../services/rewardService");

const addWasteData = asyncHandler(async (req, res) => {
  const { wasteType, weight, userId, timestamp, source } = req.body;

  if (!wasteType || weight === undefined || !userId) {
    res.status(400);
    throw new Error("wasteType, weight, and userId are required");
  }

  const user = await User.findById(userId);

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  const rewardPoints = calculatePoints({ wasteType, weight });

  const wasteRecord = await WasteData.create({
    wasteType,
    weight,
    userId,
    timestamp: timestamp || new Date(),
    source: source || "iot",
    rewardPoints,
  });

  await creditRewards({
    userId,
    points: rewardPoints,
    description: `Rewards for ${weight}kg of ${wasteType}`,
    referenceType: "WasteData",
    referenceId: wasteRecord._id,
  });

  sendSuccess(res, "Waste data added successfully", { wasteRecord }, 201);
});

const getWasteHistory = asyncHandler(async (req, res) => {
  const filter = {};

  if (req.user.role === "user") {
    filter.userId = req.user._id;
  } else if (req.query.userId) {
    filter.userId = req.query.userId;
  }

  if (req.query.wasteType) {
    filter.wasteType = req.query.wasteType;
  }

  const wasteHistory = await WasteData.find(filter).populate("userId", "name email").sort({ timestamp: -1 });

  sendSuccess(res, "Waste history fetched successfully", { wasteHistory });
});

const triggerRewardCalculation = asyncHandler(async (req, res) => {
  const { wasteType, weight } = req.body;

  if (!wasteType || weight === undefined) {
    res.status(400);
    throw new Error("wasteType and weight are required");
  }

  const points = calculatePoints({ wasteType, weight });
  sendSuccess(res, "Reward calculation completed", { wasteType, weight, points });
});

module.exports = {
  addWasteData,
  getWasteHistory,
  triggerRewardCalculation,
};
