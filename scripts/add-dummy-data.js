const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';

const dummyData = {
  users: [
    {
      name: "John Doe",
      email: "john.doe@company.com",
      password: "password123",
      role: "employee"
    },
    {
      name: "Jane Smith",
      email: "jane.smith@company.com",
      password: "password123",
      role: "employee"
    },
    {
      name: "Mike Johnson",
      email: "mike.johnson@company.com",
      password: "password123",
      role: "employee"
    },
    {
      name: "Sarah Williams",
      email: "sarah.williams@company.com",
      password: "password123",
      role: "employee"
    },
    {
      name: "David Brown",
      email: "david.brown@company.com",
      password: "password123",
      role: "employee"
    }
  ],
  categories: [
    { name: "Performance", parent: null },
    { name: "Teamwork", parent: null },
    { name: "Leadership", parent: null },
    { name: "Communication", parent: null },
    { name: "Innovation", parent: null }
  ],
  surveys: [
    {
      title: "Q4 2024 Performance Review",
      categories: ["Performance", "Teamwork", "Leadership"],
      startDate: "2024-10-01",
      endDate: "2024-12-31",
      status: "active",
      questions: [
        { id: "q1", text: "KPI Achievement Rate", type: "kpi", options: [] },
        { id: "q2", text: "Potential for Growth", type: "scale", options: ["1", "2", "3", "4", "5"] },
        { id: "q3", text: "Culture Harmony", type: "scale", options: ["1", "2", "3", "4", "5"] },
        { id: "q4", text: "Team Effect", type: "scale", options: ["1", "2", "3", "4", "5"] },
        { id: "q5", text: "Executive Observation", type: "scale", options: ["1", "2", "3", "4", "5"] },
        { id: "q6", text: "Performance Score", type: "scale", options: ["1", "2", "3", "4", "5"] },
        { id: "q7", text: "Contribution Score", type: "scale", options: ["1", "2", "3", "4", "5"] },
        { id: "q8", text: "Potential Score", type: "scale", options: ["1", "2", "3", "4", "5"] },
        { id: "q9", text: "Keeper Score", type: "scale", options: ["1", "2", "3", "4", "5"] }
      ]
    },
    {
      title: "Annual Review 2024",
      categories: ["Performance", "Communication", "Innovation"],
      startDate: "2024-01-01",
      endDate: "2024-12-31",
      status: "active",
      questions: [
        { id: "q1", text: "KPI Achievement Rate", type: "kpi", options: [] },
        { id: "q2", text: "Potential for Growth", type: "scale", options: ["1", "2", "3", "4", "5"] },
        { id: "q3", text: "Culture Harmony", type: "scale", options: ["1", "2", "3", "4", "5"] },
        { id: "q4", text: "Team Effect", type: "scale", options: ["1", "2", "3", "4", "5"] },
        { id: "q5", text: "Executive Observation", type: "scale", options: ["1", "2", "3", "4", "5"] },
        { id: "q6", text: "Performance Score", type: "scale", options: ["1", "2", "3", "4", "5"] },
        { id: "q7", text: "Contribution Score", type: "scale", options: ["1", "2", "3", "4", "5"] },
        { id: "q8", text: "Potential Score", type: "scale", options: ["1", "2", "3", "4", "5"] },
        { id: "q9", text: "Keeper Score", type: "scale", options: ["1", "2", "3", "4", "5"] }
      ]
    }
  ],
  responses: [
    {
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
    {
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
  ]
};

async function addDummyData() {
  console.log('🚀 Starting to add dummy data...\n');

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

    // 2. Create users
    console.log('2️⃣ Creating users...');
    const createdUsers = [];
    for (const user of dummyData.users) {
      try {
        const res = await axios.post(`${API_BASE}/auth/register`, user);
        createdUsers.push(res.data.user);
        console.log(`   ✅ Created user: ${user.email}`);
      } catch (err) {
        if (err.response?.status === 400 && err.response?.data?.message?.includes('exists')) {
          console.log(`   ⚠️  User ${user.email} already exists, skipping...`);
          // Try to get existing user
          const usersRes = await axios.get(`${API_BASE}/users`, { headers });
          const existingUser = usersRes.data.find(u => u.email === user.email);
          if (existingUser) createdUsers.push(existingUser);
        } else {
          console.log(`   ❌ Error creating user ${user.email}: ${err.response?.data?.message || err.message}`);
        }
      }
    }
    console.log(`   ✅ Created/found ${createdUsers.length} users\n`);

    // 3. Create categories
    console.log('3️⃣ Creating categories...');
    const createdCategories = [];
    for (const category of dummyData.categories) {
      try {
        const res = await axios.post(`${API_BASE}/categories`, category, { headers });
        createdCategories.push(res.data);
        console.log(`   ✅ Created category: ${category.name}`);
      } catch (err) {
        if (err.response?.status === 400 || err.response?.status === 409) {
          console.log(`   ⚠️  Category ${category.name} might already exist, skipping...`);
          // Try to get existing category
          const catsRes = await axios.get(`${API_BASE}/categories`, { headers });
          const existingCat = catsRes.data.find(c => c.name === category.name);
          if (existingCat) createdCategories.push(existingCat);
        } else {
          console.log(`   ❌ Error creating category ${category.name}: ${err.response?.data?.message || err.message}`);
        }
      }
    }
    console.log(`   ✅ Created/found ${createdCategories.length} categories\n`);

    // 4. Get admin user for survey creation
    const usersRes = await axios.get(`${API_BASE}/users`, { headers });
    const allUsers = usersRes.data;
    const adminUser = allUsers.find(u => u.role === 'admin');
    if (!adminUser) {
      throw new Error('Admin user not found. Please create an admin user first.');
    }

    // 5. Create surveys
    console.log('4️⃣ Creating surveys...');
    const createdSurveys = [];
    for (const survey of dummyData.surveys) {
      try {
        const surveyData = {
          ...survey,
          createdBy: adminUser._id
        };
        const res = await axios.post(`${API_BASE}/surveys`, surveyData, { headers });
        createdSurveys.push(res.data);
        console.log(`   ✅ Created survey: ${survey.title}`);
      } catch (err) {
        console.log(`   ❌ Error creating survey ${survey.title}: ${err.response?.data?.message || err.message}`);
      }
    }
    console.log(`   ✅ Created ${createdSurveys.length} surveys\n`);

    // 6. Get all users (including employees)
    const allUsersList = await axios.get(`${API_BASE}/users`, { headers });
    const employees = allUsersList.data.filter(u => u.role === 'employee');

    // 7. Create responses
    console.log('5️⃣ Creating responses...');
    let responseCount = 0;
    
    // First 5 responses for first survey
    for (let i = 0; i < 5 && i < employees.length && i < dummyData.responses.length; i++) {
      if (createdSurveys[0] && employees[i]) {
        try {
          const responseData = {
            survey: createdSurveys[0]._id,
            employee: employees[i]._id,
            answers: dummyData.responses[i].answers,
            status: dummyData.responses[i].status
          };
          await axios.post(`${API_BASE}/responses/submit`, responseData, { headers });
          responseCount++;
          console.log(`   ✅ Created response for ${employees[i].name} (Survey 1)`);
        } catch (err) {
          console.log(`   ❌ Error creating response for ${employees[i].name}: ${err.response?.data?.message || err.message}`);
        }
      }
    }

    // Next 2 responses for second survey
    if (createdSurveys[1]) {
      for (let i = 5; i < 7 && i < dummyData.responses.length && employees[i - 5]; i++) {
        try {
          const responseData = {
            survey: createdSurveys[1]._id,
            employee: employees[i - 5]._id,
            answers: dummyData.responses[i].answers,
            status: dummyData.responses[i].status
          };
          await axios.post(`${API_BASE}/responses/submit`, responseData, { headers });
          responseCount++;
          console.log(`   ✅ Created response for ${employees[i - 5].name} (Survey 2)`);
        } catch (err) {
          console.log(`   ❌ Error creating response: ${err.response?.data?.message || err.message}`);
        }
      }
    }

    console.log(`   ✅ Created ${responseCount} responses\n`);

    console.log('🎉 Dummy data added successfully!');
    console.log('\n📊 Summary:');
    console.log(`   - Users: ${createdUsers.length}`);
    console.log(`   - Categories: ${createdCategories.length}`);
    console.log(`   - Surveys: ${createdSurveys.length}`);
    console.log(`   - Responses: ${responseCount}`);
    console.log('\n✅ You can now check the Results page to see calculated scores!');

  } catch (err) {
    console.error('❌ Error:', err.response?.data || err.message);
    process.exit(1);
  }
}

// Run the script
addDummyData();

