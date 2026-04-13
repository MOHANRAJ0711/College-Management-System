const Scholarship = require('../../../models/Scholarship');
const Event = require('../../../models/Event');
const Student = require('../../../models/Student');
const Faculty = require('../../../models/Faculty');

const lifecycleController = {
  // --- Scholarship Management ---
  applyScholarship: async (req, res) => {
    try {
      const student = await Student.findOne({ user: req.user._id });
      if (!student) return res.status(404).json({ message: 'Student profile not found' });

      // Check for duplicate application for the same scheme
      const existing = await Scholarship.findOne({ student: student._id, schemeName: req.body.schemeName });
      if (existing) return res.status(400).json({ message: 'Already applied for this scheme' });

      const scholarship = await Scholarship.create({
        student: student._id,
        ...req.body,
        status: 'applied',
      });
      res.status(201).json(scholarship);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  },

  getScholarships: async (req, res) => {
    try {
      const { status } = req.query;
      const filter = status ? { status } : {};
      const scholarships = await Scholarship.find(filter)
        .populate('student', 'user rollNumber')
        .sort('-createdAt')
        .lean();
      res.status(200).json(scholarships);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },

  updateScholarshipStatus: async (req, res) => {
    try {
      const { id } = req.params;
      const { status, remarks } = req.body;
      const scholarship = await Scholarship.findByIdAndUpdate(
        id,
        { status, remarks },
        { new: true }
      );
      res.status(200).json(scholarship);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  },

  // --- Event Management ---
  bookEvent: async (req, res) => {
    try {
      const user = req.user;
      let organizerId, organizerModel;

      if (user.role === 'faculty') {
        const fac = await Faculty.findOne({ user: user._id });
        organizerId = fac._id;
        organizerModel = 'Faculty';
      } else {
        const std = await Student.findOne({ user: user._id });
        organizerId = std._id;
        organizerModel = 'Student';
      }

      const event = await Event.create({
        organizer: organizerId,
        organizerModel,
        ...req.body,
        status: 'pending',
      });
      res.status(201).json(event);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  },

  getEvents: async (req, res) => {
    try {
      const events = await Event.find()
        .populate('organizer', 'user')
        .sort('startDate')
        .lean();
      res.status(200).json(events);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },

  updateEventStatus: async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const event = await Event.findByIdAndUpdate(
        id,
        { status },
        { new: true }
      );
      res.status(200).json(event);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  }
};

module.exports = lifecycleController;
