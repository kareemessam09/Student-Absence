const classService = require("../services/classService");
const logger = require("../config/logger");

// @desc    Get all classes
// @route   GET /api/classes
// @access  Private
const getAllClasses = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const teacherId = req.query.teacher;

    const result = await classService.listClasses({ page, limit, teacherId });

    res.status(200).json({
      status: "success",
      results: result.classes.length,
      total: result.total,
      page: result.page,
      pages: result.pages,
      data: { classes: result.classes },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single class
// @route   GET /api/classes/:id
// @access  Private
const getClass = async (req, res, next) => {
  try {
    const classData = await classService.getClassById(req.params.id);
    res.status(200).json({ status: "success", data: { class: classData } });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new class
// @route   POST /api/classes
// @access  Private/Manager
const createClass = async (req, res, next) => {
  try {
    const { name, description, teacher, capacity } = req.body;
    const classData = await classService.createClass({
      name,
      description,
      teacher,
      capacity,
    });
    logger.info(`Class created: ${classData.name}`);
    res.status(201).json({ status: "success", data: { class: classData } });
  } catch (error) {
    next(error);
  }
};

// @desc    Update class
// @route   PUT /api/classes/:id
// @access  Private/Manager
const updateClass = async (req, res, next) => {
  try {
    const { name, description, teacher, capacity } = req.body;
    const updatedClass = await classService.updateClass(req.params.id, {
      name,
      description,
      teacher,
      capacity,
    });
    logger.info(`Class updated: ${updatedClass.name}`);
    res.status(200).json({ status: "success", data: { class: updatedClass } });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete class
// @route   DELETE /api/classes/:id
// @access  Private/Manager
const deleteClass = async (req, res, next) => {
  try {
    await classService.deleteClass(req.params.id);
    logger.info(`Class deactivated: ${req.params.id}`);
    res
      .status(200)
      .json({ status: "success", message: "Class deactivated successfully" });
  } catch (error) {
    next(error);
  }
};

// @desc    Get classes by teacher
// @route   GET /api/classes/teacher/:teacherId
// @access  Private
const getClassesByTeacher = async (req, res, next) => {
  try {
    const classes = await classService.listClassesByTeacher(
      req.params.teacherId
    );
    res
      .status(200)
      .json({ status: "success", results: classes.length, data: { classes } });
  } catch (error) {
    next(error);
  }
};

// @desc    Add student to class
// @route   POST /api/classes/:id/students
// @access  Private/Manager
const addStudentToClass = async (req, res, next) => {
  try {
    const classData = await classService.addStudentToClass(
      req.params.id,
      req.body.studentId
    );
    logger.info(`Student added to class ${req.params.id}`);
    res.status(200).json({
      status: "success",
      message: "Student added to class successfully",
      data: { class: classData },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Remove student from class
// @route   DELETE /api/classes/:id/students/:studentId
// @access  Private/Manager
const removeStudentFromClass = async (req, res, next) => {
  try {
    await classService.removeStudentFromClass(
      req.params.id,
      req.params.studentId
    );
    logger.info(`Student removed from class ${req.params.id}`);
    res.status(200).json({
      status: "success",
      message: "Student removed from class successfully",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllClasses,
  getClass,
  createClass,
  updateClass,
  deleteClass,
  getClassesByTeacher,
  addStudentToClass,
  removeStudentFromClass,
};
