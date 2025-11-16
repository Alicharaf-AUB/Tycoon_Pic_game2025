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
const APP_ACCESS_PASSWORD = process.env.APP_ACCESS_PASSWORD || 'Ipark@aim@2025';

// Store for valid access tokens (in production, use Redis or database)
const validAccessTokens = new Set();

// Trust proxy to get real IP addresses from Railway/proxies
app.set('trust proxy', true);

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

// Use persistent storage for uploads
// IMPORTANT: On Railway, configure a Volume with mount path: /app/data
// This ensures uploaded files persist across container restarts
const dataDir = process.env.DATA_DIR || path.join(__dirname, '../data');
const uploadDir = path.join(dataDir, 'uploads');

console.log('🔧 Storage Configuration:');
console.log('   DATA_DIR:', dataDir);
console.log('   UPLOAD_DIR:', uploadDir);
console.log('   Is Railway:', !!process.env.RAILWAY_ENVIRONMENT);

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log(`✅ Created uploads directory: ${uploadDir}`);
} else {
  console.log(`✅ Uploads directory exists: ${uploadDir}`);
  // List files in upload directory
  try {
    const files = fs.readdirSync(uploadDir);
    console.log(`📂 Uploaded files (${files.length}):`, files.slice(0, 10).join(', '), files.length > 10 ? '...' : '');
    
    if (process.env.RAILWAY_ENVIRONMENT && files.length === 0) {
      console.warn('⚠️  WARNING: Running on Railway with empty uploads directory!');
      console.warn('⚠️  Make sure you have configured a Railway Volume at mount path: /app/data');
      console.warn('⚠️  Without a volume, all uploaded files will be LOST on container restart!');
    }
  } catch (err) {
    console.error('❌ Error reading upload directory:', err);
  }
}

// ===== APP ACCESS PASSWORD PROTECTION =====
// Endpoint to verify app access password
app.post('/api/verify-app-access', (req, res) => {
  const { password } = req.body;

  if (password === APP_ACCESS_PASSWORD) {
    // Generate a unique access token
    const accessToken = uuidv4();
    validAccessTokens.add(accessToken);

    console.log('✅ App access granted');
    res.json({
      success: true,
      accessToken,
      message: 'Access granted'
    });
  } else {
    console.log('❌ App access denied - incorrect password');
    res.status(401).json({
      success: false,
      message: 'Incorrect password'
    });
  }
});

// Middleware to check app access token on all routes
const checkAppAccess = (req, res, next) => {
  // Skip check for password verification endpoint
  if (req.path === '/api/verify-app-access') {
    return next();
  }

  // Skip check for static files in production build
  if (req.path.startsWith('/_vite') || req.path.startsWith('/src') || req.path.startsWith('/node_modules')) {
    return next();
  }

  // Get token from header
  const accessToken = req.headers['x-app-access-token'];

  if (!accessToken || !validAccessTokens.has(accessToken)) {
    return res.status(403).json({
      error: 'App access denied. Please enter the app password.'
    });
  }

  next();
};

// Apply access check to all /api routes (except verify-app-access and admin routes)
app.use('/api', (req, res, next) => {
  // Skip password check for password verification endpoint
  if (req.path === '/verify-app-access') {
    return next();
  }

  // Skip password check for ALL admin routes - admins use their own auth
  if (req.path.startsWith('/admin')) {
    return next();
  }

  // Regular routes require app password
  checkAppAccess(req, res, next);
});

// Serve uploaded files (with access check)
app.use('/uploads', (req, res, next) => {
  // Check access token from query param or header
  const accessToken = req.query.token || req.headers['x-app-access-token'];

  if (!accessToken || !validAccessTokens.has(accessToken)) {
    return res.status(403).json({
      error: 'App access denied. Please enter the app password.'
    });
  }

  console.log('📁 File request:', req.path);
  next();
}, express.static(uploadDir, {
  setHeaders: (res, path) => {
    // Set CORS headers for uploaded files
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    console.log('📤 Serving file:', path);
  }
}));

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
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB limit
  fileFilter: (req, file, cb) => {
    // Check file extension
    const allowedExtensions = /\.(jpeg|jpg|png|pdf|ppt|pptx|doc|docx)$/i;
    const hasValidExtension = allowedExtensions.test(file.originalname.toLowerCase());
    
    // Check MIME type
    const allowedMimeTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'application/pdf',
      'application/vnd.ms-powerpoint', // .ppt
      'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
      'application/msword', // .doc
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document' // .docx
    ];
    const hasValidMimeType = allowedMimeTypes.includes(file.mimetype);
    
    console.log('📤 File upload attempt:', {
      filename: file.originalname,
      mimetype: file.mimetype,
      hasValidExtension,
      hasValidMimeType
    });
    
    if (hasValidExtension && hasValidMimeType) {
      return cb(null, true);
    }
    
    cb(new Error(`File type not allowed. Got: ${file.mimetype}`));
  }
});

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/dist')));
}

// Helper function to get client IP address
const getClientIp = (req) => {
  // With trust proxy enabled, Express provides req.ip
  if (req.ip) {
    return req.ip;
  }
  
  // Fallback: Check various headers for IP (in order of priority)
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    // x-forwarded-for can contain multiple IPs, take the first one
    return forwarded.split(',')[0].trim();
  }

  return req.headers['x-real-ip'] ||
         req.connection?.remoteAddress ||
         req.socket?.remoteAddress ||
         req.connection?.socket?.remoteAddress ||
         'unknown';
};

// Basic Auth Middleware for Admin
const adminAuth = (req, res, next) => {
  const credentials = basicAuth(req);

  // Capture IP address
  const clientIp = getClientIp(req);
  req.adminIp = clientIp;
  req.adminUsername = credentials?.name || 'admin';

  console.log('=== ADMIN AUTH CHECK ===');
  console.log('Request path:', req.method, req.path);
  console.log('Client IP:', clientIp);
  console.log('Credentials provided:', credentials ? `Yes (user: ${credentials.name})` : 'No');

  if (!credentials || credentials.name !== ADMIN_USERNAME || credentials.pass !== ADMIN_PASSWORD) {
    console.log('AUTH FAILED - Invalid credentials');
    console.log('Expected username:', ADMIN_USERNAME);
    console.log('Provided username:', credentials?.name || 'none');
    res.set('WWW-Authenticate', 'Basic realm="Admin Area"');
    return res.status(401).json({ error: 'Authentication required' });
  }

  console.log('AUTH SUCCESS - IP:', clientIp);
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
        s.logo,
        s.pitch_deck,
        s.cohort,
        s.support_program,
        s.industry,
        s.email,
        s.team,
        s.generating_revenue,
        s.ask,
        s.legal_entity,
        s.is_active,
        COALESCE(SUM(i.amount), 0) as total_raised
      FROM startups s
      LEFT JOIN investments i ON s.id = i.startup_id
      WHERE s.is_active = true
      GROUP BY s.id, s.name, s.slug, s.description, s.logo, s.pitch_deck, 
               s.cohort, s.support_program, s.industry, s.email, s.team, 
               s.generating_revenue, s.ask, s.legal_entity, s.is_active
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
    
    // No startup limit - investors can invest in as many startups as they want
    // Only requirement is 500€ increments (validated on frontend)
    
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
    // Get investor details
    const investor = await dbHelpers.getInvestorById(investorId);
    
    if (!investor) {
      return res.status(404).json({ error: 'Investor not found' });
    }
    
    // Calculate actual invested amount from investments table (real-time)
    const investmentsResult = await pool.query(
      'SELECT COALESCE(SUM(amount), 0) as total FROM investments WHERE investor_id = $1',
      [investorId]
    );
    const totalInvested = parseFloat(investmentsResult.rows[0].total) || 0;
    const remaining = investor.starting_credit - totalInvested;
    
    console.log('💰 Finalization check:', {
      investorId,
      starting_credit: investor.starting_credit,
      totalInvested,
      remaining,
      cachedInvested: investor.other_investments
    });
    
    // Require all funds to be invested before finalizing
    if (remaining > 0) {
      return res.status(400).json({ 
        error: `You must invest all available funds before finalizing. You still have ${formatCurrency(remaining)} remaining.`,
        remaining
      });
    }
    
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

// DISABLED: Fund request functionality removed - investors have predefined budgets only
// Submit funds request (investor)
// app.post('/api/funds-request', async (req, res) => {
//   const { investorId, requestedAmount, justification } = req.body;
//
//   if (!investorId || !requestedAmount || !justification) {
//     return res.status(400).json({ error: 'Missing required fields' });
//   }
//
//   if (requestedAmount <= 0) {
//     return res.status(400).json({ error: 'Requested amount must be positive' });
//   }
//
//   try {
//     const investor = await dbHelpers.getInvestorById(investorId);
//
//     if (!investor) {
//       return res.status(404).json({ error: 'Investor not found' });
//     }
//
//     const request = await dbHelpers.createFundRequest(
//       investorId,
//       requestedAmount,
//       justification
//     );
//
//     res.json({ success: true, requestId: request.id });
//   } catch (error) {
//     console.error('Error creating funds request:', error);
//     res.status(500).json({ error: 'Failed to create request' });
//   }
// });

// Get investor's funds requests
// app.get('/api/investors/:id/funds-requests', async (req, res) => {
//   const { id } = req.params;
//
//   try {
//     const result = await pool.query(`
//       SELECT * FROM fund_requests
//       WHERE investor_id = $1
//       ORDER BY created_at DESC
//     `, [id]);
//
//     res.json({ requests: result.rows });
//   } catch (error) {
//     console.error('Error fetching funds requests:', error);
//     res.status(500).json({ error: 'Failed to fetch requests' });
//   }
// });

// ===== ERROR LOGGING =====
// Log client-side errors
app.post('/api/log-error', async (req, res) => {
  const { investorId, investorName, investorEmail, errorType, errorMessage, errorStack, pageUrl, userAgent } = req.body;
  const clientIp = getClientIp(req);

  try {
    await pool.query(`
      INSERT INTO error_logs (investor_id, investor_name, investor_email, error_type, error_message, error_stack, page_url, user_agent, ip_address)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    `, [investorId || null, investorName || null, investorEmail || null, errorType, errorMessage, errorStack || null, pageUrl, userAgent, clientIp]);

    console.log('📝 Error logged:', errorType, '-', errorMessage.substring(0, 50));
    res.json({ success: true });
  } catch (error) {
    console.error('Error logging error:', error);
    // Don't fail the request if logging fails
    res.json({ success: false });
  }
});

// Get all error logs (admin only)
app.get('/api/admin/error-logs', adminAuth, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 500;

    const result = await pool.query(`
      SELECT * FROM error_logs
      ORDER BY timestamp DESC
      LIMIT $1
    `, [limit]);

    res.json({ logs: result.rows });
  } catch (error) {
    console.error('Error fetching error logs:', error);
    res.status(500).json({ error: 'Failed to fetch error logs' });
  }
});

// ===== FILE UPLOAD =====
// Upload file endpoint (admin)
app.post('/api/admin/upload', adminAuth, (req, res) => {
  upload.single('file')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      console.error('❌ Multer error:', err);
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'File too large. Maximum size is 100MB.' });
      }
      return res.status(400).json({ error: err.message });
    } else if (err) {
      console.error('❌ Upload error:', err);
      return res.status(400).json({ error: err.message });
    }
    
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }
      
      const fileUrl = `/uploads/${req.file.filename}`;
      console.log('✅ File uploaded successfully:', {
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
        url: fileUrl
      });
      
      res.json({ 
        success: true, 
        url: fileUrl,
        filename: req.file.filename,
        originalName: req.file.originalname
      });
    } catch (error) {
      console.error('❌ Error processing upload:', error);
      res.status(500).json({ error: 'Failed to upload file' });
    }
  });
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
        s.logo,
        s.pitch_deck,
        s.cohort,
        s.support_program,
        s.industry,
        s.email,
        s.team,
        s.generating_revenue,
        s.ask,
        s.legal_entity,
        s.is_active,
        COALESCE(SUM(i.amount), 0) as total_raised,
        COUNT(DISTINCT i.investor_id) as investor_count,
        s.created_at
      FROM startups s
      LEFT JOIN investments i ON s.id = i.startup_id
      GROUP BY s.id, s.name, s.slug, s.description, s.logo, s.pitch_deck, 
               s.cohort, s.support_program, s.industry, s.email, s.team, 
               s.generating_revenue, s.ask, s.legal_entity, s.is_active, s.created_at
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
  
  console.log('📝 Creating startup with:', {
    name,
    slug,
    logo: logo || '(none)',
    pitch_deck: pitch_deck || '(none)',
    description: description?.substring(0, 50) + '...'
  });
  
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
    
    console.log('✅ Startup created successfully with ID:', id);
    
    await broadcastGameState();
    
    res.json({ success: true, id });
  } catch (error) {
    if (error.message.includes('UNIQUE')) {
      return res.status(400).json({ error: 'Slug already exists' });
    }
    console.error('❌ Error creating startup:', error);
    res.status(500).json({ error: 'Failed to create startup' });
  }
});

// Update startup (admin)
app.put('/api/admin/startups/:id', adminAuth, async (req, res) => {
  const { id } = req.params;
  const { name, slug, description, logo, pitch_deck, cohort, support_program, industry, email, team, generating_revenue, ask, legal_entity, isActive } = req.body;
  
  console.log('📝 Updating startup', id, 'with:', {
    name,
    slug,
    logo: logo || '(none)',
    pitch_deck: pitch_deck || '(none)',
    isActive
  });
  
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
    
    console.log('✅ Startup updated successfully');
    
    await broadcastGameState();
    
    res.json({ success: true });
  } catch (error) {
    if (error.message && (error.message.includes('duplicate key') || error.message.includes('unique constraint'))) {
      return res.status(400).json({ error: 'Slug already exists' });
    }
    console.error('❌ Error updating startup:', error);
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

// Get admin logs (admin)
app.get('/api/admin/logs', adminAuth, async (req, res) => {
  try {
    const { limit = 100, action } = req.query;
    
    let query = 'SELECT * FROM admin_logs';
    const params = [];
    
    if (action) {
      query += ' WHERE action = $1';
      params.push(action);
    }
    
    query += ' ORDER BY timestamp DESC LIMIT $' + (params.length + 1);
    params.push(parseInt(limit));
    
    const result = await pool.query(query, params);
    
    res.json({ logs: result.rows });
  } catch (error) {
    console.error('Error fetching admin logs:', error);
    res.status(500).json({ error: 'Failed to fetch logs' });
  }
});

// DISABLED: Fund request functionality removed
// Get all funds requests (admin)
// app.get('/api/admin/funds-requests', adminAuth, async (req, res) => {
//   try {
//     const { status } = req.query;
//
//     const requests = await dbHelpers.getAllFundRequests(status);
//
//     res.json({ requests });
//   } catch (error) {
//     console.error('Error fetching funds requests:', error);
//     res.status(500).json({ error: 'Failed to fetch funds requests' });
//   }
// });

// // Approve funds request (admin)
// app.post('/api/admin/funds-requests/:id/approve', adminAuth, async (req, res) => {
//   const { id } = req.params;
//   const { adminResponse, reviewedBy } = req.body;
// 
//   try {
//     // Get the request
//     const result = await pool.query('SELECT * FROM fund_requests WHERE id = $1', [id]);
// 
//     if (result.rows.length === 0) {
//       console.error('Fund request not found:', id);
//       return res.status(404).json({ error: 'Request not found' });
//     }
// 
//     const request = result.rows[0];
//     
//     console.log('📋 Fund request found:', {
//       id: request.id,
//       investorId: request.investor_id,
//       amount: request.amount,
//       status: request.status
//     });
// 
//     if (request.status !== 'pending') {
//       console.error('Request already reviewed:', request.status);
//       return res.status(400).json({ error: 'Request has already been reviewed' });
//     }
// 
//     // Get current investor credit
//     const investor = await dbHelpers.getInvestorById(request.investor_id);
//     
//     if (!investor) {
//       console.error('Investor not found:', request.investor_id);
//       return res.status(404).json({ error: 'Investor not found' });
//     }
// 
//     // Calculate new credit: current + requested amount
//     const newCredit = investor.starting_credit + request.amount;
//     
//     console.log('💰 Approving fund request:', {
//       investorId: request.investor_id,
//       investorName: investor.name,
//       currentCredit: investor.starting_credit,
//       requestedAmount: request.amount,
//       newCredit,
//       reviewedBy
//     });
//     
//     // Update investor's starting credit to the new total
//     console.log('🔄 Updating investor credit...');
//     await dbHelpers.updateInvestorCredit(request.investor_id, newCredit);
//     console.log('✅ Investor credit updated');
//     
//     // Unlock investor portfolio so they can invest the new funds
//     console.log('🔓 Unlocking investor portfolio...');
//     await pool.query('UPDATE investors SET submitted = false WHERE id = $1', [request.investor_id]);
//     console.log('✅ Investor portfolio unlocked - can now make additional investments');
// 
//     // Update request status
//     console.log('🔄 Updating fund request status...');
//     await dbHelpers.updateFundRequestStatus(
//       id,
//       'approved',
//       adminResponse || 'Approved',
//       reviewedBy || 'admin'
//     );
//     console.log('✅ Fund request status updated');
// 
//     // Log the admin action for audit trail
//     await dbHelpers.createAdminLog('FUND_REQUEST_APPROVED', {
//       requestId: id,
//       investorId: request.investor_id,
//       investorName: investor.name,
//       investorEmail: investor.email,
//       previousCredit: investor.starting_credit,
//       amountAdded: request.amount,
//       newCredit: newCredit,
//       reviewedBy: reviewedBy || 'admin',
//       adminResponse: adminResponse || 'Approved',
//       timestamp: new Date().toISOString()
//     }, req.adminIp);
//     console.log('📝 Approval logged from IP:', req.adminIp);
// 
//     await broadcastGameState();
// 
//     res.json({ 
//       success: true, 
//       newCredit,
//       message: `Successfully added ${request.amount} to ${investor.name}'s account. New total: ${newCredit}`
//     });
//   } catch (error) {
//     console.error('Error approving funds request:', error);
//     console.error('Error details:', error.message);
//     console.error('Error stack:', error.stack);
//     res.status(500).json({ 
//       error: 'Failed to approve request', 
//       details: error.message,
//       requestId: id 
//     });
//   }
// });
// 
// // Reject funds request (admin)
// app.post('/api/admin/funds-requests/:id/reject', adminAuth, async (req, res) => {
//   const { id } = req.params;
//   const { adminResponse, reviewedBy } = req.body;
// 
//   try {
//     // Get the request
//     const result = await pool.query('SELECT * FROM fund_requests WHERE id = $1', [id]);
// 
//     if (result.rows.length === 0) {
//       return res.status(404).json({ error: 'Request not found' });
//     }
// 
//     const request = result.rows[0];
// 
//     if (request.status !== 'pending') {
//       return res.status(400).json({ error: 'Request has already been reviewed' });
//     }
// 
//     // Get investor info for logging
//     const investor = await dbHelpers.getInvestorById(request.investor_id);
// 
//     // Update request status
//     await dbHelpers.updateFundRequestStatus(
//       id,
//       'rejected',
//       adminResponse || 'Rejected',
//       reviewedBy || 'admin'
//     );
// 
//     // Log the admin action for audit trail
//     await dbHelpers.createAdminLog('FUND_REQUEST_REJECTED', {
//       requestId: id,
//       investorId: request.investor_id,
//       investorName: investor?.name,
//       investorEmail: investor?.email,
//       requestedAmount: request.amount,
//       reviewedBy: reviewedBy || 'admin',
//       adminResponse: adminResponse || 'Rejected',
//       timestamp: new Date().toISOString()
//     }, req.adminIp);
//     console.log('📝 Rejection logged from IP:', req.adminIp);
// 
//     await broadcastGameState();
// 
//     res.json({ success: true, message: `Fund request rejected for ${investor?.name}` });
//   } catch (error) {
//     console.error('Error rejecting funds request:', error);
//     console.error('Error details:', error.message);
//     console.error('Error stack:', error.stack);
//     res.status(500).json({
//       error: 'Failed to reject request',
//       details: error.message,
//       requestId: id
//     });
//   }
// });
// 
// // Delete funds request
// app.delete('/api/admin/funds-requests/:id', adminAuth, async (req, res) => {
//   const { id } = req.params;
// 
//   try {
//     // Check if the request exists and get its details
//     const result = await pool.query(`
//       SELECT fr.*, i.name as investor_name, i.email as investor_email
//       FROM fund_requests fr
//       JOIN investors i ON fr.investor_id = i.id
//       WHERE fr.id = $1
//     `, [id]);
// 
//     if (result.rows.length === 0) {
//       return res.status(404).json({ error: 'Request not found' });
//     }
// 
//     const request = result.rows[0];
// 
//     // Log the admin action for audit trail
//     await dbHelpers.createAdminLog('FUND_REQUEST_DELETED', {
//       requestId: id,
//       investorId: request.investor_id,
//       investorName: request.investor_name,
//       investorEmail: request.investor_email,
//       requestedAmount: request.amount,
//       requestStatus: request.status,
//       deletedBy: req.adminUsername || 'admin',
//       timestamp: new Date().toISOString()
//     }, req.adminIp);
//     console.log('📝 Deletion logged from IP:', req.adminIp, {
//       requestId: id,
//       investor: request.investor_name,
//       amount: request.amount,
//       status: request.status
//     });
// 
//     // Delete the request
//     await pool.query('DELETE FROM fund_requests WHERE id = $1', [id]);
// 
//     // Broadcast the updated game state
//     const gameState = await getGameState();
//     io.emit('gameStateUpdate', gameState);
// 
//     res.json({ success: true, message: `Fund request deleted successfully for ${request.investor_name}` });
//   } catch (error) {
//     console.error('Error deleting funds request:', error);
//     console.error('Error details:', error.message);
//     console.error('Error stack:', error.stack);
//     res.status(500).json({
//       error: 'Failed to delete request',
//       details: error.message,
//       requestId: id
//     });
//   }
// });

// ===== SOCKET.IO =====

// Socket.IO middleware to check app access (optional for admins)
io.use((socket, next) => {
  const accessToken = socket.handshake.auth.accessToken;

  if (!accessToken || !validAccessTokens.has(accessToken)) {
    console.log('⚠️ Socket connection without valid app access token (may be admin)');
    // Allow connection but mark it as unauthenticated
    // Admins can still connect to see real-time updates if they want
  }

  next();
});

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
    // Initialize schema first (creates tables if they don't exist)
    await initializeDatabase();
    console.log('✅ Database schema initialized');
    
    // Check and add missing columns if needed
    console.log('🔄 Checking database schema for missing columns...');
    
    // Check startup table columns
    const startupColumns = [
      { name: 'logo', type: 'VARCHAR(500) DEFAULT \'\'', description: 'Startup logo URL' },
      { name: 'pitch_deck', type: 'VARCHAR(500) DEFAULT \'\'', description: 'Pitch deck URL' },
      { name: 'cohort', type: 'VARCHAR(100) DEFAULT \'\'', description: 'Cohort name' },
      { name: 'support_program', type: 'VARCHAR(100) DEFAULT \'\'', description: 'Support program' },
      { name: 'industry', type: 'VARCHAR(100) DEFAULT \'\'', description: 'Industry' },
      { name: 'email', type: 'VARCHAR(255) DEFAULT \'\'', description: 'Contact email' },
      { name: 'team', type: 'TEXT DEFAULT \'\'', description: 'Team info' },
      { name: 'generating_revenue', type: 'TEXT DEFAULT \'\'', description: 'Revenue status' },
      { name: 'ask', type: 'TEXT DEFAULT \'\'', description: 'Funding ask' },
      { name: 'legal_entity', type: 'TEXT DEFAULT \'\'', description: 'Legal entity type' }
    ];
    
    for (const column of startupColumns) {
      const columnCheck = await pool.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'startups' 
        AND column_name = $1
      `, [column.name]);
      
      if (columnCheck.rows.length === 0) {
        console.log(`⚠️  Adding missing ${column.name} column to startups (${column.description})...`);
        await pool.query(`
          ALTER TABLE startups 
          ADD COLUMN ${column.name} ${column.type}
        `);
        console.log(`✅ Added ${column.name} column`);
      }
    }
    
    // Check if reviewed_at column exists in fund_requests
    const reviewedAtCheck = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'fund_requests' 
      AND column_name = 'reviewed_at'
    `);
    
    if (reviewedAtCheck.rows.length === 0) {
      console.log('⚠️  Adding missing reviewed_at column to fund_requests...');
      await pool.query(`
        ALTER TABLE fund_requests 
        ADD COLUMN reviewed_at TIMESTAMP
      `);
      console.log('✅ Added reviewed_at column');
    }
    
    // Check if reviewed_by column exists in fund_requests
    const reviewedByCheck = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'fund_requests' 
      AND column_name = 'reviewed_by'
    `);
    
    if (reviewedByCheck.rows.length === 0) {
      console.log('⚠️  Adding missing reviewed_by column to fund_requests...');
      await pool.query(`
        ALTER TABLE fund_requests
        ADD COLUMN reviewed_by VARCHAR(255)
      `);
      console.log('✅ Added reviewed_by column');
    }

    // Check if ip_address column exists in admin_logs
    const ipAddressCheck = await pool.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'admin_logs'
      AND column_name = 'ip_address'
    `);

    if (ipAddressCheck.rows.length === 0) {
      console.log('⚠️  Adding missing ip_address column to admin_logs...');
      await pool.query(`
        ALTER TABLE admin_logs
        ADD COLUMN ip_address VARCHAR(45)
      `);
      console.log('✅ Added ip_address column to admin_logs for tracking admin actions by IP');
    }
    
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

// Initialize database first, then start server
(async () => {
  try {
    await initializeDatabaseOnStartup();
    
    server.listen(PORT, '0.0.0.0', () => {
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
    });
  } catch (error) {
    console.error('❌ Failed to initialize application:', error);
    process.exit(1);
  }
})();
