const mongoose = require('mongoose');

const applicantSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
    },
    appliedDate: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: {
        values: ['applied', 'shortlisted', 'selected', 'rejected'],
        message: '{VALUE} is not a valid applicant status',
      },
      default: 'applied',
    },
  },
  { _id: true }
);

const eligibilityCriteriaSchema = new mongoose.Schema(
  {
    minCGPA: {
      type: Number,
      min: [0, 'minCGPA cannot be negative'],
      max: [10, 'minCGPA cannot exceed 10'],
    },
    departments: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Department',
      },
    ],
    batch: {
      type: String,
      trim: true,
    },
  },
  { _id: false }
);

const placementSchema = new mongoose.Schema(
  {
    companyName: {
      type: String,
      required: [true, 'Company name is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    jobRole: {
      type: String,
      required: [true, 'Job role is required'],
      trim: true,
    },
    package: {
      type: String,
      trim: true,
    },
    eligibilityCriteria: eligibilityCriteriaSchema,
    lastDate: {
      type: Date,
    },
    driveDate: {
      type: Date,
    },
    venue: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: {
        values: ['upcoming', 'ongoing', 'completed', 'cancelled'],
        message: '{VALUE} is not a valid placement status',
      },
      default: 'upcoming',
    },
    applicants: [applicantSchema],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Placement', placementSchema);
