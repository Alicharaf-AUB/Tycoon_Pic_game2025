# Quick Reference Guide

Essential commands and operations for running the Investment Game.

## 🚀 Getting Started

### First Time Setup
```bash
# Install dependencies
npm install
cd client && npm install && cd ..

# Create database with sample data
npm run seed

# Start development servers
npm run dev
```

Access at:
- **Players**: http://localhost:5173
- **Admin**: http://localhost:5173/admin
- **Credentials**: admin / demo123

## 🎮 Running the Game

### Start Everything
```bash
npm run dev
```
Starts both server (port 3001) and client (port 5173)

### Start Separately
```bash
# Terminal 1 - Server only
npm run server

# Terminal 2 - Client only
npm run client
```

### Production Mode
```bash
# Build client
cd client && npm run build

# Start production server
NODE_ENV=production npm start
```

## 💾 Database Operations

### Reset Database
```bash
# Delete existing database
rm server/game.db

# Recreate with sample data
npm run seed
```

### Backup Database
```bash
# Create backup
cp server/game.db backups/game-$(date +%Y%m%d).db

# Restore from backup
cp backups/game-20240101.db server/game.db
```

### View Database
```bash
# Install sqlite3 if needed
brew install sqlite3  # macOS
apt-get install sqlite3  # Linux

# Open database
sqlite3 server/game.db

# Useful queries:
.tables                          # List tables
SELECT * FROM investors;         # View investors
SELECT * FROM startups;          # View startups
SELECT * FROM investments;       # View investments
.quit                            # Exit
```

## 🔧 Common Admin Tasks

### Change Admin Password
Edit `.env` file:
```env
ADMIN_PASSWORD=your_new_password
```
Restart server for changes to take effect.

### Adjust Default Starting Credit
Edit `server/database.js`, line with:
```javascript
starting_credit INTEGER NOT NULL DEFAULT 2000000
```

Or adjust per investor in admin panel after they join.

### Add Startup via Database
```bash
sqlite3 server/game.db
INSERT INTO startups (id, name, slug, description, is_active)
VALUES ('uuid-here', 'Startup Name', 'startup-slug', 'Description', 1);
```

Or use the admin panel (recommended).

### Clear All Investors
```bash
sqlite3 server/game.db
DELETE FROM investments;
DELETE FROM investors;
```

### Clear All Investments (Keep Investors)
```bash
sqlite3 server/game.db
DELETE FROM investments;
```

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Find process using port 3001
lsof -i :3001  # macOS/Linux
netstat -ano | findstr :3001  # Windows

# Kill process
kill -9 <PID>  # macOS/Linux
taskkill /PID <PID> /F  # Windows
```

### WebSocket Not Connecting
1. Check server is running: `curl http://localhost:3001/api/game-state`
2. Check client .env: `VITE_API_URL=http://localhost:3001`
3. Check browser console for errors
4. Clear browser cache and reload

### Database Locked Error
```bash
# Kill all Node processes
killall node  # macOS/Linux
taskkill /IM node.exe /F  # Windows

# Restart server
npm run server
```

### Build Fails
```bash
# Clear node_modules and reinstall
rm -rf node_modules client/node_modules
npm install
cd client && npm install
```

### Styles Not Updating
```bash
# Rebuild Tailwind
cd client
npm run dev
```

## 📊 Monitoring During Event

### View Server Logs
```bash
# If running with npm run dev
# Logs appear in terminal

# If running with PM2
pm2 logs investment-game

# View specific lines
pm2 logs investment-game --lines 100
```

### Check Connection Count
Add to `server/index.js`:
```javascript
io.on('connection', (socket) => {
  console.log(`Client connected. Total: ${io.engine.clientsCount}`);
});
```

### Monitor Database Size
```bash
ls -lh server/game.db
du -h server/game.db
```

### Export Results
```bash
# Export to CSV
sqlite3 -header -csv server/game.db "
SELECT 
  s.name as Startup,
  i.name as Investor,
  inv.amount as Amount
FROM investments inv
JOIN startups s ON inv.startup_id = s.id
JOIN investors i ON inv.investor_id = i.id
ORDER BY s.name, inv.amount DESC
" > results.csv
```

## 🎯 Pre-Event Checklist

### Day Before
- [ ] Test complete flow (join → invest → admin)
- [ ] Clear test data: `npm run seed`
- [ ] Verify admin credentials
- [ ] Check server accessibility on network
- [ ] Test on mobile devices
- [ ] Backup empty database

### 30 Minutes Before
- [ ] Clear any test data
- [ ] Verify server is running
- [ ] Test one investor join
- [ ] Check WebSocket connection
- [ ] Have backup plan ready

### During Event
- [ ] Monitor server logs
- [ ] Watch for errors
- [ ] Check connection count
- [ ] Keep admin panel open
- [ ] Be ready to lock game

### After Event
- [ ] Lock game immediately
- [ ] Backup final database
- [ ] Export results to CSV
- [ ] Save screenshots
- [ ] Thank participants!

## 🚨 Emergency Actions

### Freeze Everything
In admin panel, click "Lock" button. All investments immediately frozen.

### Restart Server (Preserve Data)
```bash
# Database persists automatically
# Just restart:
npm run server
```

### Roll Back Bad Investment
```bash
sqlite3 server/game.db
DELETE FROM investments 
WHERE investor_id = 'investor-id' 
AND startup_id = 'startup-id';
```

### Add More Time
Keep game unlocked, announce extension, participants can continue investing.

### Export Emergency Backup
```bash
# Quick backup with timestamp
cp server/game.db "backup-$(date +%Y%m%d-%H%M%S).db"
```

## 📱 Mobile Access Tips

### Share URL Easily
Generate QR code:
```bash
# Install qrcode
npm install -g qrcode-terminal

# Generate QR
qrcode-terminal http://your-server-ip:5173
```

### Local Network Access
Find your local IP:
```bash
# macOS/Linux
ifconfig | grep "inet " | grep -v 127.0.0.1

# Windows
ipconfig | findstr IPv4
```

Share: `http://192.168.x.x:5173`

### Update Client URL
Edit `client/.env`:
```env
VITE_API_URL=http://192.168.x.x:3001
```

Rebuild: `cd client && npm run dev`

## 🎓 Training New Admins

### Quick Demo Script
1. Show join flow (use fake name)
2. Create test startup in admin
3. Make test investment
4. Show leaderboard updates
5. Lock game
6. Unlock game
7. Remove test data

### Key Admin Features
- **Lock/Unlock**: Control game state
- **Edit Credits**: Adjust individual investors
- **Create Startups**: Add on the fly
- **Delete**: Remove mistakes
- **Stats**: Monitor engagement

### Admin Panel Tour
- **Overview**: Quick stats, top startups
- **Investors**: Manage participants, edit credits
- **Startups**: Create/edit/delete companies
- **Investments**: Detailed breakdown per startup

## 💡 Pro Tips

### Multiple Rounds
1. Lock after round 1
2. Discuss results
3. Unlock for round 2
4. Investors adjust strategy

### Different Groups
Create investors with different starting credits:
- VIPs: 5,000,000 CR
- Students: 1,000,000 CR
- Judges: 3,000,000 CR

### Live Announcements
Keep admin panel on projector to show:
- Real-time investment totals
- Most popular startups
- Investment count

### Post-Event Analysis
Export data to spreadsheet:
```bash
sqlite3 -header -csv server/game.db "
SELECT * FROM investments
" > investments.csv
```

Analyze in Excel/Sheets:
- Most funded startups
- Investor behavior patterns
- Capital distribution
- Group dynamics

## 🎉 Success Metrics

Track these during your event:
- Total participants
- Investment participation rate (% who invested)
- Average investments per investor
- Most popular startup
- Most active investor
- Total capital deployed
- Average investment size

View in admin panel Overview tab!

---

**Need Help?** Check README.md for detailed documentation or DEPLOYMENT.md for hosting guidance.
