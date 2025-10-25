const express = require("express");
const {
  getAllUsers,
  getUser,
  updateUser,
  deleteUser,
  getMyProfile,
  updateMyProfile,
} = require("../controllers/userController");
const { verifyToken, authorize } = require("../middleware/auth");
const {
  validateObjectId,
  validateUserUpdate,
  validatePagination,
} = require("../middleware/validation");

const router = express.Router();

// All routes are protected
router.use(verifyToken);

// User profile routes
router.get("/profile/me", getMyProfile);
router.put("/profile/me", validateUserUpdate, updateMyProfile);

// Device token registration for push notifications
router.post("/device-token", async (req, res) => {
  try {
    const { deviceToken, platform } = req.body;
    const logger = require('../config/logger');
    
    // Validate deviceToken
    if (!deviceToken || typeof deviceToken !== 'string') {
      return res.status(400).json({
        status: 'fail',
        message: 'Please provide a valid device token'
      });
    }

    // Validate platform (optional but recommended)
    if (platform && !['android', 'ios'].includes(platform)) {
      return res.status(400).json({
        status: 'fail',
        message: 'Platform must be either android or ios'
      });
    }

    const User = require('../models/User');
    
    // req.user.id comes from JWT (not _id)
    const userId = req.user.id;
    
    const updateData = { deviceToken };
    if (platform) {
      updateData.platform = platform;
      updateData.deviceTokenUpdatedAt = new Date();
    }
    
    const user = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({
        status: 'fail',
        message: 'User not found'
      });
    }

    logger.info(`Device token registered for user: ${userId}`);

    res.json({
      status: 'success',
      message: 'Device token registered successfully'
    });
  } catch (error) {
    const logger = require('../config/logger');
    logger.error('Device token registration error:', error);
    
    res.status(500).json({
      status: 'error',
      message: 'Failed to register device token',
      error: process.env.NODE_ENV === 'production' ? undefined : error.message
    });
  }
});

// Delete device token (for logout)
router.delete("/device-token", async (req, res) => {
  try {
    const User = require('../models/User');
    const logger = require('../config/logger');
    const userId = req.user.id;
    
    await User.findByIdAndUpdate(userId, {
      $unset: { deviceToken: '', platform: '', deviceTokenUpdatedAt: '' }
    });
    
    logger.info(`Device token deleted for user: ${userId}`);
    
    res.json({
      status: 'success',
      message: 'Device token deleted successfully'
    });
  } catch (error) {
    const logger = require('../config/logger');
    logger.error('Device token deletion error:', error);
    
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete device token'
    });
  }
});

// Admin only routes
router.get("/", authorize("admin"), validatePagination(), getAllUsers);
router.get("/:id", validateObjectId(), getUser);
router.put("/:id", validateObjectId(), validateUserUpdate, updateUser);
router.delete("/:id", authorize("admin"), validateObjectId(), deleteUser);

module.exports = router;
