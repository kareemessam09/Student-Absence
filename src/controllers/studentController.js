const studentService = require("../services/studentService");
const logger = require("../config/logger");
const { AppError } = require("../middleware/errorHandler");

// @desc    Get all students
// @route   GET /api/students
// @access  Private
const getAllStudents = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const classId = req.query.class;

    const result = await studentService.listStudents({ page, limit, classId });

    res.status(200).json({
      status: "success",
      results: result.students.length,
      total: result.total,
      page: result.page,
      pages: result.pages,
      data: { students: result.students },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single student
// @route   GET /api/students/:id
// @access  Private
const getStudent = async (req, res, next) => {
  try {
    const student = await studentService.getStudentById(req.params.id);
    res.status(200).json({ status: "success", data: { student } });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new student
// @route   POST /api/students
// @access  Private/Manager
const createStudent = async (req, res, next) => {
  try {
    const { studentCode, nama, class: classId } = req.body;
    const student = await studentService.createStudent({
      studentCode,
      nama,
      classId,
    });
    logger.info(`Student created: ${student.studentCode} - ${student.nama}`);
    res.status(201).json({ status: "success", data: { student } });
  } catch (error) {
    if (error.code === 11000) {
      return next(new AppError("Student code already exists", 400));
    }
    next(error);
  }
};

// @desc    Update student
// @route   PUT /api/students/:id
// @access  Private/Manager
const updateStudent = async (req, res, next) => {
  try {
    const { studentCode, nama, class: classId } = req.body;
    const updatedStudent = await studentService.updateStudent(req.params.id, {
      studentCode,
      nama,
      classId,
    });
    logger.info(`Student updated: ${updatedStudent.studentCode}`);
    res
      .status(200)
      .json({ status: "success", data: { student: updatedStudent } });
  } catch (error) {
    if (error.code === 11000) {
      return next(new AppError("Student code already exists", 400));
    }
    next(error);
  }
};

// @desc    Delete student
// @route   DELETE /api/students/:id
// @access  Private/Manager
const deleteStudent = async (req, res, next) => {
  try {
    await studentService.deleteStudent(req.params.id);
    logger.info(`Student deactivated: ${req.params.id}`);
    res
      .status(200)
      .json({ status: "success", message: "Student deactivated successfully" });
  } catch (error) {
    next(error);
  }
};

// @desc    Get students by class
// @route   GET /api/students/class/:classId
// @access  Private
const getStudentsByClass = async (req, res, next) => {
  try {
    const students = await studentService.listStudentsByClass(
      req.params.classId
    );
    res.status(200).json({
      status: "success",
      results: students.length,
      data: { students },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllStudents,
  getStudent,
  createStudent,
  updateStudent,
  deleteStudent,
  getStudentsByClass,
};
