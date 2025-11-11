#!/bin/bash

# Azure deployment script - optimized for faster builds

set -e

echo "=== Azure Deployment Started ==="

# Install root dependencies (server)
echo "Installing server dependencies..."
npm ci --production --no-audit --prefer-offline

# Install and build client
echo "Installing client dependencies..."
cd client
npm ci --no-audit --prefer-offline

echo "Building client..."
npm run build

echo "=== Deployment Complete ==="
