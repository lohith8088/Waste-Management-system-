const Complaint = require("../models/Complaint");
const asyncHandler = require("../utils/asyncHandler");
const { sendSuccess } = require("../utils/apiResponse");
const { createNotification } = require("../services/notificationService");

const createComplaint = asyncHandler(async (req, res) => {
  const { title, description, category } = req.body;

  if (!title || !description) {
    res.status(400);
    throw new Error("title and description are required");
  }

  const complaint = await Complaint.create({
    userId: req.user._id,
    title,
    description,
    category,
  });

  await createNotification({
    recipientRole: "admin",
    type: "complaint_created",
    title: "New complaint submitted",
    message: `${req.user.name || req.user.email} submitted complaint "${title}".`,
    relatedEntityType: "Complaint",
    relatedEntityId: complaint._id,
  });

  sendSuccess(res, "Complaint created successfully", { complaint }, 201);
});

const getComplaints = asyncHandler(async (req, res) => {
  const filter = req.user.role === "user" ? { userId: req.user._id } : {};
  const complaints = await Complaint.find(filter).populate("userId", "name email").sort({ createdAt: -1 });

  sendSuccess(res, "Complaints fetched successfully", { complaints });
});

const updateComplaintStatus = asyncHandler(async (req, res) => {
  const { complaintId, status, resolutionNote } = req.body;

  if (!complaintId || !status) {
    res.status(400);
    throw new Error("complaintId and status are required");
  }

  const complaint = await Complaint.findById(complaintId);

  if (!complaint) {
    res.status(404);
    throw new Error("Complaint not found");
  }

  complaint.status = status;
  complaint.resolutionNote = resolutionNote ?? complaint.resolutionNote;
  await complaint.save();

  sendSuccess(res, "Complaint status updated successfully", { complaint });
});

module.exports = {
  createComplaint,
  getComplaints,
  updateComplaintStatus,
};
