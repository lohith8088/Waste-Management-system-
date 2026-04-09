const User = require("../models/User");
const RewardTransaction = require("../models/RewardTransaction");

const rewardRates = {
  plastic: 12,
  organic: 5,
  metal: 15,
  paper: 8,
  glass: 10,
  ewaste: 20,
  mixed: 4,
};

const calculatePoints = ({ wasteType, weight }) => {
  const rate = rewardRates[wasteType] || rewardRates.mixed;
  return Math.round(rate * Number(weight || 0));
};

const creditRewards = async ({ userId, points, description, referenceType, referenceId }) => {
  if (points <= 0) {
    return null;
  }

  await User.findByIdAndUpdate(userId, { $inc: { rewardBalance: points } });

  return RewardTransaction.create({
    userId,
    type: "earned",
    points,
    description,
    referenceType,
    referenceId,
  });
};

module.exports = {
  calculatePoints,
  creditRewards,
};
