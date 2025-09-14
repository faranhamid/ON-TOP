const axios = require('axios');

const BASE_URL = 'http://localhost:3002';
let testsPassed = 0;
let testsFailed = 0;

async function runQuickTests() {
    console.log('🚀 Running quick local tests...\n');
    
    try {
        // Test 1: Health Check
        console.log('1. Testing health endpoint...');
        const health = await axios.get(`${BASE_URL}/api/health`);
        if (health.data.status === 'healthy') {
            console.log('✅ Health check passed');
            testsPassed++;
        } else {
            console.log('❌ Health check failed');
            testsFailed++;
        }

        // Test 2: User Registration
        console.log('\n2. Testing user registration...');
        const registerData = {
            email: `test_${Date.now()}@example.com`,
            password: 'TestPass123',
            firstName: 'Test',
            lastName: 'User'
        };
        
        const register = await axios.post(`${BASE_URL}/api/auth/register`, registerData);
        if (register.data.success) {
            console.log('✅ User registration passed');
            testsPassed++;
        } else {
            console.log('❌ User registration failed');
            testsFailed++;
        }

        // Test 3: User Login
        console.log('\n3. Testing user login...');
        const login = await axios.post(`${BASE_URL}/api/auth/login`, {
            email: registerData.email,
            password: registerData.password
        });
        
        if (login.data.token) {
            console.log('✅ User login passed');
            testsPassed++;
            
            const token = login.data.token;
            
            // Test 4: Emma AI
            console.log('\n4. Testing Emma AI...');
            const emma = await axios.post(`${BASE_URL}/api/emma-chat`, {
                message: 'Hello Emma!',
                conversation_history: []
            }, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (emma.data.response) {
                console.log('✅ Emma AI passed');
                console.log(`   Response: ${emma.data.response.substring(0, 50)}...`);
                testsPassed++;
            } else {
                console.log('❌ Emma AI failed');
                testsFailed++;
            }

            // Test 5: Financial Advisor
            console.log('\n5. Testing Financial Advisor...');
            const finance = await axios.post(`${BASE_URL}/api/finance-advisor`, {
                message: 'Investment advice please',
                conversation_history: []
            }, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (finance.data.response) {
                console.log('✅ Financial Advisor passed');
                console.log(`   Response: ${finance.data.response.substring(0, 50)}...`);
                testsPassed++;
            } else {
                console.log('❌ Financial Advisor failed');
                testsFailed++;
            }

            // Test 6: Task Creation
            console.log('\n6. Testing task creation...');
            const task = await axios.post(`${BASE_URL}/api/tasks`, {
                title: 'Test Task',
                description: 'Test Description',
                priority: 'medium'
            }, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (task.data.success || task.data.id) {
                console.log('✅ Task creation passed');
                testsPassed++;
            } else {
                console.log('❌ Task creation failed');
                testsFailed++;
            }

        } else {
            console.log('❌ User login failed');
            testsFailed++;
        }

    } catch (error) {
        console.log(`❌ Test error: ${error.message}`);
        testsFailed++;
    }

    // Results
    console.log('\n' + '='.repeat(40));
    console.log('📊 TEST RESULTS');
    console.log('='.repeat(40));
    console.log(`✅ Passed: ${testsPassed}`);
    console.log(`❌ Failed: ${testsFailed}`);
    console.log(`📈 Success Rate: ${((testsPassed / (testsPassed + testsFailed)) * 100).toFixed(1)}%`);
    
    if (testsFailed === 0) {
        console.log('\n🎉 ALL TESTS PASSED! Your app is working perfectly locally.');
    } else if (testsFailed < testsPassed) {
        console.log('\n⚠️  Most tests passed. Minor issues detected.');
    } else {
        console.log('\n🚨 Significant issues detected.');
    }
}

runQuickTests().catch(console.error);

