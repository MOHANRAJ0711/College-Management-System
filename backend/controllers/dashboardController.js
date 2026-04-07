const User = require('../models/User');
const Student = require('../models/Student');
const Faculty = require('../models/Faculty');
const Department = require('../models/Department');
const Course = require('../models/Course');
const Admission = require('../models/Admission');
const Notification = require('../models/Notification');
const Fee = require('../models/Fee');

const handleError = (res, err, defaultMsg = 'Server error') => {
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({ message: messages.join(', ') });
  }
  console.error(err);
  return res.status(500).json({ message: defaultMsg });
};

/**
 * GET /api/dashboard/admin — admin only
 */
const getAdminDashboard = async (req, res) => {
  try {
    const [
      totalStudents,
      totalFaculty,
      totalDepartments,
      totalCourses,
      pendingAdmissions,
      recentNotifications,
      feeAgg,
    ] = await Promise.all([
      Student.countDocuments(),
      Faculty.countDocuments(),
      Department.countDocuments({ isActive: true }),
      Course.countDocuments({ isActive: true }),
      Admission.countDocuments({
        status: { $in: ['pending', 'under_review'] },
      }),
      Notification.find({ isActive: true })
        .sort({ createdAt: -1 })
        .limit(10)
        .populate('createdBy', 'name email role')
        .populate('department', 'name code')
        .lean(),
      Fee.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            totalAmount: { $sum: '$amount' },
          },
        },
      ]),
    ]);

    const activeStudentUsers = await User.countDocuments({ role: 'student', isActive: true });
    const activeFacultyUsers = await User.countDocuments({ role: 'faculty', isActive: true });

    const feeByStatus = {};
    feeAgg.forEach((row) => {
      feeByStatus[row._id] = {
        count: row.count,
        totalAmount: row.totalAmount,
      };
    });

    const paidStats = feeByStatus.paid || { count: 0, totalAmount: 0 };
    const pendingStats = feeByStatus.pending || { count: 0, totalAmount: 0 };
    const overdueStats = feeByStatus.overdue || { count: 0, totalAmount: 0 };
    const partialStats = feeByStatus.partial || { count: 0, totalAmount: 0 };

    return res.status(200).json({
      counts: {
        students: totalStudents,
        faculty: totalFaculty,
        departments: totalDepartments,
        courses: totalCourses,
        activeStudentUsers,
        activeFacultyUsers,
      },
      pendingAdmissions,
      recentNotifications,
      feeCollection: {
        byStatus: feeByStatus,
        summary: {
          collectedAmount: paidStats.totalAmount,
          outstandingPending: pendingStats.totalAmount,
          outstandingOverdue: overdueStats.totalAmount,
          partialAmount: partialStats.totalAmount,
        },
      },
    });
  } catch (err) {
    return handleError(res, err, 'Could not load admin dashboard');
  }
};

module.exports = {
  getAdminDashboard,
};
