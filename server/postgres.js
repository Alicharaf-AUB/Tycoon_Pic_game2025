const { Pool } = require('pg');

if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is not set!');
  console.error('💡 Please set DATABASE_URL in your .env file');
  console.error('💡 Example: DATABASE_URL=postgresql://user:password@localhost:5432/investment_game');
  process.exit(1);
}

// Log DATABASE_URL for debugging (hide password)
const sanitizedUrl = process.env.DATABASE_URL.replace(/:([^:@]+)@/, ':****@');
console.log('🔗 Connecting to database:', sanitizedUrl);

// Create connection pool optimized for high load (2000+ users)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: false
  } : false,
  max: 100, // Increased for 2000 concurrent users
  min: 20, // Keep warm connections
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
  statement_timeout: 10000, // 10 second query timeout
  query_timeout: 10000,
  application_name: 'tycoon_pic_game'
});

// Event handlers
pool.on('connect', () => {
  console.log('✅ Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('❌ Unexpected error on idle PostgreSQL client', err);
  process.exit(-1);
});

// Test connection
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('❌ PostgreSQL connection test failed:', err);
  } else {
    console.log('✅ PostgreSQL connection test successful:', res.rows[0]);
  }
});

module.exports = pool;
