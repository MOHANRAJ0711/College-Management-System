const Payroll = require('../../../models/Payroll');
const Faculty = require('../../../models/Faculty');
const User = require('../../../models/User');

const payrollController = {
  /**
   * Generate payroll for a month (Admin)
   * Body: { month }  e.g. "2026-04"
   * Bug fix: Faculty model has no isActive — must filter via User model.
   */
  generatePayroll: async (req, res) => {
    try {
      const { month } = req.body;
      if (!month) {
        return res.status(400).json({ message: 'month is required (e.g. "2026-04")' });
      }

      // Fix: isActive lives on User, not Faculty
      const activeUserIds = await User.find({ role: 'faculty', isActive: true }).distinct('_id');
      const faculties = await Faculty.find({ user: { $in: activeUserIds } });

      const results = [];
      for (const faculty of faculties) {
        // Payroll computed as: basic + HRA (20%) + DA (10%) - PF deduction (10%)
        const basicSalary = 50000;
        const hra = basicSalary * 0.2;
        const da = basicSalary * 0.1;
        const pf = basicSalary * 0.1;
        const netPay = basicSalary + hra + da - pf;

        const payroll = await Payroll.findOneAndUpdate(
          { faculty: faculty._id, month },
          {
            faculty: faculty._id,
            month,
            basicSalary,
            allowances: { hra, da },
            deductions: { pf },
            netPay,
            status: 'generated',
          },
          { upsert: true, new: true }
        );
        results.push(payroll);
      }
      return res.status(201).json(results);
    } catch (err) {
      return res.status(400).json({ message: err.message });
    }
  },

  /**
   * Get all payroll records (Admin)
   */
  getPayrollRecords: async (req, res) => {
    try {
      const { month, status } = req.query;
      const filter = {};
      if (month) filter.month = month;
      if (status) filter.status = status;

      const records = await Payroll.find(filter)
        .populate({ path: 'faculty', populate: { path: 'user', select: 'name email' } })
        .sort('-month')
        .lean();
      return res.status(200).json(records);
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  },

  /**
   * Get my payslips (Faculty) — shows all statuses (generated + paid)
   */
  getMyPayslips: async (req, res) => {
    try {
      const faculty = await Faculty.findOne({ user: req.user._id });
      if (!faculty) return res.status(404).json({ message: 'Faculty profile not found' });

      const slips = await Payroll.find({ faculty: faculty._id })
        .sort('-month')
        .lean();
      return res.status(200).json(slips);
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  },

  /**
   * Mark payroll as paid (Admin)
   */
  markAsPaid: async (req, res) => {
    try {
      const { id } = req.params;
      const payroll = await Payroll.findById(id);
      if (!payroll) {
        return res.status(404).json({ message: 'Payroll record not found' });
      }

      const updated = await Payroll.findByIdAndUpdate(
        id,
        { status: 'paid', paymentDate: new Date() },
        { new: true }
      ).populate({ path: 'faculty', populate: { path: 'user', select: 'name email' } });

      return res.status(200).json(updated);
    } catch (err) {
      return res.status(400).json({ message: err.message });
    }
  },
};

module.exports = payrollController;
