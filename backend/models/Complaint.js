const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: ['academic', 'infrastructure', 'faculty', 'admin', 'ragging', 'other'],
      default: 'other',
    },
    description: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ['pending', 'in_review', 'resolved', 'rejected'],
      default: 'pending',
    },
    priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
    isAnonymous: { type: Boolean, default: false },
    adminRemarks: { type: String, trim: true },
    resolvedAt: { type: Date },
    attachments: [{ type: String }],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Complaint', complaintSchema);
