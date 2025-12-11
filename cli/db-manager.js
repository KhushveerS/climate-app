#!/usr/bin/env node

// CLI tool for managing MongoDB data in the Climate App

const { connectDB, clearAllData, countDocuments, closeDB } = require('../utils/db-utils');

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  console.log('Climate App MongoDB Manager');
  console.log('==========================');

  // Connect to database
  const isConnected = await connectDB();
  if (!isConnected) {
    process.exit(1);
  }

  switch (command) {
    case 'clear':
      console.log('Clearing all data...');
      await clearAllData();
      break;
      
    case 'count':
      console.log('Counting documents...');
      await countDocuments();
      break;
      
    case 'status':
      console.log('Database status:');
      await countDocuments();
      break;
      
    default:
      console.log('Available commands:');
      console.log('  clear   - Clear all data from collections');
      console.log('  count   - Count documents in each collection');
      console.log('  status  - Show database status');
      break;
  }

  // Close connection
  await closeDB();
}

main().catch(console.error);