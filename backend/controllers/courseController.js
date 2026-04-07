const mongoose = require('mongoose');
const Course = require('../models/Course');
const Faculty = require('../models/Faculty');

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

const coursePopulate = [{ path: 'department', select: 'name code' }];

/**
 * GET — list courses with optional filters (public)
 */
const getCourses = async (req, res) => {
  try {
    const { semester, type, search, includeInactive } = req.query;
    let { department } = req.query;
    const filter = {};

    // If faculty role is fetching, filter by their department (HOD access)
    if (req.user && req.user.role === 'faculty') {
      const ownFaculty = await Faculty.findOne({ user: req.user._id });
      if (ownFaculty && ownFaculty.department) {
        department = ownFaculty.department.toString();
      } else {
        return res.status(200).json([]);
      }
    }

    if (department && mongoose.Types.ObjectId.isValid(department)) {
      filter.department = department;
    }
    if (semester !== undefined && semester !== '') {
      const s = Number(semester);
      if (!Number.isNaN(s)) filter.semester = s;
    }
    if (type) {
      filter.type = type;
    }
    if (includeInactive !== 'true' && includeInactive !== '1') {
      filter.isActive = true;
    }

    if (search && String(search).trim()) {
      const term = String(search).trim();
      const regex = new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      filter.$or = [{ name: regex }, { code: regex }];
    }

    const courses = await Course.find(filter)
      .populate(coursePopulate)
      .sort({ department: 1, semester: 1, name: 1 })
      .lean();

    return res.status(200).json(courses);
  } catch (err) {
    return handleError(res, err, 'Could not fetch courses');
  }
};

/**
 * GET /:id — single course (public)
 */
const getCourse = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid course id' });
    }

    const course = await Course.findById(id).populate(coursePopulate).lean();
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    return res.status(200).json(course);
  } catch (err) {
    return handleError(res, err, 'Could not fetch course');
  }
};

/**
 * POST — admin
 */
const createCourse = async (req, res) => {
  try {
    const { name, code, department, semester, credits, type, description, syllabus, isActive } =
      req.body;

    if (!name || !code || !department) {
      return res.status(400).json({ message: 'Please provide name, code, and department' });
    }

    const course = await Course.create({
      name,
      code,
      department,
      semester,
      credits,
      type,
      description,
      syllabus,
      isActive: isActive !== undefined ? isActive : true,
    });

    const populated = await Course.findById(course._id).populate(coursePopulate);
    return res.status(201).json(populated);
  } catch (err) {
    return handleError(res, err, 'Could not create course');
  }
};

/**
 * PUT /:id — admin
 */
const updateCourse = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid course id' });
    }

    const allowed = [
      'name',
      'code',
      'department',
      'semester',
      'credits',
      'type',
      'description',
      'syllabus',
      'isActive',
    ];
    const update = {};
    allowed.forEach((k) => {
      if (req.body[k] !== undefined) update[k] = req.body[k];
    });

    const course = await Course.findByIdAndUpdate(id, update, {
      new: true,
      runValidators: true,
    }).populate(coursePopulate);

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    return res.status(200).json(course);
  } catch (err) {
    return handleError(res, err, 'Could not update course');
  }
};

/**
 * DELETE /:id — admin (soft delete)
 */
const deleteCourse = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid course id' });
    }

    const course = await Course.findByIdAndUpdate(id, { isActive: false }, { new: true }).populate(
      coursePopulate
    );

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    return res.status(200).json({ message: 'Course deactivated', course });
  } catch (err) {
    return handleError(res, err, 'Could not delete course');
  }
};

module.exports = {
  getCourses,
  getCourse,
  createCourse,
  updateCourse,
  deleteCourse,
};
