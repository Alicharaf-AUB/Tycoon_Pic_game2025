# 🚀 Quick Start Guide - PostgreSQL Setup

## ⚡ 3-Minute Setup (Supabase)

### Step 1: Create Database (2 minutes)
1. Go to **https://supabase.com**
2. Click **"Start your project"**
3. Sign up with GitHub/Email
4. Click **"New Project"**
   - Name: `investment-game`
   - Password: Choose a strong password (SAVE THIS!)
   - Region: Choose closest to you
5. Wait 2 minutes for provisioning ⏳

### Step 2: Get Connection String (30 seconds)
1. Click **Settings** (⚙️ gear icon)
2. Click **Database**
3. Scroll to **"Connection string"**
4. Click **URI** tab
5. **Copy** the connection string
6. **Replace** `[YOUR-PASSWORD]` with your actual password

Example:
```
postgresql://postgres.abcdefg:YOUR_PASSWORD@aws-0-us-west-1.pooler.supabase.com:5432/postgres
```

### Step 3: Update .env File (30 seconds)
```bash
cd /Users/alicharaf/Desktop/investment-game/server
nano .env
```

**Uncomment and paste** your DATABASE_URL:
```env
DATABASE_URL=postgresql://postgres.xxx:your-password@host:5432/postgres
```

Save: `Ctrl+O`, Enter, `Ctrl+X`

### Step 4: Start the Server (10 seconds)
```bash
cd /Users/alicharaf/Desktop/investment-game/server
npm start
```

**Look for these success messages:**
```
✅ Connected to PostgreSQL database
✅ PostgreSQL connection test successful
✅ Database schema initialized
✅ Database ready
Server running on port 3001
```

### Step 5: Start the Client
```bash
# In a new terminal window
cd /Users/alicharaf/Desktop/investment-game/client
npm run dev
```

**Open**: http://localhost:5173

---

## 🎯 Test It Works

1. **Create Investor**: Go to http://localhost:5173
2. **Make Investment**: Invest in any startup
3. **Restart Server**: Press `Ctrl+C` in server terminal, run `npm start` again
4. **Check Data**: Refresh browser - your investment should still be there! ✅

**If data persists = SUCCESS!** 🎉

---

## 🐛 Troubleshooting

### "DATABASE_URL environment variable is not set"
✅ Make sure you uncommented the line in `.env`  
✅ Remove any spaces around the `=` sign  
✅ File must be named exactly `.env` (not `.env.txt`)

### "Connection timeout" or "Connection refused"
✅ Check your internet connection  
✅ Verify the password in DATABASE_URL is correct  
✅ Make sure you replaced `[YOUR-PASSWORD]` with actual password

### "SSL required"
✅ Add `?sslmode=require` to the end of your DATABASE_URL:
```
DATABASE_URL=postgresql://...postgres?sslmode=require
```

---

## 📋 Commands Cheat Sheet

```bash
# Start server
cd /Users/alicharaf/Desktop/investment-game/server && npm start

# Start client (development)
cd /Users/alicharaf/Desktop/investment-game/client && npm run dev

# Build client (production)
cd /Users/alicharaf/Desktop/investment-game/client && npm run build

# View database in Supabase
# Go to: https://supabase.com/dashboard/project/YOUR_PROJECT/editor
```

---

## ✅ Success Checklist

After setup, verify:

- [ ] Server starts without errors
- [ ] See "✅ Connected to PostgreSQL database"
- [ ] See "✅ Database schema initialized"
- [ ] Client opens at http://localhost:5173
- [ ] Can create investor account
- [ ] Can make investments
- [ ] **Data persists after server restart** ⭐

---

## 🎊 Done!

Your app is now running with PostgreSQL. Data will **never be lost** again!

**What Changed:**
- Before: SQLite (data lost on restart) ❌
- After: PostgreSQL (data persists forever) ✅

**Next Steps:**
1. Test all features locally
2. Deploy to Azure/Railway with DATABASE_URL
3. Enjoy permanent data storage! 🎉

---

**Need More Help?** Read `SETUP_DATABASE.md` for detailed instructions.
