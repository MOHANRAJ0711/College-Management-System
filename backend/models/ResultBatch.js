const mongoose = require('mongoose');

<<<<<<< HEAD
const studentSubjectSchema = new mongoose.Schema({
  code: { type: String, required: true },
  name: { type: String },
  grade: { type: String },
  marks: { type: Number, default: null },
  status: { type: String, enum: ['Pass', 'Fail', 'N/A'], default: 'N/A' },
}, { _id: false });

const studentResultSchema = new mongoose.Schema({
  rollNumber: { type: String },
  name: { type: String },
  marks: { type: Number, default: null }, // for single-subject files
  grade: { type: String },
  cgpa: { type: Number, default: null },
  status: { type: String, enum: ['Pass', 'Fail', 'N/A'], default: 'N/A' },
  subjects: [studentSubjectSchema], // for multi-subject files
=======
const studentResultSchema = new mongoose.Schema({
  rollNumber: { type: String },
  name: { type: String },
  marks: { type: Number, default: null },
  grade: { type: String },
  cgpa: { type: Number, default: null },
  status: { type: String, enum: ['Pass', 'Fail', 'N/A'], default: 'N/A' },
>>>>>>> 5bf96afa4b78a77bcb7e78c540f952f867f72d09
}, { _id: false });

const resultBatchSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    uploadedByRole: { type: String, enum: ['admin', 'faculty'] },
    department: { type: String },
    semester: { type: String },
    subject: { type: String },
    academicYear: { type: String },
    fileName: { type: String },
    students: [studentResultSchema],
    analysis: {
      totalStudents: { type: Number, default: 0 },
      withMarks: { type: Number, default: 0 },
      average: { type: Number, default: 0 },
      highest: { type: Number, default: 0 },
      lowest: { type: Number, default: 0 },
      passCount: { type: Number, default: 0 },
      failCount: { type: Number, default: 0 },
      passPercentage: { type: Number, default: 0 },
      gradeDistribution: { type: mongoose.Schema.Types.Mixed, default: {} },
<<<<<<< HEAD
      subjectStats: [{
        code: String,
        passPercentage: Number,
        passCount: Number,
        failCount: Number,
      }],
=======
>>>>>>> 5bf96afa4b78a77bcb7e78c540f952f867f72d09
    },
    pdfPages: { type: Number },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ResultBatch', resultBatchSchema);
