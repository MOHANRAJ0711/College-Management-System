/**
 * Database seed script — run from backend: `node utils/seed.js` or `npm run seed`
 */
const mongoose = require('mongoose');
const readline = require('readline');

const connectDB = require('../config/db');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const User = require('../models/User');
const Student = require('../models/Student');
const Faculty = require('../models/Faculty');
const Department = require('../models/Department');
const Course = require('../models/Course');
const Attendance = require('../models/Attendance');
const Exam = require('../models/Exam');
const Result = require('../models/Result');
const Fee = require('../models/Fee');
const Notification = require('../models/Notification');
const LibraryBook = require('../models/LibraryBook');
const Placement = require('../models/Placement');

function askYesNo(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      const ok = /^y(es)?$/i.test(String(answer).trim());
      resolve(ok);
    });
  });
}

function startOfDay(d) {
  const x = new Date(d);
  x.setUTCHours(0, 0, 0, 0);
  return x;
}

async function seed() {
  console.log('[seed] Connecting to MongoDB…');
  await connectDB();

  const ok = await askYesNo(
    '\n⚠️  This will DROP ALL DATA in the current database and re-seed sample data.\n    Type "yes" to continue, anything else to abort: '
  );
  if (!ok) {
    console.log('[seed] Aborted by user.');
    await mongoose.connection.close();
    process.exit(0);
  }

  console.log('[seed] Dropping database…');
  await mongoose.connection.dropDatabase();

  console.log('[seed] Creating departments…');
  const deptCS = await Department.create({
    name: 'Computer Science',
    code: 'CS',
    description: 'Computer Science and Engineering',
    establishedYear: 1995,
    isActive: true,
  });
  const deptECE = await Department.create({
    name: 'Electronics',
    code: 'ECE',
    description: 'Electronics and Communication Engineering',
    establishedYear: 1998,
    isActive: true,
  });
  const deptIT = await Department.create({
    name: 'Information Technology',
    code: 'IT',
    description: 'Information Technology',
    establishedYear: 2001,
    isActive: true,
  });

  console.log('[seed] Creating courses (2 per department, varied semesters)…');
  const courses = await Course.insertMany([
    {
      name: 'Data Structures',
      code: 'CS101',
      department: deptCS._id,
      semester: 1,
      credits: 4,
      type: 'Theory',
      description: 'Fundamental data structures and algorithms',
      isActive: true,
    },
    {
      name: 'Operating Systems',
      code: 'CS302',
      department: deptCS._id,
      semester: 5,
      credits: 4,
      type: 'Theory',
      description: 'OS concepts, processes, memory, and file systems',
      isActive: true,
    },
    {
      name: 'Digital Circuits',
      code: 'ECE201',
      department: deptECE._id,
      semester: 3,
      credits: 3,
      type: 'Theory',
      description: 'Combinational and sequential logic design',
      isActive: true,
    },
    {
      name: 'VLSI Design',
      code: 'ECE401',
      department: deptECE._id,
      semester: 7,
      credits: 4,
      type: 'Elective',
      description: 'VLSI fundamentals and CAD tools',
      isActive: true,
    },
    {
      name: 'Web Technologies',
      code: 'IT101',
      department: deptIT._id,
      semester: 2,
      credits: 3,
      type: 'Theory',
      description: 'HTML, CSS, JavaScript, and server-side basics',
      isActive: true,
    },
    {
      name: 'Cloud Computing',
      code: 'IT303',
      department: deptIT._id,
      semester: 6,
      credits: 3,
      type: 'Theory',
      description: 'Cloud service models, virtualization, and deployment',
      isActive: true,
    },
  ]);
  const [cCS101, cCS302, cECE201, cECE401, cIT101, cIT303] = courses;

  console.log('[seed] Creating admin user (password hashed via User pre-save hook)…');
  const admin = await User.create({
    name: 'System Administrator',
    email: 'admin@college.edu',
    password: 'admin123',
    role: 'admin',
    isActive: true,
  });

  console.log('[seed] Creating faculty users and profiles…');
  const facUser1 = await User.create({
    name: 'Dr. Alice Kumar',
    email: 'faculty1@college.edu',
    password: 'faculty123',
    role: 'faculty',
    isActive: true,
  });
  const facUser2 = await User.create({
    name: 'Prof. Bob Singh',
    email: 'faculty2@college.edu',
    password: 'faculty123',
    role: 'faculty',
    isActive: true,
  });

  const faculty1 = await Faculty.create({
    user: facUser1._id,
    employeeId: 'FAC001',
    department: deptCS._id,
    designation: 'Associate Professor',
    qualification: 'Ph.D. Computer Science',
    specialization: 'Algorithms and Systems',
    experience: 12,
    phone: '+91-9876500001',
    dateOfJoining: new Date('2015-08-01'),
    subjects: [cCS101._id, cCS302._id, cIT101._id],
  });

  const faculty2 = await Faculty.create({
    user: facUser2._id,
    employeeId: 'FAC002',
    department: deptECE._id,
    designation: 'Assistant Professor',
    qualification: 'M.Tech VLSI',
    specialization: 'Digital and Analog Design',
    experience: 7,
    phone: '+91-9876500002',
    dateOfJoining: new Date('2018-01-15'),
    subjects: [cECE201._id, cECE401._id],
  });

  console.log('[seed] Creating student users and profiles…');
  const stuUser1 = await User.create({
    name: 'Riya Sharma',
    email: 'student1@college.edu',
    password: 'student123',
    role: 'student',
    isActive: true,
  });
  const stuUser2 = await User.create({
    name: 'Arjun Patel',
    email: 'student2@college.edu',
    password: 'student123',
    role: 'student',
    isActive: true,
  });
  const stuUser3 = await User.create({
    name: 'Neha Gupta',
    email: 'student3@college.edu',
    password: 'student123',
    role: 'student',
    isActive: true,
  });

  const student1 = await Student.create({
    user: stuUser1._id,
    rollNumber: 'CS2024001',
    registrationNumber: 'REG2024CS001',
    department: deptCS._id,
    course: cCS302._id,
    semester: 5,
    section: 'A',
    batch: '2024',
    gender: 'female',
    phone: '+91-9000000001',
    admissionDate: new Date('2024-07-15'),
  });

  const student2 = await Student.create({
    user: stuUser2._id,
    rollNumber: 'ECE2024002',
    registrationNumber: 'REG2024ECE002',
    department: deptECE._id,
    course: cECE201._id,
    semester: 3,
    section: 'B',
    batch: '2024',
    gender: 'male',
    phone: '+91-9000000002',
    admissionDate: new Date('2024-07-15'),
  });

  const student3 = await Student.create({
    user: stuUser3._id,
    rollNumber: 'IT2024003',
    registrationNumber: 'REG2024IT003',
    department: deptIT._id,
    course: cIT101._id,
    semester: 2,
    section: 'A',
    batch: '2024',
    gender: 'female',
    phone: '+91-9000000003',
    admissionDate: new Date('2024-07-15'),
  });

  console.log('[seed] Creating notifications…');
  await Notification.insertMany([
    {
      title: 'Welcome to the new academic year',
      message: 'Classes begin next Monday. Check your timetable in the portal.',
      type: 'general',
      targetRole: 'all',
      createdBy: admin._id,
      isActive: true,
    },
    {
      title: 'Mid-term exam schedule published',
      message: 'Internal assessments for odd-semester courses are scheduled for next month.',
      type: 'exam',
      targetRole: 'student',
      department: deptCS._id,
      createdBy: admin._id,
      isActive: true,
    },
    {
      title: 'Fee payment deadline',
      message: 'Last date for semester fee payment without fine is the 30th of this month.',
      type: 'fee',
      targetRole: 'student',
      createdBy: admin._id,
      isActive: true,
    },
    {
      title: 'Research seminar — AI in education',
      message: 'Open to all faculty and final-year students. Auditorium Block A.',
      type: 'event',
      targetRole: 'faculty',
      createdBy: admin._id,
      isActive: true,
    },
    {
      title: 'Campus placement drive',
      message: 'Multiple companies visiting this month. Eligible students must register on the placement portal.',
      type: 'placement',
      targetRole: 'student',
      createdBy: admin._id,
      isActive: true,
    },
  ]);

  console.log('[seed] Creating placement drives…');
  await Placement.insertMany([
    {
      companyName: 'TechNova Solutions',
      description: 'Product and services company hiring full-stack engineers.',
      jobRole: 'Software Engineer Trainee',
      package: '8 LPA',
      eligibilityCriteria: {
        minCGPA: 7.0,
        departments: [deptCS._id, deptIT._id],
        batch: '2024',
      },
      lastDate: new Date('2026-04-15'),
      driveDate: new Date('2026-04-22'),
      venue: 'Main Auditorium',
      status: 'upcoming',
      applicants: [
        { student: student1._id, appliedDate: new Date('2026-03-01'), status: 'applied' },
        { student: student3._id, appliedDate: new Date('2026-03-02'), status: 'shortlisted' },
      ],
      createdBy: admin._id,
    },
    {
      companyName: 'CircuitWorks India',
      description: 'Semiconductor design and verification roles.',
      jobRole: 'Design Engineer',
      package: '10 LPA',
      eligibilityCriteria: {
        minCGPA: 7.5,
        departments: [deptECE._id],
        batch: '2024',
      },
      lastDate: new Date('2026-05-01'),
      driveDate: new Date('2026-05-10'),
      venue: 'ECE Seminar Hall',
      status: 'upcoming',
      applicants: [{ student: student2._id, appliedDate: new Date('2026-03-05'), status: 'applied' }],
      createdBy: admin._id,
    },
  ]);

  console.log('[seed] Creating library books…');
  await LibraryBook.insertMany([
    {
      title: 'Introduction to Algorithms',
      author: 'Cormen, Leiserson, Rivest, Stein',
      isbn: '9780262033848',
      publisher: 'MIT Press',
      edition: '3rd',
      category: 'Computer Science',
      department: deptCS._id,
      totalCopies: 5,
      availableCopies: 4,
      shelfLocation: 'CS-A1',
      isActive: true,
    },
    {
      title: 'Digital Design and Computer Architecture',
      author: 'Harris & Harris',
      isbn: '9780123944244',
      publisher: 'Morgan Kaufmann',
      edition: '2nd',
      category: 'Electronics',
      department: deptECE._id,
      totalCopies: 3,
      availableCopies: 3,
      shelfLocation: 'ECE-B2',
      isActive: true,
    },
    {
      title: 'Modern Web Development',
      author: 'Various',
      isbn: '9781492086921',
      publisher: "O'Reilly",
      edition: '1st',
      category: 'Web',
      department: deptIT._id,
      totalCopies: 4,
      availableCopies: 2,
      shelfLocation: 'IT-C3',
      isActive: true,
    },
    {
      title: 'Operating System Concepts',
      author: 'Silberschatz, Galvin, Gagne',
      isbn: '9781118063330',
      publisher: 'Wiley',
      edition: '10th',
      category: 'Computer Science',
      department: deptCS._id,
      totalCopies: 6,
      availableCopies: 5,
      shelfLocation: 'CS-A2',
      isActive: true,
    },
    {
      title: 'Cloud Computing: Concepts and Practice',
      author: 'Sosinsky',
      isbn: '9780128093515',
      publisher: 'Elsevier',
      edition: '1st',
      category: 'Cloud',
      department: deptIT._id,
      totalCopies: 2,
      availableCopies: 2,
      shelfLocation: 'IT-C1',
      isActive: true,
    },
  ]);

  console.log('[seed] Creating exams…');
  const exam1 = await Exam.create({
    name: 'CS302 Internal Assessment 1',
    type: 'internal',
    course: cCS302._id,
    department: deptCS._id,
    semester: 5,
    date: new Date('2026-04-10'),
    startTime: '10:00',
    endTime: '11:30',
    totalMarks: 50,
    passingMarks: 20,
    room: 'CS-201',
    status: 'scheduled',
  });
  const exam2 = await Exam.create({
    name: 'ECE201 End Semester',
    type: 'semester',
    course: cECE201._id,
    department: deptECE._id,
    semester: 3,
    date: new Date('2026-05-05'),
    startTime: '14:00',
    endTime: '17:00',
    totalMarks: 100,
    passingMarks: 40,
    room: 'ECE-Lab-1',
    status: 'scheduled',
  });
  const exam3 = await Exam.create({
    name: 'IT101 Practical Exam',
    type: 'internal',
    course: cIT101._id,
    department: deptIT._id,
    semester: 2,
    date: new Date('2026-04-20'),
    startTime: '09:00',
    endTime: '12:00',
    totalMarks: 60,
    passingMarks: 24,
    room: 'IT-Lab-2',
    status: 'completed',
  });

  console.log('[seed] Creating attendance records…');
  const d1 = startOfDay('2026-03-01');
  const d2 = startOfDay('2026-03-03');
  const d3 = startOfDay('2026-03-05');
  await Attendance.insertMany([
    {
      student: student1._id,
      course: cCS302._id,
      faculty: faculty1._id,
      date: d1,
      status: 'present',
      semester: 5,
    },
    {
      student: student1._id,
      course: cCS302._id,
      faculty: faculty1._id,
      date: d2,
      status: 'late',
      semester: 5,
    },
    {
      student: student2._id,
      course: cECE201._id,
      faculty: faculty2._id,
      date: d1,
      status: 'present',
      semester: 3,
    },
    {
      student: student2._id,
      course: cECE201._id,
      faculty: faculty2._id,
      date: d3,
      status: 'absent',
      semester: 3,
    },
    {
      student: student3._id,
      course: cIT101._id,
      faculty: faculty1._id,
      date: d1,
      status: 'present',
      semester: 2,
    },
    {
      student: student3._id,
      course: cIT101._id,
      faculty: faculty1._id,
      date: d2,
      status: 'present',
      semester: 2,
    },
    {
      student: student1._id,
      course: cCS302._id,
      faculty: faculty1._id,
      date: d3,
      status: 'absent',
      semester: 5,
    },
  ]);

  console.log('[seed] Creating exam results…');
  await Result.insertMany([
    {
      student: student1._id,
      exam: exam1._id,
      course: cCS302._id,
      marksObtained: 42,
      grade: 'A',
      remarks: 'Good performance',
      publishedBy: faculty1._id,
      isPublished: true,
    },
    {
      student: student2._id,
      exam: exam2._id,
      course: cECE201._id,
      marksObtained: 72,
      grade: 'B+',
      publishedBy: faculty2._id,
      isPublished: true,
    },
    {
      student: student3._id,
      exam: exam3._id,
      course: cIT101._id,
      marksObtained: 52,
      grade: 'A',
      publishedBy: faculty1._id,
      isPublished: true,
    },
  ]);

  console.log('[seed] Creating fee records…');
  await Fee.insertMany([
    {
      student: student1._id,
      feeType: 'tuition',
      amount: 45000,
      semester: 5,
      academicYear: '2025-26',
      dueDate: new Date('2026-03-30'),
      paidDate: new Date('2026-03-10'),
      status: 'paid',
      paymentMethod: 'upi',
      transactionId: 'UPI20260310001',
      receiptNumber: 'RCP-2026-001',
    },
    {
      student: student2._id,
      feeType: 'exam',
      amount: 2500,
      semester: 3,
      academicYear: '2025-26',
      dueDate: new Date('2026-04-01'),
      status: 'pending',
    },
    {
      student: student3._id,
      feeType: 'library',
      amount: 500,
      semester: 2,
      academicYear: '2025-26',
      dueDate: new Date('2026-03-15'),
      paidDate: new Date('2026-03-12'),
      status: 'paid',
      paymentMethod: 'online',
      transactionId: 'PG20260312002',
      receiptNumber: 'RCP-2026-002',
    },
    {
      student: student1._id,
      feeType: 'hostel',
      amount: 18000,
      semester: 5,
      academicYear: '2025-26',
      dueDate: new Date('2026-04-15'),
      status: 'overdue',
    },
    {
      student: student2._id,
      feeType: 'tuition',
      amount: 44000,
      semester: 3,
      academicYear: '2025-26',
      dueDate: new Date('2026-03-30'),
      paidDate: new Date('2026-03-28'),
      status: 'partial',
      paymentMethod: 'cash',
      remarks: 'Balance to be cleared next week',
    },
  ]);

  console.log('\n[seed] ✓ Seeding completed successfully.');
  console.log('    Admin:     admin@college.edu / admin123');
  console.log('    Faculty:   faculty1@college.edu, faculty2@college.edu / faculty123');
  console.log('    Students:  student1..3@college.edu / student123\n');

  await mongoose.connection.close();
  console.log('[seed] Database connection closed.');
  process.exit(0);
}

seed().catch(async (err) => {
  console.error('[seed] Error:', err);
  await mongoose.connection.close().catch(() => {});
  process.exit(1);
});
