const mongoose = require('mongoose');

const feeSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: [true, 'Student is required'],
    },
    feeType: {
      type: String,
      enum: {
        values: ['tuition', 'hostel', 'library', 'lab', 'exam', 'other'],
        message: '{VALUE} is not a valid fee type',
      },
      required: [true, 'Fee type is required'],
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0, 'Amount cannot be negative'],
    },
    semester: {
      type: Number,
      min: [1, 'Semester must be between 1 and 8'],
      max: [8, 'Semester must be between 1 and 8'],
    },
    academicYear: {
      type: String,
      trim: true,
    },
    dueDate: {
      type: Date,
    },
    paidDate: {
      type: Date,
    },
    status: {
      type: String,
      enum: {
        values: ['pending', 'paid', 'overdue', 'partial'],
        message: '{VALUE} is not a valid fee status',
      },
      default: 'pending',
    },
    paymentMethod: {
      type: String,
      enum: {
        values: ['online', 'cash', 'cheque', 'upi'],
        message: '{VALUE} is not a valid payment method',
      },
    },
    transactionId: {
      type: String,
      trim: true,
    },
    receiptNumber: {
      type: String,
      trim: true,
    },
    remarks: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Fee', feeSchema);
