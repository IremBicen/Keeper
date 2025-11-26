const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';

async function checkData() {
  console.log('🔍 Checking existing data in database...\n');

  try {
    // Login
    console.log('1️⃣ Logging in...');
    const loginRes = await axios.post(`${API_BASE}/auth/login`, {
      email: 'admin@test.com',
      password: 'admin123'
    });
    const token = loginRes.data.token;
    const headers = { Authorization: `Bearer ${token}` };
    console.log('✅ Logged in\n');

    // Check Users
    console.log('2️⃣ Checking Users...');
    try {
      const usersRes = await axios.get(`${API_BASE}/users`, { headers });
      const users = usersRes.data;
      console.log(`   Total Users: ${users.length}`);
      users.forEach(u => {
        console.log(`   - ${u.name} (${u.email}) - Role: ${u.role} - ID: ${u._id}`);
      });
    } catch (err) {
      console.log(`   ❌ Error: ${err.response?.data?.message || err.message}`);
    }
    console.log('');

    // Check Categories
    console.log('3️⃣ Checking Categories...');
    try {
      const catsRes = await axios.get(`${API_BASE}/categories`, { headers });
      const categories = catsRes.data;
      console.log(`   Total Categories: ${categories.length}`);
      categories.forEach(c => {
        console.log(`   - ${c.name} - ID: ${c._id}`);
      });
    } catch (err) {
      console.log(`   ❌ Error: ${err.response?.data?.message || err.message}`);
    }
    console.log('');

    // Check Surveys
    console.log('4️⃣ Checking Surveys...');
    try {
      const surveysRes = await axios.get(`${API_BASE}/surveys`, { headers });
      const surveys = surveysRes.data;
      console.log(`   Total Surveys: ${surveys.length}`);
      surveys.forEach(s => {
        console.log(`   - ${s.title} - ID: ${s._id}`);
        console.log(`     Questions: ${s.questions?.length || 0}`);
        console.log(`     Categories: ${s.categories?.join(', ') || 'None'}`);
      });
    } catch (err) {
      console.log(`   ❌ Error: ${err.response?.data?.message || err.message}`);
    }
    console.log('');

    // Check Responses
    console.log('5️⃣ Checking Responses...');
    try {
      const responsesRes = await axios.get(`${API_BASE}/responses`, { headers });
      const responses = responsesRes.data;
      console.log(`   Total Responses: ${responses.length}`);
      responses.forEach(r => {
        const employeeName = r.employee?.name || r.employee?._id || 'Unknown';
        const surveyTitle = r.survey?.title || r.survey?._id || 'Unknown';
        console.log(`   - Employee: ${employeeName}, Survey: ${surveyTitle}, Status: ${r.status}`);
        console.log(`     ID: ${r._id}, Answers: ${r.answers?.length || 0}`);
      });
    } catch (err) {
      console.log(`   ❌ Error: ${err.response?.data?.message || err.message}`);
    }
    console.log('');

    // Check Results
    console.log('6️⃣ Checking Results...');
    try {
      const resultsRes = await axios.get(`${API_BASE}/results`, { headers });
      const results = resultsRes.data;
      console.log(`   Total Results: ${results.length}`);
      results.forEach(r => {
        console.log(`   - ${r.employeeName} - Keeper Score: ${r.keeperScore?.toFixed(1) || 'N/A'}`);
      });
    } catch (err) {
      console.log(`   ❌ Error: ${err.response?.data?.message || err.message}`);
    }

    console.log('\n✅ Data check complete!');

  } catch (err) {
    console.error('\n❌ Error:', err.response?.data || err.message);
    if (err.code === 'ECONNREFUSED') {
      console.error('\n⚠️  Backend server is not running!');
      console.error('   Please start the backend: cd dovec-keeper-backend && npm run dev');
    }
    process.exit(1);
  }
}

checkData();

