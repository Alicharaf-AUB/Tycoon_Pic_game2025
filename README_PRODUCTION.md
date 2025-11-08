# 🏆 AUB Angel Investor

**Real-time investment simulation for AUB Innovation and Maker (AIM) events**

Deploy in 15 minutes • 5 Real Startups • Mobile-First • Gold Luxury Theme

[![Deploy](https://img.shields.io/badge/Deploy-Railway-blueviolet)](https://railway.app)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Node](https://img.shields.io/badge/Node-16+-success)](https://nodejs.org)

---

## 🎯 What Is This?

A **production-ready** web app where event participants invest virtual capital in real AIM startups, seeing live results and transparent leaderboards. Built specifically for AUB events with:

- ✅ **5 Real AIM Startups** (Mina Canaan, IGT, Impersonas, Schedex, Bilo)
- ✅ **AUB Branding** throughout the interface
- ✅ **Gold Luxury Theme** (professional yellow/gold design)
- ✅ **Real-time Updates** via WebSocket
- ✅ **Mobile Optimized** for live events
- ✅ **Admin Dashboard** with full control

**Perfect for**: Demo days, pitch competitions, training workshops, investor education

---

## ⚡ Quick Start

### For Deployment (Event Organizers)

**Deploy to Production in 15 minutes:**

```bash
# 1. Build the app
cd client && npm install && npm run build && cd ..

# 2. Push to GitHub
git init && git add . && git commit -m "Deploy AUB Angel Investor"

# 3. Deploy to Railway
# See DEPLOY_NOW.md for detailed steps
```

**Full guides available:**
- 📘 **DEPLOY_NOW.md** - 15-minute deployment walkthrough
- 📗 **RAILWAY_DEPLOY.md** - Complete Railway guide
- 📙 **PRODUCTION_CHECKLIST.md** - Pre-launch verification

### For Local Testing

```bash
# Install dependencies
npm install
cd client && npm install && cd ..

# Initialize database with AIM startups
npm run seed

# Start development servers
npm run dev

# Visit http://localhost:5173
```

**Access:**
- Players: `http://localhost:5173`
- Admin: `http://localhost:5173/admin` (admin/demo123)

---

## 🎨 The Experience

### For Participants (Investors)

1. **Join** - Enter name, receive 2,000,000 CR
2. **Browse** - View 5 real AIM startups with descriptions
3. **Invest** - Allocate capital across startups
4. **Watch** - See live leaderboard and other investors
5. **Adjust** - Edit investments anytime (until game locks)

### For Organizers (Admins)

1. **Monitor** - Real-time dashboard with stats
2. **Control** - Lock/unlock to freeze voting
3. **Manage** - Adjust credits, add/remove participants
4. **Analyze** - See which startups are most popular
5. **Present** - Display live results on projector

---

## 🏗️ Tech Stack

**Backend:**
- Node.js + Express
- Socket.io (real-time)
- SQLite (database)
- Basic Auth (admin)

**Frontend:**
- React + Vite
- Tailwind CSS (gold theme)
- Socket.io client
- Responsive design

**Infrastructure:**
- Railway (recommended)
- GitHub (source control)
- HTTPS (automatic)

---

## 📱 The Real AIM Startups

Your app includes these 5 companies:

1. **Mina Canaan** - EnergyTech
   - Sustainable catamarans powered by wind, sun, electricity, hydrogen

2. **IGT** - GreenTech
   - Solar systems and green industry solutions

3. **Impersonas** - Digital Humans
   - Virtual avatars for brands (the "Netflix of digital humans")

4. **Schedex** - B2B SaaS
   - AI-powered scheduling for hospitality & F&B

5. **Bilo** - AdTech
   - Launch outdoor billboard ads in 5 minutes

---

## 🎪 Running an Event

### Before Event (1 day)

1. Deploy to Railway
2. Test with team
3. Clear test data
4. Prepare QR code with URL

### 1 Hour Before

1. Verify app accessible
2. Check all startups visible
3. Confirm game UNLOCKED
4. Test on mobile

### During Event

1. Keep admin panel open
2. Monitor investments live
3. Watch Overview tab
4. Lock when voting ends

### After Pitches

1. Lock game immediately
2. Screenshot results
3. Announce top startup
4. Celebrate winners! 🏆

---

## 🎨 Design Features

### Gold Luxury Theme

- **Colors**: Gold (#eab308), Amber, Yellow
- **Style**: Professional tycoon aesthetic
- **Mood**: Wealth, success, premium
- **Typography**: Bold, confident, uppercase labels

### Mobile-First

- Touch-friendly buttons
- Responsive grid
- Optimized for phones
- Perfect for live events

### Real-Time

- Instant updates
- Live leaderboard
- WebSocket powered
- See others invest

---

## 🔐 Security

- ✅ Basic Auth for admin panel
- ✅ HTTPS enforced (Railway automatic)
- ✅ Environment variables for credentials
- ✅ No real financial transactions
- ✅ Controlled simulation environment

**Important**: Change admin password before deploying!

---

## 📊 Expected Usage

- **Participants**: 20-100 simultaneous investors
- **Duration**: 15-30 minute investment period
- **Investments**: 1-3 per person average
- **Platform**: Primarily mobile phones
- **Network**: WiFi or mobile data

---

## 🚀 Deployment Platforms

### Railway (Recommended) ⭐

**Why Railway:**
- One-click deploy from GitHub
- Automatic HTTPS
- Free tier available
- Auto-deploys on push
- Built-in monitoring

**Setup time**: 10 minutes  
**Difficulty**: Easy ⭐  
**Cost**: Free ($5/month credit)

See `RAILWAY_DEPLOY.md` for detailed guide.

### Alternative Platforms

- **Fly.io** - Global edge deployment
- **Render** - Free tier available
- **Heroku** - Classic PaaS
- **DigitalOcean** - App Platform
- **VPS** - Full control (Ubuntu guide included)

All deployment guides in `DEPLOYMENT.md`

---

## 📚 Documentation

Comprehensive guides included:

- **DEPLOY_NOW.md** - Quick 15-min deployment
- **RAILWAY_DEPLOY.md** - Full Railway walkthrough
- **PRODUCTION_CHECKLIST.md** - Launch verification
- **QUICK_REFERENCE.md** - Common operations
- **THEME_CHANGES.md** - Design system details
- **VISUAL_GUIDE.md** - UI/UX specifications

---

## 🎯 Features Checklist

- ✅ Real-time WebSocket updates
- ✅ Mobile-responsive design
- ✅ Admin control panel
- ✅ Lock/unlock game rounds
- ✅ Transparent leaderboard
- ✅ Flexible credit allocation
- ✅ 5 real AIM startups
- ✅ AUB branding
- ✅ Gold luxury theme
- ✅ Production ready

---

## 💡 Use Cases

### Demo Days
- Attendees vote on pitches
- Real-time popularity contest
- Engages audience
- Creates excitement

### Training Workshops
- Teach portfolio allocation
- Demonstrate market dynamics
- Practice investment strategy
- Safe learning environment

### Pitch Competitions
- Audience participation
- Democratic voting
- Transparent results
- Professional presentation

### Team Building
- Interactive activity
- Competitive element
- Discussion catalyst
- Fun and engaging

---

## 🔧 Customization

### Change Startups

Edit `server/seed.js`:
```javascript
const startups = [
  {
    name: 'Your Startup',
    slug: 'your-startup',
    description: 'Your description here',
  },
  // Add more...
];
```

### Adjust Starting Credit

Edit `server/database.js`:
```javascript
starting_credit INTEGER NOT NULL DEFAULT 2000000
```

Or adjust per investor in admin panel.

### Modify Theme

Edit `client/tailwind.config.js` for colors.
Edit `client/src/index.css` for styles.

---

## 🆘 Troubleshooting

### App Won't Start

```bash
# Check logs
railway logs

# Common fixes:
- Verify environment variables
- Check PORT is set to 3001
- Ensure build completed
```

### WebSocket Issues

```bash
# Solutions:
- Verify CLIENT_URL matches domain
- Check CORS settings
- Test WebSocket connection
```

### Admin Can't Login

```bash
# Check:
- Credentials in environment variables
- No typos in username/password
- Basic Auth is working
- Try incognito mode
```

More in `QUICK_REFERENCE.md`

---

## 📞 Support

**Documentation:**
- Full guides in repository
- Step-by-step checklists
- Troubleshooting section

**Platform Support:**
- Railway: https://railway.app/help
- Railway Discord: https://discord.gg/railway

**Issues:**
- Check logs first
- Review checklist
- Test locally

---

## 📄 License

MIT License - Feel free to use for AUB events!

---

## 🎉 Credits

Built for **American University of Beirut (AUB)**  
**Innovation and Maker (AIM)** Program

Featuring real AIM startups:
- Mina Canaan
- IGT
- Impersonas
- Schedex
- Bilo

---

## 🚀 Ready to Deploy?

```bash
# Quick Start:
1. cd client && npm run build
2. Push to GitHub
3. Deploy to Railway
4. Share URL with participants
5. Run your event!
```

**See DEPLOY_NOW.md for complete walkthrough**

---

**Built with ❤️ for AUB • Deploy in 15 minutes • Perfect for demo days**

🏆 Good luck with your event!
