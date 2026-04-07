const mongoose = require('mongoose');
require('./models/Department'); // Register department
const User = require('./models/User');
const Faculty = require('./models/Faculty');
require('dotenv').config();

async function check() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to DB');

    // Find Rupa
    const rupaUser = await User.findOne({ name: 'Rupa' });
    if (!rupaUser) {
      console.log('Rupa not found');
      return;
    }
    console.log('Rupa User ID:', rupaUser._id);

    const rupaFaculty = await Faculty.findOne({ user: rupaUser._id }).populate('department');
    if (!rupaFaculty) {
      console.log('Rupa Faculty record not found');
      return;
    }
    
    if (!rupaFaculty.department) {
      console.log('Rupa has NO department assigned!');
    } else {
      console.log('Rupa Department:', rupaFaculty.department.name, 'ID:', rupaFaculty.department._id);
      
      // Find all faculty in this department
      const allInDept = await Faculty.find({ department: rupaFaculty.department._id }).populate('user');
      console.log(`\nFound ${allInDept.length} faculty in ${rupaFaculty.department.name}:`);
      allInDept.forEach(f => {
        console.log(`- ${f.user?.name} (${f.designation}) [ID: ${f._id}]`);
      });
    }

    // Find all faculty with NO department
    const noDept = await Faculty.find({ department: { $exists: false } }).populate('user');
    console.log(`\nFaculty with NO department: ${noDept.length}`);
    noDept.forEach(f => {
      console.log(`- ${f.user?.name} [ID: ${f._id}]`);
    });

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await mongoose.disconnect();
  }
}

check();
