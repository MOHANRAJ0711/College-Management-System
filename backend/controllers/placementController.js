const mongoose = require('mongoose');
const Placement = require('../models/Placement');
const Student = require('../models/Student');
const handleError = require('../utils/handleError');

async function getStudentFromUser(userId) {
  return Student.findOne({ user: userId });
}

const placementListPopulate = [
  { path: 'eligibilityCriteria.departments', select: 'name code' },
  { path: 'createdBy', select: 'name email' },
  {
    path: 'applicants.student',
    select: 'rollNumber registrationNumber department course semester user',
    populate: { path: 'user', select: 'name email' },
  },
];

const placementDetailPopulate = [
  { path: 'eligibilityCriteria.departments', select: 'name code' },
  { path: 'createdBy', select: 'name email role' },
  {
    path: 'applicants.student',
    select: 'rollNumber registrationNumber department course semester user',
    populate: { path: 'user', select: 'name email' },
  },
];

/**
 * POST / — Create placement drive (admin)
 */
const createPlacement = async (req, res) => {
  try {
    const payload = { ...req.body, createdBy: req.user._id };
    const doc = await Placement.create(payload);
    const populated = await Placement.findById(doc._id).populate(placementDetailPopulate);
    return res.status(201).json(populated);
  } catch (err) {
    return handleError(res, err, 'Could not create placement drive');
  }
};

/**
 * GET / — List placement drives
 */
const getPlacements = async (req, res) => {
  try {
    const { status, companyName } = req.query;
    const filter = {};

    if (status) {
      const allowed = ['upcoming', 'ongoing', 'completed', 'cancelled'];
      if (!allowed.includes(status)) {
        return res.status(400).json({ message: 'Invalid status filter' });
      }
      filter.status = status;
    }
    if (companyName && String(companyName).trim()) {
      filter.companyName = new RegExp(
        String(companyName).trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
        'i'
      );
    }

    const rows = await Placement.find(filter).populate(placementListPopulate).sort({
      driveDate: -1,
      lastDate: -1,
      createdAt: -1,
    });

    return res.status(200).json(rows);
  } catch (err) {
    return handleError(res, err, 'Could not fetch placements');
  }
};

/**
 * GET /:id — Single placement
 */
const getPlacement = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid placement id' });
    }

    const doc = await Placement.findById(id).populate(placementDetailPopulate);

    if (!doc) {
      return res.status(404).json({ message: 'Placement drive not found' });
    }

    return res.status(200).json(doc);
  } catch (err) {
    return handleError(res, err, 'Could not fetch placement');
  }
};

/**
 * PUT /:id — Update placement (admin)
 */
const updatePlacement = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid placement id' });
    }

    const doc = await Placement.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    }).populate(placementDetailPopulate);

    if (!doc) {
      return res.status(404).json({ message: 'Placement drive not found' });
    }

    return res.status(200).json(doc);
  } catch (err) {
    return handleError(res, err, 'Could not update placement');
  }
};

/**
 * POST /:id/apply — Student applies to a drive
 */
const applyPlacement = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid placement id' });
    }

    const studentDoc = await getStudentFromUser(req.user._id);
    if (!studentDoc) {
      return res.status(404).json({ message: 'Student profile not found' });
    }

    const placement = await Placement.findById(id);
    if (!placement) {
      return res.status(404).json({ message: 'Placement drive not found' });
    }

    if (['completed', 'cancelled'].includes(placement.status)) {
      return res.status(400).json({ message: 'This placement drive is not accepting applications' });
    }

    if (placement.lastDate && new Date() > new Date(placement.lastDate)) {
      return res.status(400).json({ message: 'Application deadline has passed' });
    }

    const ec = placement.eligibilityCriteria;
    if (ec) {
      if (ec.departments && ec.departments.length > 0) {
        if (!studentDoc.department) {
          return res.status(403).json({ message: 'Your profile has no department; cannot verify eligibility' });
        }
        const allowed = ec.departments.some((d) => d.toString() === studentDoc.department.toString());
        if (!allowed) {
          return res.status(403).json({ message: 'Your department is not eligible for this drive' });
        }
      }

      if (ec.minCGPA != null) {
        const cgpa = req.body.cgpa != null ? Number(req.body.cgpa) : null;
        if (cgpa === null || Number.isNaN(cgpa)) {
          return res.status(400).json({ message: 'cgpa is required in the request body for this drive' });
        }
        if (cgpa < ec.minCGPA) {
          return res.status(403).json({ message: `Minimum CGPA required is ${ec.minCGPA}` });
        }
      }

      if (ec.batch && studentDoc.batch) {
        if (String(ec.batch).trim() !== String(studentDoc.batch).trim()) {
          return res.status(403).json({ message: 'Your batch is not eligible for this drive' });
        }
      }
    }

    const already = placement.applicants.some((a) => a.student.toString() === studentDoc._id.toString());
    if (already) {
      return res.status(400).json({ message: 'You have already applied to this drive' });
    }

    placement.applicants.push({ student: studentDoc._id, status: 'applied', appliedDate: new Date() });
    await placement.save();

    const populated = await Placement.findById(placement._id).populate(placementDetailPopulate);

    return res.status(201).json(populated);
  } catch (err) {
    return handleError(res, err, 'Could not submit application');
  }
};

/**
 * PUT /:id/applicant/:studentId — Update applicant status (admin)
 */
const updateApplicantStatus = async (req, res) => {
  try {
    const { id, studentId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(studentId)) {
      return res.status(400).json({ message: 'Invalid placement or student id' });
    }

    const { status } = req.body;
    const allowed = ['applied', 'shortlisted', 'selected', 'rejected'];
    if (!status || !allowed.includes(status)) {
      return res.status(400).json({ message: `status must be one of: ${allowed.join(', ')}` });
    }

    const placement = await Placement.findById(id);
    if (!placement) {
      return res.status(404).json({ message: 'Placement drive not found' });
    }

    const applicant = placement.applicants.find((a) => a.student.toString() === studentId);
    if (!applicant) {
      return res.status(404).json({ message: 'Applicant not found on this drive' });
    }

    applicant.status = status;
    await placement.save();

    const populated = await Placement.findById(id).populate(placementDetailPopulate);

    return res.status(200).json(populated);
  } catch (err) {
    return handleError(res, err, 'Could not update applicant');
  }
};

/**
 * GET /student-applications — Logged-in student's applications
 */
const getStudentApplications = async (req, res) => {
  try {
    const studentDoc = await getStudentFromUser(req.user._id);
    if (!studentDoc) {
      return res.status(404).json({ message: 'Student profile not found' });
    }

    const placements = await Placement.find({ 'applicants.student': studentDoc._id })
      .select(
        'companyName description jobRole package status lastDate driveDate venue applicants eligibilityCriteria createdAt'
      )
      .sort({ createdAt: -1 })
      .lean();

    const out = placements.map((p) => {
      const app = p.applicants.find((a) => a.student.toString() === studentDoc._id.toString());
      return {
        placementId: p._id,
        companyName: p.companyName,
        description: p.description,
        jobRole: p.jobRole,
        package: p.package,
        driveStatus: p.status,
        lastDate: p.lastDate,
        driveDate: p.driveDate,
        venue: p.venue,
        myStatus: app?.status,
        appliedDate: app?.appliedDate,
        createdAt: p.createdAt,
      };
    });

    return res.status(200).json(out);
  } catch (err) {
    return handleError(res, err, 'Could not fetch applications');
  }
};

module.exports = {
  createPlacement,
  getPlacements,
  getPlacement,
  updatePlacement,
  applyPlacement,
  updateApplicantStatus,
  getStudentApplications,
};
