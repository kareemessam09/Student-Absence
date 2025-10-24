const Class = require("../models/Class");
const Student = require("../models/Student");
const User = require("../models/User");
const { AppError } = require("../middleware/errorHandler");

const listClasses = async ({ page = 1, limit = 10, teacherId }) => {
  const skip = (page - 1) * limit;
  const query = {
    isActive: true,
    ...(teacherId ? { teacher: teacherId } : {}),
  };

  const [classes, total] = await Promise.all([
    Class.find(query)
      .populate("teacher", "name email")
      .populate("students", "studentCode nama")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Class.countDocuments(query),
  ]);

  return { classes, total, page, pages: Math.ceil(total / limit) };
};

const getClassById = async (id) => {
  const classData = await Class.findById(id)
    .populate("teacher", "name email")
    .populate("students", "studentCode nama");
  if (!classData) throw new AppError("No class found with that ID", 404);
  return classData;
};

const createClass = async ({ name, description, teacher, capacity }) => {
  const teacherUser = await User.findById(teacher);
  if (!teacherUser) throw new AppError("Teacher not found", 404);
  if (teacherUser.role !== "teacher")
    throw new AppError("User is not a teacher", 400);

  const classData = await Class.create({
    name,
    description,
    teacher,
    capacity: capacity || 30,
  });
  return classData;
};

const updateClass = async (id, { name, description, teacher, capacity }) => {
  const classData = await Class.findById(id);
  if (!classData) throw new AppError("No class found with that ID", 404);

  if (teacher && teacher !== classData.teacher.toString()) {
    const newTeacher = await User.findById(teacher);
    if (!newTeacher) throw new AppError("New teacher not found", 404);
    if (newTeacher.role !== "teacher")
      throw new AppError("User is not a teacher", 400);
  }

  if (name) classData.name = name;
  if (description !== undefined) classData.description = description;
  if (teacher) classData.teacher = teacher;
  if (capacity) {
    if (capacity < classData.students.length) {
      throw new AppError(
        "Capacity cannot be less than current student count",
        400
      );
    }
    classData.capacity = capacity;
  }

  return await classData.save();
};

const deleteClass = async (id) => {
  const classData = await Class.findById(id);
  if (!classData) throw new AppError("No class found with that ID", 404);
  classData.isActive = false;
  await classData.save();
  await Student.updateMany({ class: classData._id }, { isActive: false });
};

const listClassesByTeacher = async (teacherId) => {
  const classes = await Class.find({ teacher: teacherId, isActive: true })
    .populate("teacher", "name email")
    .populate("students", "studentCode nama")
    .sort({ name: 1 });
  return classes;
};

const addStudentToClass = async (classId, studentId) => {
  const classData = await Class.findById(classId);
  if (!classData) throw new AppError("Class not found", 404);

  const student = await Student.findById(studentId);
  if (!student) throw new AppError("Student not found", 404);

  if (classData.students.length >= classData.capacity) {
    throw new AppError("Class is at full capacity", 400);
  }

  if (classData.students.includes(studentId)) {
    throw new AppError("Student is already in this class", 400);
  }

  classData.students.push(studentId);
  await classData.save();

  student.class = classData._id;
  await student.save();

  return classData;
};

const removeStudentFromClass = async (classId, studentId) => {
  const classData = await Class.findById(classId);
  if (!classData) throw new AppError("Class not found", 404);

  const student = await Student.findById(studentId);
  if (!student) throw new AppError("Student not found", 404);

  classData.students.pull(studentId);
  await classData.save();

  student.isActive = false;
  await student.save();
};

const assignTeacherToClass = async (classId, teacherId, assign) => {
  const classData = await Class.findById(classId);
  if (!classData) throw new AppError("Class not found", 404);

  if (assign) {
    // Assign teacher to class
    // Verify the user is actually a teacher
    const teacher = await User.findById(teacherId);
    if (!teacher) throw new AppError("Teacher not found", 404);
    if (teacher.role !== "teacher") {
      throw new AppError("User is not a teacher", 400);
    }

    classData.teacher = teacherId;
    await classData.save();
  } else {
    // Unassign teacher from class
    // Verify the current teacher is the one trying to unassign
    if (classData.teacher.toString() !== teacherId) {
      throw new AppError(
        "You can only unassign yourself from classes you are currently teaching",
        403
      );
    }

    // Set teacher to null and bypass validation
    classData.teacher = null;
    await classData.save({ validateBeforeSave: false });
  }

  // Populate and return
  return await Class.findById(classId)
    .populate("teacher", "name email")
    .populate("students", "studentCode nama");
};

module.exports = {
  listClasses,
  getClassById,
  createClass,
  updateClass,
  deleteClass,
  listClassesByTeacher,
  addStudentToClass,
  removeStudentFromClass,
  assignTeacherToClass,
};
