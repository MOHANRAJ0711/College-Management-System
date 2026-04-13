const LeaveRequest = require('../../../models/LeaveRequest');
const Faculty = require('../../../models/Faculty');

const leaveController = {
  /**
   * Apply for leave (Faculty)
   * Body: { leaveType, startDate, endDate, reason, attachments? }
   */
  applyLeave: async (req, res) => {
    try {
      const { leaveType, startDate, endDate, reason } = req.body;
      if (!leaveType || !startDate || !endDate || !reason) {
        return res
          .status(400)
          .json({ message: 'leaveType, startDate, endDate, and reason are required' });
      }

      if (new Date(endDate) < new Date(startDate)) {
        return res.status(400).json({ message: 'endDate cannot be before startDate' });
      }

      const faculty = await Faculty.findOne({ user: req.user._id });
      if (!faculty) return res.status(404).json({ message: 'Faculty profile not found' });

      const leave = await LeaveRequest.create({
        faculty: faculty._id,
        ...req.body,
        status: 'pending',
      });
      return res.status(201).json(leave);
    } catch (err) {
      return res.status(400).json({ message: err.message });
    }
  },

  /**
   * Get my leave history (Faculty)
   */
  getMyLeaves: async (req, res) => {
    try {
      const faculty = await Faculty.findOne({ user: req.user._id });
      if (!faculty) return res.status(404).json({ message: 'Faculty profile not found' });

      const leaves = await LeaveRequest.find({ faculty: faculty._id })
        .sort('-createdAt')
        .lean();
      return res.status(200).json(leaves);
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  },

  /**
   * Get department leaves (HOD only)
   * Fix: filter faculty at query level instead of using populate+match
   * which doesn't filter at DB level and returns null for non-matching docs.
   */
  getDeptLeaves: async (req, res) => {
    try {
      const hod = await Faculty.findOne({ user: req.user._id });
      // Bug fix: Faculty model has no isHOD field; use designation instead
      if (!hod || hod.designation !== 'HOD') {
        return res.status(403).json({ message: 'HOD access required' });
      }

      // Bug fix: filter at DB level — get all faculty IDs in the same department
      const deptFacultyIds = await Faculty.find({ department: hod.department }).distinct('_id');

      const leaves = await LeaveRequest.find({ faculty: { $in: deptFacultyIds } })
        .populate({
          path: 'faculty',
          populate: { path: 'user', select: 'name email' },
        })
        .sort('-createdAt')
        .lean();

      return res.status(200).json(leaves);
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  },

  /**
   * Update leave status (HOD or Admin)
   * Body: { status, rejectionReason? }
   */
  updateStatus: async (req, res) => {
    try {
      const { id } = req.params;
      const { status, rejectionReason } = req.body;

      const validStatuses = ['pending', 'hod-approved', 'admin-approved', 'rejected'];
      if (!status || !validStatuses.includes(status)) {
        return res
          .status(400)
          .json({ message: `status must be one of: ${validStatuses.join(', ')}` });
      }

      const leave = await LeaveRequest.findById(id);
      if (!leave) return res.status(404).json({ message: 'Leave request not found' });

      leave.status = status;
      if (rejectionReason) leave.rejectionReason = rejectionReason;

      await leave.save();
      return res.status(200).json(leave);
    } catch (err) {
      return res.status(400).json({ message: err.message });
    }
  },

  /**
   * Get all leaves (Admin)
   */
  getAllLeaves: async (req, res) => {
    try {
      const leaves = await LeaveRequest.find()
        .populate({ path: 'faculty', populate: { path: 'user', select: 'name email' } })
        .sort('-createdAt')
        .lean();
      return res.status(200).json(leaves);
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  },
};

module.exports = leaveController;
