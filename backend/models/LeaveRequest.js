const mongoose = require('mongoose');

const leaveRequestSchema = new mongoose.Schema(
  {
    faculty: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Faculty',
      required: true,
    },
    leaveType: {
      type: String,
      enum: ['sick', 'casual', 'earned', 'maternity', 'paternity', 'other'],
      required: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    reason: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ['pending', 'hod-approved', 'admin-approved', 'rejected'],
      default: 'pending',
    },
    rejectionReason: String,
    attachments: [String], // URLs to docs
  },
  { timestamps: true }
);

module.exports = mongoose.model('LeaveRequest', leaveRequestSchema);
