const mongoose = require('mongoose');
const Attendance = require('../../../models/Attendance');
const Student = require('../../../models/Student');
const Faculty = require('../../../models/Faculty');
const handleError = require('../../../utils/handleError');

function normalizeDayUtc(dateInput) {
  const d = new Date(dateInput);
  if (Number.isNaN(d.getTime())) return null;
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

async function getFacultyFromUser(userId) {
  return Faculty.findOne({ user: userId });
}

async function getStudentFromUser(userId) {
  return Student.findOne({ user: userId });
}

const attendancePopulate = [
  {
    path: 'student',
    select: 'rollNumber registrationNumber user',
    populate: { path: 'user', select: 'name email' },
  },
  { path: 'course', select: 'name code department semester' },
  { path: 'faculty', select: 'employeeId designation' },
];

/**
 * Mark attendance for multiple students (faculty).
 * Body: { course, date, semester?, entries?: [{ student, status }] }
 * Alias: students — same shape as entries.
 */
const markAttendance = async (req, res) => {
  try {
    const { course, date, semester } = req.body;
    const entries = Array.isArray(req.body.entries)
      ? req.body.entries
      : Array.isArray(req.body.students)
        ? req.body.students
        : null;

    if (!course || !date || !entries || entries.length === 0) {
      return res.status(400).json({
        message: 'course, date, and entries (array of { student, status }) are required',
      });
    }
    if (!mongoose.Types.ObjectId.isValid(course)) {
      return res.status(400).json({ message: 'Invalid course id' });
    }

    const day = normalizeDayUtc(date);
    if (!day) {
      return res.status(400).json({ message: 'Invalid date' });
    }

    const faculty = await getFacultyFromUser(req.user._id);
    if (!faculty) {
      return res.status(400).json({ message: 'Faculty profile not found' });
    }

    const results = [];
    for (const item of entries) {
      if (!item.student || !item.status) {
        return res.status(400).json({ message: 'Each entry must include student and status' });
      }
      if (!mongoose.Types.ObjectId.isValid(item.student)) {
        return res.status(400).json({ message: `Invalid student id: ${item.student}` });
      }
      const allowed = ['present', 'absent', 'late'];
      if (!allowed.includes(item.status)) {
        return res.status(400).json({ message: `Invalid status: ${item.status}` });
      }

      const doc = await Attendance.findOneAndUpdate(
        { student: item.student, course, date: day },
        {
          $set: {
            status: item.status,
            faculty: faculty._id,
            ...(semester != null ? { semester: Number(semester) } : {}),
          },
        },
        { new: true, upsert: true, runValidators: true }
      ).populate(attendancePopulate);

      results.push(doc);
    }

    return res.status(201).json({ count: results.length, attendance: results });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: 'Duplicate attendance record' });
    }
    return handleError(res, err, 'Could not mark attendance');
  }
};

/**
 * Get attendance with filters: student, course, dateFrom, dateTo
 */
const getAttendance = async (req, res) => {
  try {
    const { student, course, dateFrom, dateTo } = req.query;
    const filter = {};

    if (student) {
      if (!mongoose.Types.ObjectId.isValid(student)) {
        return res.status(400).json({ message: 'Invalid student id' });
      }
      filter.student = student;
    }
    if (course) {
      if (!mongoose.Types.ObjectId.isValid(course)) {
        return res.status(400).json({ message: 'Invalid course id' });
      }
      filter.course = course;
    }
    if (dateFrom || dateTo) {
      filter.date = {};
      if (dateFrom) {
        const from = normalizeDayUtc(dateFrom);
        if (!from) return res.status(400).json({ message: 'Invalid dateFrom' });
        filter.date.$gte = from;
      }
      if (dateTo) {
        const to = normalizeDayUtc(dateTo);
        if (!to) return res.status(400).json({ message: 'Invalid dateTo' });
        const end = new Date(to);
        end.setUTCDate(end.getUTCDate() + 1);
        filter.date.$lt = end;
      }
    }

    const records = await Attendance.find(filter)
      .populate(attendancePopulate)
      .sort({ date: -1, student: 1 });

    return res.status(200).json(records);
  } catch (err) {
    return handleError(res, err, 'Could not fetch attendance');
  }
};

/**
 * Logged-in student's attendance with percentage per course
 */
const getStudentAttendance = async (req, res) => {
  try {
    const studentDoc = await getStudentFromUser(req.user._id);
    if (!studentDoc) {
      return res.status(404).json({ message: 'Student profile not found' });
    }

    const pipeline = [
      { $match: { student: studentDoc._id } },
      {
        $group: {
          _id: '$course',
          totalSessions: { $sum: 1 },
          presentCount: {
            $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] },
          },
          lateCount: {
            $sum: { $cond: [{ $eq: ['$status', 'late'] }, 1, 0] },
          },
          absentCount: {
            $sum: { $cond: [{ $eq: ['$status', 'absent'] }, 1, 0] },
          },
        },
      },
      {
        $lookup: {
          from: 'courses',
          localField: '_id',
          foreignField: '_id',
          as: 'courseInfo',
        },
      },
      { $unwind: { path: '$courseInfo', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          course: '$_id',
          courseName: '$courseInfo.name',
          courseCode: '$courseInfo.code',
          totalSessions: 1,
          presentCount: 1,
          lateCount: 1,
          absentCount: 1,
          attendedCount: { $add: ['$presentCount', '$lateCount'] },
          percentage: {
            $cond: [
              { $gt: ['$totalSessions', 0] },
              {
                $multiply: [
                  {
                    $divide: [
                      { $add: ['$presentCount', '$lateCount'] },
                      '$totalSessions',
                    ],
                  },
                  100,
                ],
              },
              0,
            ],
          },
        },
      },
    ];

    const summary = await Attendance.aggregate(pipeline);

    return res.status(200).json({ student: studentDoc._id, courses: summary });
  } catch (err) {
    return handleError(res, err, 'Could not load attendance summary');
  }
};

/**
 * Attendance report for a course (faculty/admin)
 */
const getAttendanceReport = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { dateFrom, dateTo } = req.query;

    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({ message: 'Invalid course id' });
    }

    const match = { course: new mongoose.Types.ObjectId(courseId) };
    if (dateFrom || dateTo) {
      match.date = {};
      if (dateFrom) {
        const from = normalizeDayUtc(dateFrom);
        if (!from) return res.status(400).json({ message: 'Invalid dateFrom' });
        match.date.$gte = from;
      }
      if (dateTo) {
        const to = normalizeDayUtc(dateTo);
        if (!to) return res.status(400).json({ message: 'Invalid dateTo' });
        const end = new Date(to);
        end.setUTCDate(end.getUTCDate() + 1);
        match.date.$lt = end;
      }
    }

    const byStudent = await Attendance.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$student',
          totalSessions: { $sum: 1 },
          presentCount: {
            $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] },
          },
          lateCount: {
            $sum: { $cond: [{ $eq: ['$status', 'late'] }, 1, 0] },
          },
          absentCount: {
            $sum: { $cond: [{ $eq: ['$status', 'absent'] }, 1, 0] },
          },
        },
      },
      {
        $lookup: {
          from: 'students',
          localField: '_id',
          foreignField: '_id',
          as: 'studentInfo',
        },
      },
      { $unwind: '$studentInfo' },
      {
        $lookup: {
          from: 'users',
          localField: 'studentInfo.user',
          foreignField: '_id',
          as: 'userInfo',
        },
      },
      { $unwind: { path: '$userInfo', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          student: '$_id',
          rollNumber: '$studentInfo.rollNumber',
          studentName: '$userInfo.name',
          totalSessions: 1,
          presentCount: 1,
          lateCount: 1,
          absentCount: 1,
          attendancePercentage: {
            $cond: [
              { $gt: ['$totalSessions', 0] },
              {
                $multiply: [
                  {
                    $divide: [
                      { $add: ['$presentCount', '$lateCount'] },
                      '$totalSessions',
                    ],
                  },
                  100,
                ],
              },
              0,
            ],
          },
        },
      },
      { $sort: { rollNumber: 1 } },
    ]);

    const totalRecords = await Attendance.countDocuments(match);
    const uniqueDates = await Attendance.distinct('date', match);

    return res.status(200).json({
      courseId,
      totalRecords,
      sessionDays: uniqueDates.length,
      students: byStudent,
    });
  } catch (err) {
    return handleError(res, err, 'Could not build attendance report');
  }
};

/**
 * Update single attendance record (faculty)
 */
const updateAttendance = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid attendance id' });
    }

    const faculty = await getFacultyFromUser(req.user._id);
    if (!faculty) {
      return res.status(400).json({ message: 'Faculty profile not found' });
    }

    const { status, date, semester } = req.body;
    const update = {};
    if (status) {
      const allowed = ['present', 'absent', 'late'];
      if (!allowed.includes(status)) {
        return res.status(400).json({ message: 'Invalid status' });
      }
      update.status = status;
    }
    if (date !== undefined) {
      const day = normalizeDayUtc(date);
      if (!day) return res.status(400).json({ message: 'Invalid date' });
      update.date = day;
    }
    if (semester !== undefined) update.semester = semester;

    const record = await Attendance.findByIdAndUpdate(id, { $set: update }, { new: true, runValidators: true })
      .populate(attendancePopulate);

    if (!record) {
      return res.status(404).json({ message: 'Attendance record not found' });
    }

    return res.status(200).json(record);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: 'Duplicate attendance for this student, course, and date' });
    }
    return handleError(res, err, 'Could not update attendance');
  }
};

/**
 * Get aggregated attendance summary for all departments or filtered by department/semester
 * GET /api/attendance/summary
 */
const getAttendanceSummary = async (req, res) => {
  try {
    const { department, semester, startDate, endDate } = req.query;
    const match = {};

    if (semester) {
      match.semester = Number(semester);
    }

    if (startDate || endDate) {
      match.date = {};
      if (startDate) {
        const from = normalizeDayUtc(startDate);
        if (from) match.date.$gte = from;
      }
      if (endDate) {
        const to = normalizeDayUtc(endDate);
        if (to) {
          const end = new Date(to);
          end.setUTCDate(end.getUTCDate() + 1);
          match.date.$lt = end;
        }
      }
    }

    // Pipeline to group by department
    const pipeline = [
      { $match: match },
      {
        $lookup: {
          from: 'students',
          localField: 'student',
          foreignField: '_id',
          as: 'studentInfo',
        },
      },
      { $unwind: '$studentInfo' },
      {
        $lookup: {
          from: 'departments',
          localField: 'studentInfo.department',
          foreignField: '_id',
          as: 'deptInfo',
        },
      },
      { $unwind: '$deptInfo' },
    ];

    // Filter by department if provided (by ID or Name)
    if (department) {
      if (mongoose.Types.ObjectId.isValid(department)) {
        pipeline.push({
          $match: { 'deptInfo._id': new mongoose.Types.ObjectId(department) },
        });
      } else {
        pipeline.push({
          $match: { 'deptInfo.name': new RegExp(department, 'i') },
        });
      }
    }

    // Grouping
    pipeline.push({
      $group: {
        _id: '$deptInfo._id',
        name: { $first: '$deptInfo.name' },
        code: { $first: '$deptInfo.code' },
        totalSessions: { $sum: 1 },
        presentCount: {
          $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] },
        },
        lateCount: {
          $sum: { $cond: [{ $eq: ['$status', 'late'] }, 1, 0] },
        },
        absentCount: {
          $sum: { $cond: [{ $eq: ['$status', 'absent'] }, 1, 0] },
        },
        // We'll also collect low attendance students
        students: {
          $addToSet: {
            id: '$studentInfo._id',
            name: '$studentInfo.name', // We'll need to lookup user name if missing
            rollNumber: '$studentInfo.rollNumber',
          },
        },
      },
    });

    pipeline.push({
      $project: {
        department: '$name',
        departmentCode: '$code',
        averageAttendance: {
          $cond: [
            { $gt: ['$totalSessions', 0] },
            {
              $multiply: [
                { $divide: [{ $add: ['$presentCount', '$lateCount'] }, '$totalSessions'] },
                100,
              ],
            },
            0,
          ],
        },
        sessions: '$totalSessions',
        present: '$presentCount',
        late: '$lateCount',
        absent: '$absentCount',
        // Optional: you could add logic here to filter students below 75% 
        // but it's easier to do that per student in a separate lookup if needed.
      },
    });

    const summary = await Attendance.aggregate(pipeline);

    // Also identify at-risk students across the whole system or department
    const atRiskPipeline = [
      { $match: match },
      ...pipeline.slice(1, 5), // Reuse lookup logic
      {
        $group: {
          _id: '$student',
          name: { $first: '$studentInfo.name' },
          rollNumber: { $first: '$studentInfo.rollNumber' },
          department: { $first: '$deptInfo.name' },
          sessions: { $sum: 1 },
          attended: {
            $sum: { $cond: [{ $in: ['$status', ['present', 'late']] }, 1, 0] },
          },
        },
      },
      {
        $project: {
          id: '$_id',
          name: 1,
          rollNumber: 1,
          department: 1,
          rate: {
            $cond: [{ $gt: ['$sessions', 0] }, { $multiply: [{ $divide: ['$attended', '$sessions'] }, 100] }, 0],
          },
        },
      },
      { $match: { rate: { $lt: 75 } } },
      { $limit: 50 },
    ];

    const lowAttendance = await Attendance.aggregate(atRiskPipeline);

    return res.status(200).json({
      success: true,
      data: summary,
      lowAttendance: lowAttendance,
    });
  } catch (err) {
    console.error('Aggregation error:', err);
    return handleError(res, err, 'Could not load attendance summary');
  }
};

module.exports = {
  markAttendance,
  getAttendance,
  getStudentAttendance,
  getAttendanceReport,
  updateAttendance,
  getAttendanceSummary,
};
