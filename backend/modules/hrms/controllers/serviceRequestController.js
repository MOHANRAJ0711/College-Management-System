const ServiceRequest = require('../../../models/ServiceRequest');
const Student = require('../../../models/Student');
const handleError = require('../../../utils/handleError');

exports.createRequest = async (req, res) => {
  try {
    const student = await Student.findOne({ user: req.user._id });
    if (!student) return res.status(404).json({ message: 'Student profile not found' });
    const { type, purpose, remarks, urgency, copies } = req.body;
    const sr = await ServiceRequest.create({
      student: student._id, user: req.user._id,
      type, purpose, remarks, urgency, copies: copies || 1,
    });
    res.status(201).json(sr);
  } catch (err) { handleError(res, err); }
};

exports.getMyRequests = async (req, res) => {
  try {
    const student = await Student.findOne({ user: req.user._id });
    if (!student) return res.json([]);
    const reqs = await ServiceRequest.find({ student: student._id }).sort({ createdAt: -1 });
    res.json(reqs);
  } catch (err) { handleError(res, err); }
};

exports.getAllRequests = async (req, res) => {
  try {
    const { status, type } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (type) filter.type = type;
    const reqs = await ServiceRequest.find(filter)
      .populate('student', 'rollNumber')
      .populate('user', 'name email')
      .sort({ createdAt: -1 });
    res.json(reqs);
  } catch (err) { handleError(res, err); }
};

exports.updateRequestStatus = async (req, res) => {
  try {
    const { status, adminNote, deliveryDate, documentUrl } = req.body;
    const update = { status };
    if (adminNote !== undefined) update.adminNote = adminNote;
    if (deliveryDate) update.deliveryDate = deliveryDate;
    if (documentUrl) update.documentUrl = documentUrl;
    const sr = await ServiceRequest.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!sr) return res.status(404).json({ message: 'Request not found' });
    res.json(sr);
  } catch (err) { handleError(res, err); }
};
