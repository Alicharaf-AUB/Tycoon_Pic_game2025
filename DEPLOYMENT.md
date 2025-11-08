# Deployment Guide

This guide covers deploying the Investment Game to various hosting platforms.

## 📋 Pre-Deployment Checklist

- [ ] Test locally with `npm run dev`
- [ ] Build client with `cd client && npm run build`
- [ ] Set strong admin password
- [ ] Configure environment variables
- [ ] Test production build locally with `npm start`

## 🚀 Deployment Options

### Option 1: Railway (Recommended)

Railway offers easy deployment with automatic HTTPS and domain.

#### Steps:

1. **Create Railway account**: https://railway.app

2. **Install Railway CLI**:
```bash
npm install -g @railway/cli
railway login
```

3. **Initialize project**:
```bash
railway init
```

4. **Set environment variables** in Railway dashboard:
```
NODE_ENV=production
PORT=3001
ADMIN_USERNAME=your_admin_username
ADMIN_PASSWORD=your_secure_password
CLIENT_URL=https://your-app.railway.app
```

5. **Deploy**:
```bash
railway up
```

6. **Build client** and serve from server:
   - Modify `server/index.js` to serve static files
   - Add before routes:
```javascript
app.use(express.static(path.join(__dirname, '../client/dist')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});
```

### Option 2: Fly.io

Fly.io offers global edge deployment.

#### Steps:

1. **Install flyctl**: https://fly.io/docs/hands-on/install-flyctl/

2. **Login**:
```bash
flyctl auth login
```

3. **Create fly.toml**:
```toml
app = "investment-game"

[build]
  [build.args]
    NODE_VERSION = "18"

[env]
  NODE_ENV = "production"
  PORT = "8080"

[[services]]
  http_checks = []
  internal_port = 8080
  processes = ["app"]
  protocol = "tcp"

  [[services.ports]]
    force_https = true
    handlers = ["http"]
    port = 80

  [[services.ports]]
    handlers = ["tls", "http"]
    port = 443
```

4. **Set secrets**:
```bash
flyctl secrets set ADMIN_USERNAME=admin
flyctl secrets set ADMIN_PASSWORD=your_secure_password
flyctl secrets set CLIENT_URL=https://your-app.fly.dev
```

5. **Deploy**:
```bash
flyctl deploy
```

### Option 3: Render

Render offers free tier with automatic deployments.

#### Steps:

1. **Create Render account**: https://render.com

2. **Create New Web Service** from Dashboard

3. **Configure**:
   - Environment: Node
   - Build Command: `npm install && cd client && npm install && npm run build && cd ..`
   - Start Command: `node server/index.js`

4. **Add Environment Variables**:
```
NODE_ENV=production
PORT=10000
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your_secure_password
CLIENT_URL=https://your-app.onrender.com
```

5. **Deploy**: Render auto-deploys on git push

### Option 4: Heroku

Classic PaaS option with easy scaling.

#### Steps:

1. **Install Heroku CLI**: https://devcenter.heroku.com/articles/heroku-cli

2. **Login**:
```bash
heroku login
```

3. **Create app**:
```bash
heroku create your-app-name
```

4. **Set environment variables**:
```bash
heroku config:set NODE_ENV=production
heroku config:set ADMIN_USERNAME=admin
heroku config:set ADMIN_PASSWORD=your_secure_password
```

5. **Add Procfile**:
```
web: node server/index.js
```

6. **Deploy**:
```bash
git push heroku main
```

### Option 5: DigitalOcean App Platform

Simple deployment with managed infrastructure.

#### Steps:

1. **Create DigitalOcean account**: https://www.digitalocean.com

2. **Create New App** from Dashboard

3. **Connect GitHub repo** or upload

4. **Configure**:
   - Build Command: `npm install && cd client && npm install && npm run build`
   - Run Command: `node server/index.js`

5. **Add Environment Variables** in App settings

6. **Deploy**: Auto-deploys from git

### Option 6: Traditional VPS (Ubuntu)

For full control over your deployment.

#### Steps:

1. **Get Ubuntu VPS** (DigitalOcean, Linode, AWS EC2, etc.)

2. **SSH into server**:
```bash
ssh root@your-server-ip
```

3. **Install Node.js**:
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

4. **Install PM2** (process manager):
```bash
sudo npm install -g pm2
```

5. **Clone and setup**:
```bash
git clone your-repo-url
cd investment-game
npm install
cd client && npm install && npm run build && cd ..
```

6. **Create .env file**:
```bash
nano .env
# Add your environment variables
```

7. **Start with PM2**:
```bash
pm2 start server/index.js --name investment-game
pm2 save
pm2 startup
```

8. **Setup Nginx** (reverse proxy):
```bash
sudo apt install nginx
sudo nano /etc/nginx/sites-available/investment-game
```

Nginx config:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable site:
```bash
sudo ln -s /etc/nginx/sites-available/investment-game /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

9. **Setup SSL with Let's Encrypt**:
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

## 🔧 Production Configuration

### Environment Variables

All platforms need these variables:

```env
NODE_ENV=production
PORT=3001  # or platform-specific port
ADMIN_USERNAME=your_admin_username
ADMIN_PASSWORD=your_secure_password
CLIENT_URL=https://your-production-domain.com
```

### Database Considerations

#### SQLite (Default)
- ✅ Simple, no extra setup
- ✅ Good for small-medium events (<100 concurrent users)
- ⚠️ Ensure persistent storage on hosting platform
- ⚠️ Single file, easy to backup

#### PostgreSQL (Optional Upgrade)
For larger scale:
- Better for >100 concurrent users
- Managed database options available
- Requires code changes to use `pg` instead of `better-sqlite3`

### Serving Built Client

Modify `server/index.js` to serve the built React app:

```javascript
const path = require('path');

// Add before API routes
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/dist')));
  
  // Handle React routing - serve index.html for all non-API routes
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(__dirname, '../client/dist/index.html'));
    }
  });
}
```

### Build Script

Add to root `package.json`:

```json
"scripts": {
  "build": "cd client && npm run build",
  "postinstall": "cd client && npm install"
}
```

## 🔒 Security Best Practices

### 1. Strong Admin Password
```bash
# Generate secure password
openssl rand -base64 32
```

### 2. HTTPS Only
- Use platform's automatic HTTPS
- Or setup Let's Encrypt (free)

### 3. Rate Limiting
Add to `server/index.js`:
```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use('/api/', limiter);
```

### 4. CORS Configuration
Update CORS for production domain:
```javascript
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));
```

### 5. Database Backups
Schedule regular backups:
```bash
# Cron job for daily backups
0 2 * * * cp /path/to/game.db /path/to/backups/game-$(date +\%Y\%m\%d).db
```

## 📊 Monitoring

### Application Monitoring
- Use PM2 for process management
- Setup logging: `pm2 logs investment-game`
- Monitor memory: `pm2 monit`

### Error Tracking
Consider adding:
- Sentry for error tracking
- LogRocket for session replay
- Datadog for full observability

### Performance
- Monitor WebSocket connections
- Track database query times
- Set up uptime monitoring (UptimeRobot, Pingdom)

## 🧪 Testing Production

Before going live:

1. **Load Test**:
```bash
npm install -g artillery
artillery quick --count 10 --num 50 http://your-domain.com
```

2. **Security Scan**:
```bash
npm audit
npm audit fix
```

3. **Browser Testing**:
- Test on real mobile devices
- Check different browsers
- Verify WebSocket connections

## 🔄 CI/CD Pipeline

### GitHub Actions Example

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: |
          npm install
          cd client && npm install
      
      - name: Build client
        run: cd client && npm run build
      
      - name: Deploy to production
        run: |
          # Add your deployment commands here
          # e.g., railway up, flyctl deploy, etc.
```

## 🆘 Troubleshooting

### Common Issues

**WebSocket not connecting**:
- Check firewall allows WebSocket connections
- Verify CORS configuration
- Ensure both HTTP and WS on same port

**Database locked**:
- Use WAL mode in SQLite
- Ensure proper file permissions
- Check for abandoned connections

**High memory usage**:
- Monitor socket connections
- Check for memory leaks
- Consider upgrading to PostgreSQL

**Slow performance**:
- Add database indexes
- Enable gzip compression
- Use CDN for static assets

## 📱 Platform-Specific Notes

### Railway
- Automatically builds on push
- Provides managed PostgreSQL
- Auto-scales with usage

### Fly.io
- Global edge locations
- SQLite on persistent volumes
- Great for low latency

### Render
- Free tier available
- Auto SSL certificates
- Good for small projects

### Heroku
- Ephemeral filesystem (use PostgreSQL)
- Easy scaling
- Many add-ons available

---

Choose the platform that best fits your needs and budget. For quick demos, Railway or Render are great. For production events, consider a VPS with proper monitoring.
