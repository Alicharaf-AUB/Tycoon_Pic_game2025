#!/bin/bash

# Run this script on Railway to add the ip_address column
# Usage: ./run-migration.sh

echo "🔧 Running database migration..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

node server/migrate-add-ip-to-investments.js

echo "✅ Migration complete!"
