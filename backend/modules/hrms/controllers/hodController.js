const Faculty = require('../../../models/Faculty');
const Student = require('../../../models/Student');
const Course = require('../../../models/Course');
const Timetable = require('../../../models/Timetable');
const Notification = require('../../../models/Notification');
const User = require('../../../models/User');
const handleError = require('../../../utils/handleError');

const getHodDept = async (userId) => {
  const faculty = await Faculty.findOne({ user: userId }).populate('department');
  return faculty?.department ?? null;
};

exports.getDashboard = async (req, res) => {
  try {
    const dept = await getHodDept(req.user._id);
    if (!dept) return res.status(403).json({ message: 'No department assigned' });
    const deptId = dept._id;

    const [students, facultyList, courses] = await Promise.all([
      Student.countDocuments({ department: deptId }),
      Faculty.countDocuments({ department: deptId }),
      Course.countDocuments({ department: deptId }),
    ]);

    return res.json({
      department: dept,
      stats: { students, faculty: facultyList, courses },
    });
  } catch (err) {
    return handleError(res, err);
  }
};

exports.getDeptFaculty = async (req, res) => {
  try {
    const dept = await getHodDept(req.user._id);
    if (!dept) return res.status(403).json({ message: 'No department assigned' });
    const list = await Faculty.find({ department: dept._id })
      .populate('user', 'name email avatar isActive')
      .populate('subjects', 'name code');
    return res.json(list);
  } catch (err) {
    return handleError(res, err);
  }
};

exports.getDeptStudents = async (req, res) => {
  try {
    const dept = await getHodDept(req.user._id);
    if (!dept) return res.status(403).json({ message: 'No department assigned' });
    const { semester, section } = req.query;
    const filter = { department: dept._id };
    if (semester) filter.semester = Number(semester);
    if (section) filter.section = section;
    const list = await Student.find(filter)
      .populate('user', 'name email')
      .populate('course', 'name code');
    return res.json(list);
  } catch (err) {
    return handleError(res, err);
  }
};

exports.getDeptCourses = async (req, res) => {
  try {
    const dept = await getHodDept(req.user._id);
    if (!dept) return res.status(403).json({ message: 'No department assigned' });
    const list = await Course.find({ department: dept._id }).sort({ semester: 1 });
    return res.json(list);
  } catch (err) {
    return handleError(res, err);
  }
};

/**
 * Assign a subject (course) to a faculty member.
 * Bug fix: .includes() uses reference equality for ObjectIds — use .some() with string comparison.
 */
exports.assignSubject = async (req, res) => {
  try {
    const { facultyId, courseId } = req.body;
    if (!facultyId || !courseId) {
      return res.status(400).json({ message: 'facultyId and courseId are required' });
    }

    const faculty = await Faculty.findById(facultyId);
    if (!faculty) return res.status(404).json({ message: 'Faculty not found' });

    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: 'Course not found' });

    // Bug fix: compare as strings because ObjectId is not primitive-equal
    const alreadyAssigned = faculty.subjects.some((s) => s.toString() === courseId.toString());
    if (!alreadyAssigned) {
      faculty.subjects.push(courseId);
      await faculty.save();
    }

    const populated = await Faculty.findById(faculty._id)
      .populate('user', 'name email')
      .populate('subjects', 'name code semester');
    return res.json({ message: 'Subject assigned', faculty: populated });
  } catch (err) {
    return handleError(res, err);
  }
};

/**
 * Remove a subject from a faculty member.
 */
exports.removeSubject = async (req, res) => {
  try {
    const { facultyId, courseId } = req.body;
    if (!facultyId || !courseId) {
      return res.status(400).json({ message: 'facultyId and courseId are required' });
    }

    const faculty = await Faculty.findById(facultyId);
    if (!faculty) return res.status(404).json({ message: 'Faculty not found' });

    faculty.subjects = faculty.subjects.filter((s) => s.toString() !== courseId.toString());
    await faculty.save();

    return res.json({ message: 'Subject removed', faculty });
  } catch (err) {
    return handleError(res, err);
  }
};

exports.sendDeptNotification = async (req, res) => {
  try {
    const dept = await getHodDept(req.user._id);
    if (!dept) return res.status(403).json({ message: 'No department assigned' });
    const { title, message, targetRole } = req.body;
    if (!title || !message) {
      return res.status(400).json({ message: 'title and message are required' });
    }
    const notification = await Notification.create({
      title,
      message,
      type: 'announcement',
      targetRole: targetRole || 'all',
      createdBy: req.user._id,
      department: dept._id,
    });
    return res.status(201).json(notification);
  } catch (err) {
    return handleError(res, err);
  }
};
