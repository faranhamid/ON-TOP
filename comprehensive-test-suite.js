#!/usr/bin/env node

// ON TOP - Comprehensive Test Suite
// Tests all aspects of the application for production readiness

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:3002';
const VERCEL_URL = 'https://on-mbxdl25u9-faran-hamids-projects.vercel.app';

let testResults = {
    passed: 0,
    failed: 0,
    total: 0,
    details: []
};

// Test utilities
async function makeRequest(url, method = 'GET', data = null, headers = {}) {
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
                'User-Agent': 'ON-TOP-Test/1.0',
                ...headers
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

function logTest(name, passed, message = '') {
    testResults.total++;
    if (passed) {
        testResults.passed++;
        console.log(`✅ ${name}`);
    } else {
        testResults.failed++;
        console.log(`❌ ${name}: ${message}`);
    }
    testResults.details.push({ name, passed, message });
}

function checkFileExists(filePath) {
    return fs.existsSync(filePath);
}

// Test Categories

async function testStaticFiles() {
    console.log('\n🔍 Testing Static Files...');
    
    const staticFiles = [
        '/index.html',
        '/landing.html',
        '/app.html',
        '/paywall.html',
        '/app.js',
        '/auth-manager.js',
        '/auth-ui.js',
        '/paywall-manager.js'
    ];

    for (const file of staticFiles) {
        try {
            const response = await makeRequest(`${BASE_URL}${file}`);
            logTest(`Static file ${file}`, 
                response.statusCode === 200, 
                `Status: ${response.statusCode}`);
        } catch (error) {
            logTest(`Static file ${file}`, false, error.message);
        }
    }
}

async function testAPIEndpoints() {
    console.log('\n🔍 Testing API Endpoints...');
    
    // Health check
    try {
        const response = await makeRequest(`${BASE_URL}/api/health`);
        logTest('API Health Check', 
            response.statusCode === 200 && response.body.includes('healthy'),
            `Status: ${response.statusCode}`);
    } catch (error) {
        logTest('API Health Check', false, error.message);
    }

    // Emma AI Chat endpoint
    try {
        const response = await makeRequest(`${BASE_URL}/api/emma-chat`, 'POST', {
            message: 'Hello Emma, this is a test',
            conversationContext: {},
            recentChat: []
        });
        const data = JSON.parse(response.body);
        logTest('Emma AI Chat Endpoint', 
            response.statusCode === 200 && data.success !== undefined,
            `Status: ${response.statusCode}`);
    } catch (error) {
        logTest('Emma AI Chat Endpoint', false, error.message);
    }

    // Finance Advisor endpoint
    try {
        const response = await makeRequest(`${BASE_URL}/api/finance-advisor`, 'POST', {
            message: 'Help me with budgeting',
            userFinanceContext: {},
            recentChat: []
        });
        logTest('Finance Advisor Endpoint', 
            response.statusCode === 200,
            `Status: ${response.statusCode}`);
    } catch (error) {
        logTest('Finance Advisor Endpoint', false, error.message);
    }

    // User registration endpoint (should fail without proper data)
    try {
        const response = await makeRequest(`${BASE_URL}/api/auth/register`, 'POST', {
            email: 'test@example.com'
        });
        logTest('User Registration Validation', 
            response.statusCode === 400, // Should fail validation
            `Status: ${response.statusCode}`);
    } catch (error) {
        logTest('User Registration Validation', false, error.message);
    }
}

async function testFileStructure() {
    console.log('\n🔍 Testing File Structure...');
    
    const requiredFiles = [
        'www/index.html',
        'www/app.html',
        'www/landing.html',
        'www/paywall.html',
        'www/app.js',
        'www/auth-manager.js',
        'www/auth-ui.js',
        'www/paywall-manager.js',
        'server.js',
        'database.js',
        'storage.js',
        'package.json',
        'capacitor.config.json',
        'vercel.json'
    ];

    for (const file of requiredFiles) {
        const exists = checkFileExists(path.join(__dirname, file));
        logTest(`File exists: ${file}`, exists, exists ? '' : 'File not found');
    }
}

async function testMobileConfiguration() {
    console.log('\n🔍 Testing Mobile Configuration...');
    
    // Test Capacitor config
    try {
        const configPath = path.join(__dirname, 'capacitor.config.json');
        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        
        logTest('Capacitor config exists', !!config, '');
        logTest('App ID configured', !!config.appId, config.appId || 'Missing');
        logTest('App name configured', !!config.appName, config.appName || 'Missing');
        logTest('Web directory configured', config.webDir === 'www', `Found: ${config.webDir}`);
        logTest('Server URL configured', !!config.server?.url, config.server?.url || 'Missing');
        
    } catch (error) {
        logTest('Capacitor configuration', false, error.message);
    }

    // Test iOS configuration
    const iosConfigPath = path.join(__dirname, 'ios/App/App/capacitor.config.json');
    logTest('iOS config synced', checkFileExists(iosConfigPath), '');

    // Test Android configuration  
    const androidConfigPath = path.join(__dirname, 'android/app/src/main/assets/capacitor.config.json');
    logTest('Android config synced', checkFileExists(androidConfigPath), '');
}

async function testVercelDeployment() {
    console.log('\n🔍 Testing Vercel Deployment...');
    
    // Test Vercel config
    try {
        const vercelConfigPath = path.join(__dirname, 'vercel.json');
        const config = JSON.parse(fs.readFileSync(vercelConfigPath, 'utf8'));
        
        logTest('Vercel config exists', !!config, '');
        logTest('Vercel builds configured', !!config.builds, '');
        logTest('Vercel routes configured', !!config.routes, '');
        
    } catch (error) {
        logTest('Vercel configuration', false, error.message);
    }

    // Test API index file
    const apiIndexPath = path.join(__dirname, 'api/index.js');
    logTest('Vercel API handler exists', checkFileExists(apiIndexPath), '');

    // Test live deployment (if accessible)
    try {
        const response = await makeRequest(`${VERCEL_URL}/`);
        logTest('Vercel deployment accessible', 
            response.statusCode === 200 || response.statusCode === 401, // 401 if protected
            `Status: ${response.statusCode}`);
    } catch (error) {
        logTest('Vercel deployment accessible', false, error.message);
    }
}

async function testJavaScriptFunctionality() {
    console.log('\n🔍 Testing JavaScript Functionality...');
    
    // Test main app.js
    try {
        const appJsPath = path.join(__dirname, 'www/app.js');
        const appJs = fs.readFileSync(appJsPath, 'utf8');
        
        logTest('App.js contains initialization', appJs.includes('document.addEventListener'), '');
        logTest('App.js contains Emma chat', appJs.includes('sendMessage') || appJs.includes('emma'), '');
        logTest('App.js contains auth functions', appJs.includes('login') || appJs.includes('register'), '');
        
    } catch (error) {
        logTest('App.js functionality', false, error.message);
    }

    // Test auth-manager.js
    try {
        const authPath = path.join(__dirname, 'www/auth-manager.js');
        const authJs = fs.readFileSync(authPath, 'utf8');
        
        logTest('Auth manager exists', true, '');
        logTest('Auth manager contains login', authJs.includes('login'), '');
        logTest('Auth manager contains register', authJs.includes('register'), '');
        
    } catch (error) {
        logTest('Auth manager functionality', false, error.message);
    }
}

async function testDatabaseConfiguration() {
    console.log('\n🔍 Testing Database Configuration...');
    
    try {
        const databasePath = path.join(__dirname, 'database.js');
        const databaseJs = fs.readFileSync(databasePath, 'utf8');
        
        logTest('Database module exists', true, '');
        logTest('Database has user functions', databaseJs.includes('registerUser'), '');
        logTest('Database has task functions', databaseJs.includes('saveUserTasks'), '');
        
        // Test cloud database too
        const cloudDbPath = path.join(__dirname, 'database-cloud.js');
        logTest('Cloud database module exists', checkFileExists(cloudDbPath), '');
        
    } catch (error) {
        logTest('Database configuration', false, error.message);
    }
}

async function testHTMLPages() {
    console.log('\n🔍 Testing HTML Pages...');
    
    const pages = ['index.html', 'app.html', 'landing.html', 'paywall.html'];
    
    for (const page of pages) {
        try {
            const pagePath = path.join(__dirname, 'www', page);
            const html = fs.readFileSync(pagePath, 'utf8');
            
            logTest(`${page} has DOCTYPE`, html.includes('<!DOCTYPE html>'), '');
            logTest(`${page} has viewport meta`, html.includes('viewport'), '');
            logTest(`${page} has title`, html.includes('<title>'), '');
            logTest(`${page} has proper structure`, html.includes('<body>') && html.includes('</body>'), '');
            
            // Specific tests
            if (page === 'app.html') {
                logTest(`${page} includes app.js`, html.includes('app.js'), '');
                logTest(`${page} includes auth scripts`, html.includes('auth-'), '');
            }
            
            if (page === 'paywall.html') {
                logTest(`${page} includes paywall manager`, html.includes('paywall-manager.js'), '');
            }
            
        } catch (error) {
            logTest(`${page} structure`, false, error.message);
        }
    }
}

async function testSecurityConfiguration() {
    console.log('\n🔍 Testing Security Configuration...');
    
    try {
        const serverPath = path.join(__dirname, 'server.js');
        const serverJs = fs.readFileSync(serverPath, 'utf8');
        
        logTest('CORS configured', serverJs.includes('cors'), '');
        logTest('Helmet security', serverJs.includes('helmet'), '');
        logTest('Rate limiting', serverJs.includes('rateLimit'), '');
        logTest('JWT authentication', serverJs.includes('jwt'), '');
        logTest('Input validation', serverJs.includes('validationResult'), '');
        
    } catch (error) {
        logTest('Security configuration', false, error.message);
    }
}

async function testEnvironmentConfiguration() {
    console.log('\n🔍 Testing Environment Configuration...');
    
    // Test production template
    const prodTemplatePath = path.join(__dirname, 'production.env.template');
    logTest('Production env template exists', checkFileExists(prodTemplatePath), '');
    
    const vercelTemplatePath = path.join(__dirname, 'vercel.env.template');
    logTest('Vercel env template exists', checkFileExists(vercelTemplatePath), '');
    
    // Test server environment handling
    try {
        const serverPath = path.join(__dirname, 'server.js');
        const serverJs = fs.readFileSync(serverPath, 'utf8');
        
        logTest('Environment variables loaded', serverJs.includes('process.env'), '');
        logTest('Database provider switching', serverJs.includes('DATABASE_PROVIDER'), '');
        logTest('JWT secret configured', serverJs.includes('JWT_SECRET'), '');
        
    } catch (error) {
        logTest('Environment configuration', false, error.message);
    }
}

// Performance and Load Tests
async function testPerformance() {
    console.log('\n🔍 Testing Performance...');
    
    const startTime = Date.now();
    try {
        const response = await makeRequest(`${BASE_URL}/`);
        const loadTime = Date.now() - startTime;
        
        logTest('Homepage loads quickly', loadTime < 2000, `${loadTime}ms`);
        logTest('Homepage returns content', response.body.length > 1000, `${response.body.length} bytes`);
        
    } catch (error) {
        logTest('Homepage performance', false, error.message);
    }
    
    // Test multiple concurrent requests
    const concurrentTests = [];
    for (let i = 0; i < 5; i++) {
        concurrentTests.push(makeRequest(`${BASE_URL}/api/health`));
    }
    
    try {
        const results = await Promise.all(concurrentTests);
        const allSuccessful = results.every(r => r.statusCode === 200);
        logTest('Handles concurrent requests', allSuccessful, `${results.length} concurrent requests`);
    } catch (error) {
        logTest('Concurrent request handling', false, error.message);
    }
}

// Main test runner
async function runAllTests() {
    console.log('🚀 ON TOP - Comprehensive Test Suite');
    console.log('=====================================');
    console.log(`Testing local server: ${BASE_URL}`);
    console.log(`Testing Vercel deployment: ${VERCEL_URL}`);
    console.log('');

    // Run all test categories
    await testFileStructure();
    await testHTMLPages();
    await testStaticFiles();
    await testJavaScriptFunctionality();
    await testAPIEndpoints();
    await testDatabaseConfiguration();
    await testMobileConfiguration();
    await testVercelDeployment();
    await testSecurityConfiguration();
    await testEnvironmentConfiguration();
    await testPerformance();

    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('📊 TEST RESULTS SUMMARY');
    console.log('='.repeat(50));
    console.log(`✅ Passed: ${testResults.passed}`);
    console.log(`❌ Failed: ${testResults.failed}`);
    console.log(`📈 Total:  ${testResults.total}`);
    console.log(`🎯 Success Rate: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`);

    if (testResults.failed === 0) {
        console.log('\n🎉 ALL TESTS PASSED! Your ON TOP app is production ready!');
    } else {
        console.log(`\n⚠️  ${testResults.failed} tests failed. Review the issues above.`);
    }

    // Detailed failure report
    if (testResults.failed > 0) {
        console.log('\n📋 FAILED TESTS DETAILS:');
        testResults.details
            .filter(t => !t.passed)
            .forEach(t => console.log(`   ❌ ${t.name}: ${t.message}`));
    }

    console.log('\n🏁 Test suite completed.');
    
    return testResults.failed === 0;
}

// Run tests
runAllTests().then(success => {
    process.exit(success ? 0 : 1);
}).catch(error => {
    console.error('❌ Test suite failed:', error);
    process.exit(1);
});

