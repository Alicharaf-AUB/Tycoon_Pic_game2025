/**
 * Socket.IO Stress Test
 * Tests WebSocket connections for real-time updates
 */

const io = require('socket.io-client');
const { faker } = require('@faker-js/faker');

const BASE_URL = process.argv[2] || 'http://localhost:3001';
const TOTAL_CONNECTIONS = 2000;
const RAMP_UP_TIME = 30000; // 30 seconds to connect all users
const TEST_DURATION = 60000; // 1 minute test

console.log('🔌 Socket.IO Stress Test');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(`📍 Target: ${BASE_URL}`);
console.log(`👥 Total Connections: ${TOTAL_CONNECTIONS}`);
console.log(`⏱️  Ramp-up Time: ${RAMP_UP_TIME / 1000}s`);
console.log(`⏱️  Test Duration: ${TEST_DURATION / 1000}s`);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

const sockets = [];
const stats = {
  connected: 0,
  disconnected: 0,
  errors: 0,
  messagesReceived: 0,
  connectionTimes: [],
  startTime: Date.now()
};

function createSocket(index) {
  return new Promise((resolve) => {
    const connectStart = Date.now();
    const socket = io(BASE_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 3,
      timeout: 10000
    });

    socket.on('connect', () => {
      const connectTime = Date.now() - connectStart;
      stats.connected++;
      stats.connectionTimes.push(connectTime);
      sockets.push(socket);
      
      if (stats.connected % 100 === 0) {
        console.log(`✅ ${stats.connected} sockets connected`);
      }
      resolve(socket);
    });

    socket.on('disconnect', () => {
      stats.disconnected++;
      if (stats.disconnected % 100 === 0) {
        console.log(`⚠️  ${stats.disconnected} sockets disconnected`);
      }
    });

    socket.on('connect_error', (error) => {
      stats.errors++;
      console.error(`❌ Connection error #${stats.errors}:`, error.message);
      resolve(null);
    });

    socket.on('gameState', () => {
      stats.messagesReceived++;
    });

    socket.on('newInvestor', () => {
      stats.messagesReceived++;
    });

    socket.on('newInvestment', () => {
      stats.messagesReceived++;
    });

    // Timeout fallback
    setTimeout(() => {
      if (!socket.connected) {
        stats.errors++;
        resolve(null);
      }
    }, 15000);
  });
}

async function runTest() {
  const interval = RAMP_UP_TIME / TOTAL_CONNECTIONS;
  
  console.log('🚀 Starting connection ramp-up...\n');

  // Connect all sockets gradually
  for (let i = 0; i < TOTAL_CONNECTIONS; i++) {
    createSocket(i);
    await sleep(interval);
  }

  console.log('\n⏳ Waiting for all connections to establish...\n');
  await sleep(5000);

  console.log('\n📊 Connection Phase Complete');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`✅ Successfully Connected: ${stats.connected}`);
  console.log(`❌ Failed Connections: ${stats.errors}`);
  console.log(`📈 Success Rate: ${(stats.connected / TOTAL_CONNECTIONS * 100).toFixed(2)}%`);
  
  if (stats.connectionTimes.length > 0) {
    const avgConnectTime = stats.connectionTimes.reduce((a, b) => a + b, 0) / stats.connectionTimes.length;
    const maxConnectTime = Math.max(...stats.connectionTimes);
    console.log(`⏱️  Avg Connection Time: ${avgConnectTime.toFixed(2)}ms`);
    console.log(`⏱️  Max Connection Time: ${maxConnectTime}ms`);
  }
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Simulate activity for test duration
  console.log(`🎮 Simulating user activity for ${TEST_DURATION / 1000}s...\n`);
  
  const activityInterval = setInterval(() => {
    const randomSocket = sockets[Math.floor(Math.random() * sockets.length)];
    if (randomSocket && randomSocket.connected) {
      // Simulate requesting game state
      randomSocket.emit('requestGameState');
    }
  }, 100);

  await sleep(TEST_DURATION);
  clearInterval(activityInterval);

  // Results
  console.log('\n📋 FINAL RESULTS');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`🔌 Peak Concurrent Connections: ${stats.connected - stats.disconnected}`);
  console.log(`📨 Total Messages Received: ${stats.messagesReceived}`);
  console.log(`📊 Messages/sec: ${(stats.messagesReceived / (TEST_DURATION / 1000)).toFixed(2)}`);
  console.log(`⚠️  Disconnections: ${stats.disconnected}`);
  console.log(`❌ Connection Errors: ${stats.errors}`);
  console.log(`⏱️  Total Test Time: ${((Date.now() - stats.startTime) / 1000).toFixed(2)}s`);
  
  // Health assessment
  const successRate = (stats.connected / TOTAL_CONNECTIONS) * 100;
  const disconnectRate = (stats.disconnected / stats.connected) * 100;
  
  console.log('\n🏥 HEALTH ASSESSMENT');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  if (successRate >= 95 && disconnectRate < 5) {
    console.log('✅ EXCELLENT: Server handles 2000 concurrent connections well!');
  } else if (successRate >= 80 && disconnectRate < 15) {
    console.log('⚠️  GOOD: Server mostly stable but may need optimization');
    console.log('💡 Consider: Increase Railway resources or add load balancing');
  } else {
    console.log('🚨 POOR: Server struggles with high concurrent connections');
    console.log('💡 Recommendations:');
    console.log('   - Upgrade Railway plan immediately');
    console.log('   - Implement connection pooling');
    console.log('   - Add Redis for session management');
    console.log('   - Consider horizontal scaling');
  }
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Cleanup
  console.log('🧹 Cleaning up connections...');
  sockets.forEach(socket => {
    if (socket && socket.connected) {
      socket.disconnect();
    }
  });

  setTimeout(() => {
    console.log('✅ Test complete!\n');
    process.exit(0);
  }, 2000);
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Start test
runTest().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
