const LeaveRequest = require('../models/LeaveRequest');
const Faculty = require('../models/Faculty');

const leaveController = {
  // Apply for leave (Faculty)
  applyLeave: async (req, res) => {
    try {
      const faculty = await Faculty.findOne({ user: req.user._id });
      if (!faculty) return res.status(404).json({ message: 'Faculty profile not found' });

      const leave = await LeaveRequest.create({
        faculty: faculty._id,
        ...req.body,
        status: 'pending',
      });
      res.status(201).json(leave);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  },

  // Get my leave history (Faculty)
  getMyLeaves: async (req, res) => {
    try {
      const faculty = await Faculty.findOne({ user: req.user._id });
      if (!faculty) return res.status(404).json({ message: 'Faculty profile not found' });

      const leaves = await LeaveRequest.find({ faculty: faculty._id }).sort('-createdAt').lean();
      res.status(200).json(leaves);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },

  // Get department leaves (HOD)
  getDeptLeaves: async (req, res) => {
    try {
      const hod = await Faculty.findOne({ user: req.user._id });
      if (!hod || !hod.isHOD) return res.status(403).json({ message: 'HOD access required' });

      const leaves = await LeaveRequest.find()
        .populate({
          path: 'faculty',
          match: { department: hod.department },
          populate: { path: 'user', select: 'name email' }
        })
        .sort('-createdAt')
        .lean();
      
      // Filter out null faculty (those not in the same department)
      const filtered = leaves.filter(l => l.faculty !== null);
      res.status(200).json(filtered);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },

  // Update status (HOD or Admin)
  updateStatus: async (req, res) => {
    try {
      const { id } = req.params;
      const { status, rejectionReason } = req.body;
      
      const leave = await LeaveRequest.findById(id);
      if (!leave) return res.status(404).json({ message: 'Leave request not found' });

      leave.status = status;
      if (rejectionReason) leave.rejectionReason = rejectionReason;
      
      await leave.save();
      res.status(200).json(leave);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  },

  // Get all leaves (Admin)
  getAllLeaves: async (req, res) => {
    try {
      const leaves = await LeaveRequest.find()
        .populate({ path: 'faculty', populate: { path: 'user', select: 'name email' } })
        .sort('-createdAt')
        .lean();
      res.status(200).json(leaves);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },
};

module.exports = leaveController;
