const Assignment = require('../../../models/Assignment');
const Faculty = require('../../../models/Faculty');
const Student = require('../../../models/Student');
const handleError = require('../../../utils/handleError');

exports.createAssignment = async (req, res) => {
  try {
    const faculty = await Faculty.findOne({ user: req.user._id });
    if (!faculty) return res.status(404).json({ message: 'Faculty profile not found' });
    const { title, description, courseId, department, semester, section, dueDate, maxMarks } = req.body;
    const asgn = await Assignment.create({
      title, description, faculty: faculty._id,
      course: courseId || undefined,
      department: department || faculty.department || undefined,
      semester, section, dueDate, maxMarks: maxMarks || 100,
    });
    res.status(201).json(asgn);
  } catch (err) { handleError(res, err); }
};

exports.getMyAssignments = async (req, res) => {
  try {
    const faculty = await Faculty.findOne({ user: req.user._id });
    if (!faculty) return res.json([]);
    const list = await Assignment.find({ faculty: faculty._id })
      .populate('course', 'name code')
      .populate('department', 'name code')
      .sort({ createdAt: -1 });
    res.json(list);
  } catch (err) { handleError(res, err); }
};

exports.getAssignmentsForStudent = async (req, res) => {
  try {
    const student = await Student.findOne({ user: req.user._id });
    if (!student) return res.json([]);
    const filter = { status: 'active' };
    if (student.department) filter.department = student.department;
    if (student.semester) filter.semester = student.semester;
    if (student.section) filter.$or = [{ section: student.section }, { section: { $exists: false } }];
    const list = await Assignment.find(filter)
      .populate('course', 'name code')
      .populate('faculty', 'user')
      .sort({ dueDate: 1 });
    res.json(list);
  } catch (err) { handleError(res, err); }
};

exports.updateAssignment = async (req, res) => {
  try {
    const faculty = await Faculty.findOne({ user: req.user._id });
    if (!faculty) return res.status(403).json({ message: 'Not authorized' });
    const asgn = await Assignment.findOneAndUpdate(
      { _id: req.params.id, faculty: faculty._id },
      req.body, { new: true, runValidators: true }
    );
    if (!asgn) return res.status(404).json({ message: 'Assignment not found' });
    res.json(asgn);
  } catch (err) { handleError(res, err); }
};

exports.deleteAssignment = async (req, res) => {
  try {
    const faculty = await Faculty.findOne({ user: req.user._id });
    await Assignment.findOneAndDelete({ _id: req.params.id, faculty: faculty?._id });
    res.json({ message: 'Deleted' });
  } catch (err) { handleError(res, err); }
};
