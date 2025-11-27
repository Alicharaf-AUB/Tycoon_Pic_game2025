/**
 * Load Testing Script for Tycoon PIC Game
 * Simulates 2000 concurrent users
 * 
 * Usage: node load-test.js <production-url>
 * Example: node load-test.js https://tycoonpicgame2025-production.up.railway.app
 */

const autocannon = require('autocannon');
const { faker } = require('@faker-js/faker');

const BASE_URL = process.argv[2] || 'http://localhost:3001';
const TOTAL_USERS = 2000;
const DURATION = 60; // seconds
const CONNECTIONS = 200; // concurrent connections
const PIPELINING = 10; // requests per connection

console.log('🚀 Starting Stress Test');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(`📍 Target: ${BASE_URL}`);
console.log(`👥 Simulating: ${TOTAL_USERS} users`);
console.log(`⏱️  Duration: ${DURATION} seconds`);
console.log(`🔗 Concurrent connections: ${CONNECTIONS}`);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// Test scenarios
const scenarios = {
  // 1. User Registration/Login
  userLogin: {
    title: '👤 User Login Test',
    url: `${BASE_URL}/api/join`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    setupRequest: (req) => {
      req.body = JSON.stringify({
        name: faker.person.fullName(),
        email: faker.internet.email()
      });
      return req;
    }
  },

  // 2. Get Game State
  gameState: {
    title: '🎮 Game State Retrieval',
    url: `${BASE_URL}/api/game-state`,
    method: 'GET'
  },

  // 3. Investment (Voting)
  invest: {
    title: '💰 Investment/Voting Test',
    url: `${BASE_URL}/api/invest`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    setupRequest: (req) => {
      req.body = JSON.stringify({
        investorId: Math.floor(Math.random() * 1000) + 1,
        startupId: Math.floor(Math.random() * 10) + 1,
        amount: Math.floor(Math.random() * 50) + 10
      });
      return req;
    }
  }
};

// Run a single test scenario
function runScenario(scenario) {
  return new Promise((resolve, reject) => {
    console.log(`\n🔥 Running: ${scenario.title}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    const instance = autocannon({
      url: scenario.url,
      connections: CONNECTIONS,
      pipelining: PIPELINING,
      duration: DURATION,
      method: scenario.method || 'GET',
      headers: scenario.headers || {},
      setupRequest: scenario.setupRequest,
      requests: [
        {
          method: scenario.method || 'GET',
          path: scenario.url.replace(BASE_URL, ''),
          headers: scenario.headers || {},
          setupRequest: scenario.setupRequest
        }
      ]
    }, (err, result) => {
      if (err) {
        console.error('❌ Test failed:', err);
        reject(err);
      } else {
        resolve(result);
      }
    });

    autocannon.track(instance, { renderProgressBar: true });
  });
}

// Display results
function displayResults(title, result) {
  console.log(`\n📊 Results for: ${title}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`✅ Total Requests: ${result.requests.total}`);
  console.log(`⚡ Requests/sec: ${result.requests.average}`);
  console.log(`📈 Throughput: ${(result.throughput.average / 1024 / 1024).toFixed(2)} MB/sec`);
  console.log(`⏱️  Latency (avg): ${result.latency.mean} ms`);
  console.log(`⏱️  Latency (p99): ${result.latency.p99} ms`);
  console.log(`❌ Errors: ${result.errors}`);
  console.log(`⏳ Timeouts: ${result.timeouts}`);
  console.log(`📊 2xx responses: ${result['2xx']}`);
  console.log(`⚠️  4xx responses: ${result['4xx']}`);
  console.log(`🔥 5xx responses: ${result['5xx']}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  // Warning thresholds
  if (result.latency.mean > 1000) {
    console.log('⚠️  WARNING: Average latency is HIGH (> 1s)');
  }
  if (result['5xx'] > 0) {
    console.log('🚨 CRITICAL: Server errors detected!');
  }
  if (result.errors > result.requests.total * 0.01) {
    console.log('⚠️  WARNING: Error rate > 1%');
  }
}

// Main test execution
async function runAllTests() {
  const results = {};

  try {
    // Test 1: User Login (most critical)
    results.login = await runScenario(scenarios.userLogin);
    displayResults(scenarios.userLogin.title, results.login);
    await sleep(5000); // 5 second cooldown

    // Test 2: Game State
    results.gameState = await runScenario(scenarios.gameState);
    displayResults(scenarios.gameState.title, results.gameState);
    await sleep(5000);

    // Test 3: Investment/Voting
    results.invest = await runScenario(scenarios.invest);
    displayResults(scenarios.invest.title, results.invest);

    // Summary
    console.log('\n\n📋 STRESS TEST SUMMARY');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    let totalRequests = 0;
    let totalErrors = 0;
    let totalTimeouts = 0;
    let total5xx = 0;

    Object.keys(results).forEach(key => {
      totalRequests += results[key].requests.total;
      totalErrors += results[key].errors;
      totalTimeouts += results[key].timeouts;
      total5xx += results[key]['5xx'];
    });

    console.log(`📊 Total Requests Sent: ${totalRequests}`);
    console.log(`✅ Success Rate: ${((totalRequests - totalErrors - total5xx) / totalRequests * 100).toFixed(2)}%`);
    console.log(`❌ Total Errors: ${totalErrors}`);
    console.log(`⏳ Total Timeouts: ${totalTimeouts}`);
    console.log(`🔥 Total 5xx Errors: ${total5xx}`);

    if (total5xx === 0 && totalErrors < totalRequests * 0.01) {
      console.log('\n✅ PASS: Server handled the load successfully!');
    } else if (total5xx > 0) {
      console.log('\n🚨 FAIL: Server errors detected. Railway may crash under this load!');
      console.log('💡 Recommendations:');
      console.log('   - Increase Railway plan (more CPU/RAM)');
      console.log('   - Add horizontal scaling');
      console.log('   - Implement rate limiting');
      console.log('   - Add Redis caching');
    } else {
      console.log('\n⚠️  PARTIAL PASS: Some errors detected but server survived');
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (error) {
    console.error('\n🚨 CRITICAL FAILURE:', error);
    console.log('❌ Server crashed or became unresponsive!');
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Start the test
if (require.main === module) {
  runAllTests().then(() => {
    console.log('✅ All tests completed!');
    process.exit(0);
  }).catch(err => {
    console.error('❌ Test suite failed:', err);
    process.exit(1);
  });
}

module.exports = { runAllTests, scenarios };
