const Notification = require("../models/Notification");
const Student = require("../models/Student");
const User = require("../models/User");
const { AppError } = require("../middleware/errorHandler");
const { emitToUser } = require("../config/socket");
const { sendPushNotification } = require("./pushNotificationService");
const logger = require("../config/logger");

const sendRequest = async ({ fromUserId, studentId, message }) => {
  const student = await Student.findById(studentId).populate("class");
  if (!student) throw new AppError("Student not found", 404);
  if (!student.isActive) throw new AppError("Student is not active", 400);

  const classData = student.class;
  if (!classData || !classData.isActive)
    throw new AppError("Student's class is not active", 400);

  const teacher = await User.findById(classData.teacher);
  if (!teacher || teacher.role !== "teacher")
    throw new AppError("Class teacher not found", 404);

  const notification = await Notification.create({
    from: fromUserId,
    to: teacher._id,
    student: studentId,
    class: classData._id,
    type: "request",
    message:
      message || `Request for student ${student.nama} (${student.studentCode})`,
  });

  // Emit real-time event to the teacher
  emitToUser(String(teacher._id), "notification:new", {
    id: notification._id,
    type: notification.type,
    status: notification.status,
    student: {
      id: student._id,
      studentCode: student.studentCode,
      nama: student.nama,
    },
    class: { id: classData._id, name: classData.name },
    message: notification.message,
    createdAt: notification.createdAt,
  });

  // Send push notification (best-effort, non-blocking)
  sendPushNotification(
    teacher._id,
    '📝 New Absence Request',
    `${student.nama} - ${classData.name}`,
    {
      type: 'request',
      notificationId: notification._id.toString(),
      studentId: studentId.toString(),
      studentName: student.nama,
      className: classData.name,
      clickAction: 'FLUTTER_NOTIFICATION_CLICK',
    }
  ).then((result) => {
    if (result.success) {
      logger.info('Push notification sent for absence request', { 
        teacher: teacher._id, 
        student: student.nama 
      });
    } else {
      logger.warn('Push notification failed for absence request', { 
        teacher: teacher._id, 
        reason: result.reason || result.error 
      });
    }
  }).catch((err) => {
    logger.error('Push notification error for absence request', { 
      teacher: teacher._id, 
      error: err.message 
    });
  });

  return notification;
};

const sendMessageFromTeacher = async ({
  fromTeacherId,
  toReceptionistId,
  studentId,
  message,
}) => {
  // Validate roles
  const [teacher, receptionist, student] = await Promise.all([
    User.findById(fromTeacherId),
    User.findById(toReceptionistId),
    Student.findById(studentId).populate("class"),
  ]);

  if (!teacher || teacher.role !== "teacher") {
    throw new AppError("Sender is not a teacher", 403);
  }
  if (!receptionist || receptionist.role !== "receptionist") {
    throw new AppError("Recipient is not a receptionist", 400);
  }
  if (!student) throw new AppError("Student not found", 404);
  if (!student.class) throw new AppError("Student has no class", 400);

  // Ensure this teacher manages the student's class
  if (String(student.class.teacher) !== String(fromTeacherId)) {
    throw new AppError("Teacher does not manage the student's class", 403);
  }

  const notification = await Notification.create({
    from: fromTeacherId,
    to: toReceptionistId,
    student: studentId,
    class: student.class._id,
    type: "message",
    message: message || `Message from teacher regarding ${student.nama}`,
  });

  // Emit to receptionist
  emitToUser(String(toReceptionistId), "notification:new", {
    id: notification._id,
    type: notification.type,
    status: notification.status,
    student: {
      id: student._id,
      studentCode: student.studentCode,
      nama: student.nama,
    },
    class: { id: student.class._id, name: student.class.name },
    message: notification.message,
    createdAt: notification.createdAt,
  });

  // Send push notification to receptionist (best-effort, non-blocking)
  sendPushNotification(
    toReceptionistId,
    '📩 New Message from Teacher',
    `${student.nama} - ${notification.message}`,
    {
      type: 'message',
      notificationId: notification._id.toString(),
      studentId: studentId.toString(),
      studentName: student.nama,
      className: student.class.name,
      clickAction: 'FLUTTER_NOTIFICATION_CLICK',
    }
  ).then((result) => {
    if (result.success) {
      logger.info('Push notification sent for teacher message', { 
        receptionist: toReceptionistId, 
        student: student.nama 
      });
    } else {
      logger.warn('Push notification failed for teacher message', { 
        receptionist: toReceptionistId, 
        reason: result.reason || result.error 
      });
    }
  }).catch((err) => {
    logger.error('Push notification error for teacher message', { 
      receptionist: toReceptionistId, 
      error: err.message 
    });
  });

  return notification;
};

const respondToNotification = async ({
  notificationId,
  responderUserId,
  status,
  responseMessage,
}) => {
  if (
    ["approved", "rejected", "absent", "present"].includes(status) === false
  ) {
    throw new AppError("Invalid response status", 400);
  }

  const notification = await Notification.findById(notificationId)
    .populate("from", "name email role")
    .populate("to", "name email role")
    .populate("student", "nama studentCode")
    .populate("class", "name");
    
  if (!notification) throw new AppError("Notification not found", 404);

  if (notification.to._id.toString() !== responderUserId) {
    throw new AppError(
      "You are not authorized to respond to this notification",
      403
    );
  }
  if (notification.status !== "pending") {
    throw new AppError("This notification has already been responded to", 400);
  }

  notification.status = status;
  notification.responseMessage = responseMessage;
  notification.responseDate = new Date();
  notification.isRead = true;
  notification.type = "response";
  await notification.save();

  // Reload to get populated fields after save
  const updatedNotification = await Notification.findById(notificationId)
    .populate("from", "name email role")
    .populate("to", "name email role")
    .populate("student", "nama studentCode")
    .populate("class", "name");

  // Emit real-time event to the requester
  emitToUser(String(notification.from._id), "notification:updated", {
    id: updatedNotification._id,
    status: updatedNotification.status,
    responseMessage: updatedNotification.responseMessage,
    responseDate: updatedNotification.responseDate,
  });

  return updatedNotification;
};

const listNotificationsForUser = async ({
  userId,
  page = 1,
  limit = 10,
  status,
  type,
}) => {
  const skip = (page - 1) * limit;
  const query = { $or: [{ from: userId }, { to: userId }] };
  if (status) query.status = status;
  if (type) query.type = type;

  const [notifications, total] = await Promise.all([
    Notification.find(query)
      .populate("from", "name email role")
      .populate("to", "name email role")
      .populate("student", "nama studentCode")
      .populate("class", "name")
      .sort({ requestDate: -1 })
      .skip(skip)
      .limit(limit),
    Notification.countDocuments(query),
  ]);

  return { notifications, total, page, pages: Math.ceil(total / limit) };
};

const getNotificationById = async ({ id, userId }) => {
  const notification = await Notification.findById(id)
    .populate("from", "name email role")
    .populate("to", "name email role")
    .populate("student", "nama studentCode")
    .populate("class", "name");
  if (!notification) throw new AppError("Notification not found", 404);

  if (
    notification.from._id.toString() !== userId &&
    notification.to._id.toString() !== userId
  ) {
    throw new AppError(
      "You can only view notifications you're involved in",
      403
    );
  }

  if (notification.to._id.toString() === userId && !notification.isRead) {
    notification.isRead = true;
    await notification.save();

    // Emit read event to the sender
    emitToUser(
      String(notification.from._id || notification.from),
      "notification:read",
      {
        id: notification._id,
        readBy: userId,
        readAt: new Date(),
      }
    );
  }

  return notification;
};

const markNotificationAsRead = async ({ id, userId }) => {
  const notification = await Notification.findById(id);
  if (!notification) throw new AppError("Notification not found", 404);
  if (notification.to.toString() !== userId) {
    throw new AppError("You can only mark your own notifications as read", 403);
  }
  notification.isRead = true;
  await notification.save();

  // Emit read event to the sender
  emitToUser(String(notification.from), "notification:read", {
    id: notification._id,
    readBy: userId,
    readAt: new Date(),
  });
};

const getUnreadCountForUser = async (userId) => {
  return await Notification.countDocuments({ to: userId, isRead: false });
};

const listNotificationsByStudent = async (studentId) => {
  const notifications = await Notification.find({ student: studentId })
    .populate("from", "name email role")
    .populate("to", "name email role")
    .populate("student", "nama studentCode")
    .populate("class", "name")
    .sort({ requestDate: -1 });
  return notifications;
};

module.exports = {
  sendRequest,
  sendMessageFromTeacher,
  respondToNotification,
  listNotificationsForUser,
  getNotificationById,
  markNotificationAsRead,
  getUnreadCountForUser,
  listNotificationsByStudent,
};
