// Database helper functions for PostgreSQL
const pool = require('./postgres');
const { v4: uuidv4 } = require('uuid');

// ===== INVESTOR FUNCTIONS =====

async function getInvestorByEmail(email) {
  const result = await pool.query('SELECT * FROM investors WHERE email = $1', [email]);
  return result.rows[0];
}

async function getInvestorById(id) {
  const result = await pool.query(`
    SELECT 
      i.id,
      i.name,
      i.email,
      i.starting_credit,
      i.submitted,
      i.remember_me,
      i.created_at,
      COALESCE(SUM(inv.amount), 0) as invested,
      i.starting_credit - COALESCE(SUM(inv.amount), 0) as remaining
    FROM investors i
    LEFT JOIN investments inv ON i.id = inv.investor_id
    WHERE i.id = $1
    GROUP BY i.id, i.name, i.email, i.starting_credit, i.submitted, i.remember_me, i.created_at
  `, [id]);
  return result.rows[0];
}

async function createInvestor(name, email) {
  const result = await pool.query(
    'INSERT INTO investors (name, email, starting_credit, invested, remaining) VALUES ($1, $2, 500, 0, 500) RETURNING id',
    [name, email]
  );
  const id = result.rows[0].id;
  return await getInvestorById(id);
}

async function getInvestorByEmailOrName(email, name) {
  const result = await pool.query(`
    SELECT 
      i.id,
      i.name,
      i.email,
      i.starting_credit,
      i.submitted,
      i.remember_me,
      i.created_at,
      COALESCE(SUM(inv.amount), 0) as invested,
      i.starting_credit - COALESCE(SUM(inv.amount), 0) as remaining
    FROM investors i
    LEFT JOIN investments inv ON i.id = inv.investor_id
    WHERE i.email = $1 OR LOWER(i.name) = LOWER($2)
    GROUP BY i.id, i.name, i.email, i.starting_credit, i.submitted, i.remember_me, i.created_at
    LIMIT 1
  `, [email, name]);
  return result.rows[0];
}

async function updateInvestorRememberMe(id, rememberMe) {
  await pool.query('UPDATE investors SET remember_me = $2 WHERE id = $1', [id, rememberMe]);
}

async function updateInvestorCredit(id, amount) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    await client.query(`
      UPDATE investors
      SET starting_credit = starting_credit + $2,
          remaining = remaining + $2
      WHERE id = $1
    `, [id, amount]);
    
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function deleteInvestor(id) {
  await pool.query('DELETE FROM investors WHERE id = $1', [id]);
}

// ===== INVESTMENT FUNCTIONS =====

async function getExistingInvestment(startupId, investorId) {
  const result = await pool.query(`
    SELECT * FROM investments 
    WHERE startup_id = $1 AND investor_id = $2
  `, [startupId, investorId]);
  return result.rows[0];
}

async function createOrUpdateInvestment(investorId, startupId, amount) {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    const existing = await client.query(
      'SELECT * FROM investments WHERE investor_id = $1 AND startup_id = $2',
      [investorId, startupId]
    );

    if (existing.rows.length > 0) {
      const oldAmount = existing.rows[0].amount;
      const difference = amount - oldAmount;

      if (amount === 0) {
        // Delete investment
        await client.query(
          'DELETE FROM investments WHERE investor_id = $1 AND startup_id = $2',
          [investorId, startupId]
        );
        
        // Update investor balances
        await client.query(`
          UPDATE investors
          SET invested = invested - $2,
              remaining = remaining + $2
          WHERE id = $1
        `, [investorId, oldAmount]);
      } else {
        // Update investment
        await client.query(
          'UPDATE investments SET amount = $3, timestamp = CURRENT_TIMESTAMP WHERE investor_id = $1 AND startup_id = $2',
          [investorId, startupId, amount]
        );
        
        // Update investor balances
        await client.query(`
          UPDATE investors
          SET invested = invested + $2,
              remaining = remaining - $2
          WHERE id = $1
        `, [investorId, difference]);
      }
    } else {
      // Create new investment
      await client.query(
        'INSERT INTO investments (investor_id, startup_id, amount) VALUES ($1, $2, $3)',
        [investorId, startupId, amount]
      );
      
      // Update investor balances
      await client.query(`
        UPDATE investors
        SET invested = invested + $2,
            remaining = remaining - $2
        WHERE id = $1
      `, [investorId, amount]);
    }

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function submitInvestments(investorId) {
  await pool.query('UPDATE investors SET submitted = true WHERE id = $1', [investorId]);
}

// ===== STARTUP FUNCTIONS =====

async function getAllStartups() {
  const result = await pool.query(`
    SELECT * FROM startups
    WHERE is_active = true
    ORDER BY name
  `);
  return result.rows;
}

async function getStartupById(id) {
  const result = await pool.query('SELECT * FROM startups WHERE id = $1', [id]);
  return result.rows[0];
}

async function createStartup(data) {
  const result = await pool.query(`
    INSERT INTO startups (
      name, slug, description, logo, pitch_deck, cohort, support_program,
      industry, email, team, generating_revenue, ask, legal_entity, is_active
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, true)
    RETURNING *
  `, [
    data.name,
    data.slug,
    data.description || '',
    data.logo || '',
    data.pitch_deck || '',
    data.cohort || '',
    data.support_program || '',
    data.industry || '',
    data.email || '',
    data.team || '',
    data.generating_revenue || '',
    data.ask || '',
    data.legal_entity || ''
  ]);
  return result.rows[0];
}

async function updateStartup(id, data) {
  const updates = [];
  const values = [];
  let paramCount = 1;

  if (data.name !== undefined) {
    updates.push(`name = $${paramCount++}`);
    values.push(data.name);
  }
  if (data.slug !== undefined) {
    updates.push(`slug = $${paramCount++}`);
    values.push(data.slug);
  }
  if (data.description !== undefined) {
    updates.push(`description = $${paramCount++}`);
    values.push(data.description);
  }
  if (data.logo !== undefined) {
    updates.push(`logo = $${paramCount++}`);
    values.push(data.logo);
  }
  if (data.pitch_deck !== undefined) {
    updates.push(`pitch_deck = $${paramCount++}`);
    values.push(data.pitch_deck);
  }
  if (data.cohort !== undefined) {
    updates.push(`cohort = $${paramCount++}`);
    values.push(data.cohort);
  }
  if (data.support_program !== undefined) {
    updates.push(`support_program = $${paramCount++}`);
    values.push(data.support_program);
  }
  if (data.industry !== undefined) {
    updates.push(`industry = $${paramCount++}`);
    values.push(data.industry);
  }
  if (data.email !== undefined) {
    updates.push(`email = $${paramCount++}`);
    values.push(data.email);
  }
  if (data.team !== undefined) {
    updates.push(`team = $${paramCount++}`);
    values.push(data.team);
  }
  if (data.generating_revenue !== undefined) {
    updates.push(`generating_revenue = $${paramCount++}`);
    values.push(data.generating_revenue);
  }
  if (data.ask !== undefined) {
    updates.push(`ask = $${paramCount++}`);
    values.push(data.ask);
  }
  if (data.legal_entity !== undefined) {
    updates.push(`legal_entity = $${paramCount++}`);
    values.push(data.legal_entity);
  }
  if (data.isActive !== undefined) {
    updates.push(`is_active = $${paramCount++}`);
    values.push(data.isActive);
  }

  if (updates.length === 0) return;

  values.push(id);
  const query = `UPDATE startups SET ${updates.join(', ')} WHERE id = $${paramCount}`;
  
  await pool.query(query, values);
}

async function deleteStartup(id) {
  await pool.query('DELETE FROM startups WHERE id = $1', [id]);
}

// ===== FUND REQUEST FUNCTIONS =====

async function createFundRequest(investorId, amount, reason) {
  const result = await pool.query(`
    INSERT INTO fund_requests (investor_id, amount, reason, status)
    VALUES ($1, $2, $3, 'pending')
    RETURNING *
  `, [investorId, amount, reason]);
  return result.rows[0];
}

async function getAllFundRequests() {
  const result = await pool.query(`
    SELECT 
      fr.*,
      i.name as investor_name,
      i.email as investor_email,
      i.starting_credit as current_credit
    FROM fund_requests fr
    JOIN investors i ON fr.investor_id = i.id
    ORDER BY 
      CASE fr.status
        WHEN 'pending' THEN 1
        WHEN 'approved' THEN 2
        WHEN 'rejected' THEN 3
      END,
      fr.created_at DESC
  `);
  return result.rows;
}

async function updateFundRequestStatus(id, status, adminNotes) {
  const result = await pool.query(`
    UPDATE fund_requests
    SET status = $2, admin_notes = $3, reviewed_at = CURRENT_TIMESTAMP
    WHERE id = $1
    RETURNING *
  `, [id, status, adminNotes]);
  return result.rows[0];
}

// ===== GAME STATE FUNCTIONS =====

async function getGameLockStatus() {
  const result = await pool.query('SELECT is_locked FROM game_state WHERE id = 1');
  return result.rows[0]?.is_locked || false;
}

async function toggleGameLock() {
  const result = await pool.query(`
    UPDATE game_state
    SET is_locked = NOT is_locked, updated_at = CURRENT_TIMESTAMP
    WHERE id = 1
    RETURNING is_locked
  `);
  return result.rows[0].is_locked;
}

// ===== ADMIN LOG FUNCTIONS =====

async function createAdminLog(action, details) {
  await pool.query(
    'INSERT INTO admin_logs (action, details) VALUES ($1, $2)',
    [action, JSON.stringify(details)]
  );
}

// ===== STATS FUNCTIONS =====

async function getAdminStats() {
  const totalInvestorsResult = await pool.query('SELECT COUNT(*) as count FROM investors');
  const totalStartupsResult = await pool.query('SELECT COUNT(*) as count FROM startups WHERE is_active = true');
  const totalInvestedResult = await pool.query('SELECT COALESCE(SUM(amount), 0) as total FROM investments');
  const totalInvestmentsResult = await pool.query('SELECT COUNT(*) as count FROM investments');

  return {
    totalInvestors: parseInt(totalInvestorsResult.rows[0].count),
    totalStartups: parseInt(totalStartupsResult.rows[0].count),
    totalInvested: parseInt(totalInvestedResult.rows[0].total),
    totalInvestments: parseInt(totalInvestmentsResult.rows[0].count)
  };
}

module.exports = {
  getInvestorByEmail,
  getInvestorById,
  createInvestor,
  getInvestorByEmailOrName,
  updateInvestorRememberMe,
  updateInvestorCredit,
  deleteInvestor,
  getExistingInvestment,
  createOrUpdateInvestment,
  submitInvestments,
  getAllStartups,
  getStartupById,
  createStartup,
  updateStartup,
  deleteStartup,
  createFundRequest,
  getAllFundRequests,
  updateFundRequestStatus,
  getGameLockStatus,
  toggleGameLock,
  createAdminLog,
  getAdminStats
};
