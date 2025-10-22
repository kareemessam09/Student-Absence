const express = require("express");
const {
  getAllStudents,
  getStudent,
  createStudent,
  updateStudent,
  deleteStudent,
  getStudentsByClass,
} = require("../controllers/studentController");
const { verifyToken, authorize } = require("../middleware/auth");
const {
  validateObjectId,
  validatePagination,
  validateStudent,
} = require("../middleware/validation");

const router = express.Router();

// All routes are protected
router.use(verifyToken);

// Student routes
router.get("/", validatePagination(), getAllStudents);
router.get("/class/:classId", validateObjectId("classId"), getStudentsByClass);
router.get("/:id", validateObjectId(), getStudent);

// Manager only routes
router.post("/", authorize("manager"), validateStudent(), createStudent);
router.put(
  "/:id",
  authorize("manager"),
  validateObjectId(),
  validateStudent(),
  updateStudent
);
router.delete("/:id", authorize("manager"), validateObjectId(), deleteStudent);

module.exports = router;
