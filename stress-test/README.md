# Stress Testing Guide for Tycoon PIC Game

## Overview
This suite tests whether Railway can handle **2000 concurrent users** without crashing.

## Prerequisites

```bash
cd stress-test
npm install
```

## Test Scenarios

### 1. HTTP Load Test
Tests API endpoints with high request volume:
- User login/registration
- Game state retrieval
- Voting/investment actions

```bash
# Test local server
npm run test:local

# Test production (Railway)
npm run test:production
```

### 2. WebSocket Stress Test
Tests Socket.IO real-time connections:
- 2000 concurrent WebSocket connections
- Real-time message broadcasting
- Connection stability

```bash
npm run test:socket https://tycoonpicgame2025-production.up.railway.app
```

## Expected Results

### ✅ PASS Criteria
- **Success Rate**: > 95%
- **Average Latency**: < 500ms
- **5xx Errors**: 0
- **Connection Success**: > 95%
- **Disconnect Rate**: < 5%

### ⚠️ WARNING Signs
- Average latency > 1000ms
- Error rate > 1%
- Disconnections > 10%
- High memory usage

### 🚨 FAIL Indicators
- Server crashes
- 5xx errors present
- Connection success < 80%
- Persistent timeouts

## Railway Optimization Recommendations

If tests fail, consider:

### 1. **Upgrade Railway Plan**
- Increase CPU cores
- Add more RAM (recommend 4GB+ for 2k users)
- Enable autoscaling

### 2. **Database Optimization**
```sql
-- Add indexes for frequently queried fields
CREATE INDEX idx_investments_investor ON investments(investor_id);
CREATE INDEX idx_investments_startup ON investments(startup_id);
CREATE INDEX idx_startups_active ON startups(is_active);
```

### 3. **Enable Caching**
- Add Redis for session management
- Cache game state queries
- Implement rate limiting

### 4. **Connection Pooling**
Update `server/index.js`:
```javascript
const pool = new Pool({
  connectionString: DATABASE_URL,
  max: 100, // Increase pool size
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});
```

### 5. **Add Rate Limiting**
```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100 // limit each IP to 100 requests per minute
});

app.use('/api/', limiter);
```

### 6. **Enable Compression**
```javascript
const compression = require('compression');
app.use(compression());
```

## Monitoring During Test

Watch Railway metrics:
1. **CPU Usage** - should stay < 80%
2. **Memory Usage** - should stay < 90%
3. **Response Time** - should stay < 500ms
4. **Error Rate** - should stay at 0%

## Emergency Actions

If Railway crashes during the event:
1. **Immediate**: Restart the service
2. **Short-term**: Enable rate limiting
3. **Long-term**: Upgrade plan or implement load balancing

## Running Tests Safely

```bash
# Start with smaller load
node load-test.js <url> --connections 100 --duration 30

# Gradually increase
node load-test.js <url> --connections 500 --duration 30

# Full test
npm run test:production
```

## Realistic Event Simulation

Actual event behavior:
- Not all 2000 users login simultaneously
- Activity is spread over time
- Peak traffic during voting period

The stress tests are **worst-case scenarios** (all users at once).
