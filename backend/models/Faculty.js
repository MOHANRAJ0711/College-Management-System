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

const facultySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
      unique: true,
    },
    employeeId: {
      type: String,
      required: [true, 'Employee ID is required'],
      unique: true,
      trim: true,
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
    },
    designation: {
      type: String,
      enum: {
        values: [
          'Professor',
          'Associate Professor',
          'Assistant Professor',
          'HOD',
          'Lecturer',
        ],
        message: '{VALUE} is not a valid designation',
      },
      trim: true,
    },
    qualification: {
      type: String,
      trim: true,
    },
    specialization: {
      type: String,
      trim: true,
    },
    experience: {
      type: Number,
      min: [0, 'Experience cannot be negative'],
    },
    phone: {
      type: String,
      trim: true,
    },
    address: addressSchema,
    dateOfJoining: {
      type: Date,
    },
    subjects: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Faculty', facultySchema);
