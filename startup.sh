#!/bin/bash

# Azure App Service startup script

echo "Starting Tycoon AUB PIC Game..."

# Start the server (dependencies already installed during deployment)
echo "Starting server..."
node server/index.js
