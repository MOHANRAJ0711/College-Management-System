const pdfParse = require('pdf-parse');
const XLSX = require('xlsx');
const ResultBatch = require('../models/ResultBatch');
<<<<<<< HEAD
const User = require('../models/User');
const Notification = require('../models/Notification');
=======
>>>>>>> 5bf96afa4b78a77bcb7e78c540f952f867f72d09
const handleError = require('../utils/handleError');

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
<<<<<<< HEAD
      headers = lines[i].split(/\s{2,}|\t+/).map((h) => h.trim());
=======
      headers = lines[i].split(/\s{2,}|\t+/).map((h) => h.trim().toLowerCase());
>>>>>>> 5bf96afa4b78a77bcb7e78c540f952f867f72d09
      break;
    }
  }

  if (headerIdx === -1) {
<<<<<<< HEAD
    // Basic fallback parsing for single results
    for (const line of lines) {
      const match = line.match(
        /(\d{10,}[A-Z]*\d*)\s+([A-Za-z\s.]+?)\s+([\d.]+)\s*(?:\/\s*[\d.]+)?\s*([A-Z+]*)?$/
=======
    for (const line of lines) {
      const match = line.match(
        /(\d{2,}[A-Z]*\d*)\s+([A-Za-z\s.]+?)\s+([\d.]+)\s*(?:\/\s*[\d.]+)?\s*([A-Z+]*)?$/
>>>>>>> 5bf96afa4b78a77bcb7e78c540f952f867f72d09
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
<<<<<<< HEAD
    headers.findIndex((h) => patterns.some((p) => p.test(h.toLowerCase())));

  const rollCol = findCol([/roll/i, /reg/i, /enrol/i, /id/i]);
  const nameCol = findCol([/name/i, /student/i]);
  
  // Find subject columns (e.g., AI3021, GE3751, etc.)
  const subjectCols = [];
  headers.forEach((h, idx) => {
    if (/^[A-Z]{2,}\d{3,}/i.test(h) || /^[A-Z]\/\d{4}/i.test(h)) {
      subjectCols.push({ code: h, index: idx });
    }
  });
=======
    headers.findIndex((h) => patterns.some((p) => p.test(h)));

  const rollCol = findCol([/roll/i, /reg/i, /enrol/i, /id/i]);
  const nameCol = findCol([/name/i, /student/i]);
  const marksCol = findCol([/marks/i, /total/i, /score/i, /obtained/i]);
  const gradeCol = findCol([/grade/i, /gpa/i, /cgpa/i]);
  const cgpaCol = findCol([/cgpa/i, /gpa/i]);
>>>>>>> 5bf96afa4b78a77bcb7e78c540f952f867f72d09

  const dataLines = lines.slice(headerIdx + 1);
  for (const line of dataLines) {
    const parts = line.split(/\s{2,}|\t+/).map((p) => p.trim());
    if (parts.length < 2) continue;

    const roll = rollCol >= 0 ? parts[rollCol] : parts[0];
    const name = nameCol >= 0 ? parts[nameCol] : parts[1];
<<<<<<< HEAD

    if (!roll || !name || roll.length < 5) continue;
    if (/^(total|average|class|subject|page|date|provisional|anna|office|instruction)/i.test(roll)) continue;

    const student = {
      rollNumber: roll,
      name,
      subjects: [],
      status: 'Pass',
    };

    if (subjectCols.length > 0) {
      subjectCols.forEach((col) => {
        const grade = parts[col.index] || 'N/A';
        const isFail = ['U', 'UA', 'W', 'WH', 'F', 'AB'].includes(grade.toUpperCase());
        student.subjects.push({
          code: col.code,
          grade: grade,
          status: isFail ? 'Fail' : 'Pass'
        });
        if (isFail) student.status = 'Fail';
      });
    } else {
      // Fallback to single marks/grade if no subject headers found
      const marksCol = findCol([/marks/i, /total/i, /score/i]);
      const gradeCol = findCol([/grade/i]);
      student.marks = marksCol >= 0 ? parseFloat(parts[marksCol]) : null;
      student.grade = gradeCol >= 0 ? parts[gradeCol] : null;
      if (student.grade === 'F' || student.grade === 'U') student.status = 'Fail';
    }

    students.push(student);
=======
    const rawMarks = marksCol >= 0 ? parts[marksCol] : parts[2];
    const rawGrade = gradeCol >= 0 ? parts[gradeCol] : '';
    const rawCgpa = cgpaCol >= 0 && cgpaCol !== gradeCol ? parts[cgpaCol] : '';

    if (!roll || !name) continue;
    if (/^(total|average|class|subject|page|date)/i.test(roll)) continue;

    const marksNum = parseFloat(String(rawMarks).replace(/[^\d.]/g, ''));

    students.push({
      rollNumber: roll,
      name,
      marks: Number.isFinite(marksNum) ? marksNum : null,
      grade: rawGrade || null,
      cgpa: parseFloat(rawCgpa) || null,
    });
>>>>>>> 5bf96afa4b78a77bcb7e78c540f952f867f72d09
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
<<<<<<< HEAD
  const total = students.length;
  if (total === 0) {
    return {
      totalStudents: 0, passCount: 0, failCount: 0,
      passPercentage: 0, gradeDistribution: {}, subjectStats: []
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

  // Subject-wise stats
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
    passPercentage: Math.round((stat.pass / (stat.pass + stat.fail)) * 10000) / 100
  }));

  return {
    totalStudents: total,
    passCount,
    failCount,
    passPercentage: Math.round((passCount / total) * 10000) / 100,
    gradeDistribution,
    subjectStats
=======
  const withMarks = students.filter((s) => s.marks != null);
  const total = withMarks.length;
  if (total === 0) {
    return {
      totalStudents: students.length, withMarks: 0, average: 0,
      highest: 0, lowest: 0, passCount: 0, failCount: 0,
      passPercentage: 0, gradeDistribution: {},
    };
  }

  const marksList = withMarks.map((s) => s.marks);
  const sum = marksList.reduce((a, b) => a + b, 0);
  const average = sum / total;
  const highest = Math.max(...marksList);
  const lowest = Math.min(...marksList);

  const passThreshold = highest > 10 ? highest * 0.4 : 4.0;
  const passCount = withMarks.filter((s) => s.marks >= passThreshold).length;
  const failCount = total - passCount;

  const gradeDistribution = {};
  students.forEach((s) => {
    const g = s.grade || assignGrade(s.marks, highest);
    gradeDistribution[g] = (gradeDistribution[g] || 0) + 1;
  });

  return {
    totalStudents: students.length, withMarks: total,
    average: Math.round(average * 100) / 100, highest, lowest,
    passCount, failCount,
    passPercentage: Math.round((passCount / total) * 10000) / 100,
    gradeDistribution,
>>>>>>> 5bf96afa4b78a77bcb7e78c540f952f867f72d09
  };
}

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

    const maxMarks = Math.max(...students.filter((s) => s.marks != null).map((s) => s.marks), 100);

    const enriched = students.map((s) => ({
      ...s,
      grade: s.grade || assignGrade(s.marks, maxMarks),
      cgpa: s.cgpa || computeCGPA(s.marks, maxMarks),
      status: s.marks != null && s.marks >= maxMarks * 0.4 ? 'Pass' : 'Fail',
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

const saveResultBatch = async (req, res) => {
  try {
<<<<<<< HEAD
    const { title, description, department, semester, subject, academicYear, students, analysis, fileName, pdfPages, notifyStudents } = req.body;
=======
    const { title, description, department, semester, subject, academicYear, students, analysis, fileName, pdfPages } = req.body;
>>>>>>> 5bf96afa4b78a77bcb7e78c540f952f867f72d09
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

<<<<<<< HEAD
    // Notify Students if requested
    if (notifyStudents) {
      const rollNumbers = students.map(s => s.rollNumber).filter(Boolean);
      // Find users with these roll numbers (assuming rollNumber is username or stored in profile)
      const users = await User.find({ username: { $in: rollNumbers }, role: 'student' });
      
      if (users.length > 0) {
        const notifications = users.map(user => ({
          title: `Result Published: ${title}`,
          message: `Your results for ${title} have been published. Check your dashboard for details.`,
          type: 'exam',
          targetRole: 'student',
          createdBy: req.user._id,
          recipient: user._id // Assuming Notification model can have a specific recipient or we just create general ones
        }));
        
        // Use insertMany for bulk creation
        await Notification.insertMany(notifications);
      }
    }

=======
>>>>>>> 5bf96afa4b78a77bcb7e78c540f952f867f72d09
    const populated = await ResultBatch.findById(batch._id).populate('uploadedBy', 'name email role');
    return res.status(201).json(populated);
  } catch (err) {
    return handleError(res, err, 'Failed to save result batch');
  }
};

const getResultBatches = async (req, res) => {
  try {
    const filter = {};
    if (req.query.uploadedBy) filter.uploadedBy = req.query.uploadedBy;
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

<<<<<<< HEAD
    // Determine subject columns
    const allSubjectCodes = new Set();
    list.forEach(s => {
      if (s.subjects) s.subjects.forEach(sub => allSubjectCodes.add(sub.code));
    });
    const subjectCodes = Array.from(allSubjectCodes).sort();

    const rows = list.map((s, i) => {
      const row = {
        'S.No': i + 1,
        'Roll Number': s.rollNumber || '',
        'Student Name': s.name || '',
      };

      if (subjectCodes.length > 0) {
        subjectCodes.forEach(code => {
          const sub = s.subjects?.find(sub => sub.code === code);
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
    
    // Auto-width for columns
    const cols = [{ wch: 6 }, { wch: 16 }, { wch: 30 }];
    subjectCodes.forEach(() => cols.push({ wch: 12 }));
    cols.push({ wch: 8 }, { wch: 10 });
    ws['!cols'] = cols;

    XLSX.utils.book_append_sheet(wb, ws, filterType === 'arrear' ? 'Arrear Students' : 'Results');

    // Stats sheet
    const statsRows = [
      { Metric: 'Total Students', Value: list.length },
      { Metric: 'Filter', Value: filterType === 'arrear' ? 'Arrear/Fail Only' : filterType === 'pass' ? 'Pass Only' : 'All Students' },
      { Metric: 'Pass Count', Value: list.filter((s) => s.status === 'Pass').length },
      { Metric: 'Fail Count', Value: list.filter((s) => s.status === 'Fail').length },
    ];
    
    const ws2 = XLSX.utils.json_to_sheet(statsRows);
=======
    const rows = list.map((s, i) => ({
      'S.No': i + 1,
      'Roll Number': s.rollNumber || '',
      'Student Name': s.name || '',
      'Marks Obtained': s.marks ?? '',
      'Grade': s.grade || '',
      'CGPA': s.cgpa ?? '',
      'Status': s.status || '',
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(rows);
    ws['!cols'] = [
      { wch: 6 }, { wch: 16 }, { wch: 30 }, { wch: 16 },
      { wch: 8 }, { wch: 8 }, { wch: 8 },
    ];
    XLSX.utils.book_append_sheet(wb, ws, filterType === 'arrear' ? 'Arrear Students' : 'Results');

    const wm = list.filter((s) => s.marks != null);
    const statsRows = [
      { Metric: 'Total Students', Value: list.length },
      { Metric: 'Filter', Value: filterType === 'arrear' ? 'Arrear/Fail Only' : filterType === 'pass' ? 'Pass Only' : 'All Students' },
      { Metric: 'Average Marks', Value: wm.length ? (wm.reduce((a, b) => a + b.marks, 0) / wm.length).toFixed(2) : 'N/A' },
      { Metric: 'Highest Marks', Value: wm.length ? Math.max(...wm.map((s) => s.marks)) : 'N/A' },
      { Metric: 'Lowest Marks', Value: wm.length ? Math.min(...wm.map((s) => s.marks)) : 'N/A' },
      { Metric: 'Pass Count', Value: list.filter((s) => s.status === 'Pass').length },
      { Metric: 'Fail Count', Value: list.filter((s) => s.status === 'Fail').length },
      { Metric: 'Pass Percentage', Value: (() => {
        const total = wm.length;
        const pass = list.filter((s) => s.status === 'Pass').length;
        return total ? ((pass / total) * 100).toFixed(2) + '%' : 'N/A';
      })() },
    ];
    const ws2 = XLSX.utils.json_to_sheet(statsRows);
    ws2['!cols'] = [{ wch: 20 }, { wch: 20 }];
>>>>>>> 5bf96afa4b78a77bcb7e78c540f952f867f72d09
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

module.exports = {
  uploadResultPDF,
  saveResultBatch,
  getResultBatches,
  getResultBatch,
  deleteResultBatch,
  downloadResultExcel,
};
