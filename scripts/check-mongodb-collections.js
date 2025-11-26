// Run this from dovec-keeper-backend directory
// Or install mongoose in root: npm install mongoose dotenv

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../dovec-keeper-backend/.env') });

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/dovec_keeper';

async function checkCollections() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    console.log(`   URI: ${MONGO_URI}\n`);
    
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    const db = mongoose.connection.db;
    const dbName = db.databaseName;
    console.log(`📊 Database: ${dbName}\n`);

    // List all collections
    const collections = await db.listCollections().toArray();
    console.log('📁 Collections in database:');
    collections.forEach(col => {
      console.log(`   - ${col.name}`);
    });
    console.log('');

    // Check specifically for responses collection (with different possible names)
    const possibleNames = ['responses', 'Responses', 'response', 'Response'];
    
    for (const name of possibleNames) {
      try {
        const collection = db.collection(name);
        const count = await collection.countDocuments();
        console.log(`📋 Collection "${name}": ${count} documents`);
        
        if (count > 0) {
          console.log(`   ✅ Found data in "${name}"!`);
          const sample = await collection.findOne();
          console.log(`   Sample document:`);
          console.log(`   ${JSON.stringify(sample, null, 2)}`);
        }
      } catch (err) {
        // Collection doesn't exist
      }
    }
    console.log('');

    // Check using the model directly
    console.log('🔍 Checking using Mongoose model...');
    const ResponseModel = mongoose.model('Response', new mongoose.Schema({}, { strict: false }));
    const modelCount = await ResponseModel.countDocuments();
    console.log(`   Model "Response" count: ${modelCount}`);
    
    if (modelCount > 0) {
      const sample = await ResponseModel.findOne();
      console.log(`   Sample from model:`);
      console.log(`   ${JSON.stringify(sample, null, 2)}`);
    }

    // Get the actual collection name Mongoose uses
    const actualCollectionName = ResponseModel.collection.name;
    console.log(`\n💡 Mongoose uses collection name: "${actualCollectionName}"`);
    console.log(`   (Model name "Response" → Collection name "${actualCollectionName}")`);

    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');

  } catch (err) {
    console.error('\n❌ Error:', err.message);
    if (err.code === 'ECONNREFUSED') {
      console.error('\n⚠️  MongoDB is not running!');
      console.error('   Start MongoDB service or check your connection string.');
    }
    process.exit(1);
  }
}

checkCollections();

