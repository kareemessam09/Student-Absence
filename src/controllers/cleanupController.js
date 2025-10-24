const { cleanupNotifications } = require("../services/schedulerService");
const logger = require("../config/logger");

// @desc    Manually trigger notification cleanup
// @route   DELETE /api/notifications/cleanup
// @access  Private/Manager
const triggerNotificationCleanup = async (req, res, next) => {
  try {
    const result = await cleanupNotifications();
    
    logger.info(`Manager ${req.user.name} triggered manual notification cleanup`);

    res.status(200).json({
      status: "success",
      message: `Successfully deleted ${result.deletedCount} notifications`,
      data: {
        deletedCount: result.deletedCount,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  triggerNotificationCleanup,
};
