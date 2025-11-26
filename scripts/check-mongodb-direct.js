const mongoose = require('mongoose');
const path = require('path');

// Try to load .env from backend directory
try {
  require('dotenv').config({ path: path.join(__dirname, '../dovec-keeper-backend/.env') });
} catch (e) {
  // If dotenv not available, use default
}

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/dovec_keeper';

async function checkMongoDB() {
  console.log('🔍 Checking MongoDB directly...\n');
  console.log(`📡 Connection String: ${MONGO_URI}\n`);

  try {
    // Connect to MongoDB
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get database name from connection
    const dbName = mongoose.connection.db.databaseName;
    console.log(`📊 Database Name: ${dbName}\n`);

    // List all collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('📁 Collections in database:');
    collections.forEach(col => {
      console.log(`   - ${col.name}`);
    });
    console.log('');

    // Check responses collection
    const ResponseModel = mongoose.connection.db.collection('responses');
    const responseCount = await ResponseModel.countDocuments();
    console.log(`📝 Responses Collection:`);
    console.log(`   Total Documents: ${responseCount}\n`);

    if (responseCount > 0) {
      console.log('   Sample documents:');
      const samples = await ResponseModel.find().limit(3).toArray();
      samples.forEach((doc, idx) => {
        console.log(`\n   Document ${idx + 1}:`);
        console.log(`   - _id: ${doc._id}`);
        console.log(`   - employee: ${doc.employee}`);
        console.log(`   - survey: ${doc.survey}`);
        console.log(`   - status: ${doc.status}`);
        console.log(`   - answers count: ${doc.answers?.length || 0}`);
        console.log(`   - submittedAt: ${doc.submittedAt || 'N/A'}`);
      });
    } else {
      console.log('   ⚠️  Collection is EMPTY!');
      console.log('   💡 This explains why Compass shows no data.');
    }

    // Check if there are responses in other collections or databases
    console.log('\n🔍 Checking for responses in other collections...');
    
    // Check users collection
    const usersCount = await mongoose.connection.db.collection('users').countDocuments();
    console.log(`   Users: ${usersCount}`);
    
    // Check surveys collection
    const surveysCount = await mongoose.connection.db.collection('surveys').countDocuments();
    console.log(`   Surveys: ${surveysCount}`);

    // List all databases
    const adminDb = mongoose.connection.db.admin();
    const { databases } = await adminDb.listDatabases();
    console.log('\n🗄️  All databases on this MongoDB instance:');
    databases.forEach(db => {
      console.log(`   - ${db.name} (${(db.sizeOnDisk / 1024 / 1024).toFixed(2)} MB)`);
    });

    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.message.includes('ECONNREFUSED')) {
      console.error('\n⚠️  MongoDB is not running!');
      console.error('   Start MongoDB service or check connection string.');
    }
    process.exit(1);
  }
}

checkMongoDB();

