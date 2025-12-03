const pool = require('./postgres');

/**
 * Migration: Add ip_address column to investments table
 * This allows tracking which IP address made each investment/vote
 */
async function migrate() {
  const client = await pool.connect();

  try {
    console.log('🔧 Starting migration: Add ip_address to investments table...');

    await client.query('BEGIN');

    // Add ip_address column if it doesn't exist
    await client.query(`
      ALTER TABLE investments
      ADD COLUMN IF NOT EXISTS ip_address VARCHAR(45)
    `);

    // Create index for performance
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_investments_ip
      ON investments(ip_address)
    `);

    await client.query('COMMIT');

    console.log('✅ Migration completed successfully!');
    console.log('   - Added ip_address column to investments table');
    console.log('   - Created index on ip_address for query performance');

    process.exit(0);

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
