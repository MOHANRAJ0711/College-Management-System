const mongoose = require('mongoose');
const Exam = require('../../../models/Exam');
const handleError = require('../../../utils/handleError');

const examPopulate = [
  { path: 'course', select: 'name code department semester credits' },
  { path: 'department', select: 'name code' },
];

const getExam = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid exam id' });
    }

    const exam = await Exam.findById(id).populate(examPopulate);

    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }

    return res.status(200).json(exam);
  } catch (err) {
    return handleError(res, err, 'Could not fetch exam');
  }
};

const getExams = async (req, res) => {
  try {
    const { department, semester, type } = req.query;
    const filter = {};

    if (department) {
      if (!mongoose.Types.ObjectId.isValid(department)) {
        return res.status(400).json({ message: 'Invalid department id' });
      }
      filter.department = department;
    }
    if (semester !== undefined && semester !== '') {
      const s = Number(semester);
      if (Number.isNaN(s) || s < 1 || s > 8) {
        return res.status(400).json({ message: 'Invalid semester' });
      }
      filter.semester = s;
    }
    if (type) {
      const allowed = ['internal', 'semester', 'supplementary'];
      if (!allowed.includes(type)) {
        return res.status(400).json({ message: 'Invalid exam type' });
      }
      filter.type = type;
    }

    const exams = await Exam.find(filter).populate(examPopulate).sort({ date: -1 });

    return res.status(200).json(exams);
  } catch (err) {
    return handleError(res, err, 'Could not fetch exams');
  }
};

const createExam = async (req, res) => {
  try {
    const exam = await Exam.create(req.body);
    const populated = await Exam.findById(exam._id).populate(examPopulate);
    return res.status(201).json(populated);
  } catch (err) {
    return handleError(res, err, 'Could not create exam');
  }
};

const updateExam = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid exam id' });
    }

    const exam = await Exam.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    }).populate(examPopulate);

    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }

    return res.status(200).json(exam);
  } catch (err) {
    return handleError(res, err, 'Could not update exam');
  }
};

const deleteExam = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid exam id' });
    }

    const exam = await Exam.findByIdAndDelete(id);
    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }

    return res.status(200).json({ message: 'Exam removed', id: exam._id });
  } catch (err) {
    return handleError(res, err, 'Could not delete exam');
  }
};

module.exports = {
  createExam,
  getExams,
  getExam,
  updateExam,
  deleteExam,
};
