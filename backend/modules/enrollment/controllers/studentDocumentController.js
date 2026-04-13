const StudentDocument = require('../../../models/StudentDocument');
const Student = require('../../../models/Student');
const handleError = require('../../../utils/handleError');

exports.uploadDocument = async (req, res) => {
  try {
    const student = await Student.findOne({ user: req.user._id });
    if (!student) return res.status(404).json({ message: 'Student profile not found' });
    if (!req.file) return res.status(400).json({ message: 'File is required' });
    const { title, type, description, course } = req.body;
    const doc = await StudentDocument.create({
      student: student._id, user: req.user._id,
      title: title || req.file.originalname,
      type: type || 'other',
      fileUrl: `/uploads/${req.file.filename}`,
      fileName: req.file.originalname,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      course: course || undefined,
      description,
    });
    res.status(201).json(doc);
  } catch (err) { handleError(res, err); }
};

exports.getMyDocuments = async (req, res) => {
  try {
    const student = await Student.findOne({ user: req.user._id });
    if (!student) return res.json([]);
    const docs = await StudentDocument.find({ student: student._id })
      .populate('course', 'name code')
      .sort({ createdAt: -1 });
    res.json(docs);
  } catch (err) { handleError(res, err); }
};

exports.deleteDocument = async (req, res) => {
  try {
    const student = await Student.findOne({ user: req.user._id });
    await StudentDocument.findOneAndDelete({ _id: req.params.id, student: student?._id });
    res.json({ message: 'Deleted' });
  } catch (err) { handleError(res, err); }
};
