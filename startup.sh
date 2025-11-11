#!/bin/bash

# Azure App Service startup script

echo "Starting AUB Investment Game..."

# Start the server (dependencies already installed during deployment)
echo "Starting server..."
node server/index.js
