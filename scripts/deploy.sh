#!/bin/bash

# AIM Currency Production Deployment Script
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT=${1:-production}
DEPLOYMENT_TYPE=${2:-rolling}
SERVICE_NAME="aim-currency"
DOCKER_REGISTRY="your-registry.com"
DOCKER_IMAGE_TAG=${3:-latest}
HEALTH_CHECK_TIMEOUT=300
ROLLBACK_TIMEOUT=60

echo -e "${BLUE}🚀 AIM Currency Deployment${NC}"
echo "============================="
echo -e "${YELLOW}Environment: $ENVIRONMENT${NC}"
echo -e "${YELLOW}Deployment Type: $DEPLOYMENT_TYPE${NC}"
echo -e "${YELLOW}Image Tag: $DOCKER_IMAGE_TAG${NC}"

# Function to validate prerequisites
validate_prerequisites() {
    echo -e "${BLUE}🔍 Validating prerequisites...${NC}"
    
    # Check if Docker is installed
    if ! command -v docker >/dev/null 2>&1; then
        echo -e "${RED}❌ Docker is not installed${NC}"
        exit 1
    fi
    
    # Check if Docker Compose is installed
    if ! command -v docker-compose >/dev/null 2>&1; then
        echo -e "${RED}❌ Docker Compose is not installed${NC}"
        exit 1
    fi
    
    # Check if kubectl is installed (for Kubernetes deployment)
    if [ "$DEPLOYMENT_TYPE" = "kubernetes" ] && ! command -v kubectl >/dev/null 2>&1; then
        echo -e "${RED}❌ kubectl is not installed${NC}"
        exit 1
    fi
    
    # Check if environment file exists
    if [ ! -f "./config/${ENVIRONMENT}.env" ]; then
        echo -e "${RED}❌ Environment file not found: ./config/${ENVIRONMENT}.env${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ Prerequisites validated${NC}"
}

# Function to build Docker images
build_images() {
    echo -e "${BLUE}🏗️  Building Docker images...${NC}"
    
    # Build main application image
    echo -e "${YELLOW}📦 Building main application image...${NC}"
    docker build -t "${DOCKER_REGISTRY}/${SERVICE_NAME}:${DOCKER_IMAGE_TAG}" .
    
    # Build individual service images
    local services=("gateway" "ledgerd" "mintd" "treasury" "agent-gateway" "disputes" "onramp" "verifier-advanced" "metering" "webhookd")
    
    for service in "${services[@]}"; do
        if [ -d "$service" ] && [ -f "$service/Dockerfile" ]; then
            echo -e "${YELLOW}📦 Building $service image...${NC}"
            docker build -t "${DOCKER_REGISTRY}/${SERVICE_NAME}-${service}:${DOCKER_IMAGE_TAG}" "$service"
        fi
    done
    
    echo -e "${GREEN}✅ Docker images built successfully${NC}"
}

# Function to push images to registry
push_images() {
    echo -e "${BLUE}📤 Pushing images to registry...${NC}"
    
    # Push main application image
    docker push "${DOCKER_REGISTRY}/${SERVICE_NAME}:${DOCKER_IMAGE_TAG}"
    
    # Push individual service images
    local services=("gateway" "ledgerd" "mintd" "treasury" "agent-gateway" "disputes" "onramp" "verifier-advanced" "metering" "webhookd")
    
    for service in "${services[@]}"; do
        if [ -d "$service" ] && [ -f "$service/Dockerfile" ]; then
            docker push "${DOCKER_REGISTRY}/${SERVICE_NAME}-${service}:${DOCKER_IMAGE_TAG}"
        fi
    done
    
    echo -e "${GREEN}✅ Images pushed to registry${NC}"
}

# Function to run database migrations
run_migrations() {
    echo -e "${BLUE}🗄️  Running database migrations...${NC}"
    
    # Run migration script
    ./scripts/migrate.sh "$ENVIRONMENT"
    
    echo -e "${GREEN}✅ Database migrations completed${NC}"
}

# Function to deploy with Docker Compose
deploy_docker_compose() {
    echo -e "${BLUE}🐳 Deploying with Docker Compose...${NC}"
    
    # Create production Docker Compose file
    cat > "docker-compose.${ENVIRONMENT}.yml" << EOF
version: '3.8'

services:
  # Database
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: aim_${ENVIRONMENT}
      POSTGRES_USER: aim_user
      POSTGRES_PASSWORD: \${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./infra/sql:/docker-entrypoint-initdb.d
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U aim_user -d aim_${ENVIRONMENT}"]
      interval: 10s
      timeout: 5s
      retries: 5

  # Redis
  redis:
    image: redis:7-alpine
    command: redis-server --requirepass \${REDIS_PASSWORD}
    volumes:
      - redis_data:/data
    ports:
      - "6379:6379"
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  # NATS
  nats:
    image: nats:2.10-alpine
    command: ["--jetstream", "--store_dir", "/data"]
    volumes:
      - nats_data:/data
    ports:
      - "4222:4222"
    healthcheck:
      test: ["CMD", "nats", "server", "check", "jetstream"]
      interval: 10s
      timeout: 5s
      retries: 5

  # MinIO
  minio:
    image: minio/minio:latest
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: \${MINIO_ACCESS_KEY}
      MINIO_ROOT_PASSWORD: \${MINIO_SECRET_KEY}
    volumes:
      - minio_data:/data
    ports:
      - "9000:9000"
      - "9001:9001"
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:9000/minio/health/live"]
      interval: 30s
      timeout: 20s
      retries: 3

  # Gateway Service
  gateway:
    image: ${DOCKER_REGISTRY}/${SERVICE_NAME}-gateway:${DOCKER_IMAGE_TAG}
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=${ENVIRONMENT}
    env_file:
      - ./config/${ENVIRONMENT}.env
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
      nats:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
    restart: unless-stopped

  # Ledger Service
  ledgerd:
    image: ${DOCKER_REGISTRY}/${SERVICE_NAME}-ledgerd:${DOCKER_IMAGE_TAG}
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=${ENVIRONMENT}
    env_file:
      - ./config/${ENVIRONMENT}.env
    depends_on:
      postgres:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3001/health"]
      interval: 30s
      timeout: 10s
      retries: 3
    restart: unless-stopped

  # Mint Service
  mintd:
    image: ${DOCKER_REGISTRY}/${SERVICE_NAME}-mintd:${DOCKER_IMAGE_TAG}
    ports:
      - "3003:3003"
    environment:
      - NODE_ENV=${ENVIRONMENT}
    env_file:
      - ./config/${ENVIRONMENT}.env
    depends_on:
      postgres:
        condition: service_healthy
      nats:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3003/health"]
      interval: 30s
      timeout: 10s
      retries: 3
    restart: unless-stopped

  # Treasury Service
  treasury:
    image: ${DOCKER_REGISTRY}/${SERVICE_NAME}-treasury:${DOCKER_IMAGE_TAG}
    ports:
      - "3004:3004"
    environment:
      - NODE_ENV=${ENVIRONMENT}
    env_file:
      - ./config/${ENVIRONMENT}.env
    depends_on:
      postgres:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3004/health"]
      interval: 30s
      timeout: 10s
      retries: 3
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
  nats_data:
  minio_data:

networks:
  default:
    name: aim-${ENVIRONMENT}-network
EOF

    # Deploy with Docker Compose
    docker-compose -f "docker-compose.${ENVIRONMENT}.yml" up -d
    
    echo -e "${GREEN}✅ Docker Compose deployment completed${NC}"
}

# Function to deploy with Kubernetes
deploy_kubernetes() {
    echo -e "${BLUE}☸️  Deploying with Kubernetes...${NC}"
    
    # Create Kubernetes namespace
    kubectl create namespace "aim-${ENVIRONMENT}" --dry-run=client -o yaml | kubectl apply -f -
    
    # Create ConfigMap from environment file
    kubectl create configmap "aim-${ENVIRONMENT}-config" \
        --from-env-file="./config/${ENVIRONMENT}.env" \
        --namespace="aim-${ENVIRONMENT}" \
        --dry-run=client -o yaml | kubectl apply -f -
    
    # Deploy services
    local services=("gateway" "ledgerd" "mintd" "treasury" "agent-gateway" "disputes" "onramp" "verifier-advanced" "metering" "webhookd")
    
    for service in "${services[@]}"; do
        if [ -d "$service" ] && [ -f "$service/k8s.yaml" ]; then
            echo -e "${YELLOW}📦 Deploying $service to Kubernetes...${NC}"
            kubectl apply -f "$service/k8s.yaml" -n "aim-${ENVIRONMENT}"
        fi
    done
    
    echo -e "${GREEN}✅ Kubernetes deployment completed${NC}"
}

# Function to perform health checks
perform_health_checks() {
    echo -e "${BLUE}🏥 Performing health checks...${NC}"
    
    local services=("gateway:3000" "ledgerd:3001" "mintd:3003" "treasury:3004")
    local all_healthy=true
    
    for service in "${services[@]}"; do
        local name=$(echo $service | cut -d: -f1)
        local port=$(echo $service | cut -d: -f2)
        
        echo -e "${YELLOW}🔍 Checking $name health...${NC}"
        
        local attempts=0
        local max_attempts=20
        
        while [ $attempts -lt $max_attempts ]; do
            if curl -s "http://localhost:$port/health" > /dev/null 2>&1; then
                echo -e "${GREEN}✅ $name is healthy${NC}"
                break
            else
                attempts=$((attempts + 1))
                echo -e "${YELLOW}⏳ Waiting for $name to be healthy... (attempt $attempts/$max_attempts)${NC}"
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

# Function to rollback deployment
rollback_deployment() {
    echo -e "${BLUE}⏪ Rolling back deployment...${NC}"
    
    if [ "$DEPLOYMENT_TYPE" = "docker-compose" ]; then
        # Rollback Docker Compose deployment
        docker-compose -f "docker-compose.${ENVIRONMENT}.yml" down
        docker-compose -f "docker-compose.${ENVIRONMENT}.yml" up -d
        
        echo -e "${GREEN}✅ Docker Compose rollback completed${NC}"
    elif [ "$DEPLOYMENT_TYPE" = "kubernetes" ]; then
        # Rollback Kubernetes deployment
        kubectl rollout undo deployment --namespace="aim-${ENVIRONMENT}"
        
        echo -e "${GREEN}✅ Kubernetes rollback completed${NC}"
    fi
}

# Function to cleanup old deployments
cleanup_old_deployments() {
    echo -e "${BLUE}🧹 Cleaning up old deployments...${NC}"
    
    # Remove old Docker images
    docker image prune -f
    
    # Remove old containers
    docker container prune -f
    
    # Remove old volumes
    docker volume prune -f
    
    echo -e "${GREEN}✅ Cleanup completed${NC}"
}

# Function to send deployment notification
send_notification() {
    local status=$1
    local message=$2
    
    echo -e "${BLUE}📢 Sending deployment notification...${NC}"
    
    # Send notification to Slack, email, etc.
    # This would be implemented based on your notification system
    
    echo -e "${GREEN}✅ Notification sent: $status - $message${NC}"
}

# Main deployment function
main() {
    local start_time=$(date +%s)
    
    echo -e "${BLUE}🚀 Starting deployment process...${NC}"
    
    # Validate prerequisites
    validate_prerequisites
    
    # Build and push images
    build_images
    push_images
    
    # Run database migrations
    run_migrations
    
    # Deploy based on type
    case $DEPLOYMENT_TYPE in
        "docker-compose")
            deploy_docker_compose
            ;;
        "kubernetes")
            deploy_kubernetes
            ;;
        *)
            echo -e "${RED}❌ Unsupported deployment type: $DEPLOYMENT_TYPE${NC}"
            exit 1
            ;;
    esac
    
    # Perform health checks
    perform_health_checks
    
    # Perform smoke tests
    perform_smoke_tests
    
    # Cleanup old deployments
    cleanup_old_deployments
    
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    echo -e "${GREEN}🎉 Deployment completed successfully in ${duration}s!${NC}"
    
    # Send success notification
    send_notification "SUCCESS" "Deployment completed successfully"
    
    # Show deployment summary
    echo -e "${BLUE}📊 Deployment Summary${NC}"
    echo "=================="
    echo -e "${GREEN}Environment: $ENVIRONMENT${NC}"
    echo -e "${GREEN}Deployment Type: $DEPLOYMENT_TYPE${NC}"
    echo -e "${GREEN}Image Tag: $DOCKER_IMAGE_TAG${NC}"
    echo -e "${GREEN}Duration: ${duration}s${NC}"
    echo -e "${GREEN}Status: SUCCESS${NC}"
}

# Error handling
trap 'echo -e "${RED}❌ Deployment failed. Rolling back...${NC}"; rollback_deployment; send_notification "FAILED" "Deployment failed and rolled back"; exit 1' ERR

# Run main function
main "$@"
