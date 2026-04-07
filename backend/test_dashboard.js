require('dotenv').config();
const mongoose = require('mongoose');
const { getAdminDashboard } = require('./controllers/dashboardController');

async function test() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  const req = {};
  const res = {
    status: (code) => ({
      json: (data) => {
        console.log('STATUS:', code);
        console.log('DATA:', JSON.stringify(data, null, 2));
      }
    })
  };
  
  await getAdminDashboard(req, res);
  await mongoose.connection.close();
}

test();
