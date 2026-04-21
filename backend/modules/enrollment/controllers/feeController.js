const crypto = require('crypto');
const mongoose = require('mongoose');
const Fee = require('../../../models/Fee');
const Student = require('../../../models/Student');
const handleError = require('../../../utils/handleError');

async function getStudentFromUser(userId) {
  return Student.findOne({ user: userId });
}

function generateReceiptNumber() {
  const ts = Date.now().toString(36).toUpperCase();
  const rnd = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `RCP-${ts}-${rnd}`;
}

const feePopulate = {
  path: 'student',
  select: 'rollNumber registrationNumber department course user',
  populate: { path: 'user', select: 'name email' },
};

const createFee = async (req, res) => {
  try {
    if (req.body.student && !mongoose.Types.ObjectId.isValid(req.body.student)) {
      return res.status(400).json({ message: 'Invalid student id' });
    }
    const fee = await Fee.create(req.body);
    const populated = await Fee.findById(fee._id).populate(feePopulate);
    return res.status(201).json(populated);
  } catch (err) {
    return handleError(res, err, 'Could not create fee record');
  }
};

const getFees = async (req, res) => {
  try {
    const { student, status, feeType, semester, academicYear } = req.query;
    const filter = {};

    if (student) {
      if (!mongoose.Types.ObjectId.isValid(student)) {
        return res.status(400).json({ message: 'Invalid student id' });
      }
      filter.student = student;
    }
    if (status) {
      const allowed = ['pending', 'paid', 'overdue', 'partial'];
      if (!allowed.includes(status)) {
        return res.status(400).json({ message: 'Invalid status' });
      }
      filter.status = status;
    }
    if (feeType) filter.feeType = feeType;
    if (semester !== undefined && semester !== '') {
      const s = Number(semester);
      if (Number.isNaN(s)) return res.status(400).json({ message: 'Invalid semester' });
      filter.semester = s;
    }
    if (academicYear) filter.academicYear = academicYear;

    const fees = await Fee.find(filter).populate(feePopulate).sort({ dueDate: -1, createdAt: -1 });

    return res.status(200).json(fees);
  } catch (err) {
    return handleError(res, err, 'Could not fetch fees');
  }
};

const payFee = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid fee id' });
    }

    const studentDoc = await getStudentFromUser(req.user._id);
    if (!studentDoc) {
      return res.status(404).json({ message: 'Student profile not found' });
    }

    const fee = await Fee.findById(id);
    if (!fee) {
      return res.status(404).json({ message: 'Fee record not found' });
    }

    if (!fee.student.equals(studentDoc._id)) {
      return res.status(403).json({ message: 'Not authorized to pay this fee' });
    }

    const { paymentMethod, transactionId, amount } = req.body;
    const methods = ['online', 'cash', 'cheque', 'upi'];
    if (!paymentMethod || !methods.includes(paymentMethod)) {
      return res.status(400).json({ message: 'Valid paymentMethod is required' });
    }

    const payAmount = amount != null ? Number(amount) : fee.amount;
    if (Number.isNaN(payAmount) || payAmount <= 0) {
      return res.status(400).json({ message: 'Invalid payment amount' });
    }

    let newStatus = 'paid';
    if (payAmount < fee.amount) {
      newStatus = 'partial';
    }

    const receiptNumber = fee.receiptNumber || generateReceiptNumber();

    const updated = await Fee.findByIdAndUpdate(
      id,
      {
        $set: {
          status: newStatus,
          paidDate: new Date(),
          paymentMethod,
          transactionId: transactionId || fee.transactionId,
          receiptNumber,
          remarks: req.body.remarks ?? fee.remarks,
        },
      },
      { new: true, runValidators: true }
    ).populate(feePopulate);

    return res.status(200).json(updated);
  } catch (err) {
    return handleError(res, err, 'Could not process payment');
  }
};

const getStudentFees = async (req, res) => {
  try {
    const studentDoc = await getStudentFromUser(req.user._id);
    if (!studentDoc) {
      return res.status(404).json({ message: 'Student profile not found' });
    }

    const fees = await Fee.find({ student: studentDoc._id }).sort({ dueDate: -1, createdAt: -1 });

    return res.status(200).json(fees);
  } catch (err) {
    return handleError(res, err, 'Could not fetch your fees');
  }
};

const getPaymentHistory = async (req, res) => {
  try {
    const studentDoc = await getStudentFromUser(req.user._id);
    if (!studentDoc) {
      return res.status(404).json({ message: 'Student profile not found' });
    }

    const history = await Fee.find({
      student: studentDoc._id,
      status: { $in: ['paid', 'partial'] },
    })
      .sort({ paidDate: -1 })
      .select('feeType amount paidDate receiptNumber paymentMethod transactionId status semester academicYear');

    return res.status(200).json(history);
  } catch (err) {
    return handleError(res, err, 'Could not fetch payment history');
  }
};

const getFeeReport = async (req, res) => {
  try {
    const { academicYear } = req.query;
    const match = {};
    if (academicYear) match.academicYear = academicYear;

    const [totals] = await Fee.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          totalBilled: { $sum: '$amount' },
          count: { $sum: 1 },
          paidSum: {
            $sum: {
              $cond: [{ $eq: ['$status', 'paid'] }, '$amount', 0],
            },
          },
          partialSum: {
            $sum: {
              $cond: [{ $eq: ['$status', 'partial'] }, '$amount', 0],
            },
          },
        },
      },
    ]);

    const byType = await Fee.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$feeType',
          totalAmount: { $sum: '$amount' },
          paidCount: {
            $sum: { $cond: [{ $eq: ['$status', 'paid'] }, 1, 0] },
          },
          pendingCount: {
            $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] },
          },
        },
      },
    ]);

    const pendingAmountAgg = await Fee.aggregate([
      { $match: { ...match, status: { $in: ['pending', 'overdue'] } } },
      { $group: { _id: null, pendingAmount: { $sum: '$amount' } } },
    ]);

    const collected = (totals?.paidSum ?? 0) + (totals?.partialSum ?? 0);
    const due = totals?.totalBilled ?? 0;
    const pending = pendingAmountAgg[0]?.pendingAmount ?? 0;

    return res.status(200).json({
      collected,
      due,
      pending,
      summary: totals || {
        totalBilled: 0,
        count: 0,
        paidSum: 0,
        partialSum: 0,
      },
      pendingAmount: pending,
      byFeeType: byType,
    });
  } catch (err) {
    return handleError(res, err, 'Could not build fee report');
  }
};

module.exports = {
  createFee,
  getFees,
  payFee,
  getStudentFees,
  getPaymentHistory,
  getFeeReport,
};
