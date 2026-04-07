const Payroll = require('../models/Payroll');
const Faculty = require('../models/Faculty');

const payrollController = {
  // Generate payroll for a month (Admin)
  generatePayroll: async (req, res) => {
    try {
      const { month } = req.body;
      const faculties = await Faculty.find({ isActive: true });
      
      const results = [];
      for (const faculty of faculties) {
        // Simple logic for sample: netPay = basicSalary + allowances - deductions
        // In real world, this would be computed based on attendance/leaves
        const basicSalary = 50000; // Sample basic
        const hra = basicSalary * 0.2;
        const da = basicSalary * 0.1;
        const netPay = basicSalary + hra + da - (basicSalary * 0.1); // 10% PF/Tax

        const payroll = await Payroll.findOneAndUpdate(
          { faculty: faculty._id, month },
          {
            faculty: faculty._id,
            month,
            basicSalary,
            allowances: { hra, da },
            netPay,
            status: 'generated'
          },
          { upsert: true, new: true }
        );
        results.push(payroll);
      }
      res.status(201).json(results);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  },

  // Get all payroll records (Admin)
  getPayrollRecords: async (req, res) => {
    try {
      const records = await Payroll.find()
        .populate({ path: 'faculty', populate: { path: 'user', select: 'name email' } })
        .sort('-month')
        .lean();
      res.status(200).json(records);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },

  // Get my payslips (Faculty)
  getMyPayslips: async (req, res) => {
    try {
      const faculty = await Faculty.findOne({ user: req.user._id });
      if (!faculty) return res.status(404).json({ message: 'Faculty profile not found' });

      const slips = await Payroll.find({ faculty: faculty._id, status: 'paid' }).sort('-month').lean();
      res.status(200).json(slips);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },

  // Update payment status (Admin)
  markAsPaid: async (req, res) => {
    try {
      const { id } = req.params;
      const payroll = await Payroll.findByIdAndUpdate(
        id,
        { status: 'paid', paymentDate: Date.now() },
        { new: true }
      );
      res.status(200).json(payroll);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  }
};

module.exports = payrollController;
