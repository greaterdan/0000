# 🚀 AIM Currency - AI-Powered Digital Currency System

**AIM Currency** is a revolutionary quantum-safe digital currency infrastructure designed specifically for AI agents and human users. Built with enterprise-grade security, real-time processing, and seamless AI integration.

## 🌟 What is AIM Currency?

AIM Currency is a **complete digital currency ecosystem** that enables:

- **AI Agents** to earn, spend, and manage digital currency autonomously
- **Humans** to interact with AI services using a unified currency system
- **Real-time transactions** with quantum-safe cryptography
- **Decentralized verification** and dispute resolution
- **Seamless crypto on-ramp** for traditional currency conversion

## 🎯 Core Features

### 💰 **Digital Currency Management**
- **100M AIM tokens** total supply with controlled distribution
- **Real-time balance tracking** and transaction history
- **Quantum-safe cryptography** using Ed25519 (upgradeable to Dilithium3)
- **Demurrage system** to encourage circulation and prevent hoarding

### 🤖 **AI Agent Integration**
- **OAuth2 authentication** for AI agents
- **Service token system** for secure API access
- **Reputation scoring** for agent behavior tracking
- **Automated dispute resolution** for agent transactions

### 🔄 **Transaction Processing**
- **Instant transfers** between accounts
- **Job-based processing** for complex operations
- **Merkle tree logging** for transaction verification
- **Checkpoint system** for data integrity

### 💱 **Crypto Integration**
- **Multi-crypto on-ramp** (Bitcoin, Ethereum, etc.)
- **Real-time exchange rates** and price tracking
- **Automated buy/sell orders** for AIM tokens
- **Secure wallet management**

## 🏗️ Architecture

### **Core Services**

| Service | Port | Purpose |
|---------|------|---------|
| **Gateway** | 3000 | Main API entry point, rate limiting, authentication |
| **Treasury** | 3004 | Token supply management, buy/sell operations |
| **Ledgerd** | 3001 | Balance tracking, transaction journaling |
| **Mintd** | 3003 | Token minting, supply control |
| **Agent Gateway** | 3006 | AI agent authentication and management |
| **Disputes** | 3007 | Dispute resolution and reputation management |
| **Metering** | 3008 | Usage tracking and billing |
| **Marketplace** | 3009 | Token trading and exchange |
| **Onramp** | 3012 | Crypto currency integration |
| **Webhookd** | 3013 | Event notifications and callbacks |
| **Verifier Advanced** | 3014 | Advanced transaction verification |
| **Logd** | 3002 | Transaction logging and checkpointing |

### **Infrastructure**
- **PostgreSQL** database for persistent storage
- **NATS** messaging for service communication
- **Redis** for caching and session management
- **Docker** containerization for easy deployment

## 🚀 Getting Started

### **Prerequisites**
- Node.js 18+ 
- PostgreSQL 16+
- Docker (optional)

### **Quick Start**

1. **Clone the repository**
   ```bash
   git clone https://github.com/greaterdan/0000.git
   cd 0000/server
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the services**
   ```bash
   # Start all services
   ./start.sh
   
   # Or start individual services
   cd gateway && npm run dev
   cd treasury && npm run dev
   ```

4. **Test the system**
   ```bash
   # Check gateway health
   curl http://localhost:3000/api/health
   
   # Get current rates
   curl http://localhost:3000/api/v1/rates
   ```

### **Using the CLI**

```bash
# Install CLI globally
cd aim-cli && npm install -g .

# Create a wallet
aim setup

# Check balance
aim balance

# Send AIM to another account
aim send <recipient> <amount>

# Buy AIM with crypto
aim buy <amount> <crypto_type>

# View transaction history
aim history
```

## 🔧 API Usage

### **Authentication**
```bash
# Get service token
curl -X POST http://localhost:3000/api/v1/auth/dev \
  -H "Content-Type: application/json" \
  -d '{"serviceName": "my-service"}'
```

### **Transfer AIM**
```bash
curl -X POST http://localhost:3000/api/v1/transfer \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "recipient": "account-id",
    "amount": "1000000",
    "memo": "Payment for AI service"
  }'
```

### **Check Balance**
```bash
curl http://localhost:3000/api/v1/balance \
  -H "Authorization: Bearer <token>"
```

## 🤖 AI Agent Integration

### **Register an AI Agent**
```python
import requests

# Register new agent
response = requests.post('http://localhost:3006/api/v1/agents', json={
    'name': 'My AI Assistant',
    'capabilities': ['text-generation', 'image-processing']
})

agent_data = response.json()
client_id = agent_data['clientId']
client_secret = agent_data['clientSecret']
```

### **Authenticate Agent**
```python
# Get OAuth token
auth_response = requests.post('http://localhost:3006/api/v1/oauth/token', data={
    'grant_type': 'client_credentials',
    'client_id': client_id,
    'client_secret': client_secret
})

access_token = auth_response.json()['access_token']
```

### **Make Authenticated Requests**
```python
# Use token for API calls
headers = {'Authorization': f'Bearer {access_token}'}
balance = requests.get('http://localhost:3000/api/v1/balance', headers=headers)
```

## 💡 Use Cases

### **For AI Developers**
- **Monetize AI services** with automatic payment processing
- **Track usage** and implement usage-based pricing
- **Handle disputes** automatically with reputation systems
- **Scale globally** with distributed infrastructure

### **For Businesses**
- **Pay for AI services** using a unified currency
- **Track AI spending** across multiple providers
- **Automate billing** and payment reconciliation
- **Integrate with existing** crypto payment systems

### **For End Users**
- **Earn AIM** by providing data or services to AI
- **Spend AIM** on AI-powered applications
- **Convert to/from** traditional cryptocurrencies
- **Track transactions** with full transparency

## 🔒 Security Features

- **Quantum-safe cryptography** (Ed25519, upgradeable to Dilithium3)
- **Multi-signature transactions** for high-value operations
- **Rate limiting** and DDoS protection
- **Audit logging** for all transactions
- **Dispute resolution** with reputation scoring
- **Secure key management** with hardware security modules

## 📊 Token Economics

- **Total Supply**: 100,000,000 AIM tokens
- **Public Sale**: 50,000,000 AIM (50%)
- **Treasury Reserves**: 50,000,000 AIM (50%)
- **Initial Price**: $0.75 USD per AIM
- **Demurrage Rate**: 2% annually (encourages circulation)

## 🚀 Deployment

### **Railway Deployment**
```bash
# Deploy to Railway
railway login
railway link
railway up
```

### **Docker Deployment**
```bash
# Build and run with Docker Compose
docker-compose up -d
```

### **Manual Deployment**
```bash
# Set environment variables
export POSTGRES_URL="postgresql://user:pass@localhost:5432/aim"
export JWT_SECRET="your-secret-key"

# Start services
npm run start:prod
```

## 📈 Monitoring & Analytics

- **Real-time metrics** via Prometheus
- **Transaction analytics** and reporting
- **Performance monitoring** for all services
- **Error tracking** and alerting
- **Usage dashboards** for business insights

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

- **Documentation**: [Wiki](https://github.com/greaterdan/0000/wiki)
- **Issues**: [GitHub Issues](https://github.com/greaterdan/0000/issues)
- **Discord**: [Community Server](https://discord.gg/aim-currency)

## 🎯 Roadmap

- [ ] **Q1 2024**: Dilithium3 quantum-safe cryptography
- [ ] **Q2 2024**: Mobile wallet applications
- [ ] **Q3 2024**: DeFi integration and staking
- [ ] **Q4 2024**: Cross-chain interoperability
- [ ] **Q1 2025**: AI agent marketplace

---

**AIM Currency** - *Empowering the future of AI with secure, scalable digital currency infrastructure.*

Built with ❤️ for the AI revolution.
