const mongoose = require('mongoose');
const User = require('../models/User');
const Student = require('../models/Student');
<<<<<<< HEAD
const Faculty = require('../models/Faculty');
=======
>>>>>>> 5bf96afa4b78a77bcb7e78c540f952f867f72d09
const Attendance = require('../models/Attendance');
const Exam = require('../models/Exam');
const Fee = require('../models/Fee');
const Notification = require('../models/Notification');

/** Resolve ref whether stored as ObjectId or populated { _id, ... } */
const refId = (ref) => {
  if (!ref) return null;
  if (typeof ref === 'object' && ref._id) return ref._id;
  return ref;
};

const handleError = (res, err, defaultMsg = 'Server error') => {
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({ message: messages.join(', ') });
  }
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0] || 'field';
    return res.status(400).json({ message: `Duplicate value for ${field}` });
  }
  console.error(err);
  return res.status(500).json({ message: defaultMsg });
};

const studentPopulate = [
  { path: 'user', select: 'name email role avatar isActive createdAt' },
  { path: 'department', select: 'name code description' },
  { path: 'course', select: 'name code semester credits type department' },
];

<<<<<<< HEAD
const buildStudentFilter = async (query, user) => {
=======
const buildStudentFilter = async (query) => {
>>>>>>> 5bf96afa4b78a77bcb7e78c540f952f867f72d09
  const filter = {};
  const {
    department,
    course,
    semester,
    section,
    batch,
    search,
    includeInactive,
  } = query;

  if (department && mongoose.Types.ObjectId.isValid(department)) {
    filter.department = department;
  }
  if (course && mongoose.Types.ObjectId.isValid(course)) {
    filter.course = course;
  }
  if (semester !== undefined && semester !== '') {
    const s = Number(semester);
    if (!Number.isNaN(s)) filter.semester = s;
  }
  if (section) filter.section = new RegExp(section, 'i');
  if (batch) filter.batch = new RegExp(batch, 'i');

  if (search && String(search).trim()) {
    const term = String(search).trim();
    const regex = new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    const matchingUsers = await User.find({
      role: 'student',
      $or: [{ name: regex }, { email: regex }],
    }).distinct('_id');
    filter.user = { $in: matchingUsers };
  }

  if (includeInactive !== 'true' && includeInactive !== '1') {
    const activeIds = await User.find({ role: 'student', isActive: true }).distinct('_id');
    if (filter.user && filter.user.$in) {
      const set = new Set(activeIds.map((id) => id.toString()));
      const narrowed = filter.user.$in.filter((id) => set.has(id.toString()));
      filter.user = { $in: narrowed };
    } else {
      filter.user = { $in: activeIds };
    }
  }

<<<<<<< HEAD
  if (user && user.role === 'faculty') {
    const faculty = await Faculty.findOne({ user: user._id });
    if (faculty && faculty.designation === 'HOD' && faculty.department) {
      filter.department = faculty.department;
    }
  }

=======
>>>>>>> 5bf96afa4b78a77bcb7e78c540f952f867f72d09
  return filter;
};

/**
 * GET /api/students — admin, faculty
 */
const getStudents = async (req, res) => {
  try {
<<<<<<< HEAD
    const filter = await buildStudentFilter(req.query, req.user);
=======
    const filter = await buildStudentFilter(req.query);
>>>>>>> 5bf96afa4b78a77bcb7e78c540f952f867f72d09
    const students = await Student.find(filter)
      .populate(studentPopulate)
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json(students);
  } catch (err) {
    return handleError(res, err, 'Could not fetch students');
  }
};

/**
 * GET /api/students/:id
 */
const getStudent = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid student id' });
    }

    const student = await Student.findById(id).populate(studentPopulate);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    if (req.user.role === 'student') {
      const own = await Student.findOne({ user: req.user._id });
      if (!own || own._id.toString() !== id) {
        return res.status(403).json({ message: 'Not authorized to view this student' });
      }
    } else if (req.user.role !== 'admin' && req.user.role !== 'faculty') {
      return res.status(403).json({ message: 'Not authorized to view students' });
    }

    return res.status(200).json(student);
  } catch (err) {
    return handleError(res, err, 'Could not fetch student');
  }
};

/**
 * POST /api/students — admin
 */
const createStudent = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      rollNumber,
      registrationNumber,
      department,
      course,
      semester,
      section,
      batch,
      dateOfBirth,
      gender,
      phone,
      address,
      guardianName,
      guardianPhone,
      bloodGroup,
      admissionDate,
    } = req.body;

    if (!name || !email || !password || !rollNumber) {
      return res
        .status(400)
        .json({ message: 'Please provide name, email, password, and rollNumber' });
    }

    const existing = await User.findOne({ email: String(email).toLowerCase().trim() });
    if (existing) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    const user = await User.create({
      name,
      email,
      password,
      role: 'student',
    });

    const student = await Student.create({
      user: user._id,
      rollNumber,
      registrationNumber,
      department,
      course,
      semester,
      section,
      batch,
      dateOfBirth,
      gender,
      phone,
      address,
      guardianName,
      guardianPhone,
      bloodGroup,
      admissionDate,
    });

    const populated = await Student.findById(student._id).populate(studentPopulate);
    return res.status(201).json(populated);
  } catch (err) {
    return handleError(res, err, 'Could not create student');
  }
};

/**
 * PUT /api/students/:id — admin
 */
const updateStudent = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid student id' });
    }

    const student = await Student.findById(id);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    const {
      name,
      email,
      rollNumber,
      registrationNumber,
      department,
      course,
      semester,
      section,
      batch,
      dateOfBirth,
      gender,
      phone,
      address,
      guardianName,
      guardianPhone,
      bloodGroup,
      admissionDate,
      isActive,
    } = req.body;

    const userFields = {};
    if (name !== undefined) userFields.name = name;
    if (email !== undefined) userFields.email = email;
    if (isActive !== undefined) userFields.isActive = isActive;

    if (Object.keys(userFields).length) {
      if (userFields.email) {
        userFields.email = String(userFields.email).toLowerCase().trim();
        const clash = await User.findOne({
          email: userFields.email,
          _id: { $ne: student.user },
        });
        if (clash) {
          return res.status(400).json({ message: 'Email already in use' });
        }
      }
      await User.findByIdAndUpdate(student.user, userFields, { new: true, runValidators: true });
    }

    const profileUpdate = {};
    [
      'rollNumber',
      'registrationNumber',
      'department',
      'course',
      'semester',
      'section',
      'batch',
      'dateOfBirth',
      'gender',
      'phone',
      'address',
      'guardianName',
      'guardianPhone',
      'bloodGroup',
      'admissionDate',
    ].forEach((k) => {
      if (req.body[k] !== undefined) profileUpdate[k] = req.body[k];
    });

    const updated = await Student.findByIdAndUpdate(id, profileUpdate, {
      new: true,
      runValidators: true,
    }).populate(studentPopulate);

    return res.status(200).json(updated);
  } catch (err) {
    return handleError(res, err, 'Could not update student');
  }
};

/**
 * DELETE /api/students/:id — admin, soft delete via user deactivation
 */
const deleteStudent = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid student id' });
    }

    const student = await Student.findById(id);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    await User.findByIdAndUpdate(student.user, { isActive: false });
    return res.status(200).json({ message: 'Student account deactivated (soft delete)' });
  } catch (err) {
    return handleError(res, err, 'Could not delete student');
  }
};

/**
 * GET /api/students/dashboard — logged-in student
 */
const getStudentDashboard = async (req, res) => {
  try {
    const student = await Student.findOne({ user: req.user._id })
      .populate(studentPopulate)
      .lean();

    if (!student) {
      return res.status(404).json({ message: 'Student profile not found' });
    }

    const studentId = student._id;
    const now = new Date();

    const attendanceRecords = await Attendance.find({ student: studentId }).lean();
    const total = attendanceRecords.length;
    const present = attendanceRecords.filter((r) => r.status === 'present').length;
    const attendancePercent = total === 0 ? null : Math.round((present / total) * 1000) / 10;

    const deptId = refId(student.department);
    const courseId = refId(student.course);

    const examFilter = {
      date: { $gte: now },
      status: { $ne: 'cancelled' },
    };
    if (student.semester) examFilter.semester = student.semester;
    if (deptId) examFilter.$or = [{ department: deptId }];
    if (courseId) {
      examFilter.$or = [...(examFilter.$or || []), { course: courseId }];
    }
    if (!examFilter.$or || examFilter.$or.length === 0) {
      delete examFilter.$or;
    }

    const upcomingExams = await Exam.find(examFilter)
      .populate('course', 'name code')
      .populate('department', 'name code')
      .sort({ date: 1 })
      .limit(15)
      .lean();

    const fees = await Fee.find({ student: studentId })
      .sort({ dueDate: 1, createdAt: -1 })
      .lean();

    const pendingFees = fees.filter((f) => f.status === 'pending' || f.status === 'overdue');
    const paidFees = fees.filter((f) => f.status === 'paid');
    const feeStatus = {
      totalRecords: fees.length,
      pendingCount: pendingFees.length,
      paidCount: paidFees.length,
      pendingAmount: pendingFees.reduce((s, f) => s + (f.amount || 0), 0),
      items: fees.slice(0, 20),
    };

    const notifFilter = {
      isActive: true,
      $and: [
        {
          $or: [
            { targetRole: 'all' },
            { targetRole: 'student' },
            ...(deptId ? [{ department: deptId }] : []),
          ],
        },
        {
          $or: [
            { expiryDate: { $exists: false } },
            { expiryDate: null },
            { expiryDate: { $gte: now } },
          ],
        },
      ],
    };

    const notifications = await Notification.find(notifFilter)
      .sort({ createdAt: -1 })
      .limit(15)
      .populate('department', 'name code')
      .lean();

    return res.status(200).json({
      student,
      attendance: {
        percent: attendancePercent,
        presentCount: present,
        totalSessions: total,
      },
      upcomingExams,
      feeStatus,
      notifications,
    });
  } catch (err) {
    return handleError(res, err, 'Could not load dashboard');
  }
};

module.exports = {
  getStudents,
  getStudent,
  createStudent,
  updateStudent,
  deleteStudent,
  getStudentDashboard,
};
