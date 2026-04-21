const pdfParse = require('pdf-parse');
const XLSX = require('xlsx');
const ResultBatch = require('../../../models/ResultBatch');
const Notification = require('../../../models/Notification');
const Student = require('../../../models/Student');
const handleError = require('../../../utils/handleError');

/**
 * Parse tabular result text extracted from a PDF.
 * Supports:
 *   - Anna University subject-code header format (AI3021, GE3751…)
 *   - Generic single-marks/grade table
 *   - Regex fallback for simple roll-name-marks lines
 */
function parseResultLines(text) {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  const students = [];
  const headerPatterns = [
    /roll\s*n/i, /reg.*no/i, /student\s*name/i, /s\.?\s*no/i, /sl\.?\s*no/i,
  ];

  let headerIdx = -1;
  let headers = [];

  for (let i = 0; i < lines.length; i++) {
    if (headerPatterns.some((p) => p.test(lines[i]))) {
      headerIdx = i;
      headers = lines[i].split(/\s{2,}|\t+/).map((h) => h.trim());
      break;
    }
  }

  if (headerIdx === -1) {
    // Regex fallback for simple roll-number name marks lines
    for (const line of lines) {
      const match = line.match(
        /(\d{10,}[A-Z]*\d*)\s+([A-Za-z\s.]+?)\s+([\d.]+)\s*(?:\/\s*[\d.]+)?\s*([A-Z+]*)?$/
      );
      if (match) {
        students.push({
          rollNumber: match[1].trim(),
          name: match[2].trim(),
          marks: parseFloat(match[3]),
          grade: match[4]?.trim() || '',
        });
      }
    }
    return students;
  }

  const findCol = (patterns) =>
    headers.findIndex((h) => patterns.some((p) => p.test(h.toLowerCase())));

  const rollCol = findCol([/roll/i, /reg/i, /enrol/i, /id/i]);
  const nameCol = findCol([/name/i, /student/i]);

  // Detect subject-code columns (Anna University format: e.g. AI3021, GE3751)
  const subjectCols = [];
  headers.forEach((h, idx) => {
    if (/^[A-Z]{2,}\d{3,}/i.test(h) || /^[A-Z]\/\d{4}/i.test(h)) {
      subjectCols.push({ code: h, index: idx });
    }
  });

  const dataLines = lines.slice(headerIdx + 1);
  for (const line of dataLines) {
    const parts = line.split(/\s{2,}|\t+/).map((p) => p.trim());
    if (parts.length < 2) continue;

    const roll = rollCol >= 0 ? parts[rollCol] : parts[0];
    const name = nameCol >= 0 ? parts[nameCol] : parts[1];

    if (!roll || !name || roll.length < 5) continue;
    if (/^(total|average|class|subject|page|date|provisional|anna|office|instruction)/i.test(roll)) continue;

    if (subjectCols.length > 0) {
      // Subject-wise grade format (Anna University)
      const student = {
        rollNumber: roll,
        name,
        subjects: [],
        status: 'Pass',
      };
      subjectCols.forEach((col) => {
        const grade = parts[col.index] || 'N/A';
        const isFail = ['U', 'UA', 'W', 'WH', 'F', 'AB'].includes(grade.toUpperCase());
        student.subjects.push({
          code: col.code,
          grade,
          status: isFail ? 'Fail' : 'Pass',
        });
        if (isFail) student.status = 'Fail';
      });
      students.push(student);
    } else {
      // Generic marks/grade format
      const marksCol = findCol([/marks/i, /total/i, /score/i, /obtained/i]);
      const gradeCol = findCol([/grade/i, /gpa/i, /cgpa/i]);
      const cgpaCol = findCol([/cgpa/i, /gpa/i]);

      const rawMarks = marksCol >= 0 ? parts[marksCol] : parts[2];
      const rawGrade = gradeCol >= 0 ? parts[gradeCol] : '';
      const rawCgpa = cgpaCol >= 0 && cgpaCol !== gradeCol ? parts[cgpaCol] : '';

      const marksNum = parseFloat(String(rawMarks || '').replace(/[^\d.]/g, ''));

      students.push({
        rollNumber: roll,
        name,
        marks: Number.isFinite(marksNum) ? marksNum : null,
        grade: rawGrade || null,
        cgpa: parseFloat(rawCgpa) || null,
        status: null, // computed after max marks is known
      });
    }
  }

  return students;
}

function assignGrade(marks, maxMarks) {
  if (marks == null || maxMarks == null || maxMarks === 0) return 'N/A';
  const pct = (marks / maxMarks) * 100;
  if (pct >= 90) return 'O';
  if (pct >= 80) return 'A+';
  if (pct >= 70) return 'A';
  if (pct >= 60) return 'B+';
  if (pct >= 50) return 'B';
  if (pct >= 40) return 'C';
  return 'F';
}

function computeCGPA(marks, maxMarks) {
  if (marks == null || maxMarks == null || maxMarks === 0) return null;
  const pct = (marks / maxMarks) * 100;
  if (pct >= 90) return 10.0;
  if (pct >= 80) return 9.0;
  if (pct >= 70) return 8.0;
  if (pct >= 60) return 7.0;
  if (pct >= 50) return 6.0;
  if (pct >= 40) return 5.0;
  return 0;
}

function computeStats(students) {
  const total = students.length;
  if (total === 0) {
    return {
      totalStudents: 0, passCount: 0, failCount: 0,
      passPercentage: 0, gradeDistribution: {}, subjectStats: [],
    };
  }

  const passCount = students.filter((s) => s.status === 'Pass').length;
  const failCount = total - passCount;

  // Grade distribution
  const gradeDistribution = {};
  students.forEach((s) => {
    if (s.grade) {
      gradeDistribution[s.grade] = (gradeDistribution[s.grade] || 0) + 1;
    } else if (s.subjects) {
      s.subjects.forEach((sub) => {
        gradeDistribution[sub.grade] = (gradeDistribution[sub.grade] || 0) + 1;
      });
    }
  });

  // Subject-wise stats (Anna University format)
  const subjectStatsMap = {};
  students.forEach((s) => {
    if (s.subjects) {
      s.subjects.forEach((sub) => {
        if (!subjectStatsMap[sub.code]) {
          subjectStatsMap[sub.code] = { code: sub.code, pass: 0, fail: 0 };
        }
        if (sub.status === 'Pass') subjectStatsMap[sub.code].pass++;
        else subjectStatsMap[sub.code].fail++;
      });
    }
  });

  const subjectStats = Object.values(subjectStatsMap).map((stat) => ({
    code: stat.code,
    passCount: stat.pass,
    failCount: stat.fail,
    passPercentage: Math.round((stat.pass / (stat.pass + stat.fail)) * 10000) / 100,
  }));

  return {
    totalStudents: total,
    passCount,
    failCount,
    passPercentage: Math.round((passCount / total) * 10000) / 100,
    gradeDistribution,
    subjectStats,
  };
}

/**
 * POST /api/result-upload/pdf — upload and parse a result PDF
 */
const uploadResultPDF = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Please upload a PDF file' });
    }

    const dataBuffer = req.file.buffer;
    const pdfData = await pdfParse(dataBuffer);
    const text = pdfData.text;

    const students = parseResultLines(text);

    if (students.length === 0) {
      return res.status(400).json({
        message: 'Could not extract student results from the PDF. Ensure it has a tabular format with roll numbers, names, and marks.',
        rawTextSample: text.slice(0, 500),
      });
    }

    const maxMarks = Math.max(
      ...students.filter((s) => s.marks != null).map((s) => s.marks),
      100
    );

    const enriched = students.map((s) => ({
      ...s,
      grade: s.grade || assignGrade(s.marks, maxMarks),
      cgpa: s.cgpa || computeCGPA(s.marks, maxMarks),
      status: s.status !== null ? s.status : (s.marks != null && s.marks >= maxMarks * 0.4 ? 'Pass' : 'Fail'),
    }));

    const analysis = computeStats(enriched);

    return res.status(200).json({
      message: 'PDF parsed successfully',
      students: enriched,
      analysis,
      pdfInfo: { pages: pdfData.numpages, extractedStudents: enriched.length },
    });
  } catch (err) {
    return handleError(res, err, 'Failed to parse result PDF');
  }
};

/**
 * POST /api/result-upload/save — save parsed results as a ResultBatch
 */
const saveResultBatch = async (req, res) => {
  try {
    const {
      title, description, department, semester, subject,
      academicYear, students, analysis, fileName, pdfPages, notifyStudents,
    } = req.body;

    if (!title || !Array.isArray(students) || students.length === 0) {
      return res.status(400).json({ message: 'title and students array are required' });
    }

    const batch = await ResultBatch.create({
      title,
      description,
      uploadedBy: req.user._id,
      uploadedByRole: req.user.role,
      department,
      semester,
      subject,
      academicYear,
      fileName,
      students,
      analysis: analysis || computeStats(students),
      pdfPages,
    });

    // Create targeted notifications for students found in the batch
    if (notifyStudents && students.length > 0) {
      const rollNumbers = students.map(s => s.rollNumber).filter(Boolean);
      
      // Find matching student records to get their User IDs
      const matchingStudents = await Student.find({ 
        rollNumber: { $in: rollNumbers } 
      }).select('user rollNumber').lean();

      if (matchingStudents.length > 0) {
        const notificationPromises = matchingStudents.map(async (s) => {
          const studentResult = students.find(rs => rs.rollNumber === s.rollNumber);
          const gpaText = studentResult?.cgpa ? ` (CGPA: ${studentResult.cgpa})` : '';
          
          return Notification.create({
            title: `Your Result Published: ${title}`,
            message: `Your specific results for "${title}" are now available${gpaText}. Click to view details.`,
            type: 'exam',
            targetRole: 'student',
            recipient: s.user, // Target individual student
            createdBy: req.user._id,
            meta: { 
              batchId: batch._id, 
              type: 'result',
              rollNumber: s.rollNumber 
            },
            isActive: true,
          });
        });
        await Promise.all(notificationPromises);
      }

      // Also create a department-wide general notification
      await Notification.create({
        title: `Results Published: ${title}`,
        message: `The full results for "${title}" have been released for the ${department || 'department'}.`,
        type: 'exam',
        targetRole: 'student',
        createdBy: req.user._id,
        department,
        isActive: true,
      });
    }

    const populated = await ResultBatch.findById(batch._id).populate('uploadedBy', 'name email role');
    return res.status(201).json(populated);
  } catch (err) {
    return handleError(res, err, 'Failed to save result batch');
  }
};

/**
 * GET /api/result-upload — list all batches (admin: all, faculty: own)
 */
const getResultBatches = async (req, res) => {
  try {
    const filter = {};
    if (req.query.department) filter.department = req.query.department;
    if (req.user.role === 'faculty') {
      filter.uploadedBy = req.user._id;
    }

    const batches = await ResultBatch.find(filter)
      .populate('uploadedBy', 'name email role')
      .sort({ createdAt: -1 })
      .select('-students');

    return res.status(200).json(batches);
  } catch (err) {
    return handleError(res, err, 'Failed to fetch result batches');
  }
};

/**
 * GET /api/result-upload/:id — single batch with full student list
 */
const getResultBatch = async (req, res) => {
  try {
    const batch = await ResultBatch.findById(req.params.id)
      .populate('uploadedBy', 'name email role');

    if (!batch) {
      return res.status(404).json({ message: 'Result batch not found' });
    }

    if (req.user.role === 'faculty' && String(batch.uploadedBy._id) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Not authorized to view this batch' });
    }

    return res.status(200).json(batch);
  } catch (err) {
    return handleError(res, err, 'Failed to fetch result batch');
  }
};

/**
 * DELETE /api/result-upload/:id — admin or uploader
 */
const deleteResultBatch = async (req, res) => {
  try {
    const batch = await ResultBatch.findById(req.params.id);
    if (!batch) {
      return res.status(404).json({ message: 'Result batch not found' });
    }
    await batch.deleteOne();
    return res.status(200).json({ message: 'Result batch deleted' });
  } catch (err) {
    return handleError(res, err, 'Failed to delete result batch');
  }
};

/**
 * POST /api/result-upload/download-excel — generate Excel report
 */
const downloadResultExcel = async (req, res) => {
  try {
    const { students, filterType } = req.body;
    if (!Array.isArray(students) || students.length === 0) {
      return res.status(400).json({ message: 'No student data provided' });
    }

    let list = students;
    if (filterType === 'arrear') {
      list = students.filter((s) => s.status === 'Fail');
    } else if (filterType === 'pass') {
      list = students.filter((s) => s.status === 'Pass');
    }

    // Detect subject-code columns if present (Anna University format)
    const allSubjectCodes = new Set();
    list.forEach((s) => {
      if (s.subjects) s.subjects.forEach((sub) => allSubjectCodes.add(sub.code));
    });
    const subjectCodes = Array.from(allSubjectCodes).sort();

    const rows = list.map((s, i) => {
      const row = {
        'S.No': i + 1,
        'Roll Number': s.rollNumber || '',
        'Student Name': s.name || '',
      };

      if (subjectCodes.length > 0) {
        subjectCodes.forEach((code) => {
          const sub = s.subjects?.find((sub) => sub.code === code);
          row[code] = sub ? sub.grade : '—';
        });
      } else {
        row['Marks Obtained'] = s.marks ?? '';
        row['Grade'] = s.grade || '';
      }

      row['CGPA'] = s.cgpa ?? '';
      row['Status'] = s.status || '';
      return row;
    });

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(rows);

    const cols = [{ wch: 6 }, { wch: 16 }, { wch: 30 }];
    subjectCodes.forEach(() => cols.push({ wch: 12 }));
    cols.push({ wch: 8 }, { wch: 10 });
    ws['!cols'] = cols;

    XLSX.utils.book_append_sheet(wb, ws, filterType === 'arrear' ? 'Arrear Students' : 'Results');

    // Analysis summary sheet
    const statsRows = [
      { Metric: 'Total Students', Value: list.length },
      { Metric: 'Filter', Value: filterType === 'arrear' ? 'Arrear/Fail Only' : filterType === 'pass' ? 'Pass Only' : 'All Students' },
      { Metric: 'Pass Count', Value: list.filter((s) => s.status === 'Pass').length },
      { Metric: 'Fail Count', Value: list.filter((s) => s.status === 'Fail').length },
    ];
    const ws2 = XLSX.utils.json_to_sheet(statsRows);
    ws2['!cols'] = [{ wch: 20 }, { wch: 20 }];
    XLSX.utils.book_append_sheet(wb, ws2, 'Analysis');

    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    const fname = filterType === 'arrear' ? 'arrear_students.xlsx' : 'result_analysis.xlsx';
    res.setHeader('Content-Disposition', `attachment; filename=${fname}`);
    return res.send(buf);
  } catch (err) {
    return handleError(res, err, 'Failed to generate Excel file');
  }
};

/**
 * GET /api/result-upload/my-results — fetch results for the logged-in student
 */
const getMyResults = async (req, res) => {
  try {
    const student = await Student.findOne({ user: req.user._id }).select('rollNumber');
    if (!student || !student.rollNumber) {
      return res.status(404).json({ message: 'Student profile or roll number not found' });
    }

    // Find all batches where this student's roll number exists
    const batches = await ResultBatch.find({
      'students.rollNumber': student.rollNumber
    }).sort({ createdAt: -1 }).lean();

    // Map batches to extract only the relevant student's result
    const personalResults = batches.map(batch => {
      const myData = batch.students.find(s => s.rollNumber === student.rollNumber);
      return {
        batchId: batch._id,
        title: batch.title,
        description: batch.description,
        subject: batch.subject,
        semester: batch.semester,
        academicYear: batch.academicYear,
        date: batch.createdAt,
        result: myData
      };
    });

    return res.status(200).json(personalResults);
  } catch (err) {
    return handleError(res, err, 'Failed to fetch personal results');
  }
};

module.exports = {
  uploadResultPDF,
  saveResultBatch,
  getResultBatches,
  getResultBatch,
  deleteResultBatch,
  downloadResultExcel,
  getMyResults,
};
