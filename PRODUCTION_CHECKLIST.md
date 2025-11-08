# 🎯 Production Deployment Checklist

Use this checklist to ensure your AUB Angel Investor app is ready for deployment.

## ✅ Pre-Deployment (Do This First)

### Security
- [ ] Changed admin password from `demo123` to a strong password
- [ ] Updated `.env` with production credentials
- [ ] Admin password is 12+ characters with mixed case, numbers, symbols
- [ ] Removed any test/debug code
- [ ] No sensitive data in client-side code

### Configuration
- [ ] Updated `CLIENT_URL` in `.env` to production domain
- [ ] Verified all environment variables are set
- [ ] Tested locally with `NODE_ENV=production npm start`
- [ ] Confirmed database seeds with real AIM startups

### Code Quality
- [ ] All features tested locally
- [ ] No console.errors in browser
- [ ] Mobile responsive (tested on phone)
- [ ] WebSocket connections work
- [ ] Admin panel accessible and functional

### Content
- [ ] All 5 AIM startups are correct:
  - [ ] Mina Canaan
  - [ ] IGT
  - [ ] Impersonas
  - [ ] Schedex
  - [ ] Bilo
- [ ] Startup descriptions are accurate
- [ ] Branding shows "AUB Angel Investor"
- [ ] Color theme is correct (gold/yellow tycoon)

## 🚀 Deployment Steps

### 1. Build
- [ ] Run `cd client && npm install && npm run build`
- [ ] Verify `client/dist` folder exists
- [ ] Check dist folder size is reasonable (~2-5MB)

### 2. Git Repository
- [ ] Code committed to git
- [ ] `.gitignore` excludes node_modules and .db files
- [ ] Pushed to GitHub/GitLab
- [ ] Repository is accessible

### 3. Platform Setup (Railway/Vercel/etc)
- [ ] Account created
- [ ] Repository connected
- [ ] Build command configured
- [ ] Start command configured
- [ ] Environment variables set

### 4. Domain & SSL
- [ ] Domain assigned (yourapp.railway.app or custom)
- [ ] HTTPS enabled (automatic on Railway)
- [ ] Domain accessible in browser
- [ ] No SSL warnings

### 5. Database
- [ ] Database initialized (auto-seeded on first run)
- [ ] 5 startups visible in admin panel
- [ ] Game state is UNLOCKED
- [ ] No sample investors or investments

## ✅ Post-Deployment (After Going Live)

### Immediate Verification
- [ ] Visit player URL - join page loads
- [ ] Join page shows "AUB Angel Investor" branding
- [ ] Create test investor account
- [ ] View all 5 startups
- [ ] Make test investment
- [ ] Investment shows in startup card
- [ ] Numbers update in real-time

### Admin Panel
- [ ] Access `/admin` URL
- [ ] Login with admin credentials
- [ ] Overview tab shows correct stats
- [ ] Investors tab lists test investor
- [ ] Startups tab shows all 5 startups
- [ ] Investments tab shows test investment
- [ ] Lock/unlock button works
- [ ] When locked, investors can't invest

### Real-Time Features
- [ ] Open app in 2 browser windows
- [ ] Make investment in window 1
- [ ] Verify it appears in window 2 instantly
- [ ] Check admin panel updates in real-time
- [ ] Test with phone + desktop simultaneously

### Mobile Testing
- [ ] Open on mobile phone
- [ ] Join as investor
- [ ] Cards display correctly
- [ ] Buttons are touch-friendly
- [ ] Investment modal works
- [ ] Stats are readable
- [ ] No horizontal scrolling

### Performance
- [ ] Page loads in < 3 seconds
- [ ] No errors in browser console
- [ ] No errors in server logs
- [ ] WebSocket connection stable
- [ ] Can handle multiple simultaneous users

## 🎯 Event Preparation (1 Day Before)

### Team Briefing
- [ ] Share URLs with organizers
- [ ] Share admin credentials (securely)
- [ ] Explain lock/unlock functionality
- [ ] Show how to monitor investments
- [ ] Practice full flow together

### Technical Setup
- [ ] Clear any test data
- [ ] Re-seed database with fresh startups
- [ ] Verify game is UNLOCKED
- [ ] Test on event WiFi if possible
- [ ] Have backup plan (screenshots, offline mode)

### Communication
- [ ] Prepare QR code with join URL
- [ ] Prepare slides with URL
- [ ] Test URL on different devices
- [ ] Have short URL ready (bit.ly, etc)
- [ ] Prepare instructions for participants

## 🎪 Event Day (Morning Of)

### 2 Hours Before
- [ ] Verify app is accessible
- [ ] Check all 5 startups visible
- [ ] Make one test investment
- [ ] Clear test data
- [ ] Confirm game is UNLOCKED
- [ ] Check admin panel on laptop

### 30 Minutes Before
- [ ] Open admin panel on presenter screen
- [ ] Test join flow on phone
- [ ] Verify WebSocket working
- [ ] Check mobile data connection works
- [ ] Have support contact ready

### During Event
- [ ] Monitor admin panel
- [ ] Watch for errors in logs
- [ ] Track investor count
- [ ] Note any issues
- [ ] Be ready to lock game

### After Pitches
- [ ] Lock game immediately
- [ ] Take screenshot of results
- [ ] Export data (if needed)
- [ ] Announce winners
- [ ] Unlock for Q&A (optional)

## 📊 Post-Event

### Data Backup
- [ ] Export database file
- [ ] Screenshot final results
- [ ] Save investor list
- [ ] Document any issues
- [ ] Gather feedback

### Analysis
- [ ] Which startup got most investment?
- [ ] How many participants?
- [ ] What was average investment?
- [ ] Any technical issues?
- [ ] What could improve?

## 🆘 Emergency Contacts

**If something goes wrong:**

1. **App down**: Check Railway/platform status
2. **Can't login**: Verify credentials in env vars
3. **Investments not working**: Check game not locked
4. **Real-time not updating**: Refresh browser, check WebSocket
5. **Mobile issues**: Try different browser

**Backup plan:**
- Have paper ballots ready
- Screenshot results periodically
- Keep admin panel visible at all times

## 📞 Support Resources

- **Railway Status**: https://railway.app/status
- **Railway Logs**: `railway logs` (CLI) or dashboard
- **Browser Console**: F12 → Console tab
- **Server Logs**: Check Railway dashboard

## ✅ Success Criteria

Your deployment is successful when:

- [ ] 10+ people can join simultaneously
- [ ] Investments show in real-time
- [ ] Admin can lock/unlock game
- [ ] Mobile experience is smooth
- [ ] No errors during 1-hour test
- [ ] Team is confident using it

## 🎉 You're Ready!

If all checkboxes are ✅, you're ready to deploy!

**Last steps:**
1. Change admin password one more time
2. Clear any test data
3. Announce to team
4. Deploy!
5. Celebrate! 🎊

---

**Need help?** See:
- RAILWAY_DEPLOY.md - Deployment guide
- README.md - General documentation
- QUICK_REFERENCE.md - Common operations

**Pro tip**: Do a full rehearsal with your team 1 day before the event!
