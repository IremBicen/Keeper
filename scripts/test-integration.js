/**
 * Quick Integration Test Script
 * 
 * This script tests basic API connectivity and endpoints.
 * Run with: node test-integration.js
 * 
 * Prerequisites:
 * - Backend must be running on http://localhost:5000
 * - MongoDB must be connected
 * - Admin user must exist (email: admin@test.com, password: admin123)
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';
let authToken = '';

// Test colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

// Test functions
async function testLogin() {
  logInfo('Testing login...');
  try {
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'admin@test.com',
      password: 'admin123'
    });
    
    if (response.data.token) {
      authToken = response.data.token;
      logSuccess('Login successful');
      return true;
    }
  } catch (error) {
    logError(`Login failed: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

async function testCategories() {
  logInfo('Testing Categories endpoints...');
  try {
    // GET categories
    const getRes = await axios.get(`${BASE_URL}/categories`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    logSuccess(`GET /categories - Found ${getRes.data.length} categories`);

    // POST category
    const postRes = await axios.post(`${BASE_URL}/categories`, {
      name: `Test Category ${Date.now()}`
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    logSuccess(`POST /categories - Created category: ${postRes.data.name}`);
    const categoryId = postRes.data._id;

    // PUT category
    const putRes = await axios.put(`${BASE_URL}/categories/${categoryId}`, {
      name: `Updated Test Category ${Date.now()}`
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    logSuccess(`PUT /categories/:id - Updated category`);

    // DELETE category
    await axios.delete(`${BASE_URL}/categories/${categoryId}`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    logSuccess(`DELETE /categories/:id - Deleted category`);

    return true;
  } catch (error) {
    logError(`Categories test failed: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

async function testSubcategories() {
  logInfo('Testing Subcategories endpoints...');
  try {
    // First, create a category to use
    const categoryRes = await axios.post(`${BASE_URL}/categories`, {
      name: `Test Category for Subcategory ${Date.now()}`
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    const categoryId = categoryRes.data._id;

    // GET subcategories
    const getRes = await axios.get(`${BASE_URL}/subcategories`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    logSuccess(`GET /subcategories - Found ${getRes.data.length} subcategories`);

    // POST subcategory
    const postRes = await axios.post(`${BASE_URL}/subcategories`, {
      name: `Test Subcategory ${Date.now()}`,
      minRating: 1,
      maxRating: 5,
      category: categoryId
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    logSuccess(`POST /subcategories - Created subcategory: ${postRes.data.name}`);
    const subcategoryId = postRes.data._id;

    // PUT subcategory
    const putRes = await axios.put(`${BASE_URL}/subcategories/${subcategoryId}`, {
      name: `Updated Test Subcategory ${Date.now()}`,
      minRating: 2,
      maxRating: 10
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    logSuccess(`PUT /subcategories/:id - Updated subcategory`);

    // DELETE subcategory
    await axios.delete(`${BASE_URL}/subcategories/${subcategoryId}`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    logSuccess(`DELETE /subcategories/:id - Deleted subcategory`);

    // Clean up category
    await axios.delete(`${BASE_URL}/categories/${categoryId}`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    return true;
  } catch (error) {
    logError(`Subcategories test failed: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

async function testSurveys() {
  logInfo('Testing Surveys endpoints...');
  try {
    // GET surveys
    const getRes = await axios.get(`${BASE_URL}/surveys`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    logSuccess(`GET /surveys - Found ${getRes.data.length} surveys`);

    // POST survey
    const postRes = await axios.post(`${BASE_URL}/surveys`, {
      title: `Test Survey ${Date.now()}`,
      categories: [],
      status: 'draft',
      questions: [
        { id: 'q1', text: 'Test Question 1', type: 'scale' },
        { id: 'q2', text: 'Test Question 2', type: 'kpi' }
      ]
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    logSuccess(`POST /surveys - Created survey: ${postRes.data.title}`);
    const surveyId = postRes.data._id;

    // GET single survey
    const getSingleRes = await axios.get(`${BASE_URL}/surveys/${surveyId}`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    logSuccess(`GET /surveys/:id - Retrieved survey`);

    // PUT survey
    const putRes = await axios.put(`${BASE_URL}/surveys/${surveyId}`, {
      title: `Updated Test Survey ${Date.now()}`,
      status: 'active'
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    logSuccess(`PUT /surveys/:id - Updated survey`);

    // DELETE survey
    await axios.delete(`${BASE_URL}/surveys/${surveyId}`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    logSuccess(`DELETE /surveys/:id - Deleted survey`);

    return true;
  } catch (error) {
    logError(`Surveys test failed: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

async function testUsers() {
  logInfo('Testing Users endpoints...');
  try {
    // GET users
    const getRes = await axios.get(`${BASE_URL}/users`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    logSuccess(`GET /users - Found ${getRes.data.length} users`);

    if (getRes.data.length > 0) {
      const userId = getRes.data[0]._id;
      // GET single user
      const getSingleRes = await axios.get(`${BASE_URL}/users/${userId}`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      logSuccess(`GET /users/:id - Retrieved user: ${getSingleRes.data.name}`);
    }

    return true;
  } catch (error) {
    logError(`Users test failed: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

async function testResponses() {
  logInfo('Testing Responses endpoints...');
  try {
    // GET responses
    const getRes = await axios.get(`${BASE_URL}/responses`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    logSuccess(`GET /responses - Found ${getRes.data.length} responses`);

    return true;
  } catch (error) {
    logError(`Responses test failed: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

async function testResults() {
  logInfo('Testing Results endpoints...');
  try {
    // GET results
    const getRes = await axios.get(`${BASE_URL}/results`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    logSuccess(`GET /results - Found ${getRes.data.length} employee results`);

    if (getRes.data.length > 0) {
      const employeeId = getRes.data[0]._id;
      // GET single employee results
      const getSingleRes = await axios.get(`${BASE_URL}/results/${employeeId}`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      logSuccess(`GET /results/:employeeId - Retrieved results for: ${getSingleRes.data.employeeName}`);
    }

    return true;
  } catch (error) {
    logError(`Results test failed: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

// Main test runner
async function runTests() {
  log('\n🚀 Starting Integration Tests...\n', 'blue');

  const results = {
    login: false,
    categories: false,
    subcategories: false,
    surveys: false,
    users: false,
    responses: false,
    results: false,
  };

  // Test login first
  results.login = await testLogin();
  if (!results.login) {
    logError('\n❌ Login failed. Cannot continue tests. Please check:');
    logError('   1. Backend is running on http://localhost:5000');
    logError('   2. Admin user exists (email: admin@test.com, password: admin123)');
    logError('   3. MongoDB is connected\n');
    process.exit(1);
  }

  log('\n');

  // Run all tests
  results.categories = await testCategories();
  log('');
  results.subcategories = await testSubcategories();
  log('');
  results.surveys = await testSurveys();
  log('');
  results.users = await testUsers();
  log('');
  results.responses = await testResponses();
  log('');
  results.results = await testResults();

  // Summary
  log('\n' + '='.repeat(50), 'blue');
  log('📊 Test Summary', 'blue');
  log('='.repeat(50), 'blue');
  
  const totalTests = Object.keys(results).length;
  const passedTests = Object.values(results).filter(r => r).length;
  
  Object.entries(results).forEach(([test, passed]) => {
    if (passed) {
      logSuccess(`${test.padEnd(20)} PASSED`);
    } else {
      logError(`${test.padEnd(20)} FAILED`);
    }
  });

  log('\n' + '='.repeat(50), 'blue');
  log(`Total: ${passedTests}/${totalTests} tests passed`, passedTests === totalTests ? 'green' : 'yellow');
  log('='.repeat(50) + '\n', 'blue');

  if (passedTests === totalTests) {
    logSuccess('🎉 All tests passed! Integration is working correctly.\n');
    process.exit(0);
  } else {
    logError('⚠️  Some tests failed. Please check the errors above.\n');
    process.exit(1);
  }
}

// Run tests
runTests().catch(error => {
  logError(`\nFatal error: ${error.message}\n`);
  process.exit(1);
});

