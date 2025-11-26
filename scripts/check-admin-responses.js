const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';

async function checkAdminResponses() {
  console.log('🔍 Checking Admin Responses and Results...\n');

  try {
    // 1. Login as admin
    console.log('1️⃣ Logging in as admin...');
    const loginRes = await axios.post(`${API_BASE}/auth/login`, {
      email: 'admin@test.com',
      password: 'admin123'
    });
    const token = loginRes.data.token;
    const adminUser = loginRes.data.user;
    const headers = { Authorization: `Bearer ${token}` };
    console.log('✅ Logged in as:', adminUser.name);
    console.log('   Admin ID from login:', adminUser.id);
    console.log('   Admin _id from login:', adminUser._id || 'N/A');
    console.log('');

    // 2. Get all users to find admin
    console.log('2️⃣ Finding admin in users list...');
    const usersRes = await axios.get(`${API_BASE}/users`, { headers });
    const adminFromList = usersRes.data.find(u => u.email === 'admin@test.com');
    if (adminFromList) {
      console.log('✅ Admin found in users list:');
      console.log('   Admin _id from users list:', adminFromList._id);
      console.log('   Admin id from users list:', adminFromList.id || 'N/A');
    } else {
      console.log('❌ Admin not found in users list');
    }
    console.log('');

    // 3. Get all responses
    console.log('3️⃣ Checking all responses...');
    const responsesRes = await axios.get(`${API_BASE}/responses`, { headers });
    const responses = responsesRes.data;
    console.log(`   Total responses: ${responses.length}`);
    
    // Find admin's responses
    const adminResponses = responses.filter(r => {
      const empId = r.employee?._id?.toString() || r.employee?.toString() || r.employee;
      return empId === adminUser.id || 
             empId === adminUser._id ||
             (adminFromList && (empId === adminFromList._id?.toString() || empId === adminFromList.id));
    });
    
    console.log(`   Admin's responses: ${adminResponses.length}`);
    adminResponses.forEach((r, idx) => {
      console.log(`   Response ${idx + 1}:`);
      console.log(`     Employee ID in response: ${r.employee?._id || r.employee}`);
      console.log(`     Survey: ${r.survey?.title || r.survey?._id || 'Unknown'}`);
      console.log(`     Status: ${r.status}`);
      console.log(`     Answers: ${r.answers?.length || 0}`);
    });
    console.log('');

    // 4. Try to get results with different IDs
    console.log('4️⃣ Trying to fetch results...');
    
    if (adminUser.id) {
      try {
        console.log(`   Trying with adminUser.id: ${adminUser.id}`);
        const results1 = await axios.get(`${API_BASE}/results/${adminUser.id}`, { headers });
        console.log('   ✅ Results found with adminUser.id!');
        console.log('   Scores:', {
          keeperScore: results1.data.keeperScore,
          performanceScore: results1.data.performanceScore
        });
      } catch (err) {
        console.log('   ❌ No results with adminUser.id:', err.response?.status, err.response?.data?.message);
      }
    }
    
    if (adminFromList?._id) {
      try {
        console.log(`   Trying with adminFromList._id: ${adminFromList._id}`);
        const results2 = await axios.get(`${API_BASE}/results/${adminFromList._id}`, { headers });
        console.log('   ✅ Results found with adminFromList._id!');
        console.log('   Scores:', {
          keeperScore: results2.data.keeperScore,
          performanceScore: results2.data.performanceScore
        });
      } catch (err) {
        console.log('   ❌ No results with adminFromList._id:', err.response?.status, err.response?.data?.message);
      }
    }
    console.log('');

    // 5. Summary
    console.log('📊 Summary:');
    console.log(`   Admin ID from login: ${adminUser.id}`);
    console.log(`   Admin _id from users list: ${adminFromList?._id || 'N/A'}`);
    console.log(`   Admin responses found: ${adminResponses.length}`);
    console.log(`   Submitted responses: ${adminResponses.filter(r => r.status === 'submitted').length}`);
    
    if (adminResponses.length > 0 && adminResponses.filter(r => r.status === 'submitted').length > 0) {
      const submittedResponses = adminResponses.filter(r => r.status === 'submitted');
      const employeeIdInResponse = submittedResponses[0].employee?._id?.toString() || submittedResponses[0].employee?.toString();
      console.log(`   Employee ID stored in responses: ${employeeIdInResponse}`);
      console.log('');
      console.log('💡 If IDs don\'t match, that\'s the problem!');
      console.log('   The employee ID in responses must match the user ID when querying results.');
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

checkAdminResponses();

