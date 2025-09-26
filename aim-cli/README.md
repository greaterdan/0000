# AIM Currency CLI

Command-line interface for managing AIM tokens. Install globally on any computer and connect to your Railway server.

## 🚀 Quick Install

```bash
# Install globally from GitHub
npm install -g https://github.com/greaterdan/0000.git#main:server/aim-cli

# Configure your Railway server
aim config --api-url https://your-app-name.up.railway.app

# Create your wallet
aim setup
```

## 📋 Commands

- `aim setup` - Create new wallet
- `aim balance` - Check balance
- `aim send` - Send tokens
- `aim buy` - Buy AIM with crypto
- `aim sell` - Sell AIM for crypto
- `aim restore` - Restore from seed phrase
- `aim backup` - Export wallet backup

## 🔧 Configuration

Your wallet data is stored locally in `~/.config/aim-cli/` and encrypted with your password.

## 🌐 Server Connection

The CLI connects to your Railway-deployed server. Make sure your server is running and accessible.

## 🔒 Security

- 24-word BIP39 seed phrases
- AES-256-CBC encryption for local storage
- Password-protected wallet files
- ECDSA signatures for transactions

## 📱 Cross-Platform

Works on:
- macOS
- Linux  
- Windows (with Node.js)

## 🆘 Support

If you have issues:
1. Check your Railway server is running
2. Verify your API URL configuration
3. Reinstall: `npm uninstall -g aim-currency-cli && npm install -g https://github.com/greaterdan/0000.git#main:server/aim-cli`