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

// Admin only routes
router.get("/", authorize("admin"), validatePagination(), getAllUsers);
router.get("/:id", validateObjectId(), getUser);
router.put("/:id", validateObjectId(), validateUserUpdate, updateUser);
router.delete("/:id", authorize("admin"), validateObjectId(), deleteUser);

module.exports = router;
