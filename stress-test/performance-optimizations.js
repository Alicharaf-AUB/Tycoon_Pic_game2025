/**
 * Server Performance Recommendations
 * Apply these optimizations to handle 2000+ concurrent users
 */

// 1. Enable Compression
const compression = require('compression');
app.use(compression());

// 2. Rate Limiting
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute window
  max: 100, // limit each IP to 100 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests, please try again later.'
});

app.use('/api/', limiter);

// 3. Increase Database Connection Pool
const pool = new Pool({
  connectionString: DATABASE_URL,
  max: 100, // Increase from default 10
  min: 10, // Keep minimum connections ready
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  allowExitOnIdle: false
});

// 4. Socket.IO Optimizations
io.on('connection', (socket) => {
  // Reduce broadcast frequency
  socket.setMaxListeners(50);
  
  // Throttle game state updates
  const throttledUpdate = throttle(() => {
    socket.emit('gameState', cachedGameState);
  }, 1000); // Max once per second
});

// 5. Cache Game State
let cachedGameState = null;
let cacheTimestamp = 0;
const CACHE_TTL = 2000; // 2 seconds

async function getGameState() {
  const now = Date.now();
  if (cachedGameState && (now - cacheTimestamp) < CACHE_TTL) {
    return cachedGameState;
  }
  
  const gameState = await fetchGameStateFromDB();
  cachedGameState = gameState;
  cacheTimestamp = now;
  return gameState;
}

// 6. Batch Database Updates
const batchQueue = [];
const BATCH_SIZE = 50;
const BATCH_INTERVAL = 1000; // 1 second

function queueDatabaseUpdate(query, params) {
  batchQueue.push({ query, params });
  
  if (batchQueue.length >= BATCH_SIZE) {
    flushBatch();
  }
}

setInterval(flushBatch, BATCH_INTERVAL);

async function flushBatch() {
  if (batchQueue.length === 0) return;
  
  const batch = batchQueue.splice(0, BATCH_SIZE);
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    for (const item of batch) {
      await client.query(item.query, item.params);
    }
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Batch update failed:', err);
  } finally {
    client.release();
  }
}

// 7. Throttle Helper
function throttle(func, limit) {
  let inThrottle;
  return function() {
    const args = arguments;
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  }
}

// 8. Graceful Shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, closing connections...');
  await flushBatch(); // Flush remaining updates
  await pool.end();
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

// 9. Memory Monitoring
setInterval(() => {
  const used = process.memoryUsage();
  console.log('Memory Usage:', {
    rss: `${Math.round(used.rss / 1024 / 1024)}MB`,
    heapTotal: `${Math.round(used.heapTotal / 1024 / 1024)}MB`,
    heapUsed: `${Math.round(used.heapUsed / 1024 / 1024)}MB`,
  });
  
  // Alert if memory usage is high
  if (used.heapUsed / used.heapTotal > 0.9) {
    console.warn('⚠️ HIGH MEMORY USAGE! Consider restarting or scaling.');
  }
}, 30000); // Every 30 seconds

// 10. Cluster Mode (for multi-core CPUs)
const cluster = require('cluster');
const os = require('os');

if (cluster.isMaster) {
  const numCPUs = os.cpus().length;
  console.log(`Master process starting ${numCPUs} workers...`);
  
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }
  
  cluster.on('exit', (worker, code, signal) => {
    console.log(`Worker ${worker.process.pid} died, starting new worker...`);
    cluster.fork();
  });
} else {
  // Worker processes run the actual server
  startServer();
}
