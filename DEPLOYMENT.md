# 🚀 Dual Deployment Guide - Railway & Azure

This app is configured to deploy on **both Railway and Azure**. Choose the platform that best fits your needs.

---

## 🚄 Railway Deployment (Recommended for Quick Start)

### Why Railway?
- ✅ 5-minute setup
- ✅ Automatic PostgreSQL configuration
- ✅ $5 free credits monthly
- ✅ One-click deployment
- ✅ Auto-deploys on git push

### Step-by-Step (5 Minutes)

1. **Sign Up**
   - Go to https://railway.app
   - Sign in with GitHub

2. **Create New Project**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose: `Alicharaf-AUB/Investment-game`
   - Railway auto-detects Node.js configuration

3. **Add PostgreSQL Database**
   - In your project, click "+ New"
   - Select "Database" → "PostgreSQL"
   - Railway automatically sets `DATABASE_URL`

4. **Add Environment Variables**
   - Click your service → "Variables" tab
   - Add:
     ```
     ADMIN_USERNAME=admin
     ADMIN_PASSWORD=YourSecurePassword123
     NODE_ENV=production
     ```
   - `DATABASE_URL` is already set automatically!

5. **Deploy!**
   - Railway automatically builds and deploys
   - Get your URL: `https://your-app.up.railway.app`
   - Done! ✅

### Cost
- **Free Tier**: $5 credit/month (hobby projects)
- **Hobby**: $5/month (PostgreSQL + hosting)
- **Pro**: $20/month (more resources)

---

## ☁️ Azure Deployment (Enterprise Option)

### Why Azure?
- ✅ Enterprise-grade infrastructure
- ✅ Corporate/organizational requirements
- ✅ Advanced monitoring and scaling
- ✅ Integration with Azure services

### Prerequisites
- Azure account (https://azure.microsoft.com/free)
- Azure CLI (optional)

### Step-by-Step (20-25 Minutes)

#### 1. Create PostgreSQL Database
1. Go to https://portal.azure.com
2. "Create a resource" → "Azure Database for PostgreSQL Flexible Server"
3. Configure:
   - Resource Group: `investment-game-rg` (create new)
   - Server name: `investment-game-db` (must be unique)
   - Region: East US (or closest)
   - PostgreSQL version: 15
   - Workload: Development
   - Admin username: `adminuser`
   - Password: [Create strong password - SAVE IT!]
4. Networking: Enable "Public access from Azure services"
5. Click "Review + Create" → Wait 5-10 minutes
6. Get connection string from "Connection strings" tab

#### 2. Create App Service
1. "Create a resource" → "Web App"
2. Configure:
   - Resource Group: `investment-game-rg` (same as database)
   - Name: `investment-game-app` (must be unique)
   - Publish: Code
   - Runtime: Node 18 LTS
   - OS: Linux
   - Region: Same as database
   - Pricing: Basic B1 ($13/month)
3. Click "Review + Create"

#### 3. Configure Environment Variables
1. Go to App Service → "Configuration" → "Application settings"
2. Add:
   ```
   DATABASE_URL=postgresql://user:pass@host:5432/investment_game
   ADMIN_USERNAME=admin
   ADMIN_PASSWORD=YourSecurePassword123
   PORT=8080
   NODE_ENV=production
   ```
3. Click "Save"

#### 4. Deploy Code

**Option A: GitHub Actions (Recommended)**
1. App Service → "Deployment Center"
2. Source: GitHub
3. Authorize and select repository
4. Azure creates workflow automatically
5. Every push to `main` deploys automatically

**Option B: Local Git**
```bash
# Get deployment URL from App Service → Deployment Center
git remote add azure <your-azure-git-url>
git push azure main
```

#### 5. Verify
- Visit: `https://investment-game-app.azurewebsites.net`
- Database auto-initializes on first run

### Cost
- PostgreSQL Flexible Server: ~$12-15/month
- App Service Basic B1: ~$13/month
- **Total**: ~$25-30/month

---

## 📁 Configuration Files

### Railway Files
- `railway.json` - Railway-specific configuration
- `nixpacks.toml` - Build configuration for Nixpacks
- `.npmrc` - NPM optimization settings

### Azure Files
- `.deployment` - Azure deployment config
- `web.config` - IIS configuration
- `ecosystem.config.js` - PM2 process manager
- `startup.sh` - Azure startup script
- `deploy.sh` - Azure build script

### Universal Files
- `package.json` - Works for both platforms
- `server/.env` - Environment template
- `.env.azure` - Azure environment template

---

## 🔄 Switching Between Platforms

Your code works on **both platforms** without changes!

### Deploy to Railway First (Testing)
1. Deploy to Railway (5 minutes)
2. Test with free credits
3. Get feedback from users

### Move to Azure Later (Production)
1. Export data from Railway PostgreSQL
2. Import to Azure PostgreSQL
3. Deploy to Azure
4. Update DNS

### Run Both Simultaneously
- Railway: Development/staging environment
- Azure: Production environment
- Same codebase, different databases

---

## 🎯 Recommendation

| Scenario | Platform | Why |
|----------|----------|-----|
| Quick demo/testing | **Railway** | 5-min setup, free credits |
| Student project | **Railway** | Cheaper, simpler |
| Startup MVP | **Railway** | Fast iteration, low cost |
| Corporate requirement | **Azure** | Enterprise features |
| Need Azure integration | **Azure** | Native Azure services |
| Production app | **Either** | Both are production-ready |

---

## 🆘 Need Help?

### Railway Support
- Dashboard: https://railway.app/dashboard
- Docs: https://docs.railway.app
- Discord: https://discord.gg/railway

### Azure Support
- Portal: https://portal.azure.com
- Docs: https://docs.microsoft.com/azure
- Support: Azure Portal → Support

### App Issues
- Check logs in platform dashboard
- Verify `DATABASE_URL` is set
- Ensure all environment variables are configured
- Check database connection

---

## ✅ Deployment Checklist

### Before Deploying
- [x] PostgreSQL migration complete
- [x] All dependencies in package.json
- [x] Environment variables documented
- [x] Build scripts configured
- [x] Code pushed to GitHub

### Railway Deployment
- [ ] Signed up on Railway
- [ ] Connected GitHub repo
- [ ] Added PostgreSQL database
- [ ] Set environment variables
- [ ] Verified deployment successful

### Azure Deployment
- [ ] Created Azure account
- [ ] Created PostgreSQL Flexible Server
- [ ] Created App Service
- [ ] Configured environment variables
- [ ] Set up deployment method
- [ ] Verified deployment successful

---

**Your app is ready for both platforms! Choose what works best for you.** 🚀
