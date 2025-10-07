#!/usr/bin/env node

// ON TOP - Deployment Test Script
// Tests key endpoints after Vercel deployment

const https = require('https');
const http = require('http');

const VERCEL_URL = process.argv[2] || 'http://localhost:3002';
const BASE_URL = VERCEL_URL.replace(/\/$/, ''); // Remove trailing slash

console.log(`🧪 Testing deployment at: ${BASE_URL}`);
console.log('=' .repeat(50));

// Test endpoints
const tests = [
    {
        name: 'Health Check',
        path: '/api/health',
        method: 'GET',
        expected: 'healthy'
    },
    {
        name: 'Static Files',
        path: '/index.html',
        method: 'GET',
        expected: 'html'
    },
    {
        name: 'CORS Headers',
        path: '/api/health',
        method: 'OPTIONS',
        expected: 'cors'
    }
];

async function makeRequest(url, method = 'GET', data = null) {
    return new Promise((resolve, reject) => {
        const urlObj = new URL(url);
        const client = urlObj.protocol === 'https:' ? https : http;
        
        const options = {
            hostname: urlObj.hostname,
            port: urlObj.port,
            path: urlObj.pathname + urlObj.search,
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'ON-TOP-Test/1.0'
            }
        };

        const req = client.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => {
                resolve({
                    statusCode: res.statusCode,
                    headers: res.headers,
                    body: body
                });
            });
        });

        req.on('error', reject);
        
        if (data) {
            req.write(JSON.stringify(data));
        }
        
        req.end();
    });
}

async function runTest(test) {
    try {
        const url = `${BASE_URL}${test.path}`;
        const response = await makeRequest(url, test.method);
        
        let success = false;
        let message = '';

        switch (test.expected) {
            case 'healthy':
                success = response.statusCode === 200 && response.body.includes('healthy');
                message = success ? '✅ API is healthy' : `❌ Expected healthy response, got ${response.statusCode}`;
                break;
            case 'html':
                success = response.statusCode === 200 && response.body.includes('<html');
                message = success ? '✅ Static files served' : `❌ Expected HTML, got ${response.statusCode}`;
                break;
            case 'cors':
                success = response.headers['access-control-allow-origin'] !== undefined;
                message = success ? '✅ CORS headers present' : '❌ Missing CORS headers';
                break;
        }

        console.log(`${test.name}: ${message}`);
        return success;
        
    } catch (error) {
        console.log(`${test.name}: ❌ Request failed - ${error.message}`);
        return false;
    }
}

async function runAllTests() {
    console.log('Running deployment tests...\n');
    
    let passed = 0;
    let total = tests.length;
    
    for (const test of tests) {
        const success = await runTest(test);
        if (success) passed++;
        await new Promise(resolve => setTimeout(resolve, 500)); // Small delay between tests
    }
    
    console.log('\n' + '=' .repeat(50));
    console.log(`Test Results: ${passed}/${total} passed`);
    
    if (passed === total) {
        console.log('🎉 All tests passed! Your deployment is ready.');
        process.exit(0);
    } else {
        console.log('⚠️  Some tests failed. Check your deployment configuration.');
        process.exit(1);
    }
}

// Additional manual test instructions
console.log('📋 Manual Tests to Run:');
console.log('1. Open your mobile app and test user registration');
console.log('2. Test Emma AI chat functionality');
console.log('3. Verify file uploads work');
console.log('4. Test authentication flows');
console.log('');

runAllTests().catch(error => {
    console.error('❌ Test suite failed:', error.message);
    process.exit(1);
});
