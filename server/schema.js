const pool = require('./postgres');

async function initializeDatabase() {
  const client = await pool.connect();
  
  try {
    console.log('🔧 Initializing PostgreSQL database schema...');
    
    await client.query('BEGIN');

    // Create investors table
    await client.query(`
      CREATE TABLE IF NOT EXISTS investors (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        starting_credit INTEGER DEFAULT 500,
        invested INTEGER DEFAULT 0,
        remaining INTEGER DEFAULT 500,
        submitted BOOLEAN DEFAULT FALSE,
        remember_me BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create startups table
    await client.query(`
      CREATE TABLE IF NOT EXISTS startups (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        slug VARCHAR(255) UNIQUE NOT NULL,
        description TEXT DEFAULT '',
        logo VARCHAR(500) DEFAULT '',
        pitch_deck VARCHAR(500) DEFAULT '',
        cohort VARCHAR(100) DEFAULT '',
        support_program VARCHAR(100) DEFAULT '',
        industry VARCHAR(100) DEFAULT '',
        email VARCHAR(255) DEFAULT '',
        team TEXT DEFAULT '',
        generating_revenue TEXT DEFAULT '',
        ask TEXT DEFAULT '',
        legal_entity TEXT DEFAULT '',
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create investments table with CASCADE
    await client.query(`
      CREATE TABLE IF NOT EXISTS investments (
        id SERIAL PRIMARY KEY,
        investor_id INTEGER NOT NULL,
        startup_id INTEGER NOT NULL,
        amount INTEGER NOT NULL,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (investor_id) REFERENCES investors(id) ON DELETE CASCADE,
        FOREIGN KEY (startup_id) REFERENCES startups(id) ON DELETE CASCADE
      )
    `);

    // Create fund_requests table
    await client.query(`
      CREATE TABLE IF NOT EXISTS fund_requests (
        id SERIAL PRIMARY KEY,
        investor_id INTEGER NOT NULL,
        amount INTEGER NOT NULL,
        reason TEXT NOT NULL,
        status VARCHAR(20) DEFAULT 'pending',
        admin_notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        reviewed_at TIMESTAMP,
        FOREIGN KEY (investor_id) REFERENCES investors(id) ON DELETE CASCADE
      )
    `);

    // Create admin_logs table
    await client.query(`
      CREATE TABLE IF NOT EXISTS admin_logs (
        id SERIAL PRIMARY KEY,
        action VARCHAR(255) NOT NULL,
        details TEXT,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create game_state table for lock status
    await client.query(`
      CREATE TABLE IF NOT EXISTS game_state (
        id INTEGER PRIMARY KEY DEFAULT 1,
        is_locked BOOLEAN DEFAULT FALSE,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CHECK (id = 1)
      )
    `);

    // Insert default game state if not exists
    await client.query(`
      INSERT INTO game_state (id, is_locked)
      VALUES (1, FALSE)
      ON CONFLICT (id) DO NOTHING
    `);

    // Create indexes for performance
    await client.query('CREATE INDEX IF NOT EXISTS idx_investments_investor ON investments(investor_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_investments_startup ON investments(startup_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_fund_requests_investor ON fund_requests(investor_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_fund_requests_status ON fund_requests(status)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_startups_active ON startups(is_active)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_investors_email ON investors(email)');

    await client.query('COMMIT');
    console.log('✅ Database schema initialized successfully');

    // Check if we need to seed
    const result = await client.query('SELECT COUNT(*) FROM startups');
    const count = parseInt(result.rows[0].count);
    
    if (count === 0) {
      console.log('📊 Database is empty, seeding with sample data...');
      await seedDatabase();
    } else {
      console.log(`📊 Database has ${count} startups, skipping seed`);
    }

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Database initialization failed:', error);
    throw error;
  } finally {
    client.release();
  }
}

async function seedDatabase() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    console.log('🌱 Seeding sample startups...');

    const startups = [
      {
        name: 'TechVision AI',
        slug: 'techvision-ai',
        description: 'AI-powered business analytics platform helping companies make data-driven decisions.',
        industry: 'Artificial Intelligence',
        cohort: 'Spring 2024',
        support_program: 'AUB Innovation Hub',
        team: '3 founders with 15+ years combined experience in ML and data science',
        generating_revenue: 'Yes, $50K ARR',
        ask: 'Seed funding to expand team and accelerate product development',
        legal_entity: 'TechVision AI LLC'
      },
      {
        name: 'EcoTrack Solutions',
        slug: 'ecotrack-solutions',
        description: 'Sustainability tracking software for enterprises to monitor and reduce carbon footprint.',
        industry: 'CleanTech',
        cohort: 'Fall 2023',
        support_program: 'Green Innovation Program',
        team: '4 co-founders from environmental engineering backgrounds',
        generating_revenue: 'Pre-revenue, 5 pilot customers',
        ask: 'Series A funding for market expansion',
        legal_entity: 'EcoTrack Solutions Inc'
      },
      {
        name: 'HealthHub Connect',
        slug: 'healthhub-connect',
        description: 'Telemedicine platform connecting patients with healthcare providers across MENA region.',
        industry: 'HealthTech',
        cohort: 'Spring 2024',
        support_program: 'Digital Health Accelerator',
        team: '5 team members including doctors and software engineers',
        generating_revenue: 'Yes, $120K ARR with 2000+ active users',
        ask: 'Growth capital to expand to new markets',
        legal_entity: 'HealthHub Connect SAL'
      }
    ];

    for (const startup of startups) {
      await client.query(
        `INSERT INTO startups (name, slug, description, industry, cohort, support_program, team, generating_revenue, ask, legal_entity, is_active)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, true)`,
        [startup.name, startup.slug, startup.description, startup.industry, startup.cohort, startup.support_program, startup.team, startup.generating_revenue, startup.ask, startup.legal_entity]
      );
    }

    await client.query('COMMIT');
    console.log('✅ Database seeded successfully with sample startups');

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Database seeding failed:', error);
    throw error;
  } finally {
    client.release();
  }
}

module.exports = { initializeDatabase, seedDatabase, pool };
