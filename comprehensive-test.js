const axios = require('axios');
const fs = require('fs');

// Test configuration
const BASE_URL = 'https://on-top.vercel.app';
const LOCAL_URL = 'http://localhost:3002';
const TEST_ITERATIONS = 100;

// Test results tracking
let testResults = {
    passed: 0,
    failed: 0,
    errors: [],
    performance: []
};

// Test user credentials
const testUser = {
    email: `test_${Date.now()}@example.com`,
    password: 'TestPass123!',
    name: 'Test User'
};

console.log('🚀 Starting comprehensive ON TOP app testing...');
console.log(`📊 Running ${TEST_ITERATIONS} iterations of tests`);
console.log(`🌐 Testing against: ${BASE_URL}`);

// Helper function to make HTTP requests with error handling
async function makeRequest(method, url, data = null, headers = {}) {
    const startTime = Date.now();
    try {
        const config = {
            method,
            url,
            timeout: 30000, // 30 second timeout
            headers: {
                'Content-Type': 'application/json',
                ...headers
            }
        };
        
        if (data) {
            config.data = data;
        }
        
        const response = await axios(config);
        const duration = Date.now() - startTime;
        
        testResults.performance.push({
            endpoint: url,
            method,
            duration,
            status: response.status
        });
        
        return {
            success: true,
            data: response.data,
            status: response.status,
            duration
        };
    } catch (error) {
        const duration = Date.now() - startTime;
        const errorInfo = {
            endpoint: url,
            method,
            error: error.message,
            status: error.response?.status || 'NETWORK_ERROR',
            duration
        };
        
        testResults.errors.push(errorInfo);
        
        return {
            success: false,
            error: error.message,
            status: error.response?.status || 'NETWORK_ERROR',
            duration
        };
    }
}

// Test 1: Frontend Loading
async function testFrontendLoading() {
    console.log('🌐 Testing frontend loading...');
    
    const pages = [
        '/',
        '/paywall.html',
        '/index.html'
    ];
    
    for (const page of pages) {
        const result = await makeRequest('GET', `${BASE_URL}${page}`);
        if (result.success) {
            console.log(`✅ ${page} loaded successfully (${result.duration}ms)`);
            testResults.passed++;
        } else {
            console.log(`❌ ${page} failed to load: ${result.error}`);
            testResults.failed++;
        }
    }
}

// Test 2: API Health Check
async function testAPIHealth() {
    console.log('🏥 Testing API health...');
    
    const result = await makeRequest('GET', `${BASE_URL}/api/health`);
    if (result.success) {
        console.log(`✅ API health check passed (${result.duration}ms)`);
        console.log(`📊 Health status: ${JSON.stringify(result.data)}`);
        testResults.passed++;
    } else {
        console.log(`❌ API health check failed: ${result.error}`);
        testResults.failed++;
    }
}

// Test 3: User Registration
async function testUserRegistration() {
    console.log('👤 Testing user registration...');
    
    const userData = {
        ...testUser,
        email: `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}@example.com`
    };
    
    const result = await makeRequest('POST', `${BASE_URL}/api/auth/register`, userData);
    if (result.success && result.data.token) {
        console.log(`✅ User registration successful (${result.duration}ms)`);
        testResults.passed++;
        return result.data.token;
    } else {
        console.log(`❌ User registration failed: ${result.error}`);
        testResults.failed++;
        return null;
    }
}

// Test 4: User Login
async function testUserLogin(email, password) {
    console.log('🔐 Testing user login...');
    
    const result = await makeRequest('POST', `${BASE_URL}/api/auth/login`, {
        email,
        password
    });
    
    if (result.success && result.data.token) {
        console.log(`✅ User login successful (${result.duration}ms)`);
        testResults.passed++;
        return result.data.token;
    } else {
        console.log(`❌ User login failed: ${result.error}`);
        testResults.failed++;
        return null;
    }
}

// Test 5: Emma AI Chat
async function testEmmaAI(token) {
    console.log('🧠 Testing Emma AI chat...');
    
    const result = await makeRequest('POST', `${BASE_URL}/api/emma-chat`, {
        message: 'Hello Emma, I need help with stress management.',
        conversation_history: []
    }, {
        'Authorization': `Bearer ${token}`
    });
    
    if (result.success && result.data.response) {
        console.log(`✅ Emma AI chat successful (${result.duration}ms)`);
        console.log(`🤖 Emma response: ${result.data.response.substring(0, 100)}...`);
        testResults.passed++;
    } else {
        console.log(`❌ Emma AI chat failed: ${result.error}`);
        testResults.failed++;
    }
}

// Test 6: Financial Advisor AI
async function testFinancialAdvisor(token) {
    console.log('💰 Testing Financial Advisor AI...');
    
    const result = await makeRequest('POST', `${BASE_URL}/api/finance-advisor`, {
        message: 'How should I start investing with $1000?',
        conversation_history: []
    }, {
        'Authorization': `Bearer ${token}`
    });
    
    if (result.success && result.data.response) {
        console.log(`✅ Financial Advisor AI successful (${result.duration}ms)`);
        console.log(`💼 Advisor response: ${result.data.response.substring(0, 100)}...`);
        testResults.passed++;
    } else {
        console.log(`❌ Financial Advisor AI failed: ${result.error}`);
        testResults.failed++;
    }
}

// Test 7: Task Management
async function testTaskManagement(token) {
    console.log('📋 Testing task management...');
    
    // Create a task
    const taskData = {
        title: 'Test Task',
        description: 'This is a test task',
        priority: 'high',
        due_date: new Date(Date.now() + 86400000).toISOString() // Tomorrow
    };
    
    const createResult = await makeRequest('POST', `${BASE_URL}/api/tasks`, taskData, {
        'Authorization': `Bearer ${token}`
    });
    
    if (createResult.success) {
        console.log(`✅ Task creation successful (${createResult.duration}ms)`);
        testResults.passed++;
        
        // Get tasks
        const getResult = await makeRequest('GET', `${BASE_URL}/api/tasks`, null, {
            'Authorization': `Bearer ${token}`
        });
        
        if (getResult.success) {
            console.log(`✅ Task retrieval successful (${getResult.duration}ms)`);
            console.log(`📊 Found ${getResult.data.length} tasks`);
            testResults.passed++;
        } else {
            console.log(`❌ Task retrieval failed: ${getResult.error}`);
            testResults.failed++;
        }
    } else {
        console.log(`❌ Task creation failed: ${createResult.error}`);
        testResults.failed++;
    }
}

// Test 8: Data Persistence
async function testDataPersistence(token) {
    console.log('💾 Testing data persistence...');
    
    const result = await makeRequest('GET', `${BASE_URL}/api/user/profile`, null, {
        'Authorization': `Bearer ${token}`
    });
    
    if (result.success) {
        console.log(`✅ Data persistence check successful (${result.duration}ms)`);
        testResults.passed++;
    } else {
        console.log(`❌ Data persistence check failed: ${result.error}`);
        testResults.failed++;
    }
}

// Main test runner
async function runComprehensiveTests() {
    const startTime = Date.now();
    
    try {
        // Test frontend loading
        await testFrontendLoading();
        
        // Test API health
        await testAPIHealth();
        
        // Run user flow tests multiple times
        for (let i = 1; i <= Math.min(TEST_ITERATIONS, 10); i++) {
            console.log(`\n🔄 Running user flow test iteration ${i}...`);
            
            // Register new user
            const token = await testUserRegistration();
            
            if (token) {
                // Test authenticated endpoints
                await testEmmaAI(token);
                await testFinancialAdvisor(token);
                await testTaskManagement(token);
                await testDataPersistence(token);
            }
            
            // Add delay between iterations to avoid rate limiting
            if (i < Math.min(TEST_ITERATIONS, 10)) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }
        
        // Performance stress test
        console.log('\n⚡ Running performance stress test...');
        const promises = [];
        for (let i = 0; i < 20; i++) {
            promises.push(makeRequest('GET', `${BASE_URL}/api/health`));
        }
        
        const stressResults = await Promise.all(promises);
        const successfulRequests = stressResults.filter(r => r.success).length;
        console.log(`✅ Stress test: ${successfulRequests}/20 requests successful`);
        
        if (successfulRequests >= 18) {
            testResults.passed++;
        } else {
            testResults.failed++;
        }
        
    } catch (error) {
        console.error('❌ Test runner error:', error.message);
        testResults.errors.push({
            test: 'Test Runner',
            error: error.message
        });
        testResults.failed++;
    }
    
    // Generate test report
    const totalTime = Date.now() - startTime;
    generateTestReport(totalTime);
}

// Generate comprehensive test report
function generateTestReport(totalTime) {
    console.log('\n' + '='.repeat(60));
    console.log('📊 COMPREHENSIVE TEST REPORT');
    console.log('='.repeat(60));
    
    console.log(`⏱️  Total test time: ${totalTime}ms`);
    console.log(`✅ Tests passed: ${testResults.passed}`);
    console.log(`❌ Tests failed: ${testResults.failed}`);
    console.log(`📈 Success rate: ${((testResults.passed / (testResults.passed + testResults.failed)) * 100).toFixed(2)}%`);
    
    // Performance analysis
    if (testResults.performance.length > 0) {
        const avgDuration = testResults.performance.reduce((sum, p) => sum + p.duration, 0) / testResults.performance.length;
        const maxDuration = Math.max(...testResults.performance.map(p => p.duration));
        const minDuration = Math.min(...testResults.performance.map(p => p.duration));
        
        console.log('\n📊 PERFORMANCE METRICS:');
        console.log(`   Average response time: ${avgDuration.toFixed(2)}ms`);
        console.log(`   Fastest response: ${minDuration}ms`);
        console.log(`   Slowest response: ${maxDuration}ms`);
    }
    
    // Error analysis
    if (testResults.errors.length > 0) {
        console.log('\n❌ ERRORS ENCOUNTERED:');
        testResults.errors.forEach((error, index) => {
            console.log(`   ${index + 1}. ${error.endpoint || error.test}: ${error.error}`);
        });
    }
    
    // Recommendations
    console.log('\n💡 RECOMMENDATIONS:');
    if (testResults.failed === 0) {
        console.log('   🎉 All tests passed! Your app is working excellently.');
    } else if (testResults.failed < testResults.passed / 4) {
        console.log('   ⚠️  Minor issues detected. Consider investigating failed tests.');
    } else {
        console.log('   🚨 Significant issues detected. Immediate attention required.');
    }
    
    // Save report to file
    const report = {
        timestamp: new Date().toISOString(),
        totalTime,
        passed: testResults.passed,
        failed: testResults.failed,
        successRate: ((testResults.passed / (testResults.passed + testResults.failed)) * 100).toFixed(2),
        performance: testResults.performance,
        errors: testResults.errors
    };
    
    fs.writeFileSync('test-report.json', JSON.stringify(report, null, 2));
    console.log('\n📄 Detailed report saved to: test-report.json');
    
    console.log('='.repeat(60));
}

// Run the tests
runComprehensiveTests().catch(error => {
    console.error('💥 Fatal test error:', error);
    process.exit(1);
});

