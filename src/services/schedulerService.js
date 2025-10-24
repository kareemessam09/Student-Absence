const cron = require('node-cron');
const Notification = require('../models/Notification');
const logger = require('../config/logger');

/**
 * Delete all notifications every day at midnight
 * Cron expression: '0 0 * * *' means:
 * - Minute: 0
 * - Hour: 0 (midnight)
 * - Day of Month: * (every day)
 * - Month: * (every month)
 * - Day of Week: * (every day of week)
 */
const scheduleNotificationCleanup = () => {
  // Run every day at midnight (00:00)
  cron.schedule('0 0 * * *', async () => {
    try {
      logger.info('Starting scheduled notification cleanup...');
      
      const result = await Notification.deleteMany({});
      
      logger.info(`✅ Notification cleanup completed. Deleted ${result.deletedCount} notifications.`);
    } catch (error) {
      logger.error(`❌ Error during notification cleanup: ${error.message}`);
    }
  });

  logger.info('📅 Notification cleanup scheduler initialized (runs daily at midnight)');
};

/**
 * Manually trigger notification cleanup (for testing or immediate cleanup)
 */
const cleanupNotifications = async () => {
  try {
    logger.info('Manual notification cleanup triggered...');
    
    const result = await Notification.deleteMany({});
    
    logger.info(`✅ Manual cleanup completed. Deleted ${result.deletedCount} notifications.`);
    
    return { success: true, deletedCount: result.deletedCount };
  } catch (error) {
    logger.error(`❌ Error during manual cleanup: ${error.message}`);
    throw error;
  }
};

module.exports = {
  scheduleNotificationCleanup,
  cleanupNotifications,
};
