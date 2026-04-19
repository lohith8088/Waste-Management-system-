const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    recipientRole: {
      type: String,
      enum: ["user", "collector", "admin"],
      required: true,
    },
    recipientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    type: {
      type: String,
      default: "general",
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    relatedEntityType: {
      type: String,
      default: "",
    },
    relatedEntityId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

notificationSchema.index({ recipientRole: 1, recipientId: 1, createdAt: -1 });

module.exports = mongoose.model("Notification", notificationSchema);
