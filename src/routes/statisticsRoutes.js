const express = require("express");
const {
  getManagerOverview,
  getClassStatistics,
  getTeacherStatistics,
  getDailyAttendance,
} = require("../controllers/statisticsController");
const { verifyToken, authorize } = require("../middleware/auth");

const router = express.Router();

// All routes require authentication and manager role
router.use(verifyToken);
router.use(authorize("manager"));

// Statistics routes
router.get("/overview", getManagerOverview);
router.get("/classes", getClassStatistics);
router.get("/teachers", getTeacherStatistics);
router.get("/daily-attendance", getDailyAttendance);

module.exports = router;
