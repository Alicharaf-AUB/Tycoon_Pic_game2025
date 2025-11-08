# 🎯 AUB Angel Investor

> **Production-Ready Investment Simulation with Real AIM Startups**

A real-time, mobile-first web application for investment simulation events. Participants receive virtual capital and invest in **5 real AIM startups**, with full transparency and live leaderboards.

## ⚡ Quick Start (3 Minutes)

```bash
# Install dependencies
npm install

# Load real AIM startups into database
npm run seed

# Start development servers
npm run dev
```

**Access:**
- 👥 **Players:** http://localhost:5173
- 🔐 **Admin:** http://localhost:5173/admin (admin/demo123)

## 🚀 Deploy to Production (10 Minutes)

See **[QUICKSTART.md](QUICKSTART.md)** for Railway deployment.

Or use one-click deploy:
1. Push to GitHub
2. Deploy on [Railway](https://railway.app)
3. Add environment variables
4. Done! ✅

**Full guide:** [PRODUCTION_DEPLOY.md](PRODUCTION_DEPLOY.md)

## 🎨 What's Included

### 🚀 Real AIM Startups
Loaded with **5 real startups** from AIM program:
1. **Mina Canaan** - Marine technology catamarans
2. **IGT** - Green industry solutions
3. **Impersonas** - Digital humans platform
4. **Schedex** - AI shift management SaaS
5. **Bilo** - Outdoor advertising AI

### 💎 Premium Design
- Light mode yellow/gold tycoon theme
- Mobile-first responsive layout
- "AUB Angel Investor" branding
- Luxury shadows and gradients
- Professional typography

### ⚡ Core Features
- **Real-time updates** via WebSocket
- **Transparent leaderboard** - see all investments
- **Admin control panel** - full event management
- **Lock/unlock rounds** - freeze results
- **Mobile optimized** - perfect for live events
- **Export results** - CSV data export

## 📁 Project Structure

```
investment-game/
├── server/
│   ├── index.js          # Express server + Socket.io
│   ├── database.js       # SQLite database setup
│   └── seed.js           # Sample data seeder
├── client/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── JoinPage.jsx       # Investor join screen
│   │   │   ├── GamePage.jsx       # Main game interface
│   │   │   └── AdminPage.jsx      # Admin dashboard
│   │   ├── context/
│   │   │   └── SocketContext.jsx  # WebSocket management
│   │   ├── utils/
│   │   │   └── api.js             # API helpers
│   │   ├── App.jsx                # Main app component
│   │   └── main.jsx               # Entry point
│   └── package.json
└── package.json
```

## 🎮 How to Use

### Running a Workshop/Event

1. **Setup Phase** (Admin):
   - Access `/admin`
   - Create startups for your event
   - Adjust default starting credits if needed

2. **Investor Join Phase**:
   - Participants visit the main URL
   - Enter their name to join
   - Automatically receive starting credits (default: 2,000,000 CR)

3. **Investment Phase**:
   - Investors browse startups
   - Allocate virtual capital across their portfolio
   - See real-time updates of what others are investing
   - Edit allocations at any time (while unlocked)

4. **Lock & Discuss** (Admin):
   - Click "Lock" to freeze all investments
   - Use the locked state for:
     - Final results presentation
     - Panel discussions
     - Award ceremonies
     - Investment strategy debriefs

5. **Analytics** (Admin):
   - Review investment patterns
   - Identify most popular startups
   - Analyze investor behavior
   - Export insights for follow-up

### Admin Features

#### Investor Management
- **Set Custom Credits**: Adjust capital per investor for VIP tiers or segments
- **Remove Investors**: Clean up test accounts or no-shows
- **Monitor Activity**: See who's invested and how much

#### Startup Management
- **Add Startups**: Name, slug, and description
- **Toggle Visibility**: Activate/deactivate without deletion
- **View Performance**: See total raised and investor count

#### Game Control
- **Lock/Unlock**: Freeze the game state for presentations
- **Real-Time Stats**: Dashboard with key metrics
- **Investment Breakdown**: Detailed view by startup

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
PORT=3001
CLIENT_URL=http://localhost:5173

# Admin credentials
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your_secure_password
```

### Default Settings

- **Default Starting Credit**: 2,000,000 CR (configurable per investor)
- **Database**: SQLite (stored in `server/game.db`)
- **WebSocket Port**: Same as API port (3001)

## 🛠️ Development

### Available Scripts

```bash
# Run both server and client in development
npm run dev

# Run server only
npm run server

# Run client only
npm run client

# Build client for production
npm run build

# Start production server
npm start
```

### API Endpoints

#### Public Endpoints
- `POST /api/join` - Join as investor
- `GET /api/game-state` - Get current game state
- `GET /api/investors/:id` - Get investor details
- `POST /api/invest` - Make/update investment

#### Admin Endpoints (Basic Auth Required)
- `GET /api/admin/investors` - List all investors
- `PUT /api/admin/investors/:id/credit` - Update investor credit
- `DELETE /api/admin/investors/:id` - Delete investor
- `GET /api/admin/startups` - List all startups
- `POST /api/admin/startups` - Create startup
- `PUT /api/admin/startups/:id` - Update startup
- `DELETE /api/admin/startups/:id` - Delete startup
- `POST /api/admin/toggle-lock` - Lock/unlock game
- `GET /api/admin/stats` - Get statistics

### WebSocket Events

- `connect` - Client connects to server
- `disconnect` - Client disconnects
- `gameStateUpdate` - Server broadcasts game state changes

## 🎨 Customization

### Styling
- Built with Tailwind CSS
- Dark theme with emerald/neon accent colors
- Customize colors in `client/tailwind.config.js`

### Credits
- Modify default starting credit in `server/database.js`
- Or set per-investor via admin panel

### Startup Fields
- Extend startup schema in `server/database.js`
- Add custom properties as needed

## 📱 Mobile Optimization

The app is designed mobile-first:
- Touch-friendly buttons and inputs
- Optimized viewport for phones
- Responsive grid layouts
- Smooth scrolling on long lists

## 🔒 Security Notes

- Admin panel uses HTTP Basic Auth
- No real financial transactions
- SQLite database (single file)
- WebSocket connections are stateless
- Credentials stored in environment variables

## 🚀 Production Deployment

### Option 1: Traditional Server

```bash
# Build the client
cd client && npm run build

# Set production environment variables
export NODE_ENV=production
export PORT=3001
export ADMIN_USERNAME=your_username
export ADMIN_PASSWORD=your_secure_password

# Start the server
npm start

# Serve the built client files
# (Configure your web server to serve client/dist)
```

### Option 2: Platform-as-a-Service

Deploy to platforms like:
- **Railway**: One-click deploy with automatic builds
- **Fly.io**: Global edge deployment
- **Render**: Free tier available
- **Heroku**: Classic PaaS option

### Environment Setup for Production

1. Set environment variables in your platform
2. Ensure SQLite persistence (or migrate to PostgreSQL)
3. Configure CORS for your domain
4. Use HTTPS for production
5. Set strong admin credentials

## 🐛 Troubleshooting

### WebSocket Connection Issues
- Check firewall settings
- Verify CLIENT_URL in .env matches your client URL
- Ensure both server and client are running

### Database Locked Errors
- Stop all running instances
- Delete `game.db` and re-run seed script

### Admin Authentication Fails
- Clear browser cache and local storage
- Verify credentials in `.env` file
- Check browser console for error messages

## 📄 License

MIT License - Feel free to use this for your events and workshops!

## 🤝 Contributing

This is a demo application. Feel free to fork and customize for your needs!

## 💡 Use Cases

- **Startup Demo Days**: Let attendees invest in pitches
- **Investment Training**: Teach portfolio allocation
- **Workshop Gamification**: Make learning interactive
- **Team Building**: Simulate investment decisions
- **Educational Events**: Demonstrate market dynamics

## 📊 Sample Data

The seed script creates:
- 6 sample startups (tech, health, finance, etc.)
- 5 sample investors
- Multiple sample investments

Perfect for testing and demonstrations!

---

Built with ❤️ using React, Node.js, Express, Socket.io, and Tailwind CSS
