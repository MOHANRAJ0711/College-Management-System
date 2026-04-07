const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const User = require('./models/User');
const Student = require('./models/Student');
const Department = require('./models/Department');

const studentsToCreate = [
  "ARUMUGAM", "GOWTHAM", "HARIHARAN", "JAYAHARI", "KARTHIK", "KEERTHI",
  "LOKESH", "MAHINDRAN", "NAVEEN", "NAVEEN", "PAVITH", "PERIYA KRISHNAN",
  "SABARI", "SAKTHIVEL.", "SARAVANAN", "WILLIAM", "BOOPATHI"
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const department = await Department.findOne({});
    if (!department) {
      console.error('No department found. Please create a department first.');
      process.exit(1);
    }
    console.log(`Using Department: ${department.name} (${department._id})`);

    for (let i = 0; i < studentsToCreate.length; i++) {
        const name = studentsToCreate[i].trim();
        const email = `${name.toLowerCase().replace(/\s+/g, '')}@gmail.com`;
        const password = '1234567890';
        // Need unique roll numbers
        const rollNumber = `24IT${(100 + i).toString()}`; 
        
        try {
            // Check if user exists
            let user = await User.findOne({ email });
            if (!user) {
                user = await User.create({
                    name,
                    email,
                    password,
                    role: 'student'
                });
                console.log(`User created: ${name} (${email})`);
            } else {
                console.log(`User already exists: ${email}`);
            }

            // Check if student exists
            let student = await Student.findOne({ user: user._id });
            if (!student) {
                await Student.create({
                    user: user._id,
                    rollNumber,
                    department: department._id,
                    semester: 1,
                    batch: '2024-2028'
                });
                console.log(`Student record created for ${name} with roll: ${rollNumber}`);
            } else {
                console.log(`Student record already exists for ${name}`);
            }
        } catch (err) {
            console.error(`Error creating student ${name}: ${err.message}`);
        }
    }

    console.log('Seeding completed');
    process.exit(0);
  } catch (err) {
    console.error(`Seeding failed: ${err.message}`);
    process.exit(1);
  }
}

seed();
