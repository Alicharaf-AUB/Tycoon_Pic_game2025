# 🚀 Quick Start - Stress Testing

## Run Tests NOW

### 1. Test Production Server (Railway)
```bash
cd stress-test
npm run test:production
```

This will:
- ✅ Test 2000 concurrent users over 60 seconds
- ✅ Measure response times and error rates
- ✅ Show if Railway can handle the load

### 2. Test WebSocket Connections
```bash
npm run test:socket https://tycoonpicgame2025-production.up.railway.app
```

This will:
- ✅ Open 2000 concurrent WebSocket connections
- ✅ Test real-time updates
- ✅ Measure connection stability

## What to Look For

### ✅ GOOD Signs:
- Success rate > 95%
- Average latency < 500ms
- Zero 5xx errors
- No crashes

### 🚨 BAD Signs:
- Server errors (5xx)
- High latency (> 1s)
- Connection failures
- Server crashes

## If Railway Fails

### Immediate Actions:
1. **Upgrade Railway Plan**
   - Go to Railway dashboard
   - Increase CPU/RAM allocation
   - Enable autoscaling

2. **Apply Database Optimizations**
   ```bash
   # Connect to Railway PostgreSQL
   psql $DATABASE_URL
   
   # Run optimization script
   \i db-optimization.sql
   ```

3. **Monitor During Event**
   - Watch Railway metrics dashboard
   - Keep backup plan ready
   - Have restart procedure documented

## Expected Load During Event

Reality check:
- **2000 users** won't all login at exact same time
- Traffic spreads over 5-10 minutes
- Peak during voting = ~500-800 concurrent
- Stress test = worst case scenario

## Railway Resource Recommendations

For 2000 users:
- **CPU**: 2+ cores
- **RAM**: 4GB minimum (8GB recommended)
- **Database**: Shared Postgres or dedicated
- **Plan**: At least Pro plan ($20/month)

## Before the Event

- [ ] Run stress tests
- [ ] Apply database optimizations
- [ ] Check Railway plan limits
- [ ] Set up monitoring
- [ ] Have restart procedure ready
- [ ] Test with 100, 500, 1000 users first
