#!/bin/bash

# Azure App Service startup script

echo "Starting AUB Investment Game..."

# Install server dependencies
echo "Installing server dependencies..."
npm install

# Build client if not already built
if [ ! -d "client/dist" ]; then
  echo "Building client..."
  cd client && npm install && npm run build && cd ..
fi

# Start the server
echo "Starting server..."
node server/index.js
