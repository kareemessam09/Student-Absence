const express = require("express");
const {
  register,
  login,
  logout,
  getMe,
  updatePassword,
  forgotPassword,
  resetPassword,
} = require("../controllers/authController");
const { verifyToken } = require("../middleware/auth");
const { authLimiter } = require("../middleware/security");
const {
  validateUserRegistration,
  validateUserLogin,
} = require("../middleware/validation");

const router = express.Router();

// Apply rate limiting to auth routes
router.use(authLimiter);

// Public routes
router.post("/register", validateUserRegistration, register);
router.post("/login", validateUserLogin, login);
router.post("/forgot-password", forgotPassword);
router.put("/reset-password/:token", resetPassword);

// Protected routes
router.use(verifyToken); // All routes below this middleware are protected

router.post("/logout", logout);
router.get("/me", getMe);
router.put("/update-password", updatePassword);

module.exports = router;
