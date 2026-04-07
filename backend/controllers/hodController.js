const Faculty = require('../models/Faculty');
const Student = require('../models/Student');
const Course = require('../models/Course');
const Timetable = require('../models/Timetable');
const Notification = require('../models/Notification');
const User = require('../models/User');
const handleError = require('../utils/handleError');

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

    res.json({
      department: dept,
      stats: { students, faculty: facultyList, courses },
    });
  } catch (err) { handleError(res, err); }
};

exports.getDeptFaculty = async (req, res) => {
  try {
    const dept = await getHodDept(req.user._id);
    if (!dept) return res.status(403).json({ message: 'No department assigned' });
    const list = await Faculty.find({ department: dept._id })
      .populate('user', 'name email avatar isActive')
      .populate('subjects', 'name code');
    res.json(list);
  } catch (err) { handleError(res, err); }
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
    res.json(list);
  } catch (err) { handleError(res, err); }
};

exports.getDeptCourses = async (req, res) => {
  try {
    const dept = await getHodDept(req.user._id);
    if (!dept) return res.status(403).json({ message: 'No department assigned' });
    const list = await Course.find({ department: dept._id }).sort({ semester: 1 });
    res.json(list);
  } catch (err) { handleError(res, err); }
};

exports.assignSubject = async (req, res) => {
  try {
    const { facultyId, courseId } = req.body;
    const faculty = await Faculty.findById(facultyId);
    if (!faculty) return res.status(404).json({ message: 'Faculty not found' });
    if (!faculty.subjects.includes(courseId)) {
      faculty.subjects.push(courseId);
      await faculty.save();
    }
    res.json({ message: 'Subject assigned', faculty });
  } catch (err) { handleError(res, err); }
};

exports.sendDeptNotification = async (req, res) => {
  try {
    const dept = await getHodDept(req.user._id);
    if (!dept) return res.status(403).json({ message: 'No department assigned' });
    const { title, message, targetRole } = req.body;
    const notification = await Notification.create({
      title, message,
      type: 'announcement',
      targetRole: targetRole || 'all',
      createdBy: req.user._id,
      department: dept._id,
    });
    res.status(201).json(notification);
  } catch (err) { handleError(res, err); }
};
