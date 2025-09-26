#!/bin/bash

echo "🚀 Starting AIM Currency Server..."

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Start the gateway service (main entry point)
echo "🌐 Starting Gateway service..."
cd gateway

# Install gateway dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing gateway dependencies..."
    npm install
fi

# Build if needed
if [ ! -d "dist" ]; then
    echo "🔨 Building gateway..."
    npm run build
fi

# Start the service
echo "✅ Starting gateway on port 3005..."
npm run start:prod

