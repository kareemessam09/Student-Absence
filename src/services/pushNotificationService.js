const admin = require('firebase-admin');
const User = require('../models/User');
const logger = require('../config/logger');

// Initialize Firebase Admin lazily
let firebaseInitialized = false;
const initFirebase = () => {
  if (firebaseInitialized) return;

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) {
    logger.warn('Firebase credentials not found in environment. Push notifications are disabled.');
    return;
  }

  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        // Stored with \n newlines escaped in env files
        privateKey: privateKey.replace(/\\n/g, '\n'),
      }),
    });
    firebaseInitialized = true;
    logger.info('Firebase Admin initialized for push notifications');
  } catch (err) {
    logger.error('Failed to initialize Firebase Admin:', err);
  }
};

/**
 * Send push notification to a user by userId.
 * The function loads the user's device token from the DB and sends via FCM.
 */
const sendPushNotification = async (userId, title, body, data = {}) => {
  try {
    initFirebase();
    if (!firebaseInitialized) {
      return { success: false, reason: 'firebase-not-configured' };
    }

    const user = await User.findById(userId);
    if (!user || !user.deviceToken) {
      logger.info('No device token for user, skipping push:', userId);
      return { success: false, reason: 'no-device-token' };
    }

    const message = {
      token: user.deviceToken,
      notification: { title, body },
      data: { ...StringifyData(data) },
      android: {
        priority: 'high',
        notification: {
          channelId: process.env.FIREBASE_ANDROID_CHANNEL_ID || 'student_notifier_channel',
          sound: 'default',
          clickAction: 'FLUTTER_NOTIFICATION_CLICK',
        },
      },
      apns: {
        headers: { 'apns-priority': '10' },
        payload: {
          aps: { alert: { title, body }, sound: 'default', badge: 1 },
        },
      },
    };

    const response = await admin.messaging().send(message);

    // Optionally log the sent notification (stored in Notification collection as a reference)
    try {
      logger.info('Push notification sent', { user: userId, messageId: response });
    } catch (e) {
      logger.warn('Failed to persist notification log:', e.message);
    }

    return { success: true, messageId: response };
  } catch (error) {
    logger.error('Failed to send push notification:', error);

    // Handle invalid token: remove deviceToken from user record
    if (
      error.code === 'messaging/invalid-registration-token' ||
      error.code === 'messaging/registration-token-not-registered'
    ) {
      try {
        await User.findByIdAndUpdate(userId, { $unset: { deviceToken: '' } });
      } catch (e) {
        logger.warn('Failed to remove invalid device token for user', userId, e.message);
      }
    }

    return { success: false, error: error.message };
  }
};

// Helper to ensure all data values are strings (FCM requires string values in data)
const StringifyData = (data) => {
  const out = {};
  Object.keys(data || {}).forEach((k) => {
    const v = data[k];
    out[k] = typeof v === 'string' ? v : JSON.stringify(v);
  });
  return out;
};

module.exports = {
  sendPushNotification,
};
