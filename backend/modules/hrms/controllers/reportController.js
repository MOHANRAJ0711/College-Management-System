const mongoose = require('mongoose');
const Student = require('../../../models/Student');
const Attendance = require('../../../models/Attendance');
const Result = require('../../../models/Result');
const Placement = require('../../../models/Placement');
const Department = require('../../../models/Department');
const handleError = require('../../../utils/handleError');

const getFilters = (query) => {
  const { department, semester } = query;
  const filters = {};
  if (department && mongoose.Types.ObjectId.isValid(department)) {
    filters.department = new mongoose.Types.ObjectId(department);
  }
  if (semester) {
    filters.semester = Number(semester);
  }
  return filters;
};

/**
 * GET /api/reports/enrollment
 */
const getEnrollmentReport = async (req, res) => {
  try {
    const { department, semester } = req.query;
    const match = {};
    if (department && mongoose.Types.ObjectId.isValid(department)) {
      match.department = new mongoose.Types.ObjectId(department);
    }
    if (semester) {
      match.semester = Number(semester);
    }

    const stats = await Student.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$department',
          count: { $sum: 1 },
        },
      },
    ]);

    const populated = await Department.populate(stats, { path: '_id', select: 'name code' });
    
    const byDepartment = populated.map(s => ({
      department: s._id,
      count: s.count
    }));

    // For semester breakdown, we only show it if a specific semester isn't selected, 
    // or if we want to show the specific selection.
    const semesterStats = await Student.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$semester',
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } }
    ]);

    const semesters = {};
    semesterStats.forEach(s => {
      if (s._id) semesters[s._id] = s.count;
    });

    return res.status(200).json({
      byDepartment,
      semesters
    });
  } catch (err) {
    return handleError(res, err, 'Could not fetch enrollment report');
  }
};

/**
 * GET /api/reports/attendance
 */
const getAttendanceReport = async (req, res) => {
  try {
    const { department, semester } = req.query;
    const match = {};
    if (semester) match.semester = Number(semester);

    const pipeline = [
      { $match: match }
    ];

    // If department filter is active, we need to filter students first or join them
    if (department && mongoose.Types.ObjectId.isValid(department)) {
      pipeline.push(
        {
          $lookup: {
            from: 'students',
            localField: 'student',
            foreignField: '_id',
            as: 'studentInfo'
          }
        },
        { $unwind: '$studentInfo' },
        { $match: { 'studentInfo.department': new mongoose.Types.ObjectId(department) } }
      );
    }

    pipeline.push(
      {
        $group: {
          _id: '$student',
          total: { $sum: 1 },
          present: {
            $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] }
          }
        }
      },
      {
        $lookup: {
          from: 'students',
          localField: '_id',
          foreignField: '_id',
          as: 'studentInfo'
        }
      },
      { $unwind: '$studentInfo' },
      {
        $group: {
          _id: '$studentInfo.department',
          totalRecords: { $sum: '$total' },
          presentRecords: { $sum: '$present' }
        }
      }
    );

    const stats = await Attendance.aggregate(pipeline);
    const populated = await Department.populate(stats, { path: '_id', select: 'name code' });

    const byDepartment = populated.map(d => ({
      department: d._id,
      percentage: d.totalRecords > 0 ? (d.presentRecords / d.totalRecords) * 100 : 0
    }));

    return res.status(200).json({
      byDepartment
    });
  } catch (err) {
    return handleError(res, err, 'Could not fetch attendance report');
  }
};

/**
 * GET /api/reports/results
 */
const getResultsReport = async (req, res) => {
  try {
    const { department, semester } = req.query;
    const match = {};
    if (semester) match.semester = Number(semester);

    const pipeline = [
      { $match: match }
    ];

    if (department && mongoose.Types.ObjectId.isValid(department)) {
      pipeline.push(
        {
          $lookup: {
            from: 'students',
            localField: 'student',
            foreignField: '_id',
            as: 'studentInfo'
          }
        },
        { $unwind: '$studentInfo' },
        { $match: { 'studentInfo.department': new mongoose.Types.ObjectId(department) } }
      );
    }

    pipeline.push(
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          pass: {
            $sum: { $cond: [{ $gte: ['$marksObtained', 40] }, 1, 0] }
          },
          grades: { $push: '$grade' }
        }
      }
    );

    const stats = await Result.aggregate(pipeline);

    if (!stats.length) {
      return res.status(200).json({ passPercentage: 0, gradeDistribution: {} });
    }

    const { total, pass, grades } = stats[0];
    const gradeDistribution = {};
    grades.forEach(g => {
      if (g) gradeDistribution[g] = (gradeDistribution[g] || 0) + 1;
    });

    return res.status(200).json({
      passPercentage: total > 0 ? (pass / total) * 100 : 0,
      gradeDistribution
    });
  } catch (err) {
    return handleError(res, err, 'Could not fetch results report');
  }
};

/**
 * GET /api/reports/placements
 */
const getPlacementsReport = async (req, res) => {
  try {
    const { department } = req.query;
    const filter = {};
    
    // In placement model, eligibilityCriteria.departments is an array
    if (department && mongoose.Types.ObjectId.isValid(department)) {
      filter['eligibilityCriteria.departments'] = new mongoose.Types.ObjectId(department);
    }

    const drives = await Placement.find(filter).lean();
    
    let totalOffers = 0;
    const byCompany = drives.map(d => {
      const selected = d.applicants?.filter(a => a.status === 'selected').length || 0;
      totalOffers += selected;
      return {
        company: d.companyName,
        offers: selected
      };
    });

    return res.status(200).json({
      totalDrives: drives.length,
      offers: totalOffers,
      byCompany
    });
  } catch (err) {
    return handleError(res, err, 'Could not fetch placements report');
  }
};

module.exports = {
  getEnrollmentReport,
  getAttendanceReport,
  getResultsReport,
  getPlacementsReport
};
