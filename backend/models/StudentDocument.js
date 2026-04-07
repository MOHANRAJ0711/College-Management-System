const mongoose = require('mongoose');

const studentDocumentSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ['assignment', 'certificate', 'project', 'report', 'id_proof', 'other'],
      default: 'other',
    },
    fileUrl: { type: String, required: true },
    fileName: { type: String, required: true },
    fileSize: { type: Number },
    mimeType: { type: String },
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
    description: { type: String, trim: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('StudentDocument', studentDocumentSchema);
