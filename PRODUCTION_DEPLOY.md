# 🚀 Production Deployment Checklist

## Pre-Deployment Steps

### 1. ✅ Security Setup
- [ ] **Change Admin Password**
  ```bash
  # Edit .env file
  ADMIN_PASSWORD=your_secure_production_password
  ```
  - Generate strong password: `openssl rand -base64 32`
  - Store securely (password manager)

- [ ] **Update CORS Settings**
  ```javascript
  // In server/index.js, update CLIENT_URL
  CLIENT_URL=https://your-production-domain.com
  ```

### 2. 🗄️ Database Setup
- [ ] **Clean Database**
  ```bash
  npm run seed
  ```
  - Removes all test data
  - Loads 5 real AIM startups
  - Ready for live investors

- [ ] **Verify Startups**
  - Check all startup descriptions are correct
  - Ensure slugs are URL-friendly

### 3. 🎨 Branding
- [ ] **Update Site Title** (already done)
  - `client/index.html` → "AUB Angel Investor"

- [ ] **Logo** (optional)
  - Replace 💰 emoji in JoinPage.jsx with logo image
  - Add logo file to `client/public/`

### 4. 🔧 Configuration

**Server (.env file):**
```env
NODE_ENV=production
PORT=3001
ADMIN_USERNAME=admin
ADMIN_PASSWORD=YOUR_SECURE_PASSWORD_HERE
CLIENT_URL=https://your-domain.com
```

**Client (client/.env):**
```env
VITE_API_URL=https://your-domain.com
```

## Deployment Options

### Option 1: Railway (Recommended - Easiest) ⭐

**Why Railway:**
- ✅ Free tier available
- ✅ Automatic HTTPS
- ✅ Auto-deploy from Git
- ✅ One-click setup
- ✅ Perfect for events

**Steps:**

1. **Create Account**
   - Visit https://railway.app
   - Sign up with GitHub

2. **Deploy from GitHub**
   ```bash
   # Push your code to GitHub first
   git init
   git add .
   git commit -m "AUB Angel Investor - Production Ready"
   git branch -M main
   git remote add origin https://github.com/yourusername/aub-angel-investor.git
   git push -u origin main
   ```

3. **Create New Project on Railway**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your repository

4. **Configure Environment Variables**
   - Go to Variables tab
   - Add all variables from .env:
     - `ADMIN_USERNAME`
     - `ADMIN_PASSWORD`
     - `CLIENT_URL` (Railway will provide this)
     - `NODE_ENV=production`

5. **Deploy**
   - Railway auto-deploys
   - Get your URL: `https://your-app.up.railway.app`
   - Update `CLIENT_URL` to this URL

6. **Build Client**
   - Add build command in Railway:
     ```
     npm install && cd client && npm install && npm run build && cd ..
     ```

**Estimated time:** 15 minutes

---

### Option 2: Vercel + Heroku

**Frontend on Vercel (Free):**
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy client
cd client
vercel --prod
```

**Backend on Heroku (Free):**
```bash
# Install Heroku CLI
brew install heroku  # macOS
# or download from heroku.com

# Deploy
heroku create aub-angel-investor
git push heroku main
heroku config:set ADMIN_PASSWORD=your_password
```

---

### Option 3: VPS (DigitalOcean/AWS)

**For full control:**

1. **Get Ubuntu VPS** ($5/month on DigitalOcean)

2. **Setup Server**
   ```bash
   # SSH into server
   ssh root@your-server-ip

   # Install Node.js
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs

   # Install PM2
   sudo npm install -g pm2

   # Clone your repo
   git clone https://github.com/yourusername/aub-angel-investor.git
   cd aub-angel-investor

   # Install dependencies
   npm install
   cd client && npm install && npm run build && cd ..

   # Create .env file
   nano .env
   # Add your production variables

   # Seed database
   npm run seed

   # Start with PM2
   pm2 start server/index.js --name aub-angel-investor
   pm2 save
   pm2 startup
   ```

3. **Setup Nginx**
   ```bash
   sudo apt install nginx
   sudo nano /etc/nginx/sites-available/aub-angel-investor
   ```

   ```nginx
   server {
       listen 80;
       server_name your-domain.com;

       location / {
           proxy_pass http://localhost:3001;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

   ```bash
   sudo ln -s /etc/nginx/sites-available/aub-angel-investor /etc/nginx/sites-enabled/
   sudo systemctl restart nginx
   ```

4. **SSL Certificate (Free)**
   ```bash
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d your-domain.com
   ```

**Estimated time:** 45 minutes

---

## Post-Deployment

### 1. ✅ Testing
- [ ] Visit production URL
- [ ] Test investor join flow
- [ ] Make test investment
- [ ] Login to admin panel
- [ ] Lock/unlock game
- [ ] Test on mobile device

### 2. 📱 Share Links
Create QR codes for easy mobile access:
```bash
# Install qrcode generator
npm install -g qrcode-terminal

# Generate QR code
qrcode-terminal https://your-production-url.com
```

Print QR code for event participants!

### 3. 🎯 Event Preparation

**30 Minutes Before Event:**
- [ ] Clear any test investments
- [ ] Verify all 5 startups are visible
- [ ] Check game is UNLOCKED
- [ ] Test on mobile
- [ ] Have admin panel open

**During Event:**
- Keep admin panel visible
- Monitor investments in real-time
- Lock game when voting period ends
- Export results afterward

### 4. 📊 Backup Data

**Export results after event:**
```bash
# SSH into server
sqlite3 server/game.db

# Export to CSV
.mode csv
.output results.csv
SELECT 
  s.name as Startup,
  i.name as Investor,
  inv.amount as Amount
FROM investments inv
JOIN startups s ON inv.startup_id = s.id
JOIN investors i ON inv.investor_id = i.id
ORDER BY s.name, inv.amount DESC;
.quit
```

**Backup database:**
```bash
cp server/game.db backups/game-$(date +%Y%m%d).db
```

---

## 🚨 Troubleshooting

### Issue: Can't connect to server
**Solution:**
- Check firewall allows port 3001
- Verify server is running: `pm2 status`
- Check logs: `pm2 logs aub-angel-investor`

### Issue: WebSocket not working
**Solution:**
- Ensure CORS is configured correctly
- Check CLIENT_URL matches frontend URL
- Verify both HTTP and WS on same port

### Issue: Database locked
**Solution:**
```bash
# Stop all processes
pm2 stop aub-angel-investor
# Restart
pm2 restart aub-angel-investor
```

---

## 📞 Support Contacts

**Before Event:**
- Test everything 24 hours before
- Have backup plan ready
- Know how to lock game quickly

**During Event:**
- Keep admin panel open
- Monitor for errors
- Have device ready to fix issues

---

## 🎉 Go Live!

You're ready to deploy **AUB Angel Investor** for your event!

**Quick Deploy (Railway):**
```bash
# 1. Push to GitHub
git init && git add . && git commit -m "Production ready"

# 2. Deploy on Railway
# Visit railway.app → New Project → Deploy from GitHub

# 3. Done! ✅
```

**Share your link and let the investing begin!** 🚀💰

---

## Post-Event Checklist

- [ ] Lock game (preserve final state)
- [ ] Backup database
- [ ] Export results to CSV
- [ ] Take screenshots of final leaderboard
- [ ] Thank participants
- [ ] Announce winners
- [ ] Archive data for future reference

**Congratulations on a successful event!** 🏆
