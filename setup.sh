#!/bin/bash

echo "🎮 Investment Game Setup"
echo "========================"
echo ""

# Install root dependencies
echo "📦 Installing server dependencies..."
npm install

# Install client dependencies
echo "📦 Installing client dependencies..."
cd client
npm install
cd ..

# Seed database
echo "🌱 Seeding database with sample data..."
node server/seed.js

echo ""
echo "✅ Setup complete!"
echo ""
echo "🚀 To start the application:"
echo "   npm run dev"
echo ""
echo "Then open:"
echo "   Player: http://localhost:5173"
echo "   Admin:  http://localhost:5173/admin (admin/demo123)"
echo ""
