# 🚀 SETUP - DO THIS FIRST

## Quick Install (5 minutes)

```bash
# 1. Extract the zip file

# 2. Go to folder
cd investment-game

# 3. Install server dependencies
npm install

# 4. Install client dependencies
cd client
npm install
cd ..

# 5. Load your 5 AIM startups
npm run seed

# 6. Start the app
npm run dev
```

**Visit:** http://localhost:5173

**Admin:** http://localhost:5173/admin (admin/demo123)

---

## If You Get Errors

### Error: "patch-package: command not found"

**Fix:**
```bash
# Already fixed! Just install:
npm install
cd client && npm install && cd ..
```

### Error: "better-sqlite3" build issues

**Mac:**
```bash
xcode-select --install
npm install
```

**Linux:**
```bash
sudo apt-get install build-essential python3
npm install
```

**Windows:**
```bash
# Install windows-build-tools:
npm install --global windows-build-tools
npm install
```

### Error: Port 3001 already in use

```bash
# Kill the process:
# Mac/Linux:
lsof -ti:3001 | xargs kill -9

# Windows:
netstat -ano | findstr :3001
taskkill /PID <PID> /F
```

---

## Production Build

```bash
# Build client
cd client
npm run build
cd ..

# The dist folder is ready for deployment
```

---

## Test Everything Works

```bash
# 1. Start app
npm run dev

# 2. Open browser: http://localhost:5173
# 3. Join as "Test User"
# 4. See 5 AIM startups
# 5. Make an investment
# 6. Open admin: http://localhost:5173/admin
# 7. Login: admin / demo123
# 8. See your investment in Overview tab

# ✅ If all works, you're ready!
```

---

## Deploy to Railway

```bash
# 1. Change password in .env
ADMIN_PASSWORD=YourSecurePassword123!

# 2. Build
cd client && npm run build && cd ..

# 3. Push to GitHub
git init
git add .
git commit -m "AUB Angel Investor"
git remote add origin YOUR_GITHUB_REPO
git push -u origin main

# 4. Deploy on Railway.app
# - Connect GitHub repo
# - Add environment variables
# - Deploy!
```

See **DEPLOY_NOW.md** for full Railway guide.

---

## Need Help?

Check these files:
- **DEPLOY_NOW.md** - Deploy to Railway in 15 min
- **QUICK_REFERENCE.md** - Common commands
- **NEW_FEATURES.md** - What's new

---

**That's it! You're ready to go! 🎉**
