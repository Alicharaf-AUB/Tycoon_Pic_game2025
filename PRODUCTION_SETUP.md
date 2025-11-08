# Production Deployment Checklist ✅

## Required: Set Environment Variables on Railway

Go to your Railway project → Variables tab and add:

### 🔐 Critical Security
```
ADMIN_PASSWORD=YourStrongPasswordHere
```
**⚠️ DO NOT use `demo123` in production!**

### Optional Configuration
```
PORT=3001
NODE_ENV=production
ADMIN_USERNAME=admin
```

## ⚠️ CRITICAL: Add Persistent Storage for Database

Railway's filesystem is ephemeral (resets on deploy). To persist your database:

1. Go to your Railway service
2. Click on "Variables" tab
3. Scroll down to "Volumes"
4. Click "New Volume"
5. Set:
   - **Mount Path**: `/app/data`
   - **Name**: `investment-game-db`
6. Add environment variable:
   ```
   DATA_DIR=/app/data
   ```
7. Redeploy your service

**Without this, your database will reset on every deployment!**

## What's Already Configured ✅

### Database
- ✅ SQLite database with automatic seeding
- ✅ Auto-creates tables on first run
- ✅ Migrations for existing databases
- ✅ Data persists between deployments (stored in Railway volume)

### APIs
- ✅ RESTful API endpoints for all operations
- ✅ WebSocket for real-time updates
- ✅ CORS configured (same-origin in production)
- ✅ Basic Auth for admin routes
- ✅ Error handling on all endpoints

### Client
- ✅ Production build optimized
- ✅ Relative API URLs (works on same domain)
- ✅ Mobile responsive
- ✅ File upload support

### File Uploads
- ✅ Multer configured (10MB limit)
- ✅ Supports: JPG, PNG, PDF, PPT, DOC
- ✅ Files served at `/uploads/`
- ✅ Auto-creates upload directory

## Post-Deployment Steps

1. **Change Admin Password**
   - Set `ADMIN_PASSWORD` environment variable on Railway
   - Redeploy after setting

2. **Test the Application**
   - Visit your Railway URL
   - Join as an investor
   - Create investments
   - Submit your choices
   - Login to admin panel with new password
   - Test admin features (create/edit/delete startups)

3. **Add Startup Data**
   - Login to admin panel
   - Add your actual startup information
   - Upload logos and pitch decks
   - Verify everything displays correctly

4. **Test on Mobile**
   - Open site on mobile device
   - Test joining game
   - Test making investments
   - Verify all interactions work

## Security Features

- ✅ Basic Auth for admin routes
- ✅ CORS restricted in production
- ✅ SQL injection protection (parameterized queries)
- ✅ File type validation for uploads
- ✅ File size limits (10MB)
- ✅ Environment variables for credentials

## Known Limitations

- Database is SQLite (single file) - fine for <100 concurrent users
- No rate limiting - add if expecting high traffic
- No email verification for investors
- File uploads stored locally (lost on container restart unless using Railway volumes)

## Monitoring

Check Railway logs for:
- `✅ Database already has X startups` - Database is seeded
- `Server running on port 3001` - Server started successfully
- `Running in PRODUCTION mode` - Production mode active
- `⚠️ WARNING: Using default admin password` - **FIX THIS!**

## Support

If issues arise:
1. Check Railway deployment logs
2. Verify environment variables are set
3. Ensure build completed successfully
4. Test API endpoints directly

## Quick Reference

- **Admin URL**: `https://your-app.up.railway.app/admin`
- **Join URL**: `https://your-app.up.railway.app/`
- **API Base**: `https://your-app.up.railway.app/api`
- **Uploads**: `https://your-app.up.railway.app/uploads/`

---

**Your app is ready for production! Just set ADMIN_PASSWORD and you're good to go! 🚀**
