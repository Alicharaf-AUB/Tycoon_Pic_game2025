# Railway Deployment Guide with Persistent Storage

This guide explains how to deploy your VIP Investment Hub to Railway with **persistent data storage** so your database and uploads don't get reset on each deployment.

## Problem

By default, Railway uses ephemeral containers that are destroyed and recreated on every deployment. This means:
- ❌ Your SQLite database gets reset
- ❌ All investor data disappears
- ❌ Uploaded files (logos, pitch decks) are lost
- ❌ You lose all data every time you push changes

## Solution: Railway Volumes (Persistent Storage)

Railway provides **Volumes** - persistent storage that survives deployments. We'll mount a volume and configure your app to use it.

---

## Step-by-Step Setup

### 1. Deploy Your App to Railway (If Not Already Deployed)

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login to Railway
railway login

# Link to your project (or create new one)
railway link

# Deploy
railway up
```

Or use the Railway dashboard:
1. Go to [railway.app](https://railway.app)
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Connect your repository

---

### 2. Add a Persistent Volume

#### Option A: Using Railway Dashboard (Recommended)

1. Open your project in Railway dashboard
2. Click on your service
3. Go to the **"Settings"** tab
4. Scroll down to **"Volumes"** section
5. Click **"+ Add Volume"**
6. Configure the volume:
   - **Mount Path**: `/data`
   - **Size**: Start with **1 GB** (adjust based on your needs)
7. Click **"Add"**

#### Option B: Using Railway CLI

```bash
# Create a volume
railway volume create

# Mount it to /data
railway volume mount /data
```

---

### 3. Set Environment Variable

Your app needs to know where to store data. Set the `DATA_DIR` environment variable:

#### Using Railway Dashboard:

1. Go to your service
2. Click **"Variables"** tab
3. Click **"+ New Variable"**
4. Add:
   - **Variable**: `DATA_DIR`
   - **Value**: `/data`
5. Click **"Add"**

#### Using Railway CLI:

```bash
railway variables set DATA_DIR=/data
```

---

### 4. Verify Other Environment Variables

Make sure these are also set in Railway:

| Variable | Value | Description |
|----------|-------|-------------|
| `NODE_ENV` | `production` | Enables production mode |
| `ADMIN_USERNAME` | `admin` (or your choice) | Admin login username |
| `ADMIN_PASSWORD` | `YOUR_SECURE_PASSWORD` | **Change from default!** |
| `DATA_DIR` | `/data` | Points to persistent volume |

⚠️ **IMPORTANT**: Change `ADMIN_PASSWORD` from the default `demo123` for security!

---

### 5. Redeploy

After adding the volume and environment variables:

#### Using Dashboard:
1. Click **"Deploy"** or push a new commit to GitHub
2. Railway will redeploy with persistent storage

#### Using CLI:
```bash
railway up
```

---

## Verification

After deployment, check the logs to confirm persistent storage is working:

```bash
railway logs
```

Look for these messages:
```
Created data directory: /data
Database path: /data/game.db
Created uploads directory: /data/uploads
Database initialized successfully
Server running on port 3001
```

✅ If you see `/data` in the paths, persistence is working!

---

## What Gets Persisted

With this setup, the following data survives deployments:

### ✅ Database (`/data/game.db`)
- All investors and their portfolios
- All startups
- All investments
- Submission statuses
- Game lock state

### ✅ Uploaded Files (`/data/uploads/`)
- Startup logos
- Pitch decks
- Any other uploaded documents

---

## Important Notes

### Volume Backups

Railway volumes are persistent, but you should still create backups:

1. **Export Data Regularly**
   - Use the admin panel's **Analytics tab**
   - Click **"Export All Data"** to download CSV backups

2. **Database Backup** (optional)
   ```bash
   # SSH into Railway container
   railway run bash

   # Copy database
   cp /data/game.db /data/game-backup-$(date +%Y%m%d).db
   ```

### Volume Size

- Start with **1 GB** (plenty for most use cases)
- Monitor usage in Railway dashboard
- Upgrade if needed (Settings → Volumes → Edit)

### Data Migration

If you need to move data between environments:

1. Export from old environment using admin panel
2. Set up new environment with persistent storage
3. Import data using admin panel

---

## Troubleshooting

### Data Still Resetting?

**Check Volume Mount:**
```bash
railway run bash
ls -la /data
```
You should see your `game.db` and `uploads/` folder.

**Check Environment Variable:**
```bash
railway run env | grep DATA_DIR
```
Should output: `DATA_DIR=/data`

**Check Logs:**
```bash
railway logs --tail 100
```
Look for "Database path: /data/game.db"

### Volume Not Showing Up?

1. Ensure volume is mounted to `/data` (not `/app/data` or other paths)
2. Redeploy after adding the volume
3. Check Railway dashboard under Settings → Volumes

### Permission Errors?

Railway automatically sets correct permissions. If you see permission errors:
```bash
railway run bash
chmod -R 755 /data
```

---

## Migration from Existing Deployment

If you already have a Railway deployment WITHOUT persistent storage:

1. **Export your current data** before making changes:
   - Login to admin panel
   - Go to Analytics tab
   - Click "Export All Data"
   - Save the CSV files

2. **Add the volume and environment variable** (steps 2-3 above)

3. **Redeploy** (step 5)

4. **Re-import your data** using the admin panel:
   - Create investors manually or via API
   - Create startups via admin panel
   - Re-create investments as needed

---

## Production Checklist

Before going live with real investors:

- [ ] Volume mounted to `/data`
- [ ] `DATA_DIR=/data` environment variable set
- [ ] `ADMIN_PASSWORD` changed from default
- [ ] `NODE_ENV=production` set
- [ ] SSL/HTTPS enabled (Railway provides this automatically)
- [ ] Custom domain configured (optional)
- [ ] Initial data backup created
- [ ] Test deployment verified (add test investor, restart app, data persists)

---

## Support

If you encounter issues:

1. Check Railway's [documentation on volumes](https://docs.railway.app/reference/volumes)
2. Review Railway logs: `railway logs`
3. Check Railway status: [status.railway.app](https://status.railway.app)

---

## Summary

✅ **Volume Added**: `/data` mounted with 1GB+
✅ **Environment Variable**: `DATA_DIR=/data`
✅ **Database**: Persists at `/data/game.db`
✅ **Uploads**: Persist in `/data/uploads/`
✅ **Deployments**: Data survives updates

Your VIP Investment Hub now has enterprise-grade data persistence! 🎉
