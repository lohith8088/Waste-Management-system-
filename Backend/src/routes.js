const express = require("express");

const authController = require("./controllers/authController");
const userController = require("./controllers/userController");
const collectorController = require("./controllers/collectorController");
const adminController = require("./controllers/adminController");
const wasteController = require("./controllers/wasteController");
const rewardController = require("./controllers/rewardController");
const pickupController = require("./controllers/pickupController");
const complaintController = require("./controllers/complaintController");
const routeController = require("./controllers/routeController");
const trackingController = require("./controllers/trackingController");
const notificationController = require("./controllers/notificationController");
const { protect, authorize } = require("./middleware/authMiddleware");

const router = express.Router();

router.post("/auth/send-otp", authController.sendOTP);
router.post("/auth/verify-otp", authController.verifyOTP);
router.get("/auth/me", protect, authController.getCurrentUser);

router.get("/users/profile", protect, authorize("user", "admin"), userController.getUserProfile);
router.put("/users/profile", protect, authorize("user", "admin"), userController.updateUserProfile);
router.get("/users/dashboard", protect, authorize("user", "admin"), userController.getUserDashboard);

router.get("/collectors/profile", protect, authorize("collector", "admin"), collectorController.getCollectorProfile);
router.post("/collectors/apply", protect, authorize("user", "admin"), collectorController.applyAsCollector);
router.get("/collectors/application", protect, authorize("user", "collector", "admin"), collectorController.getCollectorApplicationStatus);
router.get("/collectors/tasks", protect, authorize("collector", "admin"), collectorController.getAssignedTasks);
router.patch("/collectors/tasks/:taskId/complete", protect, authorize("collector", "admin"), collectorController.completeTask);
router.get("/collectors/route", protect, authorize("collector", "admin"), collectorController.getDailyRoute);

router.get("/admin/dashboard", protect, authorize("admin"), adminController.getDashboardAnalytics);
router.get("/admin/users", protect, authorize("admin"), adminController.manageUsers);
router.get("/admin/collectors", protect, authorize("admin"), adminController.manageCollectors);
router.put("/admin/collectors", protect, authorize("admin"), adminController.manageCollectors);
router.get("/admin/complaints", protect, authorize("admin"), adminController.manageComplaints);
router.put("/admin/complaints", protect, authorize("admin"), adminController.manageComplaints);
router.get("/admin/redemptions", protect, authorize("admin"), adminController.manageRedemptions);
router.put("/admin/redemptions", protect, authorize("admin"), adminController.manageRedemptions);
router.get("/admin/routes", protect, authorize("admin"), adminController.getAssignedRoutes);

router.post("/waste", protect, authorize("admin", "collector"), wasteController.addWasteData);
router.get("/waste", protect, authorize("user", "collector", "admin"), wasteController.getWasteHistory);
router.post("/waste/calculate-reward", protect, authorize("user", "collector", "admin"), wasteController.triggerRewardCalculation);

router.post("/rewards/calculate", protect, authorize("user", "admin"), rewardController.calculateRewards);
router.get("/rewards/balance", protect, authorize("user", "admin"), rewardController.getRewardBalance);
router.post("/rewards/redeem", protect, authorize("user", "admin"), rewardController.redeemRewards);
router.get("/rewards/history", protect, authorize("user", "admin"), rewardController.rewardHistory);

router.get("/pickups", protect, authorize("user", "collector", "admin"), pickupController.listPickupRequests);
router.post("/pickups", protect, authorize("user", "admin"), pickupController.createPickupRequest);
router.post("/pickups/assign", protect, authorize("admin"), pickupController.assignCollector);
router.patch("/pickups/status", protect, authorize("collector", "admin"), pickupController.updatePickupStatus);

router.post("/complaints", protect, authorize("user", "admin"), complaintController.createComplaint);
router.get("/complaints", protect, authorize("user", "collector", "admin"), complaintController.getComplaints);
router.patch("/complaints/status", protect, authorize("admin"), complaintController.updateComplaintStatus);

router.post("/routes/assign", protect, authorize("admin"), routeController.assignDailyRoute);
router.get("/routes/me", protect, authorize("collector", "admin"), routeController.getCollectorRoute);
router.get("/routes/collector/:collectorId", protect, authorize("admin"), routeController.getCollectorRoute);
router.patch("/routes/visit", protect, authorize("collector", "admin"), routeController.markLocationVisited);

router.post("/tracking/location", protect, authorize("collector", "admin"), trackingController.updateCollectorLocation);
router.get("/tracking/collectors/active", protect, authorize("admin", "user", "collector"), trackingController.getAllActiveCollectors);
router.get("/tracking/collector/:collectorId", protect, authorize("admin", "user", "collector"), trackingController.getLiveCollectorLocation);

router.get("/notifications", protect, authorize("user", "collector", "admin"), notificationController.getNotifications);
router.patch("/notifications/read-all", protect, authorize("user", "collector", "admin"), notificationController.markAllNotificationsAsRead);
router.patch("/notifications/:notificationId/read", protect, authorize("user", "collector", "admin"), notificationController.markNotificationAsRead);

module.exports = router;
