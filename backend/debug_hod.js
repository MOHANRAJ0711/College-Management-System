require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Faculty = require('./models/Faculty');
const Department = require('./models/Department');

async function debug() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  // 1. Find user "Rupa"
  const user = await User.findOne({ name: 'Rupa' });
  if (!user) {
    console.log('User Rupa not found');
    return;
  }
  console.log('User Rupa:', { _id: user._id, role: user.role });

  // 2. Find faculty record for Rupa
  const faculty = await Faculty.findOne({ user: user._id });
  if (!faculty) {
    console.log('Faculty record for Rupa not found');
  } else {
    console.log('Faculty Rupa:', { _id: faculty._id, department: faculty.department });
  }

  // 3. List departments and their HODs
  const depts = await Department.find({});
  console.log('Departments:');
  depts.forEach(d => {
    console.log(`- ${d.name} (${d._id}): HOD=${d.hod}`);
  });

  await mongoose.connection.close();
}

debug();
