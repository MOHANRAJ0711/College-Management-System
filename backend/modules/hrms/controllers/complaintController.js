const Complaint = require('../../../models/Complaint');
const Student = require('../../../models/Student');
const handleError = require('../../../utils/handleError');

exports.createComplaint = async (req, res) => {
  try {
    const student = await Student.findOne({ user: req.user._id });
    if (!student) return res.status(404).json({ message: 'Student profile not found' });
    const { title, category, description, priority, isAnonymous } = req.body;
    const complaint = await Complaint.create({
      student: student._id, user: req.user._id,
      title, category, description, priority, isAnonymous: Boolean(isAnonymous),
    });
    res.status(201).json(complaint);
  } catch (err) { handleError(res, err); }
};

exports.getMyComplaints = async (req, res) => {
  try {
    const student = await Student.findOne({ user: req.user._id });
    if (!student) return res.json([]);
    const complaints = await Complaint.find({ student: student._id }).sort({ createdAt: -1 });
    res.json(complaints);
  } catch (err) { handleError(res, err); }
};

exports.getAllComplaints = async (req, res) => {
  try {
    const { status, category } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (category) filter.category = category;
    const complaints = await Complaint.find(filter)
      .populate('student', 'rollNumber')
      .populate('user', 'name email')
      .sort({ createdAt: -1 });
    res.json(complaints);
  } catch (err) { handleError(res, err); }
};

exports.updateComplaintStatus = async (req, res) => {
  try {
    const { status, adminRemarks } = req.body;
    const update = { status };
    if (adminRemarks) update.adminRemarks = adminRemarks;
    if (status === 'resolved') update.resolvedAt = new Date();
    const complaint = await Complaint.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!complaint) return res.status(404).json({ message: 'Complaint not found' });
    res.json(complaint);
  } catch (err) { handleError(res, err); }
};
