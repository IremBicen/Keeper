const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';

async function addResponses() {
  console.log('🚀 Starting to add responses...\n');

  try {
    // 1. Login as admin
    console.log('1️⃣ Logging in as admin...');
    const loginRes = await axios.post(`${API_BASE}/auth/login`, {
      email: 'admin@test.com',
      password: 'admin123'
    });
    const token = loginRes.data.token;
    const headers = { Authorization: `Bearer ${token}` };
    console.log('✅ Logged in successfully\n');

    // 2. Get all surveys
    console.log('2️⃣ Fetching surveys...');
    const surveysRes = await axios.get(`${API_BASE}/surveys`, { headers });
    const surveys = surveysRes.data;
    console.log(`   Found ${surveys.length} surveys:`);
    surveys.forEach(s => console.log(`   - ${s.title} (ID: ${s._id})`));
    
    if (surveys.length === 0) {
      console.log('\n❌ No surveys found! Please create surveys first.');
      return;
    }
    console.log('');

    // 3. Get all users (employees)
    console.log('3️⃣ Fetching users...');
    const usersRes = await axios.get(`${API_BASE}/users`, { headers });
    const allUsers = usersRes.data;
    const employees = allUsers.filter(u => u.role === 'employee');
    console.log(`   Found ${employees.length} employees:`);
    employees.forEach(u => console.log(`   - ${u.name} (ID: ${u._id}, Email: ${u.email})`));
    
    if (employees.length === 0) {
      console.log('\n❌ No employees found! Please create employee users first.');
      return;
    }
    console.log('');

    // 4. Check existing responses
    console.log('4️⃣ Checking existing responses...');
    try {
      const existingRes = await axios.get(`${API_BASE}/responses`, { headers });
      console.log(`   Found ${existingRes.data.length} existing responses\n`);
    } catch (err) {
      console.log('   No existing responses found\n');
    }

    // 5. Create responses
    console.log('5️⃣ Creating responses...\n');
    
    const responseData = [
      // Survey 1 responses
      {
        surveyIndex: 0,
        employeeIndex: 0,
        answers: [
          { questionId: "q1", value: 85 },
          { questionId: "q2", value: 4 },
          { questionId: "q3", value: 5 },
          { questionId: "q4", value: 4 },
          { questionId: "q5", value: 4 },
          { questionId: "q6", value: 4 },
          { questionId: "q7", value: 5 },
          { questionId: "q8", value: 4 },
          { questionId: "q9", value: 4 }
        ],
        status: "submitted"
      },
      {
        surveyIndex: 0,
        employeeIndex: 1,
        answers: [
          { questionId: "q1", value: 92 },
          { questionId: "q2", value: 5 },
          { questionId: "q3", value: 4 },
          { questionId: "q4", value: 5 },
          { questionId: "q5", value: 5 },
          { questionId: "q6", value: 5 },
          { questionId: "q7", value: 4 },
          { questionId: "q8", value: 5 },
          { questionId: "q9", value: 5 }
        ],
        status: "submitted"
      },
      {
        surveyIndex: 0,
        employeeIndex: 2,
        answers: [
          { questionId: "q1", value: 78 },
          { questionId: "q2", value: 3 },
          { questionId: "q3", value: 4 },
          { questionId: "q4", value: 3 },
          { questionId: "q5", value: 3 },
          { questionId: "q6", value: 3 },
          { questionId: "q7", value: 4 },
          { questionId: "q8", value: 3 },
          { questionId: "q9", value: 3 }
        ],
        status: "submitted"
      },
      {
        surveyIndex: 0,
        employeeIndex: 3,
        answers: [
          { questionId: "q1", value: 88 },
          { questionId: "q2", value: 4 },
          { questionId: "q3", value: 5 },
          { questionId: "q4", value: 4 },
          { questionId: "q5", value: 4 },
          { questionId: "q6", value: 4 },
          { questionId: "q7", value: 5 },
          { questionId: "q8", value: 4 },
          { questionId: "q9", value: 4 }
        ],
        status: "submitted"
      },
      {
        surveyIndex: 0,
        employeeIndex: 4,
        answers: [
          { questionId: "q1", value: 95 },
          { questionId: "q2", value: 5 },
          { questionId: "q3", value: 5 },
          { questionId: "q4", value: 5 },
          { questionId: "q5", value: 5 },
          { questionId: "q6", value: 5 },
          { questionId: "q7", value: 5 },
          { questionId: "q8", value: 5 },
          { questionId: "q9", value: 5 }
        ],
        status: "submitted"
      },
      // Survey 2 responses (if exists)
      {
        surveyIndex: 1,
        employeeIndex: 0,
        answers: [
          { questionId: "q1", value: 90 },
          { questionId: "q2", value: 4 },
          { questionId: "q3", value: 4 },
          { questionId: "q4", value: 5 },
          { questionId: "q5", value: 4 },
          { questionId: "q6", value: 4 },
          { questionId: "q7", value: 5 },
          { questionId: "q8", value: 4 },
          { questionId: "q9", value: 4 }
        ],
        status: "submitted"
      },
      {
        surveyIndex: 1,
        employeeIndex: 1,
        answers: [
          { questionId: "q1", value: 87 },
          { questionId: "q2", value: 5 },
          { questionId: "q3", value: 5 },
          { questionId: "q4", value: 4 },
          { questionId: "q5", value: 5 },
          { questionId: "q6", value: 5 },
          { questionId: "q7", value: 4 },
          { questionId: "q8", value: 5 },
          { questionId: "q9", value: 5 }
        ],
        status: "submitted"
      }
    ];

    let successCount = 0;
    let errorCount = 0;

    for (const response of responseData) {
      const survey = surveys[response.surveyIndex];
      const employee = employees[response.employeeIndex];

      if (!survey) {
        console.log(`   ⚠️  Skipping: Survey index ${response.surveyIndex} not found`);
        errorCount++;
        continue;
      }

      if (!employee) {
        console.log(`   ⚠️  Skipping: Employee index ${response.employeeIndex} not found`);
        errorCount++;
        continue;
      }

      try {
        const payload = {
          survey: survey._id,
          employee: employee._id,
          answers: response.answers,
          status: response.status
        };

        console.log(`   Creating response for ${employee.name} on ${survey.title}...`);
        const res = await axios.post(`${API_BASE}/responses/submit`, payload, { headers });
        
        if (res.data) {
          console.log(`   ✅ Success! Response ID: ${res.data._id}`);
          successCount++;
        }
      } catch (err) {
        console.log(`   ❌ Error: ${err.response?.data?.message || err.message}`);
        if (err.response?.data) {
          console.log(`      Details:`, JSON.stringify(err.response.data, null, 2));
        }
        errorCount++;
      }
    }

    console.log('\n📊 Summary:');
    console.log(`   ✅ Successfully created: ${successCount} responses`);
    console.log(`   ❌ Errors: ${errorCount}`);
    
    if (successCount > 0) {
      console.log('\n✅ Responses added! Check the Results page to see calculated scores.');
    }

  } catch (err) {
    console.error('\n❌ Fatal Error:', err.response?.data || err.message);
    if (err.response) {
      console.error('Status:', err.response.status);
      console.error('Data:', JSON.stringify(err.response.data, null, 2));
    }
    process.exit(1);
  }
}

// Run the script
addResponses();

