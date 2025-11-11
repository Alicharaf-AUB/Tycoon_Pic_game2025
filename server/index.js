const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const basicAuth = require('basic-auth');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const multer = require('multer');
const fs = require('fs');
require('dotenv').config();

// Use PostgreSQL instead of SQLite
const pool = require('./postgres');
const { initializeDatabase } = require('./schema');
const dbHelpers = require('./dbHelpers');

const app = express();
const server = http.createServer(app);

// Configure CORS based on environment
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? true // Allow all origins in production (Railway handles this)
    : "http://localhost:5173", // In development, allow local client
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
};

const io = socketIo(server, {
  path: '/socket.io/',
  cors: corsOptions,
  transports: ['polling', 'websocket'], // Match client order
  allowEIO3: true,
  pingTimeout: 60000,
  pingInterval: 25000
});

console.log('🔌 Socket.IO server initialized');
console.log('📡 Path: /socket.io/');
console.log('🚦 Transports: polling, websocket');

const PORT = process.env.PORT || 3001;
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'demo123';

// Helper function to format currency
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount) + ' €';
};

// Warn if using default password in production
if (process.env.NODE_ENV === 'production' && ADMIN_PASSWORD === 'demo123') {
  console.warn('⚠️  WARNING: Using default admin password in production! Please set ADMIN_PASSWORD environment variable.');
}

app.use(cors(corsOptions));
app.use(express.json());

// Use persistent storage for uploads (same as database)
const dataDir = process.env.DATA_DIR || path.join(__dirname, '../data');
const uploadDir = path.join(dataDir, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log(`Created uploads directory: ${uploadDir}`);
}

// Serve uploaded files
app.use('/uploads', express.static(uploadDir));

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf|ppt|pptx|doc|docx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error('Only images (JPG, PNG) and documents (PDF, PPT) are allowed'));
  }
});

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/dist')));
}

// Basic Auth Middleware for Admin
const adminAuth = (req, res, next) => {
  const credentials = basicAuth(req);

  console.log('=== ADMIN AUTH CHECK ===');
  console.log('Request path:', req.method, req.path);
  console.log('Credentials provided:', credentials ? `Yes (user: ${credentials.name})` : 'No');

  if (!credentials || credentials.name !== ADMIN_USERNAME || credentials.pass !== ADMIN_PASSWORD) {
    console.log('AUTH FAILED - Invalid credentials');
    console.log('Expected username:', ADMIN_USERNAME);
    console.log('Provided username:', credentials?.name || 'none');
    res.set('WWW-Authenticate', 'Basic realm="Admin Area"');
    return res.status(401).json({ error: 'Authentication required' });
  }

  console.log('AUTH SUCCESS');
  next();
};

// Helper: Broadcast game state to all clients (now async)
const broadcastGameState = async () => {
  try {
    const gameState = await getGameState();
    io.emit('gameStateUpdate', gameState);
  } catch (error) {
    console.error('Error broadcasting game state:', error);
  }
};

// Helper: Get complete game state (now async for PostgreSQL)
const getGameState = async () => {
  try {
    // Get game lock status
    const lockResult = await pool.query('SELECT is_locked FROM game_state WHERE id = 1');
    const isLocked = lockResult.rows[0]?.is_locked || false;
    
    // Get all active startups with investment totals
    const startupsResult = await pool.query(`
      SELECT 
        s.id,
        s.name,
        s.slug,
        s.description,
        s.is_active,
        COALESCE(SUM(i.amount), 0) as total_raised
      FROM startups s
      LEFT JOIN investments i ON s.id = i.startup_id
      WHERE s.is_active = true
      GROUP BY s.id
      ORDER BY total_raised DESC
    `);
    
    // Get all investments with investor names
    const investmentsResult = await pool.query(`
      SELECT 
        inv.id,
        inv.investor_id,
        investor.name as investor_name,
        inv.startup_id,
        inv.amount
      FROM investments inv
      JOIN investors investor ON inv.investor_id = investor.id
      ORDER BY inv.amount DESC
    `);
    
    // Get all investors with their stats
    const investorsResult = await pool.query(`
      SELECT 
        i.id,
        i.name,
        i.starting_credit,
        i.submitted,
        COALESCE(SUM(inv.amount), 0) as invested,
        i.starting_credit - COALESCE(SUM(inv.amount), 0) as remaining
      FROM investors i
      LEFT JOIN investments inv ON i.id = inv.investor_id
      GROUP BY i.id, i.name, i.starting_credit, i.submitted
      ORDER BY i.name
    `);
    
    return {
      isLocked,
      startups: startupsResult.rows,
      investments: investmentsResult.rows,
      investors: investorsResult.rows
    };
  } catch (error) {
    console.error('Error getting game state:', error);
    throw error;
  }
};

// ===== PUBLIC API ROUTES =====

// Join as investor
app.post('/api/join', async (req, res) => {
  const { name, email } = req.body;

  if (!name || name.trim() === '') {
    return res.status(400).json({ error: 'Name is required' });
  }

  if (!email || email.trim() === '') {
    return res.status(400).json({ error: 'Email is required' });
  }

  const trimmedName = name.trim();
  const trimmedEmail = email.trim();

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmedEmail)) {
    return res.status(400).json({ error: 'Please enter a valid email address' });
  }

  try {
    // Check if investor already exists by email (exact match, case-sensitive)
    const existing = await dbHelpers.getInvestorByEmail(trimmedEmail);

    if (existing) {
      // Allow rejoin - return existing investor
      console.log(`Investor rejoining: ${existing.name} (${existing.email})`);
      return res.json({ investor: existing, rejoined: true });
    }

    // Create new investor
    const investor = await dbHelpers.createInvestor(trimmedName, trimmedEmail);

    console.log(`New investor created: ${investor.name} (${investor.email})`);

    await broadcastGameState();

    res.json({ investor, rejoined: false });
  } catch (error) {
    console.error('Error creating investor:', error);
    if (error.message && error.message.includes('UNIQUE constraint failed')) {
      return res.status(400).json({ error: 'An account with this email already exists' });
    }
    res.status(500).json({ error: 'Failed to join game' });
  }
});

// Find investor by email AND name (for returning users) - auto-creates if not exists
app.post('/api/find-investor', async (req, res) => {
  const { email, name } = req.body;

  if (!email || email.trim() === '') {
    return res.status(400).json({ error: 'Email is required' });
  }

  if (!name || name.trim() === '') {
    return res.status(400).json({ error: 'Name is required' });
  }

  const trimmedEmail = email.trim();
  const trimmedName = name.trim();

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmedEmail)) {
    return res.status(400).json({ error: 'Please enter a valid email address' });
  }

  try {
    // Find investor by email AND name using helper function
    let investor = await dbHelpers.getInvestorByEmailOrName(trimmedEmail, trimmedName);

    if (!investor) {
      // Account doesn't exist - create it automatically
      console.log(`Creating new account for: ${trimmedName} (${trimmedEmail})`);

      investor = await dbHelpers.createInvestor(trimmedName, trimmedEmail);

      console.log(`New investor created: ${investor.name} (${investor.email})`);
      await broadcastGameState();

      return res.json({ investor, newAccount: true });
    }

    console.log(`Investor found: ${investor.name} (${investor.email})`);
    res.json({ investor, newAccount: false });
  } catch (error) {
    console.error('Error finding/creating investor:', error);
    if (error.message && error.message.includes('duplicate key') || error.message.includes('unique constraint')) {
      return res.status(400).json({ error: 'An account with this email already exists with a different name' });
    }
    res.status(500).json({ error: 'Failed to find or create investor' });
  }
});

// Get game state (for all users)
app.get('/api/game-state', async (req, res) => {
  try {
    const gameState = await getGameState();
    res.json(gameState);
  } catch (error) {
    console.error('Error getting game state:', error);
    res.status(500).json({ error: 'Failed to get game state' });
  }
});

// Get investor by ID
app.get('/api/investors/:id', async (req, res) => {
  const { id } = req.params;
  
  try {
    const investor = await dbHelpers.getInvestorById(id);
    
    if (!investor) {
      return res.status(404).json({ error: 'Investor not found' });
    }
    
    res.json({ investor });
  } catch (error) {
    console.error('Error getting investor:', error);
    res.status(500).json({ error: 'Failed to get investor' });
  }
});

// Make or update investment
app.post('/api/invest', async (req, res) => {
  const { investorId, startupId, amount } = req.body;
  
  try {
    // Check if game is locked
    const gameStateResult = await pool.query('SELECT is_locked FROM game_state WHERE id = 1');
    if (gameStateResult.rows.length > 0 && gameStateResult.rows[0].is_locked) {
      return res.status(403).json({ error: 'Game is locked. No more changes allowed.' });
    }
    
    if (!investorId || !startupId || amount === undefined) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    if (amount < 0) {
      return res.status(400).json({ error: 'Amount cannot be negative' });
    }
    
    // Get investor's starting credit, current investments, and count of unique startups invested in
    const investorQuery = await pool.query(`
      SELECT 
        i.starting_credit,
        COALESCE(SUM(CASE WHEN inv.startup_id != $1 THEN inv.amount ELSE 0 END), 0) as other_investments,
        COUNT(DISTINCT CASE WHEN inv.startup_id != $1 AND inv.amount > 0 THEN inv.startup_id END) as unique_startups_count
      FROM investors i
      LEFT JOIN investments inv ON i.id = inv.investor_id
      WHERE i.id = $2
      GROUP BY i.id, i.starting_credit
    `, [startupId, investorId]);
    
    if (investorQuery.rows.length === 0) {
      return res.status(404).json({ error: 'Investor not found' });
    }
    
    const investor = investorQuery.rows[0];
    const startingCredit = parseFloat(investor.starting_credit);
    const currentUniqueStartups = parseInt(investor.unique_startups_count);
    
    console.log('💰 Investment Check:', {
      investorId,
      startupId,
      requestedAmount: amount,
      startingCredit,
      otherInvestments: parseFloat(investor.other_investments),
      available: startingCredit - parseFloat(investor.other_investments),
      uniqueStartups: currentUniqueStartups
    });
    
    // Check if total investments would exceed starting credit
    const totalInvestments = parseFloat(investor.other_investments) + amount;
    if (totalInvestments > startingCredit) {
      return res.status(400).json({ 
        error: 'Insufficient funds',
        available: startingCredit - parseFloat(investor.other_investments)
      });
    }
    
    // Business Rule: Check maximum startup investment limits based on account balance
    // If trying to add a NEW investment (amount > 0) to a startup they haven't invested in yet
    const existingInvestment = await dbHelpers.getExistingInvestment(startupId, investorId);
    const isNewStartup = !existingInvestment || existingInvestment.amount === 0;
    
    if (amount > 0 && isNewStartup) {
      let maxStartups;
      
      if (startingCredit < 10000) {
        maxStartups = 2;
      } else if (startingCredit >= 10000 && startingCredit < 15000) {
        maxStartups = 3;
      } else if (startingCredit >= 15000 && startingCredit < 20000) {
        maxStartups = 4;
      } else {
        maxStartups = Infinity; // No limit for 20k+
      }
      
      if (currentUniqueStartups >= maxStartups) {
        return res.status(400).json({ 
          error: `Maximum startup limit reached. With ${formatCurrency(startingCredit)} capital, you can invest in up to ${maxStartups} startup${maxStartups !== 1 ? 's' : ''}.`,
          maxStartups
        });
      }
    }
    
    // Use helper to create or update investment
    await dbHelpers.createOrUpdateInvestment(investorId, startupId, amount);
    
    await broadcastGameState();
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error making investment:', error);
    res.status(500).json({ error: 'Failed to make investment' });
  }
});

// Submit investments (finalize choices)
app.post('/api/submit', async (req, res) => {
  const { investorId } = req.body;

  if (!investorId) {
    return res.status(400).json({ error: 'Investor ID is required' });
  }

  try {
    // Mark investor as submitted using helper
    await dbHelpers.submitInvestments(investorId);

    await broadcastGameState();

    res.json({ success: true, message: 'Investments submitted successfully!' });
  } catch (error) {
    console.error('Error submitting investments:', error);
    res.status(500).json({ error: 'Failed to submit investments' });
  }
});

// ===== FUNDS REQUESTS =====

// Submit funds request (investor)
app.post('/api/funds-request', async (req, res) => {
  const { investorId, requestedAmount, justification } = req.body;

  if (!investorId || !requestedAmount || !justification) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  if (requestedAmount <= 0) {
    return res.status(400).json({ error: 'Requested amount must be positive' });
  }

  try {
    const investor = await dbHelpers.getInvestorById(investorId);

    if (!investor) {
      return res.status(404).json({ error: 'Investor not found' });
    }

    const request = await dbHelpers.createFundRequest(
      investorId,
      requestedAmount,
      justification
    );

    res.json({ success: true, requestId: request.id });
  } catch (error) {
    console.error('Error creating funds request:', error);
    res.status(500).json({ error: 'Failed to create request' });
  }
});

// Get investor's funds requests
app.get('/api/investors/:id/funds-requests', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(`
      SELECT * FROM fund_requests
      WHERE investor_id = $1
      ORDER BY created_at DESC
    `, [id]);

    res.json({ requests: result.rows });
  } catch (error) {
    console.error('Error fetching funds requests:', error);
    res.status(500).json({ error: 'Failed to fetch requests' });
  }
});

// ===== FILE UPLOAD =====
// Upload file endpoint (admin)
app.post('/api/admin/upload', adminAuth, upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const fileUrl = `/uploads/${req.file.filename}`;
    res.json({ 
      success: true, 
      url: fileUrl,
      filename: req.file.filename,
      originalName: req.file.originalname
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({ error: 'Failed to upload file' });
  }
});

// ===== ADMIN API ROUTES =====

// Get all investors (admin)
app.get('/api/admin/investors', adminAuth, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        i.id,
        i.name,
        i.starting_credit,
        i.submitted,
        COALESCE(SUM(inv.amount), 0) as invested,
        i.starting_credit - COALESCE(SUM(inv.amount), 0) as remaining,
        i.created_at
      FROM investors i
      LEFT JOIN investments inv ON i.id = inv.investor_id
      GROUP BY i.id, i.name, i.starting_credit, i.submitted, i.created_at
      ORDER BY i.created_at DESC
    `);
    
    res.json({ investors: result.rows });
  } catch (error) {
    console.error('Error getting investors:', error);
    res.status(500).json({ error: 'Failed to get investors' });
  }
});

// Update investor credit (admin)
app.put('/api/admin/investors/:id/credit', adminAuth, async (req, res) => {
  const { id } = req.params;
  const { startingCredit } = req.body;
  
  if (startingCredit === undefined || startingCredit < 0) {
    return res.status(400).json({ error: 'Invalid starting credit' });
  }
  
  try {
    await dbHelpers.updateInvestorCredit(id, startingCredit);
    
    await broadcastGameState();
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating investor credit:', error);
    res.status(500).json({ error: 'Failed to update credit' });
  }
});

// Delete investor (admin)
app.delete('/api/admin/investors/:id', adminAuth, async (req, res) => {
  const { id } = req.params;

  console.log('=== DELETE INVESTOR REQUEST ===');
  console.log('Investor ID:', id);
  console.log('Request Headers:', req.headers);

  try {
    // First check if investor exists
    const investor = await dbHelpers.getInvestorById(id);

    if (!investor) {
      console.log('ERROR: Investor not found with ID:', id);
      return res.status(404).json({ error: 'Investor not found' });
    }

    console.log('Found investor to delete:', investor);

    // Delete the investor using helper (CASCADE will handle related records)
    await dbHelpers.deleteInvestor(id);

    console.log('Successfully deleted investor:', investor.name);

    await broadcastGameState();

    res.json({ success: true, deleted: investor.name });
  } catch (error) {
    console.error('ERROR deleting investor:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ error: 'Failed to delete investor: ' + error.message });
  }
});

// Get all startups (admin)
app.get('/api/admin/startups', adminAuth, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        s.id,
        s.name,
        s.slug,
        s.description,
        s.is_active,
        COALESCE(SUM(i.amount), 0) as total_raised,
        COUNT(DISTINCT i.investor_id) as investor_count,
        s.created_at
      FROM startups s
      LEFT JOIN investments i ON s.id = i.startup_id
      GROUP BY s.id, s.name, s.slug, s.description, s.is_active, s.created_at
      ORDER BY s.created_at DESC
    `);
    
    res.json({ startups: result.rows });
  } catch (error) {
    console.error('Error getting startups:', error);
    res.status(500).json({ error: 'Failed to get startups' });
  }
});

// Create startup (admin)
app.post('/api/admin/startups', adminAuth, async (req, res) => {
  const { name, slug, description, logo, pitch_deck, cohort, support_program, industry, email, team, generating_revenue, ask, legal_entity } = req.body;
  
  if (!name || !slug) {
    return res.status(400).json({ error: 'Name and slug are required' });
  }
  
  try {
    const id = await dbHelpers.createStartup({
      name,
      slug,
      description: description || '',
      logo: logo || '',
      pitch_deck: pitch_deck || '',
      cohort: cohort || '',
      support_program: support_program || '',
      industry: industry || '',
      email: email || '',
      team: team || '',
      generating_revenue: generating_revenue || '',
      ask: ask || '',
      legal_entity: legal_entity || ''
    });
    
    await broadcastGameState();
    
    res.json({ success: true, id });
  } catch (error) {
    if (error.message.includes('UNIQUE')) {
      return res.status(400).json({ error: 'Slug already exists' });
    }
    console.error('Error creating startup:', error);
    res.status(500).json({ error: 'Failed to create startup' });
  }
});

// Update startup (admin)
app.put('/api/admin/startups/:id', adminAuth, async (req, res) => {
  const { id } = req.params;
  const { name, slug, description, logo, pitch_deck, cohort, support_program, industry, email, team, generating_revenue, ask, legal_entity, isActive } = req.body;
  
  try {
    await dbHelpers.updateStartup(id, {
      name,
      slug,
      description,
      logo,
      pitch_deck,
      cohort,
      support_program,
      industry,
      email,
      team,
      generating_revenue,
      ask,
      legal_entity,
      is_active: isActive
    });
    
    await broadcastGameState();
    
    res.json({ success: true });
  } catch (error) {
    if (error.message && (error.message.includes('duplicate key') || error.message.includes('unique constraint'))) {
      return res.status(400).json({ error: 'Slug already exists' });
    }
    console.error('Error updating startup:', error);
    res.status(500).json({ error: 'Failed to update startup' });
  }
});

// Delete startup (admin)
app.delete('/api/admin/startups/:id', adminAuth, async (req, res) => {
  const { id } = req.params;
  
  try {
    await dbHelpers.deleteStartup(id);
    
    await broadcastGameState();
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting startup:', error);
    res.status(500).json({ error: 'Failed to delete startup' });
  }
});

// Toggle game lock (admin)
app.post('/api/admin/toggle-lock', adminAuth, async (req, res) => {
  try {
    const isLocked = await dbHelpers.toggleGameLock();
    
    await broadcastGameState();
    
    res.json({ success: true, isLocked });
  } catch (error) {
    console.error('Error toggling lock:', error);
    res.status(500).json({ error: 'Failed to toggle lock' });
  }
});

// Get game statistics (admin)
app.get('/api/admin/stats', adminAuth, async (req, res) => {
  try {
    const stats = await dbHelpers.getAdminStats();

    res.json({ stats });
  } catch (error) {
    console.error('Error getting stats:', error);
    res.status(500).json({ error: 'Failed to get stats' });
  }
});

// Get all funds requests (admin)
app.get('/api/admin/funds-requests', adminAuth, async (req, res) => {
  try {
    const { status } = req.query;

    const requests = await dbHelpers.getAllFundRequests(status);

    res.json({ requests });
  } catch (error) {
    console.error('Error fetching funds requests:', error);
    res.status(500).json({ error: 'Failed to fetch funds requests' });
  }
});

// Approve funds request (admin)
app.post('/api/admin/funds-requests/:id/approve', adminAuth, async (req, res) => {
  const { id } = req.params;
  const { adminResponse, reviewedBy } = req.body;

  try {
    // Get the request
    const result = await pool.query('SELECT * FROM fund_requests WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Request not found' });
    }

    const request = result.rows[0];

    if (request.status !== 'pending') {
      return res.status(400).json({ error: 'Request has already been reviewed' });
    }

    // Get current investor credit
    const investor = await dbHelpers.getInvestorById(request.investor_id);
    
    if (!investor) {
      return res.status(404).json({ error: 'Investor not found' });
    }

    // Calculate new credit: current + requested amount
    const newCredit = investor.starting_credit + request.amount;
    
    console.log('💰 Approving fund request:', {
      investorId: request.investor_id,
      currentCredit: investor.starting_credit,
      requestedAmount: request.amount,
      newCredit
    });
    
    // Update investor's starting credit to the new total
    await dbHelpers.updateInvestorCredit(request.investor_id, newCredit);

    // Update request status
    await dbHelpers.updateFundRequestStatus(
      id,
      'approved',
      adminResponse || 'Approved',
      reviewedBy || 'admin'
    );

    await broadcastGameState();

    res.json({ success: true, newCredit });
  } catch (error) {
    console.error('Error approving funds request:', error);
    res.status(500).json({ error: 'Failed to approve request' });
  }
});

// Reject funds request (admin)
app.post('/api/admin/funds-requests/:id/reject', adminAuth, async (req, res) => {
  const { id } = req.params;
  const { adminResponse, reviewedBy } = req.body;

  try {
    // Get the request
    const result = await pool.query('SELECT * FROM fund_requests WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Request not found' });
    }

    const request = result.rows[0];

    if (request.status !== 'pending') {
      return res.status(400).json({ error: 'Request has already been reviewed' });
    }

    // Update request status
    await dbHelpers.updateFundRequestStatus(
      id,
      'rejected',
      adminResponse || 'Rejected',
      reviewedBy || 'admin'
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Error rejecting funds request:', error);
    res.status(500).json({ error: 'Failed to reject request' });
  }
});

// ===== SOCKET.IO =====

io.on('connection', async (socket) => {
  console.log('Client connected:', socket.id);
  
  // Send current game state to newly connected client
  const gameState = await getGameState();
  socket.emit('gameStateUpdate', gameState);
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// ===== START SERVER =====

// Initialize and seed database on startup
const initializeDatabaseOnStartup = async () => {
  console.log('🔍 Initializing database...');
  try {
    // Initialize schema (this also seeds if needed)
    await initializeDatabase();
    
    console.log('✅ Database ready');
  } catch (error) {
    console.error('❌ Error initializing database:', error);
    console.error('Stack trace:', error.stack);
  }
};

// Serve React app in production
const isProduction = process.env.NODE_ENV === 'production';
console.log('🌍 Environment:', process.env.NODE_ENV || 'development');
console.log('📦 Production mode:', isProduction);

const clientDistPath = path.join(__dirname, '../client/dist');
const indexPath = path.join(clientDistPath, 'index.html');

// Check if client build exists
console.log('🔍 Checking for client build at:', clientDistPath);
const clientExists = fs.existsSync(clientDistPath);
const indexExists = fs.existsSync(indexPath);

console.log('📁 Client dist exists:', clientExists);
console.log('📄 index.html exists:', indexExists);

if (clientExists) {
  console.log('✅ Serving static files from:', clientDistPath);
  app.use(express.static(clientDistPath));
} else {
  console.error('❌ Client build directory NOT found:', clientDistPath);
  console.error('💡 Run "npm run build" to build the client');
}

// Serve React app for any non-API routes (catch-all must be last)
app.get('*', (req, res) => {
  console.log('🌐 Catch-all route hit:', req.path);
  
  if (indexExists) {
    console.log('📤 Sending index.html');
    res.sendFile(indexPath);
  } else {
    console.error('❌ index.html not found at:', indexPath);
    res.status(503).send(`
      <html>
        <head><title>Build Required</title></head>
        <body style="font-family: Arial; padding: 40px; text-align: center;">
          <h1>🚧 Client Not Built</h1>
          <p>The client application needs to be built.</p>
          <p>Expected path: ${clientDistPath}</p>
          <p>Index.html exists: ${indexExists}</p>
          <p>NODE_ENV: ${process.env.NODE_ENV || 'not set'}</p>
        </body>
      </html>
    `);
  }
});

server.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  
  if (process.env.NODE_ENV === 'production') {
    console.log('Running in PRODUCTION mode');
    console.log('Serving client from /client/dist');
    if (ADMIN_PASSWORD === 'demo123') {
      console.warn('⚠️  SECURITY WARNING: Change admin password immediately!');
    }
  } else {
    console.log(`Admin credentials: ${ADMIN_USERNAME} / ${ADMIN_PASSWORD}`);
  }
  
  // Initialize and seed database after server starts
  await initializeDatabaseOnStartup();
});
