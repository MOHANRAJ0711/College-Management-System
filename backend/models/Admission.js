const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema(
  {
    street: { type: String, trim: true },
    city: { type: String, trim: true },
    state: { type: String, trim: true },
    pincode: { type: String, trim: true },
  },
  { _id: false }
);

const previousEducationSchema = new mongoose.Schema(
  {
    institution: { type: String, trim: true },
    board: { type: String, trim: true },
    percentage: { type: Number, min: 0, max: 100 },
    yearOfPassing: { type: Number },
  },
  { _id: false }
);

const documentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    url: { type: String, required: true, trim: true },
    verified: { type: Boolean, default: false },
  },
  { _id: false }
);

const admissionSchema = new mongoose.Schema(
  {
    applicantName: {
      type: String,
      required: [true, 'Applicant name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    phone: {
      type: String,
      required: [true, 'Phone is required'],
      trim: true,
    },
    dateOfBirth: {
      type: Date,
    },
    gender: {
      type: String,
      enum: {
        values: ['male', 'female', 'other', 'prefer_not_to_say'],
        message: '{VALUE} is not a valid gender',
      },
    },
    fatherName: {
      type: String,
      trim: true,
    },
    motherName: {
      type: String,
      trim: true,
    },
    address: addressSchema,
    previousEducation: previousEducationSchema,
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
    },
    documents: [documentSchema],
    applicationNumber: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },
    status: {
      type: String,
      enum: {
        values: [
          'pending',
          'under_review',
          'approved',
          'rejected',
          'waitlisted',
        ],
        message: '{VALUE} is not a valid application status',
      },
      default: 'pending',
    },
    meritScore: {
      type: Number,
    },
    remarks: {
      type: String,
      trim: true,
    },
    appliedDate: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

admissionSchema.pre('save', async function (next) {
  if (this.applicationNumber) {
    return next();
  }
  try {
    const refDate = this.appliedDate || new Date();
    const year = refDate.getFullYear();
    const startOfYear = new Date(year, 0, 1);
    const endOfYear = new Date(year, 11, 31, 23, 59, 59, 999);
    const count = await this.constructor.countDocuments({
      appliedDate: { $gte: startOfYear, $lte: endOfYear },
    });
    this.applicationNumber = `APP-${year}-${String(count + 1).padStart(4, '0')}`;
    next();
  } catch (err) {
    next(err);
  }
});

module.exports = mongoose.model('Admission', admissionSchema);
