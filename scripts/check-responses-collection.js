// Simple script to check responses collection
// Run from dovec-keeper-backend directory: node ../scripts/check-responses-collection.js

const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';

async function checkResponses() {
  try {
    console.log('🔍 Checking Responses Collection via API...\n');

    // Login
    const loginRes = await axios.post(`${API_BASE}/auth/login`, {
      email: 'admin@test.com',
      password: 'admin123'
    });
    const token = loginRes.data.token;
    const headers = { Authorization: `Bearer ${token}` };

    // Get responses
    const responsesRes = await axios.get(`${API_BASE}/responses`, { headers });
    const responses = responsesRes.data;

    console.log(`📊 Total Responses: ${responses.length}\n`);

    if (responses.length === 0) {
      console.log('⚠️  No responses found in database!');
      console.log('   This is why you see empty collection in Compass.');
      console.log('\n💡 To add responses:');
      console.log('   - Submit surveys through the frontend');
      console.log('   - Or run: node scripts/add-responses-only.js');
    } else {
      console.log('✅ Responses found:');
      responses.forEach((r, idx) => {
        const empName = r.employee?.name || r.employee?._id || 'Unknown';
        const surveyTitle = r.survey?.title || r.survey?._id || 'Unknown';
        console.log(`\n   ${idx + 1}. ${empName} → ${surveyTitle}`);
        console.log(`      Status: ${r.status}`);
        console.log(`      Answers: ${r.answers?.length || 0}`);
        console.log(`      ID: ${r._id}`);
      });

      console.log('\n💡 If you see data here but not in Compass:');
      console.log('   1. Check collection name is "responses" (lowercase, plural)');
      console.log('   2. Check database name is "dovec_keeper" (with underscore)');
      console.log('   3. Refresh Compass (click 🔄 button)');
      console.log('   4. Clear any filters in Compass query bar');
    }

  } catch (err) {
    console.error('\n❌ Error:', err.response?.data || err.message);
    if (err.code === 'ECONNREFUSED') {
      console.error('\n⚠️  Backend server is not running!');
      console.error('   Start it: cd dovec-keeper-backend && npm run dev');
    }
    process.exit(1);
  }
}

checkResponses();

