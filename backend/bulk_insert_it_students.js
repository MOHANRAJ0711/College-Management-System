require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Student = require('./models/Student');

const IT_DEPT_ID = '69d8f6ca151ede87b56ad974'; // Information Technology

const studentData = [
  { roll: '623522205001', name: 'ABINAYA C' },
  { roll: '623522205002', name: 'ABINAYA M' },
  { roll: '623522205003', name: 'AGNUS INFANCIA S' },
  { roll: '623522205004', name: 'AJAY KUMAR D' },
  { roll: '623522205005', name: 'ANUSHIYA P' },
  { roll: '623522205006', name: 'ARUMUGAM M' },
  { roll: '623522205007', name: 'BALAJI M' },
  { roll: '623522205008', name: 'DEEPAVARSHINI S' },
  { roll: '623522205009', name: 'DEVA S' },
  { roll: '623522205010', name: 'DHILIP KUMAR A' },
  { roll: '623522205011', name: 'EBINASER D' },
  { roll: '623522205012', name: 'GOKULKRISHNA S' },
  { roll: '623522205013', name: 'GOWTHAM M' },
  { roll: '623522205014', name: 'HARIHARAN S' },
  { roll: '623522205016', name: 'JANANI K' },
  { roll: '623522205017', name: 'JAYAHARI M' },
  { roll: '623522205018', name: 'JAY HIRITHA S' },
  { roll: '623522205019', name: 'KANAGAVALLI P' },
  { roll: '623522205020', name: 'KARMEGAM M' },
  { roll: '623522205021', name: 'KARTHIK D' },
  { roll: '623522205022', name: 'KEERTHY PRIYAN SI' },
  { roll: '623522205023', name: 'KOUSIC S' },
  { roll: '623522205024', name: 'KOWSALYA N' },
  { roll: '623522205025', name: 'LEKHA S' },
  { roll: '623522205026', name: 'LOGESH G' },
  { roll: '623522205027', name: 'LOKESH S' },
  { roll: '623522205028', name: 'MADHUMITHA P' },
  { roll: '623522205029', name: 'MAHENDRA KUMAR R' },
  { roll: '623522205030', name: 'MAHESWARI S' },
  { roll: '623522205031', name: 'MOHANAPRIYA K' },
  { roll: '623522205032', name: 'MOHANRAJ K' },
  { roll: '623522205033', name: 'MUGHIL K' },
  { roll: '623522205034', name: 'MUSHARAF ALI I' },
  { roll: '623522205035', name: 'NAVEEN KUMAR M' },
  { roll: '623522205036', name: 'NAVEENKUMAR B' },
];

async function insertStudents() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    let successCount = 0;
    let failCount = 0;

    for (const student of studentData) {
      try {
        const email = `${student.roll}@college.edu`.toLowerCase();
        
        // Check if user already exists
        let user = await User.findOne({ email });
        if (!user) {
          user = await User.create({
            name: student.name,
            email,
            password: 'student123',
            role: 'student',
            isActive: true
          });
          console.log(`User created: ${student.name}`);
        } else {
          console.log(`User already exists: ${student.name}`);
        }

        // Check if student profile already exists
        const existingStudent = await Student.findOne({ user: user._id });
        if (!existingStudent) {
          await Student.create({
            user: user._id,
            rollNumber: student.roll,
            department: IT_DEPT_ID,
            semester: 1,
            isProfileComplete: false
          });
          console.log(`Student profile created for: ${student.name}`);
        } else {
            console.log(`Student profile already exists for: ${student.name}`);
        }

        successCount++;
      } catch (err) {
        console.error(`Failed to insert student ${student.roll}:`, err.message);
        failCount++;
      }
    }

    console.log('\nInsertion Complete:');
    console.log(`Successfully processed: ${successCount}`);
    console.log(`Failed: ${failCount}`);

    process.exit(0);
  } catch (err) {
    console.error('Fatal Error:', err);
    process.exit(1);
  }
}

insertStudents();
