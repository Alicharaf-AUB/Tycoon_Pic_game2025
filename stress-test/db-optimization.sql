-- Database Optimization for High Load
-- Run these SQL commands on your Railway PostgreSQL database

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_investments_investor_id ON investments(investor_id);
CREATE INDEX IF NOT EXISTS idx_investments_startup_id ON investments(startup_id);
CREATE INDEX IF NOT EXISTS idx_investments_created_at ON investments(created_at);
CREATE INDEX IF NOT EXISTS idx_startups_is_active ON startups(is_active);
CREATE INDEX IF NOT EXISTS idx_investors_email ON investors(email);
CREATE INDEX IF NOT EXISTS idx_investors_has_submitted ON investors(has_submitted);

-- Add composite index for common queries
CREATE INDEX IF NOT EXISTS idx_investments_investor_startup ON investments(investor_id, startup_id);

-- Optimize for concurrent writes
ALTER TABLE investments SET (fillfactor = 90);
ALTER TABLE investors SET (fillfactor = 90);

-- Add connection pooling stats
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- View active connections (for monitoring)
-- SELECT count(*) FROM pg_stat_activity WHERE state = 'active';

-- View slow queries
-- SELECT query, calls, total_time, mean_time 
-- FROM pg_stat_statements 
-- ORDER BY mean_time DESC 
-- LIMIT 10;
