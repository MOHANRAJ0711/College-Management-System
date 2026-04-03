const mongoose = require('mongoose');

const certificateSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: [true, 'Student is required'],
    },
    type: {
      type: String,
      enum: {
        values: [
          'degree',
          'provisional',
          'migration',
          'character',
          'bonafide',
        ],
        message: '{VALUE} is not a valid certificate type',
      },
      required: [true, 'Certificate type is required'],
    },
    certificateNumber: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },
    issueDate: {
      type: Date,
      default: Date.now,
    },
    data: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    generatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    status: {
      type: String,
      enum: {
        values: ['generated', 'verified', 'issued'],
        message: '{VALUE} is not a valid certificate status',
      },
      default: 'generated',
    },
    pdfUrl: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Certificate', certificateSchema);
