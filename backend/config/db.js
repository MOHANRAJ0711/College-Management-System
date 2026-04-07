const mongoose = require('mongoose');

const connectDB = async (retries = 5) => {
  for (let i = 1; i <= retries; i++) {
    try {
      const conn = await mongoose.connect(process.env.MONGODB_URI);
      console.log(`MongoDB Connected: ${conn.connection.host}`);
      return;
    } catch (error) {
      console.error(`MongoDB connection attempt ${i}/${retries} failed: ${error.message}`);
      if (i === retries) {
        console.error('All connection attempts failed. Exiting.');
        process.exit(1);
      }
      const delay = Math.min(5000 * i, 15000);
      console.log(`Retrying in ${delay / 1000}s...`);
      await new Promise((r) => setTimeout(r, delay));
    }
  }
};

module.exports = connectDB;
