const pdfParse = require('pdf-parse');
const XLSX = require('xlsx');
const ResultBatch = require('../models/ResultBatch');
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
      headers = lines[i].split(/\s{2,}|\t+/).map((h) => h.trim().toLowerCase());
      break;
    }
  }

  if (headerIdx === -1) {
    for (const line of lines) {
      const match = line.match(
        /(\d{2,}[A-Z]*\d*)\s+([A-Za-z\s.]+?)\s+([\d.]+)\s*(?:\/\s*[\d.]+)?\s*([A-Z+]*)?$/
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
    headers.findIndex((h) => patterns.some((p) => p.test(h)));

  const rollCol = findCol([/roll/i, /reg/i, /enrol/i, /id/i]);
  const nameCol = findCol([/name/i, /student/i]);
  const marksCol = findCol([/marks/i, /total/i, /score/i, /obtained/i]);
  const gradeCol = findCol([/grade/i, /gpa/i, /cgpa/i]);
  const cgpaCol = findCol([/cgpa/i, /gpa/i]);

  const dataLines = lines.slice(headerIdx + 1);
  for (const line of dataLines) {
    const parts = line.split(/\s{2,}|\t+/).map((p) => p.trim());
    if (parts.length < 2) continue;

    const roll = rollCol >= 0 ? parts[rollCol] : parts[0];
    const name = nameCol >= 0 ? parts[nameCol] : parts[1];
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
    const { title, description, department, semester, subject, academicYear, students, analysis, fileName, pdfPages } = req.body;
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
