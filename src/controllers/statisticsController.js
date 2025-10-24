const Class = require("../models/Class");
const Student = require("../models/Student");
const User = require("../models/User");
const Notification = require("../models/Notification");
const logger = require("../config/logger");

// @desc    Get manager dashboard overview statistics
// @route   GET /api/statistics/overview
// @access  Private/Manager
const getManagerOverview = async (req, res, next) => {
  try {
    // Get all statistics in parallel for best performance
    const [
      classStats,
      studentStats,
      teacherStats,
      notificationStats,
      recentClasses,
    ] = await Promise.all([
      // Class statistics with aggregation
      Class.aggregate([
        {
          $facet: {
            totals: [
              {
                $group: {
                  _id: null,
                  totalClasses: { $sum: 1 },
                  totalCapacity: { $sum: "$capacity" },
                  activeClasses: {
                    $sum: { $cond: ["$isActive", 1, 0] },
                  },
                  classesWithTeacher: {
                    $sum: { $cond: [{ $ne: ["$teacher", null] }, 1, 0] },
                  },
                  classesWithoutTeacher: {
                    $sum: { $cond: [{ $eq: ["$teacher", null] }, 1, 0] },
                  },
                },
              },
            ],
            capacityAnalysis: [
              {
                $addFields: {
                  studentCount: { $size: "$students" },
                  utilizationRate: {
                    $multiply: [
                      { $divide: [{ $size: "$students" }, "$capacity"] },
                      100,
                    ],
                  },
                },
              },
              {
                $group: {
                  _id: null,
                  totalEnrolled: { $sum: "$studentCount" },
                  fullClasses: {
                    $sum: {
                      $cond: [
                        { $gte: ["$studentCount", "$capacity"] },
                        1,
                        0,
                      ],
                    },
                  },
                  nearCapacity: {
                    $sum: {
                      $cond: [{ $gte: ["$utilizationRate", 90] }, 1, 0],
                    },
                  },
                },
              },
            ],
          },
        },
      ]),

      // Student statistics
      Student.aggregate([
        {
          $group: {
            _id: null,
            totalStudents: { $sum: 1 },
            activeStudents: {
              $sum: { $cond: ["$isActive", 1, 0] },
            },
            inactiveStudents: {
              $sum: { $cond: [{ $not: "$isActive" }, 1, 0] },
            },
            newThisWeek: {
              $sum: {
                $cond: [
                  {
                    $gte: [
                      "$createdAt",
                      new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
          },
        },
      ]),

      // Teacher statistics with class assignment
      User.aggregate([
        {
          $match: { role: "teacher" },
        },
        {
          $lookup: {
            from: "classes",
            localField: "_id",
            foreignField: "teacher",
            as: "assignedClasses",
          },
        },
        {
          $group: {
            _id: null,
            totalTeachers: { $sum: 1 },
            teachersWithClasses: {
              $sum: {
                $cond: [{ $gt: [{ $size: "$assignedClasses" }, 0] }, 1, 0],
              },
            },
            teachersWithoutClasses: {
              $sum: {
                $cond: [{ $eq: [{ $size: "$assignedClasses" }, 0] }, 1, 0],
              },
            },
          },
        },
      ]),

      // Notification statistics
      Notification.aggregate([
        {
          $facet: {
            pending: [
              {
                $match: {
                  status: "pending",
                  type: "request",
                },
              },
              {
                $count: "count",
              },
            ],
            thisWeek: [
              {
                $match: {
                  createdAt: {
                    $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
                  },
                },
              },
              {
                $count: "count",
              },
            ],
          },
        },
      ]),

      // Recent classes (created this month)
      Class.aggregate([
        {
          $match: {
            createdAt: {
              $gte: new Date(
                new Date().getFullYear(),
                new Date().getMonth(),
                1
              ),
            },
          },
        },
        {
          $count: "count",
        },
      ]),
    ]);

    // Process class statistics
    const classData = classStats[0]?.totals[0] || {
      totalClasses: 0,
      totalCapacity: 0,
      activeClasses: 0,
      classesWithTeacher: 0,
      classesWithoutTeacher: 0,
    };

    const capacityData = classStats[0]?.capacityAnalysis[0] || {
      totalEnrolled: 0,
      fullClasses: 0,
      nearCapacity: 0,
    };

    // Process student statistics
    const studentData = studentStats[0] || {
      totalStudents: 0,
      activeStudents: 0,
      inactiveStudents: 0,
      newThisWeek: 0,
    };

    // Process teacher statistics
    const teacherData = teacherStats[0] || {
      totalTeachers: 0,
      teachersWithClasses: 0,
      teachersWithoutClasses: 0,
    };

    // Process notification statistics
    const notificationData = notificationStats[0] || {
      pending: [],
      thisWeek: [],
    };
    const pendingCount = notificationData.pending[0]?.count || 0;
    const notificationsThisWeek = notificationData.thisWeek[0]?.count || 0;

    // Recent classes count
    const newClassesThisMonth = recentClasses[0]?.count || 0;

    // Calculate utilization percentage
    const utilizationPercentage =
      classData.totalCapacity > 0
        ? (capacityData.totalEnrolled / classData.totalCapacity) * 100
        : 0;

    // Calculate attendance rate (based on active students vs capacity)
    // Note: This is an estimation. For real attendance, you'd need an Attendance collection
    const estimatedAttendanceRate =
      studentData.totalStudents > 0
        ? (studentData.activeStudents / studentData.totalStudents) * 100
        : 0;

    // Build response
    const response = {
      status: "success",
      data: {
        overview: {
          totalClasses: classData.totalClasses,
          totalStudents: studentData.totalStudents,
          totalTeachers: teacherData.totalTeachers,
          totalCapacity: classData.totalCapacity,
          activeStudents: studentData.activeStudents,
          inactiveStudents: studentData.inactiveStudents,
          attendanceToday: {
            present: studentData.activeStudents,
            absent: studentData.inactiveStudents,
            rate: parseFloat(estimatedAttendanceRate.toFixed(2)),
          },
          classUtilization: {
            filled: capacityData.totalEnrolled,
            available: classData.totalCapacity - capacityData.totalEnrolled,
            percentage: parseFloat(utilizationPercentage.toFixed(2)),
          },
          teacherStats: {
            total: teacherData.totalTeachers,
            assigned: teacherData.teachersWithClasses,
            unassigned: teacherData.teachersWithoutClasses,
          },
          classStats: {
            active: classData.activeClasses,
            withTeachers: classData.classesWithTeacher,
            withoutTeachers: classData.classesWithoutTeacher,
            full: capacityData.fullClasses,
            nearCapacity: capacityData.nearCapacity,
          },
        },
        recentActivity: {
          newStudentsThisWeek: studentData.newThisWeek,
          newClassesThisMonth: newClassesThisMonth,
          pendingNotifications: pendingCount,
          notificationsThisWeek: notificationsThisWeek,
        },
        timestamp: new Date(),
      },
    };

    logger.info(`Manager overview statistics generated for user ${req.user.id}`);

    res.status(200).json(response);
  } catch (error) {
    logger.error(`Error generating manager overview: ${error.message}`);
    next(error);
  }
};

// @desc    Get class-specific statistics
// @route   GET /api/statistics/classes
// @access  Private/Manager
const getClassStatistics = async (req, res, next) => {
  try {
    const classesWithStats = await Class.aggregate([
      {
        $match: { isActive: true },
      },
      {
        $lookup: {
          from: "users",
          localField: "teacher",
          foreignField: "_id",
          as: "teacherInfo",
        },
      },
      {
        $addFields: {
          studentCount: { $size: "$students" },
          availableSpots: { $subtract: ["$capacity", { $size: "$students" }] },
          utilizationRate: {
            $multiply: [
              { $divide: [{ $size: "$students" }, "$capacity"] },
              100,
            ],
          },
          hasTeacher: { $ne: ["$teacher", null] },
        },
      },
      {
        $project: {
          name: 1,
          description: 1,
          capacity: 1,
          studentCount: 1,
          availableSpots: 1,
          utilizationRate: 1,
          hasTeacher: 1,
          teacher: {
            $arrayElemAt: [
              {
                $map: {
                  input: "$teacherInfo",
                  as: "t",
                  in: {
                    id: "$$t._id",
                    name: "$$t.name",
                    email: "$$t.email",
                  },
                },
              },
              0,
            ],
          },
          createdAt: 1,
        },
      },
      {
        $sort: { utilizationRate: -1 },
      },
    ]);

    res.status(200).json({
      status: "success",
      results: classesWithStats.length,
      data: {
        classes: classesWithStats,
      },
    });
  } catch (error) {
    logger.error(`Error generating class statistics: ${error.message}`);
    next(error);
  }
};

// @desc    Get teacher statistics
// @route   GET /api/statistics/teachers
// @access  Private/Manager
const getTeacherStatistics = async (req, res, next) => {
  try {
    const teacherStats = await User.aggregate([
      {
        $match: { role: "teacher" },
      },
      {
        $lookup: {
          from: "classes",
          localField: "_id",
          foreignField: "teacher",
          as: "classes",
        },
      },
      {
        $addFields: {
          classCount: { $size: "$classes" },
          totalStudents: {
            $sum: {
              $map: {
                input: "$classes",
                as: "class",
                in: { $size: "$$class.students" },
              },
            },
          },
        },
      },
      {
        $project: {
          name: 1,
          email: 1,
          classCount: 1,
          totalStudents: 1,
          lastLogin: 1,
          createdAt: 1,
        },
      },
      {
        $sort: { classCount: -1, totalStudents: -1 },
      },
    ]);

    res.status(200).json({
      status: "success",
      results: teacherStats.length,
      data: {
        teachers: teacherStats,
      },
    });
  } catch (error) {
    logger.error(`Error generating teacher statistics: ${error.message}`);
    next(error);
  }
};

// @desc    Get daily attendance statistics by class (based on notifications)
// @route   GET /api/statistics/daily-attendance
// @access  Private/Manager
const getDailyAttendance = async (req, res, next) => {
  try {
    // Get date from query or use today
    const date = req.query.date ? new Date(req.query.date) : new Date();
    date.setHours(0, 0, 0, 0);
    const nextDay = new Date(date);
    nextDay.setDate(nextDay.getDate() + 1);

    // Get all classes with their total student count
    const classesWithStudents = await Class.find({ isActive: true })
      .populate('students', 'studentCode nama')
      .populate('teacher', 'name email')
      .lean();

    // Get all absence notifications for today (status: "absent" means student left)
    const absenceNotifications = await Notification.find({
      requestDate: { $gte: date, $lt: nextDay },
      status: 'absent', // Teacher confirmed student is absent
      type: 'response' // Only count responded notifications
    })
      .populate('student', 'studentCode nama')
      .populate('class', 'name')
      .lean();

    // Group absences by class, ensuring unique students per class
    const absencesByClass = {};
    absenceNotifications.forEach(notification => {
      const classId = notification.class._id.toString();
      const studentId = notification.student._id.toString();
      
      if (!absencesByClass[classId]) {
        absencesByClass[classId] = new Map(); // Use Map to ensure uniqueness
      }
      
      // Only add if not already present (prevents duplicates)
      if (!absencesByClass[classId].has(studentId)) {
        absencesByClass[classId].set(studentId, notification.student);
      }
    });

    // Build statistics for each class
    const classAttendance = classesWithStudents.map(classDoc => {
      const classId = classDoc._id.toString();
      const total = classDoc.students.length;
      const goneStudentsMap = absencesByClass[classId] || new Map();
      const gone = goneStudentsMap.size; // Count unique students
      const present = total - gone;
      const percentage = total > 0 
        ? ((present / total) * 100).toFixed(2)
        : 0;

      return {
        classId: classDoc._id,
        className: classDoc.name,
        teacher: classDoc.teacher ? {
          id: classDoc.teacher._id,
          name: classDoc.teacher.name,
          email: classDoc.teacher.email
        } : null,
        total,           // Total number of students in class
        present,         // Total minus accepted requests to leave
        gone,            // Number of unique students approved to go
        percentage: parseFloat(percentage), // Ratio: (present/total) * 100
        goneStudents: Array.from(goneStudentsMap.values()).map(s => ({
          id: s._id,
          studentCode: s.studentCode,
          name: s.nama
        }))
      };
    });

    // Calculate overall statistics
    const overallStats = {
      totalClasses: classAttendance.length,
      total: classAttendance.reduce((sum, c) => sum + c.total, 0),
      present: classAttendance.reduce((sum, c) => sum + c.present, 0),
      gone: classAttendance.reduce((sum, c) => sum + c.gone, 0),
      percentage: 0
    };
    
    overallStats.percentage = overallStats.total > 0
      ? parseFloat(((overallStats.present / overallStats.total) * 100).toFixed(2))
      : 0;

    res.status(200).json({
      status: 'success',
      data: {
        date: date.toISOString().split('T')[0],
        overall: overallStats,
        classes: classAttendance
      }
    });

  } catch (error) {
    logger.error(`Error generating daily attendance: ${error.message}`);
    next(error);
  }
};

module.exports = {
  getManagerOverview,
  getClassStatistics,
  getTeacherStatistics,
  getDailyAttendance,
};
