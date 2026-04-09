const Otp = require("../models/Otp");
const User = require("../models/User");
const asyncHandler = require("../utils/asyncHandler");
const generateToken = require("../utils/generateToken");
const { sendSuccess } = require("../utils/apiResponse");
const { generateOTP } = require("../services/otpService");
const { sendOTPEmail } = require("../services/emailService");

const sendOTP = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    res.status(400);
    throw new Error("Email is required");
  }

  const normalizedEmail = email.toLowerCase().trim();
  const otp = generateOTP();
  const expiryMinutes = Number(process.env.OTP_EXPIRY_MINUTES || 10);
  const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);

  await Otp.deleteMany({ email: normalizedEmail });
  await Otp.create({ email: normalizedEmail, otp, expiresAt });
  await sendOTPEmail(normalizedEmail, otp);

  sendSuccess(res, "OTP sent successfully", {
    email: normalizedEmail,
    expiresAt,
  });
});

const verifyOTP = asyncHandler(async (req, res) => {
  const { email, otp, name, role } = req.body;

  if (!email || !otp) {
    res.status(400);
    throw new Error("Email and OTP are required");
  }

  const normalizedEmail = email.toLowerCase().trim();
  const otpRecord = await Otp.findOne({ email: normalizedEmail, otp }).sort({ createdAt: -1 });

  if (!otpRecord) {
    res.status(400);
    throw new Error("Invalid OTP");
  }

  if (otpRecord.expiresAt < new Date()) {
    res.status(400);
    throw new Error("OTP has expired");
  }

  otpRecord.verifiedAt = new Date();
  await otpRecord.save();

  let user = await User.findOne({ email: normalizedEmail });

  if (!user) {
    user = await User.create({
      email: normalizedEmail,
      name: name || "",
      role: ["user", "collector", "admin"].includes(role) ? role : "user",
      isEmailVerified: true,
    });
  } else if (!user.isEmailVerified) {
    user.isEmailVerified = true;
    if (name && !user.name) {
      user.name = name;
    }
    await user.save();
  }

  const token = generateToken({
    id: user._id,
    role: user.role,
    email: user.email,
  });

  sendSuccess(res, "OTP verified successfully", { token, user });
});

const getCurrentUser = asyncHandler(async (req, res) => {
  sendSuccess(res, "Current user fetched successfully", { user: req.user });
});

module.exports = {
  sendOTP,
  verifyOTP,
  getCurrentUser,
};
