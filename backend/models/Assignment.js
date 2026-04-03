const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
    fileUrl: { type: String },
    fileName: { type: String },
    submittedAt: { type: Date, default: Date.now },
    marks: { type: Number },
    feedback: { type: String },
    status: { type: String, enum: ['submitted', 'late', 'graded'], default: 'submitted' },
  },
  { _id: false }
);

const assignmentSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
    faculty: { type: mongoose.Schema.Types.ObjectId, ref: 'Faculty', required: true },
    department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
    semester: { type: Number },
    section: { type: String },
    dueDate: { type: Date, required: true },
    maxMarks: { type: Number, default: 100 },
    attachmentUrl: { type: String },
    submissions: [submissionSchema],
    status: { type: String, enum: ['active', 'closed'], default: 'active' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Assignment', assignmentSchema);
