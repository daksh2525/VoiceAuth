const mongoose = require('mongoose');

let isConnected = false;

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/voiceauth';
  
  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });
    isConnected = true;
    console.log(`[Database] MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);
  } catch (error) {
    console.error(`[Database] MongoDB connection error: ${error.message}`);
    console.warn(`[Database] Notice: Ensure MongoDB daemon is running locally (mongod) or configure MONGODB_URI in .env.`);
    isConnected = false;
  }
};

mongoose.connection.on('disconnected', () => {
  console.log('[Database] MongoDB disconnected');
  isConnected = false;
});

mongoose.connection.on('reconnected', () => {
  console.log('[Database] MongoDB reconnected');
  isConnected = true;
});

module.exports = {
  connectDB,
  isDbConnected: () => isConnected || mongoose.connection.readyState === 1
};
