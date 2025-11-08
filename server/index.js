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

const db = require('./database');

const app = express();
const server = http.createServer(app);

// Configure CORS based on environment
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? (process.env.CLIENT_URL || true) // In production, allow same origin
    : "http://localhost:5173", // In development, allow local client
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
};

const io = socketIo(server, {
  cors: corsOptions
});

const PORT = process.env.PORT || 3001;
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'demo123';

// Warn if using default password in production
if (process.env.NODE_ENV === 'production' && ADMIN_PASSWORD === 'demo123') {
  console.warn('⚠️  WARNING: Using default admin password in production! Please set ADMIN_PASSWORD environment variable.');
}

app.use(cors(corsOptions));
app.use(express.json());

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
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
  
  if (!credentials || credentials.name !== ADMIN_USERNAME || credentials.pass !== ADMIN_PASSWORD) {
    res.set('WWW-Authenticate', 'Basic realm="Admin Area"');
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  next();
};

// Helper: Broadcast game state to all clients
const broadcastGameState = () => {
  const gameState = getGameState();
  io.emit('gameStateUpdate', gameState);
};

// Helper: Get complete game state
const getGameState = () => {
  // Get game lock status
  const lockStatus = db.prepare('SELECT is_locked FROM game_state WHERE id = 1').get();
  
  // Get all active startups with investment totals
  const startups = db.prepare(`
    SELECT 
      s.id,
      s.name,
      s.slug,
      s.description,
      s.is_active,
      COALESCE(SUM(i.amount), 0) as total_raised
    FROM startups s
    LEFT JOIN investments i ON s.id = i.startup_id
    WHERE s.is_active = 1
    GROUP BY s.id
    ORDER BY total_raised DESC
  `).all();
  
  // Get all investments with investor names
  const investments = db.prepare(`
    SELECT 
      inv.id,
      inv.investor_id,
      investor.name as investor_name,
      inv.startup_id,
      inv.amount
    FROM investments inv
    JOIN investors investor ON inv.investor_id = investor.id
    ORDER BY inv.amount DESC
  `).all();
  
  // Get all investors with their stats
  const investors = db.prepare(`
    SELECT 
      i.id,
      i.name,
      i.starting_credit,
      i.submitted,
      COALESCE(SUM(inv.amount), 0) as invested,
      i.starting_credit - COALESCE(SUM(inv.amount), 0) as remaining
    FROM investors i
    LEFT JOIN investments inv ON i.id = inv.investor_id
    GROUP BY i.id
    ORDER BY i.name
  `).all();
  
  return {
    isLocked: lockStatus.is_locked === 1,
    startups,
    investments,
    investors
  };
};

// ===== PUBLIC API ROUTES =====

// Join as investor
app.post('/api/join', (req, res) => {
  const { name } = req.body;
  
  if (!name || name.trim() === '') {
    return res.status(400).json({ error: 'Name is required' });
  }
  
  const trimmedName = name.trim();
  
  try {
    // Check if investor already exists
    const existing = db.prepare('SELECT * FROM investors WHERE LOWER(name) = LOWER(?)').get(trimmedName);
    
    if (existing) {
      // Allow rejoin - return existing investor
      return res.json({ investor: existing, rejoined: true });
    }
    
    // Create new investor
    const id = uuidv4();
    const stmt = db.prepare('INSERT INTO investors (id, name) VALUES (?, ?)');
    stmt.run(id, trimmedName);
    
    const investor = db.prepare('SELECT * FROM investors WHERE id = ?').get(id);
    
    broadcastGameState();
    
    res.json({ investor, rejoined: false });
  } catch (error) {
    console.error('Error creating investor:', error);
    res.status(500).json({ error: 'Failed to join game' });
  }
});

// Find investor by name (for returning users)
app.post('/api/find-investor', (req, res) => {
  const { name } = req.body;
  
  if (!name || name.trim() === '') {
    return res.status(400).json({ error: 'Name is required' });
  }
  
  try {
    // Find investor by exact name match (case-insensitive)
    const investor = db.prepare(`
      SELECT 
        i.id,
        i.name,
        i.starting_credit,
        COALESCE(SUM(inv.amount), 0) as invested,
        i.starting_credit - COALESCE(SUM(inv.amount), 0) as remaining
      FROM investors i
      LEFT JOIN investments inv ON i.id = inv.investor_id
      WHERE LOWER(i.name) = LOWER(?)
      GROUP BY i.id
      ORDER BY i.created_at DESC
      LIMIT 1
    `).get(name.trim());
    
    if (!investor) {
      return res.status(404).json({ error: 'No account found with that name' });
    }
    
    res.json({ investor });
  } catch (error) {
    console.error('Error finding investor:', error);
    res.status(500).json({ error: 'Failed to find investor' });
  }
});

// Get game state (for all users)
app.get('/api/game-state', (req, res) => {
  try {
    const gameState = getGameState();
    res.json(gameState);
  } catch (error) {
    console.error('Error getting game state:', error);
    res.status(500).json({ error: 'Failed to get game state' });
  }
});

// Get investor by ID
app.get('/api/investors/:id', (req, res) => {
  const { id } = req.params;
  
  try {
    const investor = db.prepare(`
      SELECT 
        i.id,
        i.name,
        i.starting_credit,
        i.submitted,
        COALESCE(SUM(inv.amount), 0) as invested,
        i.starting_credit - COALESCE(SUM(inv.amount), 0) as remaining
      FROM investors i
      LEFT JOIN investments inv ON i.id = inv.investor_id
      WHERE i.id = ?
      GROUP BY i.id
    `).get(id);
    
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
app.post('/api/invest', (req, res) => {
  const { investorId, startupId, amount } = req.body;
  
  // Check if game is locked
  const lockStatus = db.prepare('SELECT is_locked FROM game_state WHERE id = 1').get();
  if (lockStatus.is_locked === 1) {
    return res.status(403).json({ error: 'Game is locked. No more changes allowed.' });
  }
  
  if (!investorId || !startupId || amount === undefined) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  
  if (amount < 0) {
    return res.status(400).json({ error: 'Amount cannot be negative' });
  }
  
  try {
    // Get investor's starting credit and current investments
    const investor = db.prepare(`
      SELECT 
        i.starting_credit,
        COALESCE(SUM(CASE WHEN inv.startup_id != ? THEN inv.amount ELSE 0 END), 0) as other_investments
      FROM investors i
      LEFT JOIN investments inv ON i.id = inv.investor_id
      WHERE i.id = ?
      GROUP BY i.id
    `).get(startupId, investorId);
    
    if (!investor) {
      return res.status(404).json({ error: 'Investor not found' });
    }
    
    // Check if total investments would exceed starting credit
    const totalInvestments = investor.other_investments + amount;
    if (totalInvestments > investor.starting_credit) {
      return res.status(400).json({ 
        error: 'Insufficient funds',
        available: investor.starting_credit - investor.other_investments
      });
    }
    
    // If amount is 0, delete the investment
    if (amount === 0) {
      db.prepare('DELETE FROM investments WHERE investor_id = ? AND startup_id = ?')
        .run(investorId, startupId);
    } else {
      // Insert or update investment
      const id = uuidv4();
      db.prepare(`
        INSERT INTO investments (id, investor_id, startup_id, amount)
        VALUES (?, ?, ?, ?)
        ON CONFLICT(investor_id, startup_id) 
        DO UPDATE SET amount = ?, updated_at = CURRENT_TIMESTAMP
      `).run(id, investorId, startupId, amount, amount);
    }
    
    broadcastGameState();
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error making investment:', error);
    res.status(500).json({ error: 'Failed to make investment' });
  }
});

// Submit investments (finalize choices)
app.post('/api/submit', (req, res) => {
  const { investorId } = req.body;
  
  if (!investorId) {
    return res.status(400).json({ error: 'Investor ID is required' });
  }
  
  try {
    // Mark investor as submitted
    db.prepare('UPDATE investors SET submitted = 1 WHERE id = ?').run(investorId);
    
    broadcastGameState();
    
    res.json({ success: true, message: 'Investments submitted successfully!' });
  } catch (error) {
    console.error('Error submitting investments:', error);
    res.status(500).json({ error: 'Failed to submit investments' });
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
app.get('/api/admin/investors', adminAuth, (req, res) => {
  try {
    const investors = db.prepare(`
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
      GROUP BY i.id
      ORDER BY i.created_at DESC
    `).all();
    
    res.json({ investors });
  } catch (error) {
    console.error('Error getting investors:', error);
    res.status(500).json({ error: 'Failed to get investors' });
  }
});

// Update investor credit (admin)
app.put('/api/admin/investors/:id/credit', adminAuth, (req, res) => {
  const { id } = req.params;
  const { startingCredit } = req.body;
  
  if (startingCredit === undefined || startingCredit < 0) {
    return res.status(400).json({ error: 'Invalid starting credit' });
  }
  
  try {
    db.prepare('UPDATE investors SET starting_credit = ? WHERE id = ?')
      .run(startingCredit, id);
    
    broadcastGameState();
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating investor credit:', error);
    res.status(500).json({ error: 'Failed to update credit' });
  }
});

// Delete investor (admin)
app.delete('/api/admin/investors/:id', adminAuth, (req, res) => {
  const { id } = req.params;
  
  try {
    db.prepare('DELETE FROM investors WHERE id = ?').run(id);
    
    broadcastGameState();
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting investor:', error);
    res.status(500).json({ error: 'Failed to delete investor' });
  }
});

// Get all startups (admin)
app.get('/api/admin/startups', adminAuth, (req, res) => {
  try {
    const startups = db.prepare(`
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
      GROUP BY s.id
      ORDER BY s.created_at DESC
    `).all();
    
    res.json({ startups });
  } catch (error) {
    console.error('Error getting startups:', error);
    res.status(500).json({ error: 'Failed to get startups' });
  }
});

// Create startup (admin)
app.post('/api/admin/startups', adminAuth, (req, res) => {
  const { name, slug, description, logo, pitch_deck, cohort, support_program, industry, email, team, generating_revenue, ask, legal_entity } = req.body;
  
  if (!name || !slug) {
    return res.status(400).json({ error: 'Name and slug are required' });
  }
  
  const id = uuidv4();
  
  try {
    db.prepare(`INSERT INTO startups (id, name, slug, description, logo, pitch_deck, cohort, support_program, industry, email, team, generating_revenue, ask, legal_entity) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .run(id, name, slug, description || '', logo || '', pitch_deck || '', cohort || '', support_program || '', industry || '', email || '', team || '', generating_revenue || '', ask || '', legal_entity || '');
    
    broadcastGameState();
    
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
app.put('/api/admin/startups/:id', adminAuth, (req, res) => {
  const { id } = req.params;
  const { name, slug, description, logo, pitch_deck, cohort, support_program, industry, email, team, generating_revenue, ask, legal_entity, isActive } = req.body;
  
  try {
    const updates = [];
    const values = [];
    
    if (name !== undefined) {
      updates.push('name = ?');
      values.push(name);
    }
    if (slug !== undefined) {
      updates.push('slug = ?');
      values.push(slug);
    }
    if (description !== undefined) {
      updates.push('description = ?');
      values.push(description);
    }
    if (logo !== undefined) {
      updates.push('logo = ?');
      values.push(logo);
    }
    if (pitch_deck !== undefined) {
      updates.push('pitch_deck = ?');
      values.push(pitch_deck);
    }
    if (cohort !== undefined) {
      updates.push('cohort = ?');
      values.push(cohort);
    }
    if (support_program !== undefined) {
      updates.push('support_program = ?');
      values.push(support_program);
    }
    if (industry !== undefined) {
      updates.push('industry = ?');
      values.push(industry);
    }
    if (email !== undefined) {
      updates.push('email = ?');
      values.push(email);
    }
    if (team !== undefined) {
      updates.push('team = ?');
      values.push(team);
    }
    if (generating_revenue !== undefined) {
      updates.push('generating_revenue = ?');
      values.push(generating_revenue);
    }
    if (ask !== undefined) {
      updates.push('ask = ?');
      values.push(ask);
    }
    if (legal_entity !== undefined) {
      updates.push('legal_entity = ?');
      values.push(legal_entity);
    }
    if (isActive !== undefined) {
      updates.push('is_active = ?');
      values.push(isActive ? 1 : 0);
    }
    
    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }
    
    values.push(id);
    
    db.prepare(`UPDATE startups SET ${updates.join(', ')} WHERE id = ?`)
      .run(...values);
    
    broadcastGameState();
    
    res.json({ success: true });
  } catch (error) {
    if (error.message.includes('UNIQUE')) {
      return res.status(400).json({ error: 'Slug already exists' });
    }
    console.error('Error updating startup:', error);
    res.status(500).json({ error: 'Failed to update startup' });
  }
});

// Delete startup (admin)
app.delete('/api/admin/startups/:id', adminAuth, (req, res) => {
  const { id } = req.params;
  
  try {
    db.prepare('DELETE FROM startups WHERE id = ?').run(id);
    
    broadcastGameState();
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting startup:', error);
    res.status(500).json({ error: 'Failed to delete startup' });
  }
});

// Toggle game lock (admin)
app.post('/api/admin/toggle-lock', adminAuth, (req, res) => {
  try {
    const current = db.prepare('SELECT is_locked FROM game_state WHERE id = 1').get();
    const newState = current.is_locked === 1 ? 0 : 1;
    
    db.prepare('UPDATE game_state SET is_locked = ?, updated_at = CURRENT_TIMESTAMP WHERE id = 1')
      .run(newState);
    
    broadcastGameState();
    
    res.json({ success: true, isLocked: newState === 1 });
  } catch (error) {
    console.error('Error toggling lock:', error);
    res.status(500).json({ error: 'Failed to toggle lock' });
  }
});

// Get game statistics (admin)
app.get('/api/admin/stats', adminAuth, (req, res) => {
  try {
    const stats = {
      totalInvestors: db.prepare('SELECT COUNT(*) as count FROM investors').get().count,
      totalStartups: db.prepare('SELECT COUNT(*) as count FROM startups WHERE is_active = 1').get().count,
      totalInvested: db.prepare('SELECT COALESCE(SUM(amount), 0) as total FROM investments').get().total,
      totalInvestments: db.prepare('SELECT COUNT(*) as count FROM investments').get().count
    };
    
    res.json({ stats });
  } catch (error) {
    console.error('Error getting stats:', error);
    res.status(500).json({ error: 'Failed to get stats' });
  }
});

// ===== SOCKET.IO =====

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  // Send current game state to newly connected client
  socket.emit('gameStateUpdate', getGameState());
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// ===== START SERVER =====

// Auto-seed database if empty (for production deployments)
const checkAndSeedDatabase = () => {
  try {
    const startupCount = db.prepare('SELECT COUNT(*) as count FROM startups').get();
    if (startupCount.count === 0) {
      console.log('📦 Database is empty, running seed script...');
      require('./seed');
      console.log('✅ Database seeded successfully');
    } else {
      console.log(`✅ Database already has ${startupCount.count} startups`);
    }
  } catch (error) {
    console.error('❌ Error checking/seeding database:', error);
  }
};

// Serve React app in production
if (process.env.NODE_ENV === 'production') {
  // Serve static files from client build
  app.use(express.static(path.join(__dirname, '../client/dist')));
  
  // Serve React app for any non-API routes
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/dist/index.html'));
  });
}

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Admin credentials: ${ADMIN_USERNAME} / ${ADMIN_PASSWORD}`);
  
  if (process.env.NODE_ENV === 'production') {
    console.log('Running in PRODUCTION mode');
    console.log('Serving client from /client/dist');
  }
  
  // Check and seed database after server starts
  checkAndSeedDatabase();
});
