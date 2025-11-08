# 🚀 Quick Start - AUB Angel Investor

## 📋 What's Included

Your app is loaded with **5 real AIM startups**:
1. 🌊 **Mina Canaan** - Marine tech catamarans
2. ⚡ **IGT** - Green energy solutions  
3. 👥 **Impersonas** - Digital humans platform
4. 📅 **Schedex** - AI shift management
5. 📺 **Bilo** - Outdoor advertising AI

## ⚡ 3-Minute Setup (Development)

```bash
# 1. Install dependencies
npm install

# 2. Load AIM startups into database
npm run seed

# 3. Start the app
npm run dev
```

**Access:**
- 👥 Players: http://localhost:5173
- 🔐 Admin: http://localhost:5173/admin
  - Username: `admin`
  - Password: `demo123`

## 🚀 Deploy to Production (Railway - 10 Minutes)

### Step 1: Push to GitHub
```bash
git init
git add .
git commit -m "AUB Angel Investor - Ready"
git branch -M main

# Create repo on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/aub-angel-investor.git
git push -u origin main
```

### Step 2: Deploy on Railway
1. Go to https://railway.app
2. Sign up/Login with GitHub
3. Click **"New Project"**
4. Select **"Deploy from GitHub repo"**
5. Choose your `aub-angel-investor` repo

### Step 3: Configure Environment
In Railway project → **Variables** tab, add:

```
NODE_ENV=production
ADMIN_USERNAME=admin
ADMIN_PASSWORD=YOUR_SECURE_PASSWORD_HERE
```

**Generate secure password:**
```bash
openssl rand -base64 32
```

### Step 4: Get Your URL
Railway will give you a URL like:
```
https://aub-angel-investor-production.up.railway.app
```

Update variables:
```
CLIENT_URL=https://your-railway-url.up.railway.app
```

### Step 5: Test
- Visit your Railway URL
- Join as test investor
- Check admin panel works
- Test on mobile

**Done!** 🎉

## 📱 Share With Participants

### Create QR Code
```bash
npm install -g qrcode-terminal
qrcode-terminal https://your-railway-url.up.railway.app
```

### Or Share Link Directly
Send participants:
```
🎯 AUB Angel Investor

Join and invest: https://your-url.com

You'll receive 2,000,000 CR to invest across 5 AIM startups!
```

## 🎮 Running Your Event

### Before Event (30 min)
1. ✅ Verify all 5 startups visible
2. ✅ Test join flow on mobile
3. ✅ Open admin panel
4. ✅ Ensure game is UNLOCKED
5. ✅ Share QR code/link

### During Event
1. **Participants join** → They enter name
2. **Participants invest** → They allocate 2M CR across startups
3. **Real-time updates** → Everyone sees all investments
4. **Lock when ready** → Click 🔒 Lock button in admin

### After Event
1. **Review results** → Admin panel shows:
   - Top funded startups
   - Investment breakdown
   - Investor leaderboard

2. **Export data:**
```bash
# SSH into server or use Railway CLI
sqlite3 server/game.db
.mode csv
.output results.csv
SELECT s.name as Startup, SUM(i.amount) as Total
FROM investments i
JOIN startups s ON i.startup_id = s.id
GROUP BY s.name
ORDER BY Total DESC;
.quit
```

## 🎨 Customization

### Change Starting Credits
Edit `server/database.js`, line 13:
```javascript
starting_credit INTEGER NOT NULL DEFAULT 5000000  // Change amount
```

### Update Branding
Edit `client/src/pages/JoinPage.jsx`, line 27:
```javascript
<h1 className="text-5xl font-bold mb-3 text-gradient-gold font-display">
  Your Event Name Here
</h1>
```

### Add Your Logo
1. Add logo to `client/public/logo.png`
2. Edit `client/src/pages/JoinPage.jsx`:
```jsx
<img src="/logo.png" alt="Logo" className="h-20 w-auto" />
```

## 🔧 Troubleshooting

### Can't Access Admin Panel
- Clear browser cache
- Use incognito mode
- Check username/password in Railway variables

### Participants Can't Join
- Verify game is UNLOCKED (admin panel)
- Check Railway logs for errors
- Test on mobile device

### WebSocket Not Working
- Refresh page
- Check CORS settings match domain
- Verify CLIENT_URL is correct

## 📊 Event Metrics

After your event, admin panel shows:
- 👥 Total participants
- 🚀 Most popular startup
- 💰 Total capital invested
- 📊 Investment distribution

## 🎉 Success Metrics

**Your event is successful when:**
- ✅ 50+ participants join
- ✅ All startups receive investments
- ✅ Lively discussions about choices
- ✅ Clear winner emerges
- ✅ Everyone has fun! 🎊

## 🆘 Need Help?

**Common Issues:**
1. **Railway build fails** → Check Node version (18+)
2. **Database issues** → Run `npm run seed` again
3. **Can't login** → Reset password in Railway variables
4. **Slow loading** → Railway free tier can take 30s to wake up

**Pro Tips:**
- Deploy 24 hours before event to test
- Have backup mobile hotspot ready
- Print QR codes in large format
- Keep admin panel on projector
- Lock game right after voting ends

## 📞 Pre-Event Checklist

**1 Week Before:**
- [ ] Deploy to Railway
- [ ] Test with colleagues
- [ ] Generate QR codes
- [ ] Prepare announcement

**1 Day Before:**
- [ ] Fresh database seed
- [ ] Test on mobile
- [ ] Check admin credentials
- [ ] Verify all startups active

**1 Hour Before:**
- [ ] Game unlocked
- [ ] Admin panel open
- [ ] Mobile ready
- [ ] Backup plan ready

**Go Time!** 🚀

Share link, watch investments flow in real-time, and crown your winner! 🏆

---

**Made with 💰 for AUB Innovation & Entrepreneurship**
