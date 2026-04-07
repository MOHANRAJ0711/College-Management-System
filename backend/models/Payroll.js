const mongoose = require('mongoose');

const payrollSchema = new mongoose.Schema(
  {
    faculty: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Faculty',
      required: true,
    },
    month: {
       type: String,
       required: true, // Format: YYYY-MM
    },
    basicSalary: {
        type: Number,
        required: true,
    },
    allowances: {
        hra: { type: Number, default: 0 },
        da: { type: Number, default: 0 },
        ma: { type: Number, default: 0 },
        travel: { type: Number, default: 0 },
    },
    deductions: {
        pf: { type: Number, default: 0 },
        tax: { type: Number, default: 0 },
        leaves: { type: Number, default: 0 }, // Deduction for unpaid leaves
    },
    netPay: {
        type: Number,
        required: true,
    },
    paymentDate: {
        type: Date,
    },
    status: {
        type: String,
        enum: ['draft', 'generated', 'paid'],
        default: 'draft',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Payroll', payrollSchema);
