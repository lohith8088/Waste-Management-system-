const Notification = require("../models/Notification");
const asyncHandler = require("../utils/asyncHandler");
const { sendSuccess } = require("../utils/apiResponse");
const { listNotificationsForUser } = require("../services/notificationService");

const getNotifications = asyncHandler(async (req, res) => {
  const notifications = await listNotificationsForUser(req.user);
  sendSuccess(res, "Notifications fetched successfully", { notifications });
});

const markNotificationAsRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findById(req.params.notificationId);

  if (!notification) {
    res.status(404);
    throw new Error("Notification not found");
  }

  const canAccess =
    req.user.role === "admin"
      ? notification.recipientRole === "admin"
      : notification.recipientRole === req.user.role &&
        (!notification.recipientId || String(notification.recipientId) === String(req.user._id));

  if (!canAccess) {
    res.status(403);
    throw new Error("Access denied");
  }

  notification.isRead = true;
  await notification.save();

  sendSuccess(res, "Notification marked as read", { notification });
});

const markAllNotificationsAsRead = asyncHandler(async (req, res) => {
  const filter =
    req.user.role === "admin"
      ? { recipientRole: "admin", isRead: false }
      : {
          recipientRole: req.user.role,
          isRead: false,
          $or: [{ recipientId: req.user._id }, { recipientId: null }],
        };

  await Notification.updateMany(filter, { isRead: true });
  sendSuccess(res, "All notifications marked as read");
});

module.exports = {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
};
