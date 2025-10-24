const notificationService = require("../services/notificationService");
const logger = require("../config/logger");

// @desc    Send request notification to teacher
// @route   POST /api/notifications/request
// @access  Private/Receptionist
const sendRequest = async (req, res, next) => {
  try {
    const { studentId, message } = req.body;
    const notification = await notificationService.sendRequest({
      fromUserId: req.user.id,
      studentId,
      message,
    });

    logger.info(
      `Request notification sent from ${req.user.name} for student ${studentId}`
    );

    res.status(201).json({
      status: "success",
      message: "Request sent to teacher successfully",
      data: { notification },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Teacher sends message to receptionist about a student
// @route   POST /api/notifications/message
// @access  Private/Teacher
const sendTeacherMessage = async (req, res, next) => {
  try {
    const { receptionistId, studentId, message } = req.body;
    const notification = await notificationService.sendMessageFromTeacher({
      fromTeacherId: req.user.id,
      toReceptionistId: receptionistId,
      studentId,
      message,
    });

    logger.info(
      `Teacher ${req.user.name} sent message to receptionist ${receptionistId} about student ${studentId}`
    );

    res.status(201).json({ status: "success", data: { notification } });
  } catch (error) {
    next(error);
  }
};

// @desc    Respond to notification (teacher response)
// @route   PUT /api/notifications/:id/respond
// @access  Private/Teacher
const respondToNotification = async (req, res, next) => {
  try {
    const { approved, responseMessage } = req.body;
    
    // Convert approved boolean to status string
    // approved: true = student approved to leave (absent/gone)
    // approved: false = student stays (present)
    const status = approved ? "absent" : "present";
    
    const notification = await notificationService.respondToNotification({
      notificationId: req.params.id,
      responderUserId: req.user.id,
      status,
      responseMessage,
    });

    logger.info(
      `Teacher ${req.user.name} responded to notification ${req.params.id} with status: ${status}`
    );

    res.status(200).json({
      status: "success",
      message: "Response recorded successfully",
      data: { notification },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get notifications for current user
// @route   GET /api/notifications
// @access  Private
const getNotifications = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const status = req.query.status;
    const type = req.query.type;

    const result = await notificationService.listNotificationsForUser({
      userId: req.user.id,
      page,
      limit,
      status,
      type,
    });

    res.status(200).json({
      status: "success",
      results: result.notifications.length,
      total: result.total,
      page: result.page,
      pages: result.pages,
      data: { notifications: result.notifications },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single notification
// @route   GET /api/notifications/:id
// @access  Private
const getNotification = async (req, res, next) => {
  try {
    const notification = await notificationService.getNotificationById({
      id: req.params.id,
      userId: req.user.id,
    });

    res.status(200).json({ status: "success", data: { notification } });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
const markAsRead = async (req, res, next) => {
  try {
    await notificationService.markNotificationAsRead({
      id: req.params.id,
      userId: req.user.id,
    });
    res
      .status(200)
      .json({ status: "success", message: "Notification marked as read" });
  } catch (error) {
    next(error);
  }
};

// @desc    Get unread notification count
// @route   GET /api/notifications/unread/count
// @access  Private
const getUnreadCount = async (req, res, next) => {
  try {
    const count = await notificationService.getUnreadCountForUser(req.user.id);
    res.status(200).json({ status: "success", data: { unreadCount: count } });
  } catch (error) {
    next(error);
  }
};

// @desc    Get notifications by student
// @route   GET /api/notifications/student/:studentId
// @access  Private
const getNotificationsByStudent = async (req, res, next) => {
  try {
    const notifications = await notificationService.listNotificationsByStudent(
      req.params.studentId
    );
    res.status(200).json({
      status: "success",
      results: notifications.length,
      data: { notifications },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  sendRequest,
  sendTeacherMessage,
  respondToNotification,
  getNotifications,
  getNotification,
  markAsRead,
  getUnreadCount,
  getNotificationsByStudent,
};
