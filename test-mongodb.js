// Test MongoDB connectivity
const mongoose = require('mongoose');
const dbConfig = require('./mongodb-config');

console.log('Testing MongoDB connection...');

mongoose.connect(dbConfig.mongoURI, dbConfig.options)
  .then(() => {
    console.log('✓ MongoDB connected successfully');
    
    // Test creating a sample document
    const testSchema = new mongoose.Schema({
      testField: String,
      createdAt: { type: Date, default: Date.now }
    });
    
    const TestModel = mongoose.model('Test', testSchema);
    
    const testDoc = new TestModel({
      testField: 'Connection test'
    });
    
    return testDoc.save();
  })
  .then((doc) => {
    console.log('✓ Test document created successfully:', doc.testField);
    
    // Clean up - delete the test document
    return doc.remove();
  })
  .then(() => {
    console.log('✓ Test document cleaned up');
    console.log('All tests passed! MongoDB is ready to use.');
    mongoose.connection.close();
  })
  .catch(err => {
    console.error('✗ MongoDB test failed:', err.message);
    mongoose.connection.close();
  });