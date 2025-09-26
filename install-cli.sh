#!/bin/bash

echo "🌍 Installing AIM Currency CLI globally..."

# Install from GitHub
npm install -g https://github.com/greaterdan/0000.git#main:server/aim-cli

if [ $? -eq 0 ]; then
    echo "✅ AIM CLI installed successfully!"
    echo ""
    echo "📋 Next steps:"
    echo "1. Configure your Railway URL: aim config --api-url https://your-app-name.up.railway.app"
    echo "2. Create account: aim setup"
    echo "3. Check balance: aim balance"
    echo ""
    echo "🌐 Your CLI is now available globally on this computer!"
else
    echo "❌ Installation failed. Please check your internet connection and try again."
    exit 1
fi
