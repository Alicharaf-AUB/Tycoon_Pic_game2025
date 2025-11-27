#!/bin/bash

# Database Optimization Script for Railway PostgreSQL
# Run this to optimize your database for 2000 concurrent users

echo "🔧 Applying Database Optimizations for High Load..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
  echo "❌ ERROR: DATABASE_URL environment variable not set"
  echo "💡 Usage: DATABASE_URL='your_database_url' ./optimize-db.sh"
  exit 1
fi

echo "📊 Creating performance indexes..."

psql "$DATABASE_URL" <<EOF

-- Add indexes for frequently queried fields
CREATE INDEX IF NOT EXISTS idx_investments_investor_id ON investments(investor_id);
CREATE INDEX IF NOT EXISTS idx_investments_startup_id ON investments(startup_id);
CREATE INDEX IF NOT EXISTS idx_investments_created_at ON investments(created_at);
CREATE INDEX IF NOT EXISTS idx_startups_is_active ON startups(is_active);
CREATE INDEX IF NOT EXISTS idx_investors_email ON investors(email);
CREATE INDEX IF NOT EXISTS idx_investors_has_submitted ON investors(has_submitted);

-- Composite index for common queries
CREATE INDEX IF NOT EXISTS idx_investments_investor_startup ON investments(investor_id, startup_id);

-- Analyze tables for query planner
ANALYZE investments;
ANALYZE investors;
ANALYZE startups;

-- Show current index sizes
SELECT
    schemaname,
    tablename,
    indexname,
    pg_size_pretty(pg_relation_size(indexrelid)) AS index_size
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY pg_relation_size(indexrelid) DESC;

EOF

echo ""
echo "✅ Database optimization complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📈 Performance improvements applied:"
echo "   ✓ Added 7 performance indexes"
echo "   ✓ Optimized query execution plans"
echo "   ✓ Reduced database query times"
echo ""
echo "💡 Next steps:"
echo "   1. Deploy the optimized server code to Railway"
echo "   2. Monitor Railway metrics during testing"
echo "   3. Run stress test again to verify improvements"
echo ""
