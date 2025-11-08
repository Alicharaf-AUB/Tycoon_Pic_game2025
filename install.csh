#!/bin/csh

echo "🚀 AUB Angel Investor - Complete Installation"
echo "=============================================="
echo ""

# Check if npm is installed
which npm >& /dev/null
if ($status != 0) then
    echo "❌ ERROR: npm is not installed!"
    echo "Please install Node.js from: https://nodejs.org"
    exit 1
endif

echo "✓ Node.js version: `node -v`"
echo "✓ npm version: `npm -v`"
echo ""

# Kill any existing processes on port 3001
echo "🔧 Cleaning up existing processes..."
lsof -ti:3001 | xargs kill -9 >& /dev/null
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
if ($status != 0) then
    echo "❌ Server installation failed!"
    exit 1
endif
echo "✓ Server dependencies installed"
echo ""

# Install client dependencies
echo "📦 Installing client dependencies..."
cd client
npm install --legacy-peer-deps
if ($status != 0) then
    echo "❌ Client installation failed!"
    exit 1
endif
cd ..
echo "✓ Client dependencies installed"
echo ""

# Create .env file if it doesn't exist
if (! -f .env) then
    echo "📝 Creating .env file..."
    echo "PORT=3001" > .env
    echo "CLIENT_URL=http://localhost:5173" >> .env
    echo "ADMIN_USERNAME=admin" >> .env
    echo "ADMIN_PASSWORD=demo123" >> .env
    echo "NODE_ENV=development" >> .env
    echo "✓ .env file created"
    echo ""
endif

# Seed database
echo "🌱 Seeding database..."
node server/seed.js
if ($status != 0) then
    echo "⚠️  Database seeding failed, but you can run it manually later"
else
    echo "✓ Database seeded"
endif
echo ""

echo "✅ Installation Complete!"
echo ""
echo "🚀 To start the application:"
echo "   npm run dev"
echo ""
echo "Then open:"
echo "   Player: http://localhost:5173"
echo "   Admin:  http://localhost:5173/admin (admin/demo123)"
echo ""
echo "📚 For more info, see README.md"
echo ""
