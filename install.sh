#!/bin/bash

echo "🚀 AUB Angel Investor - Complete Installation"
echo "=============================================="
echo ""

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ ERROR: npm is not installed!"
    echo "Please install Node.js from: https://nodejs.org"
    exit 1
fi

echo "✓ Node.js version: $(node -v)"
echo "✓ npm version: $(npm -v)"
echo ""

# Kill any existing processes on port 3001
echo "🔧 Cleaning up existing processes..."
lsof -ti:3001 | xargs kill -9 2>/dev/null || true
echo ""

# Clean everything
echo "🧹 Cleaning old installations..."
rm -rf node_modules package-lock.json
rm -rf client/node_modules client/package-lock.json
echo "✓ Cleaned"
echo ""

# Install root dependencies
echo "📦 Installing server dependencies..."
npm install --legacy-peer-deps
if [ $? -ne 0 ]; then
    echo "❌ Server installation failed!"
    exit 1
fi
echo "✓ Server dependencies installed"
echo ""

# Install client dependencies
echo "📦 Installing client dependencies..."
cd client
npm install --legacy-peer-deps
if [ $? -ne 0 ]; then
    echo "❌ Client installation failed!"
    exit 1
fi
cd ..
echo "✓ Client dependencies installed"
echo ""

# Seed database
echo "🌱 Loading AIM startups into database..."
npm run seed
if [ $? -ne 0 ]; then
    echo "❌ Database seeding failed!"
    exit 1
fi
echo ""

echo "✅ INSTALLATION COMPLETE!"
echo "=========================="
echo ""
echo "🎯 Your 5 AIM Startups are loaded:"
echo "   1. Mina Canaan (EnergyTech)"
echo "   2. IGT (GreenTech)"
echo "   3. Impersonas (Digital Humans)"
echo "   4. Schedex (B2B SaaS)"
echo "   5. Bilo (AdTech)"
echo ""
echo "🚀 To start the app, run:"
echo "   npm run dev"
echo ""
echo "🌐 Then open:"
echo "   Players: http://localhost:5173"
echo "   Admin:   http://localhost:5173/admin"
echo ""
echo "🔐 Admin login:"
echo "   Username: admin"
echo "   Password: demo123"
echo ""
echo "⚠️  IMPORTANT: Change the password in .env before deploying!"
echo ""
