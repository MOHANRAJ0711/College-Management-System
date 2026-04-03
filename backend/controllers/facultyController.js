const mongoose = require('mongoose');
const User = require('../models/User');
const Faculty = require('../models/Faculty');
const Student = require('../models/Student');
const Timetable = require('../models/Timetable');
const Exam = require('../models/Exam');
const Notification = require('../models/Notification');

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

const facultyPopulate = [
  { path: 'user', select: 'name email role avatar isActive createdAt' },
  { path: 'department', select: 'name code description hod' },
  { path: 'subjects', select: 'name code semester credits type department' },
];

const buildFacultyFilter = async (query) => {
  const filter = {};
  const { department, designation, search, includeInactive } = query;

  if (department && mongoose.Types.ObjectId.isValid(department)) {
    filter.department = department;
  }
  if (designation) {
    filter.designation = designation;
  }

  if (search && String(search).trim()) {
    const term = String(search).trim();
    const regex = new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    const matchingUsers = await User.find({
      role: 'faculty',
      $or: [{ name: regex }, { email: regex }],
    }).distinct('_id');
    filter.user = { $in: matchingUsers };
  }

  if (includeInactive !== 'true' && includeInactive !== '1') {
    const activeIds = await User.find({ role: 'faculty', isActive: true }).distinct('_id');
    if (filter.user && filter.user.$in) {
      const set = new Set(activeIds.map((id) => id.toString()));
      filter.user.$in = filter.user.$in.filter((id) => set.has(id.toString()));
    } else {
      filter.user = { $in: activeIds };
    }
  }

  return filter;
};

/**
 * GET /api/faculty — admin
 */
const getFaculties = async (req, res) => {
  try {
    const filter = await buildFacultyFilter(req.query);
    const faculties = await Faculty.find(filter)
      .populate(facultyPopulate)
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json(faculties);
  } catch (err) {
    return handleError(res, err, 'Could not fetch faculty');
  }
};

/**
 * GET /api/faculty/:id
 */
const getFaculty = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid faculty id' });
    }

    const faculty = await Faculty.findById(id).populate(facultyPopulate);
    if (!faculty) {
      return res.status(404).json({ message: 'Faculty not found' });
    }

    if (req.user.role === 'faculty') {
      const own = await Faculty.findOne({ user: req.user._id });
      if (!own || own._id.toString() !== id) {
        return res.status(403).json({ message: 'Not authorized to view this faculty profile' });
      }
    } else if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to view faculty' });
    }

    return res.status(200).json(faculty);
  } catch (err) {
    return handleError(res, err, 'Could not fetch faculty');
  }
};

/**
 * POST /api/faculty — admin
 */
const createFaculty = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      employeeId,
      department,
      designation,
      qualification,
      specialization,
      experience,
      phone,
      address,
      dateOfJoining,
      subjects,
    } = req.body;

    if (!name || !email || !password || !employeeId) {
      return res
        .status(400)
        .json({ message: 'Please provide name, email, password, and employeeId' });
    }

    const existing = await User.findOne({ email: String(email).toLowerCase().trim() });
    if (existing) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    const user = await User.create({
      name,
      email,
      password,
      role: 'faculty',
    });

    const faculty = await Faculty.create({
      user: user._id,
      employeeId,
      department,
      designation,
      qualification,
      specialization,
      experience,
      phone,
      address,
      dateOfJoining,
      subjects: subjects || [],
    });

    const populated = await Faculty.findById(faculty._id).populate(facultyPopulate);
    return res.status(201).json(populated);
  } catch (err) {
    return handleError(res, err, 'Could not create faculty');
  }
};

/**
 * PUT /api/faculty/:id — admin
 */
const updateFaculty = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid faculty id' });
    }

    const faculty = await Faculty.findById(id);
    if (!faculty) {
      return res.status(404).json({ message: 'Faculty not found' });
    }

    const {
      name,
      email,
      employeeId,
      department,
      designation,
      qualification,
      specialization,
      experience,
      phone,
      address,
      dateOfJoining,
      subjects,
      isActive,
    } = req.body;

    const userFields = {};
    if (name !== undefined) userFields.name = name;
    if (email !== undefined) userFields.email = String(email).toLowerCase().trim();
    if (isActive !== undefined) userFields.isActive = isActive;

    if (Object.keys(userFields).length) {
      if (userFields.email) {
        const clash = await User.findOne({
          email: userFields.email,
          _id: { $ne: faculty.user },
        });
        if (clash) {
          return res.status(400).json({ message: 'Email already in use' });
        }
      }
      await User.findByIdAndUpdate(faculty.user, userFields, { new: true, runValidators: true });
    }

    const profileUpdate = {};
    [
      'employeeId',
      'department',
      'designation',
      'qualification',
      'specialization',
      'experience',
      'phone',
      'address',
      'dateOfJoining',
      'subjects',
    ].forEach((k) => {
      if (req.body[k] !== undefined) profileUpdate[k] = req.body[k];
    });

    const updated = await Faculty.findByIdAndUpdate(id, profileUpdate, {
      new: true,
      runValidators: true,
    }).populate(facultyPopulate);

    return res.status(200).json(updated);
  } catch (err) {
    return handleError(res, err, 'Could not update faculty');
  }
};

/**
 * DELETE /api/faculty/:id — admin, soft delete
 */
const deleteFaculty = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid faculty id' });
    }

    const faculty = await Faculty.findById(id);
    if (!faculty) {
      return res.status(404).json({ message: 'Faculty not found' });
    }

    await User.findByIdAndUpdate(faculty.user, { isActive: false });
    return res.status(200).json({ message: 'Faculty account deactivated (soft delete)' });
  } catch (err) {
    return handleError(res, err, 'Could not delete faculty');
  }
};

const weekdayName = () => {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[new Date().getDay()];
};

/**
 * GET /api/faculty/dashboard — logged-in faculty
 */
const getFacultyDashboard = async (req, res) => {
  try {
    const faculty = await Faculty.findOne({ user: req.user._id })
      .populate(facultyPopulate)
      .lean();

    if (!faculty) {
      return res.status(404).json({ message: 'Faculty profile not found' });
    }

    const now = new Date();
    const todayDay = weekdayName();
    const deptId = refId(faculty.department);

    const timetableQuery = { isActive: true, day: todayDay };
    if (deptId) {
      timetableQuery.department = deptId;
    }

    const timetables = await Timetable.find(timetableQuery)
      .populate('periods.course', 'name code')
      .lean();

    const todaysClasses = [];
    timetables.forEach((tt) => {
      (tt.periods || []).forEach((p) => {
        const fid = p.faculty && p.faculty.toString();
        if (fid === faculty._id.toString()) {
          todaysClasses.push({
            timetableId: tt._id,
            day: tt.day,
            semester: tt.semester,
            section: tt.section,
            academicYear: tt.academicYear,
            period: p,
          });
        }
      });
    });

    const subjectIds = (faculty.subjects || []).map((s) => refId(s)).filter(Boolean);

    const examOr = [];
    if (subjectIds.length) examOr.push({ course: { $in: subjectIds } });
    if (deptId) examOr.push({ department: deptId });

    const examFilter = {
      date: { $gte: now },
      status: { $ne: 'cancelled' },
    };
    if (examOr.length) {
      examFilter.$or = examOr;
    }

    const upcomingExams = await Exam.find(examFilter)
      .populate('course', 'name code semester')
      .populate('department', 'name code')
      .sort({ date: 1 })
      .limit(15)
      .lean();

    const notifFilter = {
      isActive: true,
      $and: [
        {
          $or: [
            { targetRole: 'all' },
            { targetRole: 'faculty' },
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

    let studentsInDepartment = null;
    if (deptId) {
      studentsInDepartment = await Student.countDocuments({ department: deptId });
    }

    return res.status(200).json({
      faculty,
      todaysClasses,
      upcomingExams,
      notifications,
      stats: {
        subjectsCount: (faculty.subjects && faculty.subjects.length) || 0,
        studentsInDepartment,
      },
    });
  } catch (err) {
    return handleError(res, err, 'Could not load faculty dashboard');
  }
};

module.exports = {
  getFaculties,
  getFaculty,
  createFaculty,
  updateFaculty,
  deleteFaculty,
  getFacultyDashboard,
};
