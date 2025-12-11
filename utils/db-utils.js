// Utility functions for MongoDB data management

const mongoose = require('mongoose');
const dbConfig = require('../mongodb-config');

// Connect to MongoDB
async function connectDB() {
  try {
    await mongoose.connect(dbConfig.mongoURI, dbConfig.options);
    console.log('MongoDB connected successfully');
    return true;
  } catch (error) {
    console.error('MongoDB connection failed:', error.message);
    return false;
  }
}

// Clear all data from collections
async function clearAllData() {
  try {
    const collections = mongoose.connection.collections;
    
    for (const key in collections) {
      const collection = collections[key];
      await collection.deleteMany({});
      console.log(`Cleared collection: ${key}`);
    }
    
    console.log('All data cleared successfully');
    return true;
  } catch (error) {
    console.error('Error clearing data:', error.message);
    return false;
  }
}

// Count documents in each collection
async function countDocuments() {
  try {
    const collections = mongoose.connection.collections;
    const counts = {};
    
    for (const key in collections) {
      const collection = collections[key];
      const count = await collection.countDocuments();
      counts[key] = count;
      console.log(`${key}: ${count} documents`);
    }
    
    return counts;
  } catch (error) {
    console.error('Error counting documents:', error.message);
    return null;
  }
}

// Close database connection
async function closeDB() {
  try {
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  } catch (error) {
    console.error('Error closing connection:', error.message);
  }
}

module.exports = {
  connectDB,
  clearAllData,
  countDocuments,
  closeDB
};