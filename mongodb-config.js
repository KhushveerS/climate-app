// MongoDB Configuration File
// This file contains the configuration for connecting to MongoDB

module.exports = {
  // MongoDB connection URI
  // Format: mongodb://[username:password@]host1[:port1][,...hostN[:portN]][/[database][?options]]
  mongoURI: process.env.MONGODB_URI || 'mongodb://localhost:27017/climateApp',
  
  // Database options
  options: {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    // Retry connection attempts
    retryWrites: true,
    // Connection timeout in milliseconds
    serverSelectionTimeoutMS: 5000,
    // Socket timeout in milliseconds
    socketTimeoutMS: 45000,
  },
  
  // Collections
  collections: {
    locations: 'locations',
    weatherData: 'weatherdata'
  }
};