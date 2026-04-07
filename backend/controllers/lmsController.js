const StudyMaterial = require('../models/StudyMaterial');
const Feedback = require('../models/Feedback');
const Course = require('../models/Course');
const Faculty = require('../models/Faculty');
const Student = require('../models/Student');

const lmsController = {
  // --- Study Materials ---
  uploadMaterial: async (req, res) => {
    try {
      const faculty = await Faculty.findOne({ user: req.user._id });
      if (!faculty) return res.status(404).json({ message: 'Faculty profile not found' });

      const material = await StudyMaterial.create({
        faculty: faculty._id,
        ...req.body,
      });
      res.status(201).json(material);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  },

  getMaterials: async (req, res) => {
    try {
      const { subjectId, year, semester } = req.query;
      const filter = {};
      if (subjectId) filter.subject = subjectId;
      if (year) filter.targetYear = year;
      if (semester) filter.targetSemester = semester;

      const materials = await StudyMaterial.find(filter)
        .populate('subject', 'name code')
        .populate({ path: 'faculty', populate: { path: 'user', select: 'name' } })
        .sort('-createdAt')
        .lean();
      res.status(200).json(materials);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },

  // --- Faculty Feedback ---
  submitFeedback: async (req, res) => {
    try {
      const student = await Student.findOne({ user: req.user._id });
      if (!student) return res.status(404).json({ message: 'Student profile not found' });

      const feedback = await Feedback.create({
        student: student._id,
        ...req.body,
      });
      res.status(201).json(feedback);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  },

  getFacultyRatings: async (req, res) => {
    try {
      const { facultyId } = req.params;
      const feedbacks = await Feedback.find({ faculty: facultyId }).lean();
      
      // Compute aggregates
      if (feedbacks.length === 0) return res.json({ average: 0, count: 0 });

      const totals = feedbacks.reduce((acc, curr) => {
        acc.teaching += curr.ratings.teaching;
        acc.punctuality += curr.ratings.punctuality;
        acc.delivery += curr.ratings.delivery;
        acc.support += curr.ratings.support;
        return acc;
      }, { teaching: 0, punctuality: 0, delivery: 0, support: 0 });

      const count = feedbacks.length;
      const averages = {
        teaching: totals.teaching / count,
        punctuality: totals.punctuality / count,
        delivery: totals.delivery / count,
        support: totals.support / count,
        total: (totals.teaching + totals.punctuality + totals.delivery + totals.support) / (4 * count)
      };

      res.status(200).json({ averages, count });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
};

module.exports = lmsController;
