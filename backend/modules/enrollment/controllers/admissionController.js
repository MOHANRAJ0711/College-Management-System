const mongoose = require('mongoose');
const Admission = require('../../../models/Admission');
const handleError = require('../../../utils/handleError');

const admissionPopulate = [
  { path: 'department', select: 'name code' },
  { path: 'course', select: 'name code semester' },
];

const applyAdmission = async (req, res) => {
  try {
    const admission = await Admission.create(req.body);
    const created = await Admission.findById(admission._id).populate(admissionPopulate);

    return res.status(201).json(created);
  } catch (err) {
    return handleError(res, err, 'Could not submit application');
  }
};

const getApplications = async (req, res) => {
  try {
    const { status, department } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (department) {
      if (!mongoose.Types.ObjectId.isValid(department)) {
        return res.status(400).json({ message: 'Invalid department id' });
      }
      filter.department = department;
    }

    const apps = await Admission.find(filter).populate(admissionPopulate).sort({ appliedDate: -1 });

    return res.status(200).json(apps);
  } catch (err) {
    return handleError(res, err, 'Could not fetch applications');
  }
};

const getApplication = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid application id' });
    }

    const app = await Admission.findById(id).populate(admissionPopulate);

    if (!app) {
      return res.status(404).json({ message: 'Application not found' });
    }

    return res.status(200).json(app);
  } catch (err) {
    return handleError(res, err, 'Could not fetch application');
  }
};

const updateApplicationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid application id' });
    }

    const { status, remarks, meritScore } = req.body;
    const allowed = ['pending', 'under_review', 'approved', 'rejected', 'waitlisted'];
    if (status && !allowed.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const update = {};
    if (status) update.status = status;
    if (remarks !== undefined) update.remarks = remarks;
    if (meritScore !== undefined) update.meritScore = meritScore;

    const app = await Admission.findByIdAndUpdate(id, { $set: update }, { new: true, runValidators: true }).populate(
      admissionPopulate
    );

    if (!app) {
      return res.status(404).json({ message: 'Application not found' });
    }

    return res.status(200).json(app);
  } catch (err) {
    return handleError(res, err, 'Could not update application');
  }
};

const getApplicationStatus = async (req, res) => {
  try {
    const { applicationNumber } = req.params;
    if (!applicationNumber) {
      return res.status(400).json({ message: 'Application number is required' });
    }

    const app = await Admission.findOne({ applicationNumber: applicationNumber.trim() })
      .populate('department', 'name code')
      .populate('course', 'name code')
      .select('applicationNumber applicantName status appliedDate remarks meritScore department course');

    if (!app) {
      return res.status(404).json({ message: 'Application not found' });
    }

    return res.status(200).json(app);
  } catch (err) {
    return handleError(res, err, 'Could not fetch application status');
  }
};

const generateMeritList = async (req, res) => {
  try {
    const { departmentId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(departmentId)) {
      return res.status(400).json({ message: 'Invalid department id' });
    }

    const list = await Admission.find({
      department: departmentId,
      meritScore: { $exists: true, $ne: null },
    })
      .sort({ meritScore: -1 })
      .populate('course', 'name code')
      .select('applicantName email applicationNumber meritScore status course appliedDate');

    return res.status(200).json({
      departmentId,
      count: list.length,
      meritList: list.map((a, index) => ({
        rank: index + 1,
        ...a.toObject(),
      })),
    });
  } catch (err) {
    return handleError(res, err, 'Could not generate merit list');
  }
};

module.exports = {
  applyAdmission,
  getApplications,
  getApplication,
  updateApplicationStatus,
  getApplicationStatus,
  generateMeritList,
};
