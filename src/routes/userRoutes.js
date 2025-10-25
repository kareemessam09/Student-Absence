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
    const { deviceToken } = req.body;
    
    if (!deviceToken || typeof deviceToken !== 'string') {
      return res.status(400).json({
        status: 'fail',
        message: 'Please provide a valid device token'
      });
    }

    const User = require('../models/User');
    await User.findByIdAndUpdate(req.user._id, { deviceToken });

    res.json({
      status: 'success',
      message: 'Device token registered successfully'
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to register device token'
    });
  }
});

// Admin only routes
router.get("/", authorize("admin"), validatePagination(), getAllUsers);
router.get("/:id", validateObjectId(), getUser);
router.put("/:id", validateObjectId(), validateUserUpdate, updateUser);
router.delete("/:id", authorize("admin"), validateObjectId(), deleteUser);

module.exports = router;
