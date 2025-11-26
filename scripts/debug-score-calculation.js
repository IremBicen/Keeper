const axios = require('axios');
const mongoose = require('mongoose');
require('dotenv').config();

const API_BASE = 'http://localhost:5000/api';
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/dovec_keeper';

async function debugScoreCalculation() {
  try {
    // 1. Login
    const loginRes = await axios.post(`${API_BASE}/auth/login`, {
      email: 'admin@test.com',
      password: 'admin123'
    });
    const token = loginRes.data.token;
    const headers = { Authorization: `Bearer ${token}` };
    const adminId = loginRes.data.user.id;

    // 2. Connect to MongoDB directly
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // 3. Get admin's responses
    const ResponseModel = mongoose.model('Response', new mongoose.Schema({}, { strict: false }));
    const responses = await ResponseModel.find({
      employee: adminId,
      status: 'submitted'
    }).populate('employee').populate('survey');

    console.log(`📊 Found ${responses.length} submitted responses for admin\n`);

    responses.forEach((response, idx) => {
      console.log(`\n📝 Response ${idx + 1}:`);
      console.log(`   Survey: ${response.survey?.title || 'Unknown'}`);
      console.log(`   Answers count: ${response.answers?.length || 0}`);
      console.log(`   Answers:`, JSON.stringify(response.answers, null, 2));
      console.log(`   Survey questions count: ${response.survey?.questions?.length || 0}`);
      console.log(`   Survey questions:`, JSON.stringify(response.survey?.questions, null, 2));
      
      // Check if question IDs match answer questionIds
      if (response.answers && response.survey?.questions) {
        console.log(`\n   🔍 Matching check:`);
        response.answers.forEach((answer: any) => {
          const question = response.survey.questions.find((q: any) => 
            q.id === answer.questionId || q._id?.toString() === answer.questionId
          );
          if (question) {
            console.log(`   ✅ Answer "${answer.questionId}" matches question "${question.id || question._id}"`);
            console.log(`      Question text: "${question.text}"`);
            console.log(`      Answer value: ${answer.value}`);
          } else {
            console.log(`   ❌ Answer "${answer.questionId}" has NO matching question!`);
          }
        });
      }
    });

    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  } catch (err) {
    console.error('❌ Error:', err.message);
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
    }
    process.exit(1);
  }
}

debugScoreCalculation();

