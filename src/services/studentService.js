const Student = require("../models/Student");
const Class = require("../models/Class");
const { AppError } = require("../middleware/errorHandler");

const listStudents = async ({ page = 1, limit = 10, classId }) => {
  const skip = (page - 1) * limit;
  const query = { isActive: true, ...(classId ? { class: classId } : {}) };

  const [students, total] = await Promise.all([
    Student.find(query)
      .populate("class", "name teacher")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Student.countDocuments(query),
  ]);

  return { students, total, page, pages: Math.ceil(total / limit) };
};

const getStudentById = async (id) => {
  const student = await Student.findById(id).populate("class", "name teacher");
  if (!student) throw new AppError("No student found with that ID", 404);
  return student;
};

const createStudent = async ({ studentCode, nama, classId }) => {
  const classExists = await Class.findById(classId);
  if (!classExists) throw new AppError("Class not found", 404);
  if (classExists.students.length >= classExists.capacity) {
    throw new AppError("Class is at full capacity", 400);
  }

  const student = await Student.create({ studentCode, nama, class: classId });
  await Class.findByIdAndUpdate(classId, { $push: { students: student._id } });
  return student;
};

const updateStudent = async (id, { studentCode, nama, classId }) => {
  const student = await Student.findById(id);
  if (!student) throw new AppError("No student found with that ID", 404);

  if (classId && classId !== student.class.toString()) {
    const newClass = await Class.findById(classId);
    if (!newClass) throw new AppError("New class not found", 404);
    if (newClass.students.length >= newClass.capacity) {
      throw new AppError("New class is at full capacity", 400);
    }
    await Class.findByIdAndUpdate(student.class, {
      $pull: { students: student._id },
    });
    await Class.findByIdAndUpdate(classId, {
      $push: { students: student._id },
    });
  }

  if (studentCode) student.studentCode = studentCode;
  if (nama) student.nama = nama;
  if (classId) student.class = classId;

  return await student.save();
};

const deleteStudent = async (id) => {
  const student = await Student.findById(id);
  if (!student) throw new AppError("No student found with that ID", 404);
  student.isActive = false;
  await student.save();
  await Class.findByIdAndUpdate(student.class, {
    $pull: { students: student._id },
  });
};

const listStudentsByClass = async (classId) => {
  const students = await Student.find({ class: classId, isActive: true })
    .populate("class", "name teacher")
    .sort({ nama: 1 });
  return students;
};

module.exports = {
  listStudents,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent,
  listStudentsByClass,
};
