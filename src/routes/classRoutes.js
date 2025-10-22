const express = require("express");
const {
  getAllClasses,
  getClass,
  createClass,
  updateClass,
  deleteClass,
  getClassesByTeacher,
  addStudentToClass,
  removeStudentFromClass,
} = require("../controllers/classController");
const { verifyToken, authorize } = require("../middleware/auth");
const {
  validateObjectId,
  validatePagination,
  validateClass,
} = require("../middleware/validation");

const router = express.Router();

// All routes are protected
router.use(verifyToken);

// Class routes
router.get("/", validatePagination(), getAllClasses);
router.get(
  "/teacher/:teacherId",
  validateObjectId("teacherId"),
  getClassesByTeacher
);
router.get("/:id", validateObjectId(), getClass);

// Manager only routes
router.post("/", authorize("manager"), validateClass(), createClass);
router.put(
  "/:id",
  authorize("manager"),
  validateObjectId(),
  validateClass(),
  updateClass
);
router.delete("/:id", authorize("manager"), validateObjectId(), deleteClass);

// Student management routes (Manager only)
router.post(
  "/:id/students",
  authorize("manager"),
  validateObjectId(),
  addStudentToClass
);
router.delete(
  "/:id/students/:studentId",
  authorize("manager"),
  validateObjectId(),
  validateObjectId("studentId"),
  removeStudentFromClass
);

module.exports = router;
