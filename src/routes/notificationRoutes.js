const express = require("express");
const {
  sendRequest,
  sendTeacherMessage,
  respondToNotification,
  getNotifications,
  getNotification,
  markAsRead,
  getUnreadCount,
  getNotificationsByStudent,
} = require("../controllers/notificationController");
const { triggerNotificationCleanup } = require("../controllers/cleanupController");
const { verifyToken, authorize } = require("../middleware/auth");
const {
  validateObjectId,
  validatePagination,
  validateNotificationRequest,
  validateNotificationResponse,
  validateTeacherMessage,
} = require("../middleware/validation");

const router = express.Router();

// All routes are protected
router.use(verifyToken);

// Push test route (manager only) - useful for testing push setup
router.post('/test-push/:userId', authorize('manager'), async (req, res) => {
  try {
    const { title, body } = req.body;
    const { sendPushNotification } = require('../services/pushNotificationService');
    const result = await sendPushNotification(req.params.userId, title || 'Test Notification', body || 'This is a test notification from backend', { type: 'test', timestamp: Date.now() });
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Notification routes
router.get("/", validatePagination(), getNotifications);
router.get("/unread/count", getUnreadCount);
router.get(
  "/student/:studentId",
  validateObjectId("studentId"),
  getNotificationsByStudent
);
router.get("/:id", validateObjectId(), getNotification);

// Receptionist only routes
router.post(
  "/request",
  authorize("receptionist"),
  validateNotificationRequest(),
  sendRequest
);

// Teacher only routes
router.post(
  "/message",
  authorize("teacher"),
  validateTeacherMessage(),
  sendTeacherMessage
);
router.post(
  "/:id/respond",
  authorize("teacher"),
  validateObjectId(),
  validateNotificationResponse(),
  respondToNotification
);
router.put(
  "/:id/respond",
  authorize("teacher"),
  validateObjectId(),
  validateNotificationResponse(),
  respondToNotification
);

// General routes
router.put("/:id/read", validateObjectId(), markAsRead);

// Manager only routes - Manual cleanup trigger
router.delete("/cleanup", authorize("manager"), triggerNotificationCleanup);

module.exports = router;
