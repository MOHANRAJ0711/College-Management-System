const mongoose = require('mongoose');
const Result = require('../models/Result');
<<<<<<< HEAD
const ResultBatch = require('../models/ResultBatch');
=======
>>>>>>> 5bf96afa4b78a77bcb7e78c540f952f867f72d09
const Exam = require('../models/Exam');
const Student = require('../models/Student');
const Faculty = require('../models/Faculty');
const handleError = require('../utils/handleError');

function computeGrade(marksObtained, totalMarks, passingMarks) {
  if (totalMarks <= 0) return 'F';
  const pct = (marksObtained / totalMarks) * 100;
  if (passingMarks != null && marksObtained < passingMarks) return 'F';
  if (pct >= 90) return 'O';
  if (pct >= 80) return 'A+';
  if (pct >= 70) return 'A';
  if (pct >= 60) return 'B+';
  if (pct >= 50) return 'B';
  if (pct >= 40) return 'C';
  return 'D';
}

async function getStudentFromUser(userId) {
  return Student.findOne({ user: userId });
}

async function getFacultyFromUser(userId) {
  return Faculty.findOne({ user: userId });
}

const resultPopulate = [
  {
    path: 'student',
    select: 'rollNumber registrationNumber department user',
    populate: { path: 'user', select: 'name email' },
  },
  { path: 'exam', select: 'name type date totalMarks passingMarks' },
  { path: 'course', select: 'name code' },
  { path: 'publishedBy', select: 'employeeId designation' },
];

/**
 * Body: { exam, entries: [{ student, marksObtained }], remarks? }
 */
const enterMarks = async (req, res) => {
  try {
    const { exam: examId, entries } = req.body;
    if (!examId || !Array.isArray(entries) || entries.length === 0) {
      return res.status(400).json({
        message: 'exam and entries (array of { student, marksObtained }) are required',
      });
    }
    if (!mongoose.Types.ObjectId.isValid(examId)) {
      return res.status(400).json({ message: 'Invalid exam id' });
    }

    const exam = await Exam.findById(examId);
    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }

    const faculty = await getFacultyFromUser(req.user._id);
    if (!faculty) {
      return res.status(400).json({ message: 'Faculty profile not found' });
    }

    const courseId = exam.course;
    const totalMarks = exam.totalMarks;
    const passingMarks = exam.passingMarks ?? Math.ceil(totalMarks * 0.4);

    const saved = [];
    for (const row of entries) {
      if (!row.student || row.marksObtained === undefined) {
        return res.status(400).json({ message: 'Each entry needs student and marksObtained' });
      }
      if (!mongoose.Types.ObjectId.isValid(row.student)) {
        return res.status(400).json({ message: 'Invalid student id' });
      }
      const mo = Number(row.marksObtained);
      if (Number.isNaN(mo) || mo < 0 || mo > totalMarks) {
        return res.status(400).json({
          message: `marksObtained must be between 0 and ${totalMarks}`,
        });
      }

      const grade = computeGrade(mo, totalMarks, passingMarks);

      const result = await Result.findOneAndUpdate(
        { student: row.student, exam: examId },
        {
          $set: {
            course: courseId,
            marksObtained: mo,
            grade,
            remarks: row.remarks ?? req.body.remarks,
            publishedBy: faculty._id,
          },
        },
        { new: true, upsert: true, runValidators: true }
      ).populate(resultPopulate);

      saved.push(result);
    }

    return res.status(201).json({ count: saved.length, results: saved });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: 'Duplicate result for student and exam' });
    }
    return handleError(res, err, 'Could not save marks');
  }
};

const getResults = async (req, res) => {
  try {
    const { student, exam, course } = req.query;
    const filter = {};

    if (student) {
      if (!mongoose.Types.ObjectId.isValid(student)) {
        return res.status(400).json({ message: 'Invalid student id' });
      }
      filter.student = student;
    }
    if (exam) {
      if (!mongoose.Types.ObjectId.isValid(exam)) {
        return res.status(400).json({ message: 'Invalid exam id' });
      }
      filter.exam = exam;
    }
    if (course) {
      if (!mongoose.Types.ObjectId.isValid(course)) {
        return res.status(400).json({ message: 'Invalid course id' });
      }
      filter.course = course;
    }

    const results = await Result.find(filter).populate(resultPopulate).sort({ createdAt: -1 });

    return res.status(200).json(results);
  } catch (err) {
    return handleError(res, err, 'Could not fetch results');
  }
};

/** Logged-in student: published results only */
const getStudentResults = async (req, res) => {
  try {
    const studentDoc = await getStudentFromUser(req.user._id);
    if (!studentDoc) {
      return res.status(404).json({ message: 'Student profile not found' });
    }

<<<<<<< HEAD
    // 1. Fetch individual exam results
    const examResults = await Result.find({ student: studentDoc._id, isPublished: true })
=======
    const results = await Result.find({ student: studentDoc._id, isPublished: true })
>>>>>>> 5bf96afa4b78a77bcb7e78c540f952f867f72d09
      .populate([
        { path: 'exam', select: 'name type date totalMarks passingMarks' },
        { path: 'course', select: 'name code' },
        { path: 'publishedBy', select: 'employeeId designation' },
      ])
      .sort({ createdAt: -1 });

<<<<<<< HEAD
    // 2. Fetch results from parsed batches (using roll number)
    const rollNumber = studentDoc.rollNumber;
    const batchResults = await ResultBatch.find({
      'students.rollNumber': rollNumber
    }).populate('uploadedBy', 'name role');

    // Filter students array in each batch to keep only this student's data
    const filteredBatches = batchResults.map(batch => {
      const studentData = batch.students.find(s => s.rollNumber === rollNumber);
      return {
        _id: batch._id,
        title: batch.title,
        department: batch.department,
        semester: batch.semester,
        academicYear: batch.academicYear,
        type: 'batch',
        studentData,
        analysis: batch.analysis,
        createdAt: batch.createdAt
      };
    });

    return res.status(200).json({
      examResults,
      batchResults: filteredBatches
    });
=======
    return res.status(200).json(results);
>>>>>>> 5bf96afa4b78a77bcb7e78c540f952f867f72d09
  } catch (err) {
    return handleError(res, err, 'Could not fetch your results');
  }
};

const publishResults = async (req, res) => {
  try {
    const { examId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(examId)) {
      return res.status(400).json({ message: 'Invalid exam id' });
    }

    const exam = await Exam.findById(examId);
    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }

    let publishedBy = null;
    if (req.user.role === 'faculty') {
      const faculty = await getFacultyFromUser(req.user._id);
      if (!faculty) {
        return res.status(400).json({ message: 'Faculty profile not found' });
      }
      publishedBy = faculty._id;
    }

    const update = { isPublished: true };
    if (publishedBy) {
      update.publishedBy = publishedBy;
    }

    const result = await Result.updateMany({ exam: examId }, { $set: update });

    return res.status(200).json({
      message: 'Results published',
      examId,
      modifiedCount: result.modifiedCount,
    });
  } catch (err) {
    return handleError(res, err, 'Could not publish results');
  }
};

const getResultAnalysis = async (req, res) => {
  try {
    const { examId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(examId)) {
      return res.status(400).json({ message: 'Invalid exam id' });
    }

    const exam = await Exam.findById(examId).populate('course', 'name code');
    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }

    const totalMarks = exam.totalMarks;
    const passingMarks = exam.passingMarks ?? Math.ceil(totalMarks * 0.4);

    const results = await Result.find({ exam: examId }).populate({
      path: 'student',
      select: 'rollNumber user',
      populate: { path: 'user', select: 'name email' },
    });

    if (results.length === 0) {
      return res.status(200).json({
        exam,
        totalStudents: 0,
        passCount: 0,
        failCount: 0,
        passPercentage: 0,
        averageMarks: 0,
        highestMarks: null,
        toppers: [],
      });
    }

    const marksList = results.map((r) => r.marksObtained);
    const sum = marksList.reduce((a, b) => a + b, 0);
    const averageMarks = sum / results.length;

    let passCount = 0;
    for (const r of results) {
      if (r.marksObtained >= passingMarks) passCount += 1;
    }
    const failCount = results.length - passCount;
    const passPercentage = (passCount / results.length) * 100;

    const sorted = [...results].sort((a, b) => b.marksObtained - a.marksObtained);
    const highestMarks = sorted[0].marksObtained;
    const toppers = sorted
      .filter((r) => r.marksObtained === highestMarks)
      .slice(0, 5)
      .map((r) => ({
        student: r.student,
        marksObtained: r.marksObtained,
        grade: r.grade,
      }));

    return res.status(200).json({
      exam,
      totalMarks,
      passingMarks,
      totalStudents: results.length,
      passCount,
      failCount,
      passPercentage: Math.round(passPercentage * 100) / 100,
      averageMarks: Math.round(averageMarks * 100) / 100,
      highestMarks,
      toppers,
    });
  } catch (err) {
    return handleError(res, err, 'Could not compute result analysis');
  }
};

module.exports = {
  enterMarks,
  getResults,
  getStudentResults,
  publishResults,
  getResultAnalysis,
};
