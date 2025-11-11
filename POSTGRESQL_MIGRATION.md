# PostgreSQL Migration Guide

This project has been partially migrated from SQLite to PostgreSQL for production scalability.

## ✅ What's Been Done

1. **Installed PostgreSQL driver**: `pg` package added
2. **Created PostgreSQL connection**: `server/postgres.js`
3. **Created database schema**: `server/schema.js` with auto-initialization
4. **Created database helpers**: `server/dbHelpers.js` with async functions
5. **Updated core functions**: `getGameState()` and `broadcastGameState()` are now async
6. **Updated endpoints**: `/api/join` endpoint converted to async/await

## ⚠️ What Still Needs Manual Conversion

The `server/index.js` file has **20+ endpoints** that need conversion from SQLite to PostgreSQL.

### Endpoints That Need Converting:

1. ✅ `/api/join` - DONE
2. ❌ `/api/find-investor` - TODO
3. ❌ `/api/game-state` - TODO
4. ❌ `/api/investors/:id` - TODO
5. ❌ `/api/invest` - TODO
6. ❌ `/api/submit` - TODO
7. ❌ `/api/funds-request` - TODO
8. ❌ `/api/investors/:id/funds-requests` - TODO
9. ❌ `/api/admin/investors` - TODO
10. ❌ `/api/admin/investors/:id/credit` - TODO
11. ❌ `/api/admin/investors/:id` (DELETE) - TODO
12. ❌ `/api/admin/startups` - TODO
13. ❌ `/api/admin/startups` (POST) - TODO
14. ❌ `/api/admin/startups/:id` (PUT) - TODO
15. ❌ `/api/admin/startups/:id` (DELETE) - TODO
16. ❌ `/api/admin/toggle-lock` - TODO
17. ❌ `/api/admin/stats` - TODO
18. ❌ `/api/admin/funds-requests` - TODO
19. ❌ `/api/admin/funds-requests/:id/approve` - TODO
20. ❌ `/api/admin/funds-requests/:id/reject` - TODO

## 🔧 How to Complete the Migration

### Pattern to Follow:

**Old (SQLite - Synchronous):**
```javascript
app.get('/api/investors/:id', (req, res) => {
  try {
    const investor = db.prepare('SELECT * FROM investors WHERE id = ?').get(req.params.id);
    res.json({ investor });
  } catch (error) {
    res.status(500).json({ error: 'Failed' });
  }
});
```

**New (PostgreSQL - Async):**
```javascript
app.get('/api/investors/:id', async (req, res) => {
  try {
    const investor = await dbHelpers.getInvestorById(req.params.id);
    res.json({ investor });
  } catch (error) {
    res.status(500).json({ error: 'Failed' });
  }
});
```

### Specific Conversion Rules:

1. **Add `async` to route handler**: `app.get('/path', (req, res) =>` becomes `app.get('/path', async (req, res) =>`

2. **Replace SQLite calls with dbHelpers**:
   - `db.prepare('SELECT...').get()` → `await dbHelpers.getXxx()`
   - `db.prepare('INSERT...').run()` → `await dbHelpers.createXxx()`
   - `db.prepare('UPDATE...').run()` → `await dbHelpers.updateXxx()`
   - `db.prepare('DELETE...').run()` → `await dbHelpers.deleteXxx()`

3. **Add `await` to broadcastGameState()**: `broadcastGameState()` → `await broadcastGameState()`

4. **Handle transactions**: Use the client pattern from dbHelpers for multi-step operations

### Example Conversions:

#### `/api/find-investor`
**Find this:**
```javascript
let investor = db.prepare(`SELECT...`).get(trimmedEmail, trimmedName);
```

**Replace with:**
```javascript
let investor = await dbHelpers.getInvestorByEmailOrName(trimmedEmail, trimmedName);
```

#### `/api/game-state`
**Find this:**
```javascript
app.get('/api/game-state', (req, res) => {
  try {
    const gameState = getGameState();
    res.json(gameState);
  }
});
```

**Replace with:**
```javascript
app.get('/api/game-state', async (req, res) => {
  try {
    const gameState = await getGameState();
    res.json(gameState);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get game state' });
  }
});
```

#### `/api/invest`
**Find this:**
```javascript
const existing = db.prepare(`SELECT...`).get(startupId, investorId);
// ... transaction code with db.prepare()
```

**Replace with:**
```javascript
await dbHelpers.createOrUpdateInvestment(investorId, startupId, amount);
```

## 🗄️ Setting Up PostgreSQL

### Option 1: Local Development (Docker)
```bash
docker run --name postgres-investment \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=investment_game \
  -p 5432:5432 \
  -d postgres:15

# Update .env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/investment_game
```

### Option 2: Azure PostgreSQL
```bash
# Create resource group
az group create --name investment-game-rg --location eastus

# Create PostgreSQL server
az postgres flexible-server create \
  --resource-group investment-game-rg \
  --name aub-investment-db \
  --location eastus \
  --admin-user adminuser \
  --admin-password YourSecurePassword123! \
  --sku-name Standard_B1ms \
  --tier Burstable \
  --storage-size 32 \
  --version 15 \
  --public-access 0.0.0.0

# Create database
az postgres flexible-server db create \
  --resource-group investment-game-rg \
  --server-name aub-investment-db \
  --database-name investment_game

# Get connection string and add to .env
DATABASE_URL=postgresql://adminuser:YourSecurePassword123!@aub-investment-db.postgres.database.azure.com:5432/investment_game?sslmode=require
```

### Option 3: Supabase (Easiest)
1. Go to https://supabase.com
2. Create new project
3. Copy the connection string
4. Add to .env:
```
DATABASE_URL=postgresql://postgres:[password]@db.[project].supabase.co:5432/postgres
```

## 🚀 Starting the Migrated Server

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env and add your DATABASE_URL

# Start server (will auto-initialize database)
npm start
```

The server will:
1. Connect to PostgreSQL
2. Create all tables if they don't exist
3. Seed sample data if database is empty
4. Start listening on PORT 3001

## 🔄 Migrating Existing SQLite Data

If you have existing data in SQLite that you want to migrate:

```bash
node server/migrate-sqlite-to-postgres.js
```

(Note: This script needs to be created - see below)

### Migration Script Template:
```javascript
const Database = require('better-sqlite3');
const { Pool } = require('pg');

async function migrate() {
  const sqliteDb = new Database('./data/game.db');
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL
  });

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Migrate investors
    const investors = sqliteDb.prepare('SELECT * FROM investors').all();
    for (const inv of investors) {
      await client.query(
        `INSERT INTO investors (id, name, email, starting_credit, invested, remaining, submitted, remember_me, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         ON CONFLICT (email) DO NOTHING`,
        [inv.id, inv.name, inv.email, inv.starting_credit, inv.invested, inv.remaining, inv.submitted === 1, inv.remember_me === 1, inv.created_at]
      );
    }

    // ... migrate other tables similarly

    await client.query('COMMIT');
    console.log('✅ Migration completed!');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Migration failed:', error);
  } finally {
    client.release();
    await pool.end();
    sqliteDb.close();
  }
}

migrate();
```

## 📝 Testing After Migration

1. **Start the server**: `npm start`
2. **Check database connection**: Look for "✅ Connected to PostgreSQL database"
3. **Check schema initialization**: Look for "✅ Database schema initialized"
4. **Test an endpoint**:
```bash
curl http://localhost:3001/api/game-state
```
5. **Create a test investor**:
```bash
curl -X POST http://localhost:3001/api/join \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com"}'
```

## 🐛 Troubleshooting

### "Cannot find module 'pg'"
```bash
npm install pg
```

### "Connection refused"
- Check PostgreSQL is running: `docker ps` or check Azure portal
- Verify DATABASE_URL in .env
- Check firewall rules (Azure)

### "Table doesn't exist"
- Delete and recreate database
- Server will auto-initialize on next start

### "Syntax error near..."
- PostgreSQL uses `$1, $2` instead of SQLite's `?`
- PostgreSQL uses `SERIAL` instead of `INTEGER PRIMARY KEY AUTOINCREMENT`
- PostgreSQL uses `true/false` instead of `1/0` for booleans

## 📊 Benefits After Full Migration

- ✅ Data persists across deployments
- ✅ Horizontal scaling with multiple app instances
- ✅ Automatic backups (Azure/Supabase)
- ✅ Better concurrent user support
- ✅ Production-grade reliability
- ✅ Connection pooling for performance

## ⏱️ Estimated Time to Complete

- Converting remaining endpoints: 2-3 hours
- Testing all functionality: 1-2 hours
- **Total**: 3-5 hours

## 🆘 Need Help?

The dbHelpers.js file has functions for most common operations:
- `getInvestorById(id)`
- `createInvestor(name, email)`
- `getInvestorByEmailOrName(email, name)`
- `updateInvestorCredit(id, amount)`
- `createOrUpdateInvestment(investorId, startupId, amount)`
- `submitInvestments(investorId)`
- `getAllStartups()`
- `createStartup(data)`
- `updateStartup(id, data)`
- `deleteStartup(id)`
- `createFundRequest(investorId, amount, reason)`
- `updateFundRequestStatus(id, status, notes)`
- `toggleGameLock()`
- `getAdminStats()`

Use these instead of writing raw SQL queries!
