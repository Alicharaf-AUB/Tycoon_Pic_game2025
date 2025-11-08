# 🚀 Railway Deployment Guide - AUB Angel Investor

Railway is the **easiest and fastest** way to deploy your AUB Angel Investor app. This guide will get you live in **under 10 minutes**.

## Why Railway?

✅ **One-click deployment** from GitHub  
✅ **Automatic HTTPS** with custom domains  
✅ **Auto-deploys** on git push  
✅ **Free tier** available ($5 credit/month)  
✅ **No configuration** needed  
✅ **Built-in monitoring**

## 📋 Pre-Deployment Checklist

Before deploying, make sure you've:

- [ ] Tested locally with `npm run dev`
- [ ] Changed admin password from `demo123`
- [ ] Pushed code to GitHub repository
- [ ] Verified all 5 AIM startups are in seed file
- [ ] Reviewed the app is ready for real use

## 🚂 Step-by-Step Deployment

### 1️⃣ Prepare Your Code

First, let's make the app production-ready:

```bash
# Make sure you're in the project directory
cd investment-game

# Build the client
cd client
npm install
npm run build
cd ..

# Test production build locally
NODE_ENV=production npm start
# Visit http://localhost:3001 to verify
```

### 2️⃣ Create a GitHub Repository

If you haven't already:

```bash
# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit - AUB Angel Investor ready for production"

# Create a new repository on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/aub-angel-investor.git
git branch -M main
git push -u origin main
```

### 3️⃣ Deploy to Railway

**Option A: Deploy from GitHub (Recommended)**

1. Go to [Railway.app](https://railway.app)
2. Click **"Start a New Project"**
3. Click **"Deploy from GitHub repo"**
4. Select your `aub-angel-investor` repository
5. Railway will automatically detect it's a Node.js app

**Option B: Deploy with Railway CLI**

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Initialize project
railway init

# Deploy
railway up
```

### 4️⃣ Configure Environment Variables

In Railway dashboard:

1. Go to your project
2. Click **"Variables"** tab
3. Add these variables:

```
NODE_ENV=production
PORT=3001
ADMIN_USERNAME=admin
ADMIN_PASSWORD=YOUR_SECURE_PASSWORD_HERE
CLIENT_URL=https://your-app.up.railway.app
```

**IMPORTANT**: Replace `YOUR_SECURE_PASSWORD_HERE` with a strong password!

### 5️⃣ Serve Static Files

Railway needs to serve the built React app. Add this to `server/index.js`:

Look for this comment near the end of the file (around line 15-20, after `const PORT = ...`):

```javascript
// Add this after middleware but before API routes
if (process.env.NODE_ENV === 'production') {
  const path = require('path');
  
  // Serve static files from React build
  app.use(express.static(path.join(__dirname, '../client/dist')));
  
  // Handle React routing - return index.html for non-API routes
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(__dirname, '../client/dist/index.html'));
  });
}
```

I'll do this for you in the next step!

### 6️⃣ Update Railway Settings

In Railway dashboard:

1. **Build Command**: `npm install && cd client && npm install && npm run build && cd ..`
2. **Start Command**: `npm start`
3. **Root Directory**: Leave empty (uses root)

### 7️⃣ Set Up Custom Domain (Optional)

1. In Railway dashboard, go to **"Settings"**
2. Click **"Generate Domain"** for a free `.railway.app` domain
3. Or add your **custom domain** if you have one
4. Update `CLIENT_URL` environment variable with your domain

### 8️⃣ Initialize Database

Railway will automatically create the database on first start. To seed it:

**Option 1: Automatic (Best for first deploy)**

Add to your `package.json`:

```json
"scripts": {
  "start": "node server/seed.js && node server/index.js"
}
```

This will seed the database every time the app starts.

**Option 2: Manual via Railway CLI**

```bash
railway run npm run seed
```

### 9️⃣ Verify Deployment

1. Visit your Railway URL: `https://your-app.up.railway.app`
2. You should see the join page with "AUB Angel Investor"
3. Try joining as a test investor
4. Login to admin at `/admin` with your credentials
5. Verify all 5 AIM startups are visible

### 🔟 Final Steps

1. **Test the full flow**:
   - Join as investor
   - Make investments
   - Check admin panel
   - Lock/unlock game

2. **Share with team**:
   - Send the Railway URL to organizers
   - Provide admin credentials (securely!)
   - Test with a few people before the event

3. **Monitor during event**:
   - Railway dashboard shows real-time metrics
   - Check logs if issues arise
   - Watch for WebSocket connections

## 🎯 Production URLs

After deployment, you'll have:

- **Player URL**: `https://your-app.up.railway.app`
- **Admin URL**: `https://your-app.up.railway.app/admin`

Share the player URL with participants!

## 🔒 Security Checklist

Before going live:

- [ ] Changed admin password from default
- [ ] Set strong password (12+ characters, mixed case, numbers, symbols)
- [ ] Tested admin login works
- [ ] Verified HTTPS is working
- [ ] Confirmed WebSocket connections work
- [ ] Tested on mobile devices

## 📊 Monitoring

Railway provides:

- **Metrics**: CPU, memory, network usage
- **Logs**: Real-time application logs
- **Deployments**: History of all deployments
- **Analytics**: Request counts and response times

Access these in your Railway dashboard.

## 🔄 Updating After Deployment

To update your app:

```bash
# Make changes locally
git add .
git commit -m "Update: your changes"
git push

# Railway automatically deploys the new version!
```

## 🆘 Troubleshooting

### App Won't Start

**Check logs in Railway dashboard:**
```
railway logs
```

**Common issues:**
- Missing environment variables
- Port mismatch (ensure PORT=3001)
- Build failed (check build logs)

### WebSocket Not Connecting

**Solution:**
- Ensure `CLIENT_URL` matches your Railway domain
- Check CORS settings in server code
- Verify WebSocket port is same as HTTP

### Database Not Persisting

**Solution:**
- Railway's filesystem is ephemeral
- Data persists as long as service is running
- For permanent storage, use Railway's PostgreSQL (optional)

### Can't Access Admin Panel

**Solutions:**
- Try `/admin` URL directly
- Clear browser cache
- Check admin credentials in environment variables
- Look for 401 errors in browser console

## 💡 Pro Tips

1. **Custom Domain**: Add your AUB domain for professional look
2. **Backups**: Export database before/after events
3. **Scaling**: Railway auto-scales, but monitor during events
4. **Testing**: Deploy to Railway staging first
5. **Logs**: Keep logs window open during events

## 📱 Testing Before Event

**One day before:**
1. Deploy to Railway
2. Share URL with team
3. Do a complete test run
4. Make 10-20 test investments
5. Lock/unlock game
6. Clear database: `railway run npm run seed`

**One hour before:**
1. Verify app is accessible
2. Test on mobile devices
3. Check admin panel loads
4. Confirm all startups visible
5. Ensure game is UNLOCKED

## 🎉 You're Live!

Once deployed:

1. **Share the URL** with participants
2. **Keep admin panel open** to monitor
3. **Lock when ready** to freeze results
4. **Celebrate!** 🎊

## 📞 Support

If you need help:

- **Railway Docs**: https://docs.railway.app
- **Railway Discord**: https://discord.gg/railway
- **Check logs**: `railway logs`

---

**Estimated deployment time**: 10-15 minutes  
**Difficulty**: Easy ⭐  
**Cost**: Free tier available ($5/month credit)

**Next**: See PRODUCTION_CHECKLIST.md for final verification steps!
