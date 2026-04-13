const mongoose = require('mongoose');
const Timetable = require('../../../models/Timetable');
const Faculty = require('../../../models/Faculty');
const Department = require('../../../models/Department');
const handleError = require('../../../utils/handleError');

/**
 * Verify whether a user has HOD-level access to a given department.
 * Admin: always true. Faculty: true only if they are HOD of that department.
 */
const verifyHodAccess = async (user, departmentId) => {
  if (!user) return false;
  if (user.role === 'admin') return true;
  if (user.role === 'faculty') {
    const faculty = await Faculty.findOne({ user: user._id });
    if (!faculty) return false;
    const isHod = await Department.exists({ _id: departmentId, hod: faculty._id });
    return Boolean(isHod);
  }
  return false;
};

const timetablePopulate = [
  { path: 'department', select: 'name code' },
  {
    path: 'periods.course',
    select: 'name code semester credits',
  },
  {
    path: 'periods.faculty',
    select: 'employeeId designation user',
    populate: { path: 'user', select: 'name email' },
  },
];

/**
 * POST /api/timetable — admin or HOD
 */
const createTimetable = async (req, res) => {
  try {
    let { department } = req.body;

    // Auto-fill department from faculty profile if not provided
    if (!department && req.user && req.user.role === 'faculty') {
      const faculty = await Faculty.findOne({ user: req.user._id });
      if (faculty && faculty.department) {
        department = faculty.department.toString();
        req.body.department = department;
      }
    }

    if (!department) {
      return res.status(400).json({ message: 'Department is required to create a timetable' });
    }

    const hasAccess = await verifyHodAccess(req.user, department);
    if (!hasAccess) {
      return res.status(403).json({ message: 'Not authorized to modify this department' });
    }

    const entry = await Timetable.create(req.body);
    const populated = await Timetable.findById(entry._id).populate(timetablePopulate);
    return res.status(201).json(populated);
  } catch (err) {
    return handleError(res, err, 'Could not create timetable entry');
  }
};

/**
 * GET /api/timetable — filter by department (required), semester, section
 */
const getTimetable = async (req, res) => {
  try {
    let { department, semester, section } = req.query;

    // Auto-fill department for faculty role
    if (!department && req.user && req.user.role === 'faculty') {
      const faculty = await Faculty.findOne({ user: req.user._id });
      if (faculty && faculty.department) {
        department = faculty.department.toString();
      }
    }

    if (!department) {
      return res.status(400).json({ message: 'department query is required' });
    }
    if (!mongoose.Types.ObjectId.isValid(department)) {
      return res.status(400).json({ message: 'Invalid department id' });
    }

    const filter = { department };
    if (semester !== undefined && semester !== '') {
      const s = Number(semester);
      if (Number.isNaN(s) || s < 1 || s > 8) {
        return res.status(400).json({ message: 'Invalid semester' });
      }
      filter.semester = s;
    }
    if (section) filter.section = section;

    const rows = await Timetable.find(filter).populate(timetablePopulate).sort({ day: 1 });

    return res.status(200).json(rows);
  } catch (err) {
    return handleError(res, err, 'Could not fetch timetable');
  }
};

/**
 * PUT /api/timetable/:id — admin or HOD
 */
const updateTimetable = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid timetable id' });
    }

    const existing = await Timetable.findById(id);
    if (!existing) {
      return res.status(404).json({ message: 'Timetable entry not found' });
    }

    let hasAccess = await verifyHodAccess(req.user, existing.department);
    if (!hasAccess) {
      return res.status(403).json({ message: 'Not authorized to modify this timetable' });
    }

    // If changing department, verify access to the new department too
    if (req.body.department && req.body.department !== existing.department.toString()) {
      hasAccess = await verifyHodAccess(req.user, req.body.department);
      if (!hasAccess) {
        return res.status(403).json({ message: 'Not authorized to modify target department' });
      }
    }

    const entry = await Timetable.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    }).populate(timetablePopulate);

    return res.status(200).json(entry);
  } catch (err) {
    return handleError(res, err, 'Could not update timetable');
  }
};

/**
 * DELETE /api/timetable/:id — admin or HOD
 */
const deleteTimetable = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid timetable id' });
    }

    const existing = await Timetable.findById(id);
    if (!existing) {
      return res.status(404).json({ message: 'Timetable entry not found' });
    }

    const hasAccess = await verifyHodAccess(req.user, existing.department);
    if (!hasAccess) {
      return res.status(403).json({ message: 'Not authorized to modify this timetable' });
    }

    await Timetable.findByIdAndDelete(id);
    return res.status(200).json({ message: 'Timetable entry removed', id: existing._id });
  } catch (err) {
    return handleError(res, err, 'Could not delete timetable');
  }
};

module.exports = {
  createTimetable,
  getTimetable,
  updateTimetable,
  deleteTimetable,
};
