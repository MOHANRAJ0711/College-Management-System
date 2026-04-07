const mongoose = require('mongoose');

const scholarshipSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
    },
    schemeName: {
      type: String,
      required: [true, 'Scheme name is required'],
      trim: true,
    },
    type: {
      type: String,
      enum: ['government', 'institutional', 'private'],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    applicationDate: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ['applied', 'submitted-to-govt', 'approved', 'rejected', 'disbursed'],
      default: 'applied',
    },
    documents: [String], // URLs
    remarks: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model('Scholarship', scholarshipSchema);
