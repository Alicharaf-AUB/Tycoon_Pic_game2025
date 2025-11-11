# 🚀 Azure Deployment Guide - Complete Setup

## Prerequisites

- Azure account (sign up at https://azure.microsoft.com/free)
- Azure CLI installed (optional, can use Azure Portal)
- Your app code pushed to GitHub

## 📋 Deployment Overview

You'll deploy:
1. **PostgreSQL Database** on Azure (Flexible Server)
2. **Web App** on Azure App Service (Node.js)
3. Both connected via DATABASE_URL

Total estimated cost: ~$25-30/month (can use free credits)

---

## Part 1: Deploy PostgreSQL Database

### Option A: Using Azure Portal (Easiest)

1. **Go to Azure Portal**: https://portal.azure.com

2. **Create PostgreSQL Server**:
   - Click "Create a resource"
   - Search for "Azure Database for PostgreSQL Flexible Server"
   - Click "Create"

3. **Configure Basic Settings**:
   ```
   Subscription: Your subscription
   Resource Group: Create new → "investment-game-rg"
   Server name: investment-game-db (must be globally unique)
   Region: Choose closest to you (e.g., East US)
   PostgreSQL version: 15
   Workload type: Development (cheaper) or Production
   ```

4. **Configure Authentication**:
   ```
   Admin username: adminuser
   Password: [Create strong password - SAVE THIS!]
   Confirm password: [Same password]
   ```

5. **Configure Networking**:
   - **IMPORTANT**: Select "Public access (allowed IP addresses)"
   - Check "Allow public access from any Azure service within Azure"
   - Add your current IP address for testing
   - Click "Review + Create"

6. **Wait for Deployment** (5-10 minutes)

7. **Get Connection String**:
   - Go to your PostgreSQL server resource
   - Click "Connection strings" in left menu
   - Copy the connection string
   - It looks like:
   ```
   postgresql://adminuser:password@investment-game-db.postgres.database.azure.com:5432/postgres?sslmode=require
   ```
   - Replace `{your_password}` with your actual password

### Option B: Using Azure CLI

```bash
# Login to Azure
az login

# Create resource group
az group create --name investment-game-rg --location eastus

# Create PostgreSQL server
az postgres flexible-server create \
  --resource-group investment-game-rg \
  --name investment-game-db \
  --location eastus \
  --admin-user adminuser \
  --admin-password YOUR_STRONG_PASSWORD \
  --sku-name Standard_B1ms \
  --tier Burstable \
  --storage-size 32 \
  --version 15 \
  --public-access 0.0.0.0

# Create database
az postgres flexible-server db create \
  --resource-group investment-game-rg \
  --server-name investment-game-db \
  --database-name investment_game

# Get connection string
az postgres flexible-server show-connection-string \
  --server-name investment-game-db \
  --database-name investment_game \
  --admin-user adminuser
```

---

## Part 2: Deploy Web Application

### Step 1: Prepare Your Application

1. **Update package.json** (already done, verify):
   ```json
   {
     "scripts": {
       "start": "node index.js",
       "build": "cd ../client && npm install && npm run build"
     },
     "engines": {
       "node": ">=18.0.0",
       "npm": ">=9.0.0"
     }
   }
   ```

2. **Verify .gitignore excludes**:
   ```
   node_modules/
   .env
   data/
   dist/
   ```

3. **Build the client locally** (to test):
   ```bash
   cd /Users/alicharaf/Desktop/investment-game/client
   npm run build
   ```

### Step 2: Deploy to Azure App Service

#### Option A: Using Azure Portal (Recommended)

1. **Create Web App**:
   - Go to https://portal.azure.com
   - Click "Create a resource"
   - Search for "Web App"
   - Click "Create"

2. **Configure Basics**:
   ```
   Subscription: Your subscription
   Resource Group: investment-game-rg (same as database)
   Name: investment-game-app (must be unique - try adding your name)
   Publish: Code
   Runtime stack: Node 18 LTS
   Operating System: Linux
   Region: Same as your database (e.g., East US)
   ```

3. **Configure Pricing**:
   ```
   Linux Plan: Create new → "investment-game-plan"
   Pricing plan: Basic B1 ($13/month) or Free F1 (for testing)
   ```

4. **Click "Review + Create"**, then **"Create"**

5. **Wait for deployment** (2-3 minutes)

#### Option B: Using GitHub Actions (Best for CI/CD)

1. **In Azure Portal**:
   - Go to your Web App resource
   - Click "Deployment Center" in left menu
   - Source: GitHub
   - Sign in to GitHub
   - Select:
     - Organization: Alicharaf-AUB
     - Repository: Investment-game
     - Branch: main
   - Build provider: GitHub Actions
   - Click "Save"

2. **Azure will automatically**:
   - Create a workflow file in your repo
   - Build and deploy your app on every push to main

### Step 3: Configure Environment Variables

1. **In Azure Portal**:
   - Go to your Web App resource
   - Click "Configuration" in left menu (under Settings)

2. **Add Application Settings** (click "+ New application setting" for each):

   ```
   DATABASE_URL = postgresql://adminuser:password@investment-game-db.postgres.database.azure.com:5432/postgres?sslmode=require
   
   NODE_ENV = production
   
   PORT = 8080
   
   ADMIN_USERNAME = admin
   
   ADMIN_PASSWORD = admin123
   
   CLIENT_URL = https://investment-game-app.azurewebsites.net
   ```

   **IMPORTANT**: Replace:
   - `password` with your actual PostgreSQL password
   - `investment-game-db` with your actual server name
   - `investment-game-app` with your actual web app name
   - Change ADMIN_PASSWORD to something secure!

3. **Click "Save"** at the top

4. **Restart the app**: Click "Restart" at the top

---

## Part 3: Deploy Application Code

### Method 1: Using Local Git Deployment

```bash
# In your project root
cd /Users/alicharaf/Desktop/investment-game

# Make sure everything is committed
git add -A
git commit -m "Prepare for Azure deployment"

# Add Azure remote (get URL from Azure Portal → Deployment Center)
az webapp deployment source config-local-git \
  --name investment-game-app \
  --resource-group investment-game-rg

# This will give you a Git URL like:
# https://investment-game-app.scm.azurewebsites.net/investment-game-app.git

# Add it as a remote
git remote add azure https://investment-game-app.scm.azurewebsites.net/investment-game-app.git

# Deploy
git push azure main
```

### Method 2: Using GitHub Deployment (Easiest)

If you set up GitHub Actions in Step 2B, deployment is automatic:

1. **Just push to GitHub**:
   ```bash
   git add -A
   git commit -m "Deploy to Azure"
   git push origin main
   ```

2. **Azure automatically**:
   - Detects the push
   - Builds your app
   - Runs `npm install` in both client and server
   - Runs `npm run build` in client
   - Deploys to production

3. **Monitor deployment**:
   - Go to GitHub repository
   - Click "Actions" tab
   - Watch the deployment progress

### Method 3: Using Azure CLI

```bash
# Deploy from local directory
cd /Users/alicharaf/Desktop/investment-game

# Build client first
cd client && npm run build && cd ..

# Create a zip of your app
zip -r app.zip . -x "*.git*" "node_modules/*" "client/node_modules/*"

# Deploy
az webapp deployment source config-zip \
  --resource-group investment-game-rg \
  --name investment-game-app \
  --src app.zip
```

---

## Part 4: Verify Deployment

1. **Check Logs**:
   - Azure Portal → Your Web App → "Log stream"
   - Look for:
   ```
   ✅ Connected to PostgreSQL database
   ✅ Database schema initialized
   ✅ Database ready
   Server running on port 8080
   ```

2. **Test the Application**:
   - Visit: `https://investment-game-app.azurewebsites.net`
   - You should see the login page
   - Create an investor account
   - Make some investments

3. **Test Admin Panel**:
   - Visit: `https://investment-game-app.azurewebsites.net/admin`
   - Login with your ADMIN_USERNAME and ADMIN_PASSWORD

4. **Test Data Persistence**:
   - Restart the app: Azure Portal → Your Web App → "Restart"
   - Visit the app again
   - Your data should still be there! ✅

---

## Part 5: Custom Domain (Optional)

If you want a custom domain like `investment.aub.edu.lb`:

1. **In Azure Portal**:
   - Go to your Web App
   - Click "Custom domains"
   - Click "Add custom domain"
   - Follow the instructions to verify your domain

2. **Update DNS** (at your domain provider):
   ```
   CNAME record:
   Name: investment (or www)
   Value: investment-game-app.azurewebsites.net
   ```

3. **Enable HTTPS**:
   - Azure provides free SSL certificates
   - In "Custom domains", click "Add binding"
   - Select your domain and "Add"

---

## 🔧 Troubleshooting

### App won't start

**Check logs**: Azure Portal → Your Web App → "Log stream"

Common issues:
- **Missing DATABASE_URL**: Add it in Configuration
- **Wrong Node version**: Verify Runtime stack is Node 18 LTS
- **Build failed**: Check that client/dist exists

### Database connection fails

- Verify DATABASE_URL is correct in Configuration
- Check PostgreSQL firewall allows Azure services
- Verify password in connection string is correct

### 502 Bad Gateway

- App is probably still starting (wait 2-3 minutes)
- Check if PORT is set to 8080 in Configuration
- Restart the app

### Changes not deploying

- Make sure you pushed to the right branch (main)
- Check GitHub Actions (if using) for errors
- Try manual deployment with Azure CLI

---

## 📊 Post-Deployment Checklist

- [ ] App is accessible at Azure URL
- [ ] Database connection working (check logs)
- [ ] Can create investor accounts
- [ ] Investments are saved
- [ ] Data persists after restart
- [ ] Admin panel works
- [ ] Fund requests work
- [ ] Real-time updates work (WebSocket)
- [ ] Change default admin password
- [ ] Set up monitoring/alerts (optional)

---

## 💰 Cost Breakdown

**Monthly estimates**:
- PostgreSQL Flexible Server (Burstable B1ms): ~$12/month
- App Service (Basic B1): ~$13/month
- **Total**: ~$25/month

**Free tier options** (for testing):
- App Service Free F1: $0 (limited to 60 CPU minutes/day)
- PostgreSQL: No free tier, minimum ~$12/month

**Cost savings**:
- Stop resources when not in use
- Use Burstable tier for PostgreSQL
- Scale down during off-hours

---

## 🔐 Security Best Practices

1. **Change default credentials**:
   ```
   ADMIN_USERNAME = [something other than 'admin']
   ADMIN_PASSWORD = [strong password]
   ```

2. **Restrict PostgreSQL access**:
   - Only allow Azure services and your IP
   - Don't use public access if possible

3. **Enable Application Insights** (monitoring):
   - Azure Portal → Your Web App → "Application Insights"
   - Click "Turn on Application Insights"

4. **Set up backups**:
   - Azure automatically backs up PostgreSQL
   - Verify backup schedule in PostgreSQL settings

5. **Use environment-specific configs**:
   - Different DATABASE_URL for staging/production
   - Different admin credentials per environment

---

## 🚀 Continuous Deployment Setup

For automatic deployments on every git push:

1. **GitHub Actions** (already set up if you used Method 2B):
   - Every push to main triggers deployment
   - Automatic build and deploy
   - View status in GitHub Actions tab

2. **Branch policies**:
   - Create `staging` branch for testing
   - Deploy `staging` → separate Azure environment
   - Deploy `main` → production after testing

---

## 📞 Support Resources

- **Azure Documentation**: https://docs.microsoft.com/azure
- **App Service Docs**: https://docs.microsoft.com/azure/app-service
- **PostgreSQL Docs**: https://docs.microsoft.com/azure/postgresql
- **Pricing Calculator**: https://azure.microsoft.com/pricing/calculator

---

## 🎉 Next Steps After Deployment

1. **Share the URL** with your users
2. **Monitor usage** in Azure Portal
3. **Set up alerts** for errors/downtime
4. **Create backups** before major changes
5. **Scale up** if needed (more users = bigger plan)

Your app is now live on Azure with persistent PostgreSQL storage! 🚀
