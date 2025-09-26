#!/bin/bash

# Infrastructure Setup Script
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Setting up AIM Currency Infrastructure${NC}"
echo "=============================================="

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to install Redis
install_redis() {
    echo -e "${BLUE}📦 Installing Redis...${NC}"
    
    if command_exists redis-server; then
        echo -e "${GREEN}✅ Redis already installed${NC}"
    else
        if [[ "$OSTYPE" == "darwin"* ]]; then
            # macOS
            if command_exists brew; then
                brew install redis
            else
                echo -e "${RED}❌ Homebrew not found. Please install Redis manually.${NC}"
                exit 1
            fi
        else
            # Linux
            sudo apt-get update
            sudo apt-get install -y redis-server
        fi
    fi
}

# Function to start Redis
start_redis() {
    echo -e "${BLUE}🔄 Starting Redis...${NC}"
    
    if [[ "$OSTYPE" == "darwin"* ]]; then
        brew services start redis
    else
        sudo systemctl start redis-server
        sudo systemctl enable redis-server
    fi
    
    # Wait for Redis to be ready
    local attempts=0
    local max_attempts=30
    
    while [ $attempts -lt $max_attempts ]; do
        if redis-cli ping > /dev/null 2>&1; then
            echo -e "${GREEN}✅ Redis is ready${NC}"
            return 0
        else
            attempts=$((attempts + 1))
            echo -e "${YELLOW}⏳ Waiting for Redis... (attempt $attempts/$max_attempts)${NC}"
            sleep 2
        fi
    done
    
    echo -e "${RED}❌ Redis failed to start${NC}"
    exit 1
}

# Function to setup PostgreSQL
setup_postgresql() {
    echo -e "${BLUE}🗄️  Setting up PostgreSQL...${NC}"
    
    # Check if PostgreSQL is available
    if command_exists psql; then
        echo -e "${GREEN}✅ PostgreSQL client found${NC}"
    else
        if [[ "$OSTYPE" == "darwin"* ]]; then
            if command_exists brew; then
                brew install postgresql@14
                echo 'export PATH="/opt/homebrew/opt/postgresql@14/bin:$PATH"' >> ~/.zshrc
                source ~/.zshrc
            else
                echo -e "${RED}❌ Homebrew not found. Please install PostgreSQL manually.${NC}"
                exit 1
            fi
        else
            sudo apt-get update
            sudo apt-get install -y postgresql postgresql-contrib
        fi
    fi
}

# Function to create test database
create_test_database() {
    echo -e "${BLUE}📊 Creating test database...${NC}"
    
    # Create test database
    createdb aim_test 2>/dev/null || echo "Database aim_test already exists"
    
    # Test connection
    if psql -d aim_test -c "SELECT 1;" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Test database connection successful${NC}"
    else
        echo -e "${RED}❌ Test database connection failed${NC}"
        exit 1
    fi
}

# Function to setup environment variables
setup_environment() {
    echo -e "${BLUE}⚙️  Setting up environment variables...${NC}"
    
    cat > .env.test << EOF
NODE_ENV=test
DATABASE_URL=postgresql://$(whoami)@localhost:5432/aim_test
REDIS_URL=redis://localhost:6379/0
JWT_SECRET=test-jwt-secret-key-for-testing
PQSIGNER_URL=http://localhost:3000
LEDGERD_URL=http://localhost:3001
MINTD_URL=http://localhost:3003
TREASURY_URL=http://localhost:3004
LOG_LEVEL=debug
PORT=3000
EOF
    
    echo -e "${GREEN}✅ Environment variables configured${NC}"
}

# Function to run database migrations
run_migrations() {
    echo -e "${BLUE}🔄 Running database migrations...${NC}"
    
    # Set environment variables for migration
    export DATABASE_URL="postgresql://$(whoami)@localhost:5432/aim_test"
    
    # Run migrations if they exist
    if [ -f "scripts/migrate.sh" ]; then
        ./scripts/migrate.sh test
    else
        echo -e "${YELLOW}⚠️  No migration script found, skipping migrations${NC}"
    fi
}

# Function to start services
start_services() {
    echo -e "${BLUE}🚀 Starting services...${NC}"
    
    # Start gateway service in background
    echo -e "${YELLOW}📡 Starting Gateway service...${NC}"
    cd gateway
    npm run start:dev &
    GATEWAY_PID=$!
    cd ..
    
    # Wait for services to be ready
    echo -e "${YELLOW}⏳ Waiting for services to be ready...${NC}"
    sleep 10
    
    # Test health endpoint
    local attempts=0
    local max_attempts=30
    
    while [ $attempts -lt $max_attempts ]; do
        if curl -s http://localhost:3000/health > /dev/null 2>&1; then
            echo -e "${GREEN}✅ Gateway service is ready${NC}"
            break
        else
            attempts=$((attempts + 1))
            echo -e "${YELLOW}⏳ Waiting for Gateway service... (attempt $attempts/$max_attempts)${NC}"
            sleep 2
        fi
    done
    
    if [ $attempts -eq $max_attempts ]; then
        echo -e "${RED}❌ Gateway service failed to start${NC}"
        kill $GATEWAY_PID 2>/dev/null || true
        exit 1
    fi
    
    echo -e "${GREEN}✅ All services started successfully${NC}"
    echo -e "${YELLOW}📋 Service PIDs:${NC}"
    echo "  Gateway: $GATEWAY_PID"
}

# Function to run infrastructure tests
run_infrastructure_tests() {
    echo -e "${BLUE}🧪 Running infrastructure tests...${NC}"
    
    # Test Redis
    if redis-cli ping | grep -q "PONG"; then
        echo -e "${GREEN}✅ Redis connectivity test passed${NC}"
    else
        echo -e "${RED}❌ Redis connectivity test failed${NC}"
    fi
    
    # Test PostgreSQL
    if psql -d aim_test -c "SELECT 1;" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ PostgreSQL connectivity test passed${NC}"
    else
        echo -e "${RED}❌ PostgreSQL connectivity test failed${NC}"
    fi
    
    # Test Gateway health endpoint
    if curl -s http://localhost:3000/health | grep -q "healthy"; then
        echo -e "${GREEN}✅ Gateway health test passed${NC}"
    else
        echo -e "${RED}❌ Gateway health test failed${NC}"
    fi
    
    # Test metrics endpoint
    if curl -s http://localhost:3000/api/metrics > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Metrics endpoint test passed${NC}"
    else
        echo -e "${YELLOW}⚠️  Metrics endpoint test failed (expected if not implemented)${NC}"
    fi
}

# Main function
main() {
    echo -e "${BLUE}🚀 Starting infrastructure setup...${NC}"
    
    install_redis
    start_redis
    setup_postgresql
    create_test_database
    setup_environment
    run_migrations
    start_services
    run_infrastructure_tests
    
    echo -e "${GREEN}✅ Infrastructure setup completed successfully!${NC}"
    echo ""
    echo -e "${YELLOW}📋 Services running:${NC}"
    echo "  🌐 Gateway: http://localhost:3000"
    echo "  📊 Health: http://localhost:3000/health"
    echo "  📈 Metrics: http://localhost:3000/api/metrics"
    echo "  📚 API Docs: http://localhost:3000/api/docs"
    echo ""
    echo -e "${YELLOW}💡 To stop services:${NC}"
    echo "  kill $GATEWAY_PID"
    echo ""
    echo -e "${YELLOW}💡 To run tests:${NC}"
    echo "  ./scripts/final-testing.sh smoke test false"
}

# Run main function
main "$@"
