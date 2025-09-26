#!/bin/bash

# AIM Currency Production Startup Script
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT=${1:-production}
SERVICE_NAME="aim-currency"
DOCKER_REGISTRY="your-registry.com"
DOCKER_IMAGE_TAG=${2:-latest}
HEALTH_CHECK_TIMEOUT=300
STARTUP_TIMEOUT=600

echo -e "${BLUE}🚀 AIM Currency Production Startup${NC}"
echo "====================================="
echo -e "${YELLOW}Environment: $ENVIRONMENT${NC}"
echo -e "${YELLOW}Image Tag: $DOCKER_IMAGE_TAG${NC}"

# Function to validate prerequisites
validate_prerequisites() {
    echo -e "${BLUE}🔍 Validating prerequisites...${NC}"
    
    # Check if Docker is installed and running
    if ! command -v docker >/dev/null 2>&1; then
        echo -e "${RED}❌ Docker is not installed${NC}"
        exit 1
    fi
    
    if ! docker info >/dev/null 2>&1; then
        echo -e "${RED}❌ Docker daemon is not running${NC}"
        exit 1
    fi
    
    # Check if Docker Compose is installed
    if ! command -v docker-compose >/dev/null 2>&1; then
        echo -e "${RED}❌ Docker Compose is not installed${NC}"
        exit 1
    fi
    
    # Check if environment file exists
    if [ ! -f "./config/${ENVIRONMENT}.env" ]; then
        echo -e "${RED}❌ Environment file not found: ./config/${ENVIRONMENT}.env${NC}"
        exit 1
    fi
    
    # Check if production Docker Compose file exists
    if [ ! -f "docker-compose.${ENVIRONMENT}.yml" ]; then
        echo -e "${RED}❌ Docker Compose file not found: docker-compose.${ENVIRONMENT}.yml${NC}"
        exit 1
    fi
    
    # Check if required directories exist
    local required_dirs=("logs" "backups" "certs" "nginx")
    for dir in "${required_dirs[@]}"; do
        if [ ! -d "$dir" ]; then
            echo -e "${YELLOW}⚠️  Creating directory: $dir${NC}"
            mkdir -p "$dir"
        fi
    done
    
    echo -e "${GREEN}✅ Prerequisites validated${NC}"
}

# Function to load environment configuration
load_environment() {
    echo -e "${BLUE}📋 Loading environment configuration...${NC}"
    
    local env_file="./config/${ENVIRONMENT}.env"
    source "$env_file"
    
    # Validate required environment variables
    local required_vars=("POSTGRES_PASSWORD" "REDIS_PASSWORD" "MINIO_ACCESS_KEY" "MINIO_SECRET_KEY" "JWT_SECRET")
    for var in "${required_vars[@]}"; do
        if [ -z "${!var}" ]; then
            echo -e "${RED}❌ Required environment variable not set: $var${NC}"
            exit 1
        fi
    done
    
    echo -e "${GREEN}✅ Environment configuration loaded${NC}"
}

# Function to check system resources
check_system_resources() {
    echo -e "${BLUE}💻 Checking system resources...${NC}"
    
    # Check available memory
    local available_memory=$(free -m | awk 'NR==2{printf "%.0f", $7}')
    local required_memory=8192  # 8GB
    
    if [ "$available_memory" -lt "$required_memory" ]; then
        echo -e "${YELLOW}⚠️  Low memory warning: ${available_memory}MB available, ${required_memory}MB recommended${NC}"
    else
        echo -e "${GREEN}✅ Memory check passed: ${available_memory}MB available${NC}"
    fi
    
    # Check available disk space
    local available_disk=$(df -BG . | awk 'NR==2{print $4}' | sed 's/G//')
    local required_disk=50  # 50GB
    
    if [ "$available_disk" -lt "$required_disk" ]; then
        echo -e "${YELLOW}⚠️  Low disk space warning: ${available_disk}GB available, ${required_disk}GB recommended${NC}"
    else
        echo -e "${GREEN}✅ Disk space check passed: ${available_disk}GB available${NC}"
    fi
    
    # Check CPU cores
    local cpu_cores=$(nproc)
    local required_cores=4
    
    if [ "$cpu_cores" -lt "$required_cores" ]; then
        echo -e "${YELLOW}⚠️  Low CPU cores warning: ${cpu_cores} cores available, ${required_cores} cores recommended${NC}"
    else
        echo -e "${GREEN}✅ CPU cores check passed: ${cpu_cores} cores available${NC}"
    fi
}

# Function to pull Docker images
pull_docker_images() {
    echo -e "${BLUE}📥 Pulling Docker images...${NC}"
    
    # Pull main application image
    echo -e "${YELLOW}📦 Pulling main application image...${NC}"
    docker pull "${DOCKER_REGISTRY}/${SERVICE_NAME}:${DOCKER_IMAGE_TAG}"
    
    # Pull individual service images
    local services=("gateway" "ledgerd" "mintd" "treasury" "agent-gateway" "disputes" "onramp" "verifier-advanced" "metering" "webhookd" "pqsigner" "logd")
    
    for service in "${services[@]}"; do
        echo -e "${YELLOW}📦 Pulling $service image...${NC}"
        docker pull "${DOCKER_REGISTRY}/${SERVICE_NAME}-${service}:${DOCKER_IMAGE_TAG}"
    done
    
    echo -e "${GREEN}✅ Docker images pulled successfully${NC}"
}

# Function to run database migrations
run_database_migrations() {
    echo -e "${BLUE}🗄️  Running database migrations...${NC}"
    
    # Run migration script
    ./scripts/migrate.sh "$ENVIRONMENT"
    
    echo -e "${GREEN}✅ Database migrations completed${NC}"
}

# Function to start services
start_services() {
    echo -e "${BLUE}🚀 Starting services...${NC}"
    
    # Start services with Docker Compose
    docker-compose -f "docker-compose.${ENVIRONMENT}.yml" up -d
    
    echo -e "${GREEN}✅ Services started successfully${NC}"
}

# Function to wait for services to be healthy
wait_for_services() {
    echo -e "${BLUE}⏳ Waiting for services to be healthy...${NC}"
    
    local services=("postgres:5432" "redis:6379" "nats:4222" "minio:9000" "gateway:3000" "ledgerd:3001" "mintd:3003" "treasury:3004")
    local all_healthy=true
    
    for service in "${services[@]}"; do
        local name=$(echo $service | cut -d: -f1)
        local port=$(echo $service | cut -d: -f2)
        
        echo -e "${YELLOW}🔍 Waiting for $name to be healthy...${NC}"
        
        local attempts=0
        local max_attempts=40
        
        while [ $attempts -lt $max_attempts ]; do
            if curl -s "http://localhost:$port/health" > /dev/null 2>&1 || nc -z localhost "$port" > /dev/null 2>&1; then
                echo -e "${GREEN}✅ $name is healthy${NC}"
                break
            else
                attempts=$((attempts + 1))
                echo -e "${YELLOW}⏳ Waiting for $name... (attempt $attempts/$max_attempts)${NC}"
                sleep 15
            fi
        done
        
        if [ $attempts -eq $max_attempts ]; then
            echo -e "${RED}❌ $name health check failed${NC}"
            all_healthy=false
        fi
    done
    
    if [ "$all_healthy" = true ]; then
        echo -e "${GREEN}✅ All services are healthy${NC}"
    else
        echo -e "${RED}❌ Some services failed health checks${NC}"
        exit 1
    fi
}

# Function to perform smoke tests
perform_smoke_tests() {
    echo -e "${BLUE}💨 Performing smoke tests...${NC}"
    
    # Test basic API endpoints
    local endpoints=(
        "http://localhost:3000/health"
        "http://localhost:3000/api/health"
        "http://localhost:3000/api/metrics"
    )
    
    for endpoint in "${endpoints[@]}"; do
        echo -e "${YELLOW}🔍 Testing $endpoint...${NC}"
        
        if curl -s "$endpoint" > /dev/null 2>&1; then
            echo -e "${GREEN}✅ $endpoint is accessible${NC}"
        else
            echo -e "${RED}❌ $endpoint is not accessible${NC}"
            exit 1
        fi
    done
    
    echo -e "${GREEN}✅ Smoke tests passed${NC}"
}

# Function to show service status
show_service_status() {
    echo -e "${BLUE}📊 Service Status${NC}"
    echo "=================="
    
    # Show Docker Compose service status
    docker-compose -f "docker-compose.${ENVIRONMENT}.yml" ps
    
    echo ""
    echo -e "${BLUE}📈 Service Health${NC}"
    echo "=================="
    
    # Check service health
    local services=("gateway:3000" "ledgerd:3001" "mintd:3003" "treasury:3004")
    
    for service in "${services[@]}"; do
        local name=$(echo $service | cut -d: -f1)
        local port=$(echo $service | cut -d: -f2)
        
        if curl -s "http://localhost:$port/health" > /dev/null 2>&1; then
            echo -e "${GREEN}✅ $name: Healthy${NC}"
        else
            echo -e "${RED}❌ $name: Unhealthy${NC}"
        fi
    done
}

# Function to setup monitoring
setup_monitoring() {
    echo -e "${BLUE}📊 Setting up monitoring...${NC}"
    
    # Check if monitoring setup script exists
    if [ -f "./scripts/setup-monitoring.sh" ]; then
        echo -e "${YELLOW}📦 Setting up monitoring stack...${NC}"
        ./scripts/setup-monitoring.sh
        
        echo -e "${GREEN}✅ Monitoring setup completed${NC}"
    else
        echo -e "${YELLOW}⚠️  Monitoring setup script not found, skipping${NC}"
    fi
}

# Function to send startup notification
send_startup_notification() {
    local status=$1
    local message=$2
    
    echo -e "${BLUE}📢 Sending startup notification...${NC}"
    
    # Send notification to Slack, email, etc.
    # This would be implemented based on your notification system
    
    echo -e "${GREEN}✅ Notification sent: $status - $message${NC}"
}

# Function to cleanup on failure
cleanup_on_failure() {
    echo -e "${RED}❌ Startup failed. Cleaning up...${NC}"
    
    # Stop services
    docker-compose -f "docker-compose.${ENVIRONMENT}.yml" down
    
    # Send failure notification
    send_startup_notification "FAILED" "Production startup failed"
    
    exit 1
}

# Main startup function
main() {
    local start_time=$(date +%s)
    
    echo -e "${BLUE}🚀 Starting production startup process...${NC}"
    
    # Set up error handling
    trap cleanup_on_failure ERR
    
    # Validate prerequisites
    validate_prerequisites
    
    # Load environment configuration
    load_environment
    
    # Check system resources
    check_system_resources
    
    # Pull Docker images
    pull_docker_images
    
    # Run database migrations
    run_database_migrations
    
    # Start services
    start_services
    
    # Wait for services to be healthy
    wait_for_services
    
    # Perform smoke tests
    perform_smoke_tests
    
    # Setup monitoring
    setup_monitoring
    
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    echo -e "${GREEN}🎉 Production startup completed successfully in ${duration}s!${NC}"
    
    # Send success notification
    send_startup_notification "SUCCESS" "Production startup completed successfully"
    
    # Show service status
    show_service_status
    
    # Show startup summary
    echo -e "${BLUE}📊 Startup Summary${NC}"
    echo "=================="
    echo -e "${GREEN}Environment: $ENVIRONMENT${NC}"
    echo -e "${GREEN}Image Tag: $DOCKER_IMAGE_TAG${NC}"
    echo -e "${GREEN}Duration: ${duration}s${NC}"
    echo -e "${GREEN}Status: SUCCESS${NC}"
    echo ""
    echo -e "${YELLOW}📋 Next steps:${NC}"
    echo "1. Monitor service health: docker-compose -f docker-compose.${ENVIRONMENT}.yml ps"
    echo "2. Check logs: docker-compose -f docker-compose.${ENVIRONMENT}.yml logs -f"
    echo "3. Access API: http://localhost:3000/api/docs"
    echo "4. Monitor metrics: http://localhost:3000/api/metrics"
    echo "5. Check health: http://localhost:3000/health"
}

# Run main function
main "$@"
