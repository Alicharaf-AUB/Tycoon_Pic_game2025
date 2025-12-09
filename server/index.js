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
const APP_ACCESS_PASSWORD = process.env.APP_ACCESS_PASSWORD || 'PIC2025';

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

// Performance optimizations for high load
const compression = require('compression');
const rateLimit = require('express-rate-limit');

// Enable response compression
app.use(compression());

app.use(cors(corsOptions));
app.use(express.json());

// Rate limiting to prevent overload
const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute per IP
  message: 'Too many requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  // Trust Railway proxy for getting real IP
  validate: { trustProxy: false },
});

// Apply rate limiting to API routes
app.use('/api/', apiLimiter);

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

// ===== APP ACCESS PASSWORD REMOVED =====
// Users can now access the app directly without a password

// ===== REMOVED APP ACCESS PASSWORD PROTECTION =====
// Users can now access the app directly without a password

// Serve uploaded files
app.use('/uploads', (req, res, next) => {
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
    // Invalidate cache when broadcasting updates
    cachedGameState = null;
    cacheTimestamp = 0;
    
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
        i.email,
        i.starting_credit,
        i.submitted,
        COALESCE(SUM(inv.amount), 0) as invested,
        i.starting_credit - COALESCE(SUM(inv.amount), 0) as remaining
      FROM investors i
      LEFT JOIN investments inv ON i.id = inv.investor_id
      GROUP BY i.id, i.name, i.email, i.starting_credit, i.submitted
      ORDER BY i.name
    `);
    
    // Debug: Log first investor to verify email is included
    if (investorsResult.rows.length > 0) {
      console.log('📧 Sample investor data:', {
        id: investorsResult.rows[0].id,
        name: investorsResult.rows[0].name,
        email: investorsResult.rows[0].email,
        hasEmail: !!investorsResult.rows[0].email
      });
    }
    
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
  const { name, email, deviceFingerprint } = req.body;

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

    // Check if this device already has an account (prevent multiple accounts from same device)
    if (deviceFingerprint && deviceFingerprint.length > 10) {
      const existingAccount = await pool.query(
        'SELECT id, name, email FROM investors WHERE device_fingerprint = $1 LIMIT 1',
        [deviceFingerprint]
      );
      
      if (existingAccount.rows.length > 0) {
        const existingUser = existingAccount.rows[0];
        console.log(`🚫 Device fingerprint already has account: ${existingUser.name} (${existingUser.email})`);
        return res.status(403).json({ 
          error: `⚠️ This device already has an account (${existingUser.name}). Each device can only create one account. Please use your existing account.`,
          existingAccount: { name: existingUser.name, email: existingUser.email }
        });
      }
    }

    // Create new investor
    const investor = await dbHelpers.createInvestor(trimmedName, trimmedEmail, deviceFingerprint);

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
  const { email, name, deviceFingerprint } = req.body;

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
      // Check if this device already has an account (prevent multiple accounts from same device)
      if (deviceFingerprint && deviceFingerprint.length > 10) {
        const existingAccount = await pool.query(
          'SELECT id, name, email FROM investors WHERE device_fingerprint = $1 LIMIT 1',
          [deviceFingerprint]
        );
        
        if (existingAccount.rows.length > 0) {
          const existing = existingAccount.rows[0];
          console.log(`🚫 Device fingerprint already has account: ${existing.name} (${existing.email})`);
          return res.status(403).json({ 
            error: `⚠️ This device already has an account (${existing.name}). Each device can only create one account. Please use your existing account.`,
            existingAccount: { name: existing.name, email: existing.email }
          });
        }
      }
      
      // Account doesn't exist - create it automatically
      console.log(`Creating new account for: ${trimmedName} (${trimmedEmail})`);

      investor = await dbHelpers.createInvestor(trimmedName, trimmedEmail, deviceFingerprint);

      console.log(`New investor created: ${investor.name} (${investor.email})`);
      await broadcastGameState();

      return res.json({ investor, newAccount: true });
    }

    console.log(`Investor found: ${investor.name} (${investor.email})`);
    res.json({ investor, newAccount: false });
  } catch (error) {
    console.error('❌ Error finding/creating investor:', error);
    console.error('Stack trace:', error.stack);
    console.error('Error details:', { email: trimmedEmail, name: trimmedName });
    
    if (error.message && (error.message.includes('duplicate key') || error.message.includes('unique constraint'))) {
      return res.status(400).json({ error: 'An account with this email already exists with a different name' });
    }
    
    // Return more specific error message
    const errorMsg = error.message || 'Failed to find or create investor';
    res.status(500).json({ 
      error: 'Failed to join game',
      details: process.env.NODE_ENV === 'development' ? errorMsg : undefined
    });
  }
});

// Cache for game state (reduce database load)
let cachedGameState = null;
let cacheTimestamp = 0;
const CACHE_TTL = 2000; // 2 seconds cache

// Get game state (for all users) - with caching
app.get('/api/game-state', async (req, res) => {
  try {
    const now = Date.now();
    
    // Return cached version if still valid
    if (cachedGameState && (now - cacheTimestamp) < CACHE_TTL) {
      return res.json(cachedGameState);
    }
    
    // Fetch fresh data
    const gameState = await getGameState();
    cachedGameState = gameState;
    cacheTimestamp = now;
    
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
  const { investorId, startupId, amount, deviceFingerprint } = req.body;

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

    // Get client IP address
    const clientIp = getClientIp(req);

    // DEVICE FINGERPRINT CHECK (primary vote integrity mechanism)
    if (deviceFingerprint && deviceFingerprint.length > 10) {
      // Check if device_fingerprint column exists
      const fpColumnCheck = await pool.query(`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = 'investments'
        AND column_name = 'device_fingerprint'
      `);

      if (fpColumnCheck.rows.length > 0) {
        // Check if this device has already voted for this startup (from a different account)
        // Only check for votes from EXISTING investors (not deleted ones)
        // The JOIN ensures we only get investments from investors that still exist
        
        console.log('🔍 Checking device fingerprint:', {
          startupId,
          investorId,
          fingerprintPreview: deviceFingerprint.substring(0, 20) + '...'
        });
        
        // DEBUG: Show ALL votes for this startup
        const allVotesForStartup = await pool.query(`
          SELECT 
            inv.id, 
            inv.investor_id, 
            inv.amount,
            inv.device_fingerprint,
            i.name as investor_name,
            i.email as investor_email,
            CASE WHEN i.id IS NULL THEN 'DELETED' ELSE 'ACTIVE' END as investor_status
          FROM investments inv
          LEFT JOIN investors i ON inv.investor_id = i.id
          WHERE inv.startup_id = $1
          ORDER BY inv.timestamp DESC
        `, [startupId]);
        
        console.log(`📊 All votes for startup ${startupId}:`, allVotesForStartup.rows);
        
        const fpCheckQuery = await pool.query(`
          SELECT inv.id, inv.investor_id, i.name as investor_name, i.id as investor_exists
          FROM investments inv
          INNER JOIN investors i ON inv.investor_id = i.id
          WHERE inv.startup_id = $1
            AND inv.device_fingerprint = $2
            AND inv.device_fingerprint IS NOT NULL
            AND inv.device_fingerprint != ''
            AND LENGTH(inv.device_fingerprint) > 10
            AND inv.investor_id != $3
            AND inv.amount > 0
          LIMIT 1
        `, [startupId, deviceFingerprint, investorId]);
        
        console.log(`Found ${fpCheckQuery.rows.length} matching votes from other active investors`);

        if (fpCheckQuery.rows.length > 0) {
          const existingVote = fpCheckQuery.rows[0];
          
          // EXTRA DEBUG: Check if this investor actually exists
          const investorCheck = await pool.query(
            'SELECT id, name, email FROM investors WHERE id = $1',
            [existingVote.investor_id]
          );
          
          console.log('🚫 Device fingerprint vote limit:', {
            startupId,
            deviceFingerprint: deviceFingerprint.substring(0, 16) + '...',
            existingInvestor: existingVote.investor_name,
            existingInvestorId: existingVote.investor_id,
            investorStillExists: investorCheck.rows.length > 0,
            investorData: investorCheck.rows[0],
            attemptedInvestor: investorId,
            message: 'Another active account from this device has already voted'
          });
          
          // CRITICAL: If investor doesn't exist, this is a bug - delete the orphaned vote and allow
          if (investorCheck.rows.length === 0) {
            console.error('🐛 BUG DETECTED: Found vote from non-existent investor! Deleting orphaned vote...');
            await pool.query('DELETE FROM investments WHERE id = $1', [existingVote.id]);
            console.log('✅ Deleted orphaned vote, allowing this vote to proceed');
            // Don't return error, let the vote continue
          } else {
            return res.status(403).json({
              error: 'This device has already voted for this startup. Each device can only vote once per startup.',
              details: 'Device-based vote limit reached',
              existingInvestor: existingVote.investor_name
            });
          }
        } else {
          console.log('✅ Device fingerprint check passed:', {
            startupId,
            deviceFingerprint: deviceFingerprint.substring(0, 16) + '...',
            investorId
          });
        }
      }
    } else {
      console.log('⚠️  Device fingerprint missing or too short:', {
        investorId,
        startupId,
        fingerprintLength: deviceFingerprint ? deviceFingerprint.length : 0,
        fingerprint: deviceFingerprint ? deviceFingerprint.substring(0, 20) + '...' : 'null'
      });
    }

    // IP CHECK (backup vote integrity mechanism)
    // DISABLED: IP checking causes false positives for users on same network
    // Device fingerprinting is the primary and more accurate method
    /*
    // Check if IP column exists before doing IP-based validation
    const ipColumnCheck = await pool.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'investments'
      AND column_name = 'ip_address'
    `);

    // Only check IP-based voting limit if column exists
    if (ipColumnCheck.rows.length > 0) {
      console.log('🔍 Checking IP-based vote limit:', {
        startupId,
        clientIp,
        currentInvestorId: investorId
      });
      
      // Check if this IP has already voted for this startup (from a different account)
      // The INNER JOIN ensures we only get investments from investors that still exist
      const ipCheckQuery = await pool.query(`
        SELECT inv.id, inv.investor_id, i.name as investor_name
        FROM investments inv
        INNER JOIN investors i ON inv.investor_id = i.id
        WHERE inv.startup_id = $1
          AND inv.ip_address = $2
          AND inv.investor_id != $3
          AND inv.amount > 0
        LIMIT 1
      `, [startupId, clientIp, investorId]);
      
      console.log(`Found ${ipCheckQuery.rows.length} IP-based votes from other active investors`);

      if (ipCheckQuery.rows.length > 0) {
        const existingVote = ipCheckQuery.rows[0];
        
        // EXTRA DEBUG: Check if this investor actually exists
        const investorCheck = await pool.query(
          'SELECT id, name, email FROM investors WHERE id = $1',
          [existingVote.investor_id]
        );
        
        console.log('🚫 IP vote limit:', {
          startupId,
          clientIp,
          existingInvestor: existingVote.investor_name,
          existingInvestorId: existingVote.investor_id,
          investorStillExists: investorCheck.rows.length > 0,
          attemptedInvestor: investorId,
          attemptedInvestorName: '(will fetch)'
        });
        
        // Get current investor name for logging
        const currentInvestor = await pool.query(
          'SELECT name, email FROM investors WHERE id = $1',
          [investorId]
        );
        
        console.log('👤 Vote attempt details:', {
          blockingUser: `${existingVote.investor_name} (ID: ${existingVote.investor_id})`,
          attemptingUser: currentInvestor.rows[0] ? `${currentInvestor.rows[0].name} (ID: ${investorId})` : 'Unknown',
          sameUser: existingVote.investor_id === parseInt(investorId)
        });
        
        // CRITICAL: If investor doesn't exist, delete the orphaned vote and allow
        if (investorCheck.rows.length === 0) {
          console.error('🐛 BUG DETECTED: IP check found vote from non-existent investor! Deleting...');
          await pool.query('DELETE FROM investments WHERE id = $1', [existingVote.id]);
          console.log('✅ Deleted orphaned IP vote, allowing this vote to proceed');
          // Don't return error, let the vote continue
        } else {
          return res.status(403).json({
            error: 'This device has already voted for this startup. Each device can only vote once per startup.',
            details: 'IP-based vote limit reached',
            existingInvestor: existingVote.investor_name
          });
        }
      }
    }
    */
    console.log('ℹ️  IP-based vote checking is disabled - using device fingerprint only');

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
      uniqueStartups: currentUniqueStartups,
      clientIp
    });

    // Validate 50-coin increments (0 is allowed to remove vote)
    if (amount !== 0 && amount % 50 !== 0) {
      return res.status(400).json({
        error: 'Amount must be in increments of 50 coins'
      });
    }

    // Check if total investments would exceed starting credit
    const totalInvestments = parseFloat(investor.other_investments) + amount;
    if (totalInvestments > startingCredit) {
      return res.status(400).json({
        error: 'Insufficient funds',
        available: startingCredit - parseFloat(investor.other_investments)
      });
    }

    // No startup limit - investors can invest in as many startups as they want
    // Only requirement is 50-coin increments (validated above)

    // Use helper to create or update investment with IP address and device fingerprint
    await dbHelpers.createOrUpdateInvestment(investorId, startupId, amount, clientIp, deviceFingerprint);

    await broadcastGameState();

    res.json({ success: true });
  } catch (error) {
    console.error('❌ Error making investment:', error);
    console.error('Stack:', error.stack);
    console.error('Details:', { investorId, startupId, amount, clientIp });
    
    // Return more specific error message
    const errorMsg = error.message || 'Failed to make investment';
    res.status(500).json({ 
      error: 'Failed to make investment',
      details: process.env.NODE_ENV === 'development' ? errorMsg : undefined
    });
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
        i.email,
        i.starting_credit,
        i.submitted,
        COALESCE(SUM(inv.amount), 0) as invested,
        i.starting_credit - COALESCE(SUM(inv.amount), 0) as remaining,
        i.created_at
      FROM investors i
      LEFT JOIN investments inv ON i.id = inv.investor_id
      GROUP BY i.id, i.name, i.email, i.starting_credit, i.submitted, i.created_at
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

    // Check how many investments will be deleted
    const investmentsCount = await pool.query(
      'SELECT COUNT(*) FROM investments WHERE investor_id = $1',
      [id]
    );
    console.log(`This will CASCADE delete ${investmentsCount.rows[0].count} investments`);

    // EXPLICITLY delete investments first (don't rely on CASCADE)
    // This ensures device fingerprints are removed even if CASCADE fails
    const deleteResult = await pool.query(
      'DELETE FROM investments WHERE investor_id = $1 RETURNING id',
      [id]
    );
    console.log(`✅ Explicitly deleted ${deleteResult.rowCount} investment records`);

    // Delete the investor
    await dbHelpers.deleteInvestor(id);

    console.log('Successfully deleted investor:', investor.name);
    
    // Verify investments were actually deleted
    const remainingInvestments = await pool.query(
      'SELECT COUNT(*) FROM investments WHERE investor_id = $1',
      [id]
    );
    
    if (parseInt(remainingInvestments.rows[0].count) > 0) {
      console.error(`⚠️ WARNING: Found ${remainingInvestments.rows[0].count} orphaned investments for deleted investor ${id}!`);
    } else {
      console.log('✅ Verified: All investments deleted successfully');
    }

    await broadcastGameState();

    res.json({ success: true, deleted: investor.name });
  } catch (error) {
    console.error('ERROR deleting investor:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ error: 'Failed to delete investor: ' + error.message });
  }
});

// Delete ALL investors (requires special password)
app.post('/api/admin/investors/delete-all', adminAuth, async (req, res) => {
  const { password } = req.body;
  const SPECIAL_PASSWORD = 'onlyaliknowsit';

  console.log('=== DELETE ALL INVESTORS REQUEST ===');
  console.log('Admin IP:', req.adminIp);
  console.log('Admin User:', req.adminUsername);

  // Require special password for this dangerous operation
  if (password !== SPECIAL_PASSWORD) {
    console.log('ERROR: Invalid special password provided');
    return res.status(403).json({ error: 'Invalid password for this operation' });
  }

  try {
    // Get count before deletion
    const countResult = await pool.query('SELECT COUNT(*) FROM investors');
    const count = parseInt(countResult.rows[0].count);

    console.log(`Deleting ${count} investors...`);

    // Delete all investors (CASCADE will handle related investments)
    await pool.query('DELETE FROM investors');

    console.log(`Successfully deleted ${count} investors`);

    // Log this critical action
    await dbHelpers.createAdminLog(
      'DELETE_ALL_INVESTORS',
      `Deleted all ${count} investors from the system`,
      req.adminIp
    );

    await broadcastGameState();

    res.json({
      success: true,
      message: `Successfully deleted ${count} investors`,
      count
    });
  } catch (error) {
    console.error('ERROR deleting all investors:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ error: 'Failed to delete all investors: ' + error.message });
  }
});

// Debug endpoint to check device fingerprint (admin only)
app.post('/api/admin/check-device-fingerprint', adminAuth, async (req, res) => {
  const { deviceFingerprint } = req.body;
  
  try {
    // Find all investments with this fingerprint
    const investments = await pool.query(`
      SELECT 
        inv.id,
        inv.investor_id,
        inv.startup_id,
        inv.amount,
        inv.device_fingerprint,
        i.name as investor_name,
        i.email as investor_email,
        s.name as startup_name,
        CASE WHEN i.id IS NULL THEN true ELSE false END as investor_deleted
      FROM investments inv
      LEFT JOIN investors i ON inv.investor_id = i.id
      LEFT JOIN startups s ON inv.startup_id = s.id
      WHERE inv.device_fingerprint = $1
      ORDER BY inv.timestamp DESC
    `, [deviceFingerprint]);
    
    res.json({
      fingerprint: deviceFingerprint.substring(0, 20) + '...',
      totalInvestments: investments.rows.length,
      investments: investments.rows
    });
  } catch (error) {
    console.error('Error checking device fingerprint:', error);
    res.status(500).json({ error: error.message });
  }
});

// Clean up orphaned investments for a specific startup (admin endpoint)
app.post('/api/admin/cleanup-startup-votes', adminAuth, async (req, res) => {
  const { startupId } = req.body;
  
  console.log('=== CLEANUP STARTUP VOTES ===');
  console.log('Startup ID:', startupId);
  
  try {
    // Find orphaned investments for this startup
    const orphanedCheck = await pool.query(`
      SELECT inv.id, inv.investor_id, inv.amount, inv.device_fingerprint
      FROM investments inv
      LEFT JOIN investors i ON inv.investor_id = i.id
      WHERE inv.startup_id = $1 AND i.id IS NULL
    `, [startupId]);
    
    const orphanedCount = orphanedCheck.rows.length;
    
    if (orphanedCount === 0) {
      console.log('✅ No orphaned votes found for this startup');
      return res.json({
        success: true,
        message: 'No orphaned votes found for this startup',
        deleted: 0
      });
    }
    
    console.log(`Found ${orphanedCount} orphaned votes for startup ${startupId}:`);
    orphanedCheck.rows.forEach(row => {
      console.log(`  - Investment ID ${row.id}: investor_id=${row.investor_id} (deleted), amount=${row.amount}`);
    });
    
    // Delete orphaned investments for this startup
    const deleteResult = await pool.query(`
      DELETE FROM investments
      WHERE startup_id = $1 
        AND investor_id NOT IN (SELECT id FROM investors)
      RETURNING id
    `, [startupId]);
    
    console.log(`✅ Deleted ${deleteResult.rowCount} orphaned votes for startup ${startupId}`);
    
    await dbHelpers.createAdminLog(
      'CLEANUP_STARTUP_VOTES',
      `Cleaned up ${deleteResult.rowCount} orphaned votes for startup ${startupId}`,
      req.adminIp
    );
    
    await broadcastGameState();
    
    res.json({
      success: true,
      message: `Cleaned up ${deleteResult.rowCount} orphaned votes for this startup`,
      deleted: deleteResult.rowCount
    });
  } catch (error) {
    console.error('ERROR cleaning up startup votes:', error);
    res.status(500).json({ error: 'Failed to cleanup: ' + error.message });
  }
});

// Clean up orphaned investments (admin endpoint)
app.post('/api/admin/cleanup-orphaned-investments', adminAuth, async (req, res) => {
  console.log('=== CLEANUP ORPHANED INVESTMENTS ===');
  console.log('Admin IP:', req.adminIp);
  console.log('Admin User:', req.adminUsername);

  try {
    // Find orphaned investments (investments without matching investor)
    const orphanedCheck = await pool.query(`
      SELECT inv.id, inv.investor_id, inv.startup_id, inv.amount, inv.device_fingerprint
      FROM investments inv
      LEFT JOIN investors i ON inv.investor_id = i.id
      WHERE i.id IS NULL
    `);

    const orphanedCount = orphanedCheck.rows.length;
    
    if (orphanedCount === 0) {
      console.log('✅ No orphaned investments found');
      return res.json({
        success: true,
        message: 'No orphaned investments found',
        deleted: 0
      });
    }

    console.log(`Found ${orphanedCount} orphaned investments:`);
    orphanedCheck.rows.forEach(row => {
      console.log(`  - Investment ID ${row.id}: investor_id=${row.investor_id} (deleted), startup_id=${row.startup_id}, amount=${row.amount}`);
    });

    // Delete orphaned investments
    const deleteResult = await pool.query(`
      DELETE FROM investments
      WHERE investor_id NOT IN (SELECT id FROM investors)
      RETURNING id
    `);

    console.log(`✅ Deleted ${deleteResult.rowCount} orphaned investments`);

    // Log this action
    await dbHelpers.createAdminLog(
      'CLEANUP_ORPHANED_INVESTMENTS',
      `Cleaned up ${deleteResult.rowCount} orphaned investment records`,
      req.adminIp
    );

    await broadcastGameState();

    res.json({
      success: true,
      message: `Cleaned up ${deleteResult.rowCount} orphaned investments`,
      deleted: deleteResult.rowCount
    });
  } catch (error) {
    console.error('ERROR cleaning up orphaned investments:', error);
    res.status(500).json({ error: 'Failed to cleanup: ' + error.message });
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

  if (!name) {
    return res.status(400).json({ error: 'Name is required' });
  }

  // Auto-generate slug from name if not provided
  const finalSlug = slug || name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')  // Replace non-alphanumeric with hyphens
    .replace(/^-+|-+$/g, '')       // Remove leading/trailing hyphens
    .replace(/-+/g, '-');          // Replace multiple hyphens with single

  console.log('📝 Creating startup with:', {
    name,
    slug: finalSlug,
    slugAutoGenerated: !slug,
    logo: logo || '(none)',
    pitch_deck: pitch_deck || '(none)',
    description: description?.substring(0, 50) + '...'
  });

  try {
    const id = await dbHelpers.createStartup({
      name,
      slug: finalSlug,
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

  // Auto-generate slug from name if not provided (and name is provided)
  const finalSlug = slug || (name ? name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')  // Replace non-alphanumeric with hyphens
    .replace(/^-+|-+$/g, '')       // Remove leading/trailing hyphens
    .replace(/-+/g, '-')           // Replace multiple hyphens with single
    : undefined);

  console.log('📝 Updating startup', id, 'with:', {
    name,
    slug: finalSlug,
    slugAutoGenerated: !slug && name,
    logo: logo || '(none)',
    pitch_deck: pitch_deck || '(none)',
    isActive
  });

  try {
    await dbHelpers.updateStartup(id, {
      name,
      slug: finalSlug,
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

    // Check if ip_address column exists in investments
    const investmentsIpCheck = await pool.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'investments'
      AND column_name = 'ip_address'
    `);

    if (investmentsIpCheck.rows.length === 0) {
      console.log('⚠️  Adding missing ip_address column to investments...');
      await pool.query(`
        ALTER TABLE investments
        ADD COLUMN ip_address VARCHAR(45)
      `);
      // Create index for performance
      await pool.query(`
        CREATE INDEX IF NOT EXISTS idx_investments_ip
        ON investments(ip_address)
      `);
      console.log('✅ Added ip_address column to investments for IP-based vote limiting');
      console.log('✅ Created index on ip_address for query performance');
    }

    // Check if device_fingerprint column exists in investments
    const deviceFingerprintCheck = await pool.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'investments'
      AND column_name = 'device_fingerprint'
    `);

    if (deviceFingerprintCheck.rows.length === 0) {
      console.log('⚠️  Adding missing device_fingerprint column to investments...');
      await pool.query(`
        ALTER TABLE investments
        ADD COLUMN device_fingerprint VARCHAR(255)
      `);
      // Create index for performance
      await pool.query(`
        CREATE INDEX IF NOT EXISTS idx_investments_device
        ON investments(device_fingerprint)
      `);
      console.log('✅ Added device_fingerprint column to investments for device-based vote limiting');
      console.log('✅ Created index on device_fingerprint for query performance');
    }
    
    // CRITICAL: Verify and fix CASCADE DELETE constraint
    console.log('🔍 Verifying CASCADE DELETE constraint on investments...');
    const cascadeCheck = await pool.query(`
      SELECT 
        tc.constraint_name, 
        rc.delete_rule
      FROM information_schema.table_constraints tc
      JOIN information_schema.referential_constraints rc 
        ON tc.constraint_name = rc.constraint_name
      WHERE tc.table_name = 'investments'
        AND tc.constraint_type = 'FOREIGN KEY'
        AND rc.delete_rule = 'CASCADE'
        AND tc.constraint_name LIKE '%investor%'
    `);
    
    if (cascadeCheck.rows.length === 0) {
      console.log('⚠️  CASCADE DELETE constraint missing! Fixing now...');
      
      // Drop existing foreign key constraint
      await pool.query(`
        ALTER TABLE investments 
        DROP CONSTRAINT IF EXISTS investments_investor_id_fkey
      `);
      
      // Add CASCADE constraint
      await pool.query(`
        ALTER TABLE investments 
        ADD CONSTRAINT investments_investor_id_fkey 
        FOREIGN KEY (investor_id) 
        REFERENCES investors(id) 
        ON DELETE CASCADE
      `);
      
      console.log('✅ CASCADE DELETE constraint added! Investments will now auto-delete when investor is deleted');
    } else {
      console.log('✅ CASCADE DELETE constraint verified:', cascadeCheck.rows[0].constraint_name);
    }
    
    console.log('✅ Database ready');
  } catch (error) {
    console.error('❌ Database initialization error:', error.message);
    console.error('Stack:', error.stack);
    // Don't throw - let the app continue even if init fails
    console.error('⚠️  Continuing without full database initialization...');
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

// Start server first, then initialize database in background
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
  
  // Initialize database after server starts (non-blocking with timeout)
  Promise.race([
    initializeDatabaseOnStartup(),
    new Promise((_, reject) => setTimeout(() => reject(new Error('DB init timeout')), 10000))
  ]).catch(error => {
    console.error('❌ Database initialization failed:', error.message);
    // App continues to run even if DB init fails/times out
  });
});
