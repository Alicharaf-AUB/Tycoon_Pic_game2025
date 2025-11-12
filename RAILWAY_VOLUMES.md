# Railway Volume Configuration for File Uploads

## ⚠️ CRITICAL: Files Are Being Deleted on Every Restart!

Uploaded files (logos, pitch decks) are stored in `/data/uploads/` on the container filesystem. Railway containers are **ephemeral** - they restart frequently and **all files are DELETED** on restart.

## ✅ SOLUTION: Add Railway Volume (5 Minutes)

Railway Volumes provide persistent storage that survives container restarts and redeployments.

### Step-by-Step Instructions:

1. **Open Railway Dashboard**
   - Go to: https://railway.app
   - Click on your project: `investment-game-production`
   - Click on your web service

2. **Add Volume**
   - Click the **"Volumes"** tab (or **"Settings"** → **"Volumes"**)
   - Click **"+ New Volume"** or **"Add Volume"**
   
3. **Configure Volume**
   - **Mount Path:** `/app/data`
   - **Name:** `uploads-storage` (or any name)
   - Click **"Add"** or **"Create"**

4. **Redeploy**
   - Railway will automatically redeploy your service
   - Wait for deployment to complete (~2 minutes)

5. **Verify**
   - Check deployment logs - should see: `✅ Uploads directory exists: /app/data/uploads`
   - Upload a test logo through admin panel
   - Manually restart the service from Railway dashboard
   - Check if the logo still loads - if yes, volume is working!

### What This Does:

- **Before Volume:** Files saved to `/app/data/uploads/` → **DELETED on restart** ❌
- **After Volume:** Files saved to `/app/data/uploads/` → **PERSISTED forever** ✅

The `/app/data` directory becomes a persistent volume that survives:
- Container restarts
- Redeployments
- Code updates
- Railway infrastructure changes

### Current Configuration

```javascript
// server/index.js
const dataDir = process.env.DATA_DIR || path.join(__dirname, '../data');
const uploadDir = path.join(dataDir, 'uploads');

// Files saved to: /app/data/uploads/
// Files served at: /uploads/
```

### Alternative: Use External Storage (Advanced)

For production at scale, consider using:
- **AWS S3** - Most popular, reliable
- **Cloudinary** - Great for images with automatic optimization
- **Railway's built-in storage** - If available on your plan

This would require code changes to use a storage SDK instead of local filesystem.

## Current Status

⚠️ **URGENT**: Files are currently being **lost on every restart**. 
- All uploaded logos and pitch decks disappear when Railway restarts the container
- Users will see broken image errors
- This needs to be fixed ASAP for production use

## Verification

After configuring the volume, test:
```bash
# 1. Upload a file via admin panel
# 2. Check the logs to see the filename
# 3. Visit: https://investment-game-production.up.railway.app/uploads/{filename}
# 4. Restart the service from Railway dashboard
# 5. Visit the same URL - should still work
```
