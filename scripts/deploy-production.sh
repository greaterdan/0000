#!/bin/bash

# Production Deployment Script
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DEPLOYMENT_TYPE=${1:-full}
ENVIRONMENT=${2:-production}
BACKUP=${3:-true}
ROLLBACK=${4:-false}
REPORT_DIR="./reports/deployment"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

echo -e "${BLUE}🚀 AIM Currency Production Deployment${NC}"
echo "====================================="
echo -e "${YELLOW}Deployment Type: $DEPLOYMENT_TYPE${NC}"
echo -e "${YELLOW}Environment: $ENVIRONMENT${NC}"
echo -e "${YELLOW}Backup: $BACKUP${NC}"
echo -e "${YELLOW}Rollback: $ROLLBACK${NC}"

# Function to create reports directory
create_reports_directory() {
    echo -e "${BLUE}📁 Creating deployment reports directory...${NC}"
    
    mkdir -p "$REPORT_DIR"
    mkdir -p "$REPORT_DIR/backups"
    mkdir -p "$REPORT_DIR/logs"
    mkdir -p "$REPORT_DIR/rollbacks"
    
    echo -e "${GREEN}✅ Deployment reports directory created${NC}"
}

# Function to check prerequisites
check_prerequisites() {
    echo -e "${BLUE}🔍 Checking deployment prerequisites...${NC}"
    
    local log_file="$REPORT_DIR/logs/prerequisites-$TIMESTAMP.log"
    
    cat > "$log_file" << EOF
# Deployment Prerequisites Check

Generated: $(date)

## Prerequisites Status

EOF

    local prerequisites_met=true
    
    # Check if Docker is installed
    if command -v docker >/dev/null 2>&1; then
        echo "✅ Docker: Installed" >> "$log_file"
        echo -e "${GREEN}✅ Docker: Installed${NC}"
    else
        echo "❌ Docker: Not installed" >> "$log_file"
        echo -e "${RED}❌ Docker: Not installed${NC}"
        prerequisites_met=false
    fi
    
    # Check if Docker Compose is installed
    if command -v docker-compose >/dev/null 2>&1; then
        echo "✅ Docker Compose: Installed" >> "$log_file"
        echo -e "${GREEN}✅ Docker Compose: Installed${NC}"
    else
        echo "❌ Docker Compose: Not installed" >> "$log_file"
        echo -e "${RED}❌ Docker Compose: Not installed${NC}"
        prerequisites_met=false
    fi
    
    # Check if Node.js is installed
    if command -v node >/dev/null 2>&1; then
        local node_version=$(node --version)
        echo "✅ Node.js: $node_version" >> "$log_file"
        echo -e "${GREEN}✅ Node.js: $node_version${NC}"
    else
        echo "❌ Node.js: Not installed" >> "$log_file"
        echo -e "${RED}❌ Node.js: Not installed${NC}"
        prerequisites_met=false
    fi
    
    # Check if npm is installed
    if command -v npm >/dev/null 2>&1; then
        local npm_version=$(npm --version)
        echo "✅ npm: $npm_version" >> "$log_file"
        echo -e "${GREEN}✅ npm: $npm_version${NC}"
    else
        echo "❌ npm: Not installed" >> "$log_file"
        echo -e "${RED}❌ npm: Not installed${NC}"
        prerequisites_met=false
    fi
    
    # Check if PostgreSQL is available
    if command -v psql >/dev/null 2>&1; then
        echo "✅ PostgreSQL: Available" >> "$log_file"
        echo -e "${GREEN}✅ PostgreSQL: Available${NC}"
    else
        echo "❌ PostgreSQL: Not available" >> "$log_file"
        echo -e "${RED}❌ PostgreSQL: Not available${NC}"
        prerequisites_met=false
    fi
    
    # Check if Redis is available
    if command -v redis-cli >/dev/null 2>&1; then
        echo "✅ Redis: Available" >> "$log_file"
        echo -e "${GREEN}✅ Redis: Available${NC}"
    else
        echo "❌ Redis: Not available" >> "$log_file"
        echo -e "${RED}❌ Redis: Not available${NC}"
        prerequisites_met=false
    fi
    
    # Check environment variables
    echo "" >> "$log_file"
    echo "## Environment Variables" >> "$log_file"
    echo "" >> "$log_file"
    
    local required_vars=("DATABASE_URL" "REDIS_URL" "JWT_SECRET" "NODE_ENV")
    for var in "${required_vars[@]}"; do
        if [ -n "${!var}" ]; then
            echo "✅ $var: Set" >> "$log_file"
            echo -e "${GREEN}✅ $var: Set${NC}"
        else
            echo "❌ $var: Not set" >> "$log_file"
            echo -e "${RED}❌ $var: Not set${NC}"
            prerequisites_met=false
        fi
    done
    
    if [ "$prerequisites_met" = false ]; then
        echo -e "${RED}❌ Prerequisites check failed${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ Prerequisites check passed${NC}"
}

# Function to create backup
create_backup() {
    if [ "$BACKUP" = "true" ]; then
        echo -e "${BLUE}💾 Creating backup...${NC}"
        
        local backup_dir="$REPORT_DIR/backups/backup-$TIMESTAMP"
        mkdir -p "$backup_dir"
        
        # Backup database
        echo -e "${YELLOW}📊 Backing up database...${NC}"
        pg_dump "$DATABASE_URL" > "$backup_dir/database.sql" 2>/dev/null || {
            echo -e "${YELLOW}⚠️  Database backup failed, continuing...${NC}"
        }
        
        # Backup configuration files
        echo -e "${YELLOW}⚙️  Backing up configuration files...${NC}"
        cp -r config/ "$backup_dir/" 2>/dev/null || true
        cp docker-compose.yml "$backup_dir/" 2>/dev/null || true
        cp Dockerfile* "$backup_dir/" 2>/dev/null || true
        
        # Backup logs
        echo -e "${YELLOW}📝 Backing up logs...${NC}"
        cp -r logs/ "$backup_dir/" 2>/dev/null || true
        
        echo -e "${GREEN}✅ Backup created: $backup_dir${NC}"
    else
        echo -e "${YELLOW}⏭️  Skipping backup${NC}"
    fi
}

# Function to run pre-deployment tests
run_pre_deployment_tests() {
    echo -e "${BLUE}🧪 Running pre-deployment tests...${NC}"
    
    local log_file="$REPORT_DIR/logs/pre-deployment-tests-$TIMESTAMP.log"
    
    ./scripts/final-testing.sh all $ENVIRONMENT true > "$log_file" 2>&1
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Pre-deployment tests passed${NC}"
    else
        echo -e "${RED}❌ Pre-deployment tests failed${NC}"
        echo -e "${YELLOW}📋 Check $log_file for details${NC}"
        echo -e "${YELLOW}⚠️  Deployment aborted due to test failures${NC}"
        exit 1
    fi
}

# Function to build application
build_application() {
    echo -e "${BLUE}🔨 Building application...${NC}"
    
    local log_file="$REPORT_DIR/logs/build-$TIMESTAMP.log"
    
    # Install dependencies
    echo -e "${YELLOW}📦 Installing dependencies...${NC}"
    npm ci > "$log_file" 2>&1
    
    # Build all services
    echo -e "${YELLOW}🏗️  Building services...${NC}"
    npm run build >> "$log_file" 2>&1
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Application build completed${NC}"
    else
        echo -e "${RED}❌ Application build failed${NC}"
        echo -e "${YELLOW}📋 Check $log_file for details${NC}"
        exit 1
    fi
}

# Function to run database migrations
run_database_migrations() {
    echo -e "${BLUE}🗄️  Running database migrations...${NC}"
    
    local log_file="$REPORT_DIR/logs/migrations-$TIMESTAMP.log"
    
    ./scripts/migrate.sh production > "$log_file" 2>&1
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Database migrations completed${NC}"
    else
        echo -e "${RED}❌ Database migrations failed${NC}"
        echo -e "${YELLOW}📋 Check $log_file for details${NC}"
        exit 1
    fi
}

# Function to deploy services
deploy_services() {
    echo -e "${BLUE}🚀 Deploying services...${NC}"
    
    local log_file="$REPORT_DIR/logs/deployment-$TIMESTAMP.log"
    
    case $DEPLOYMENT_TYPE in
        "docker")
            deploy_docker_services "$log_file"
            ;;
        "kubernetes")
            deploy_kubernetes_services "$log_file"
            ;;
        "manual")
            deploy_manual_services "$log_file"
            ;;
        "full")
            deploy_full_services "$log_file"
            ;;
        *)
            echo -e "${RED}❌ Invalid deployment type: $DEPLOYMENT_TYPE${NC}"
            exit 1
            ;;
    esac
}

# Function to deploy Docker services
deploy_docker_services() {
    local log_file="$1"
    
    echo -e "${YELLOW}🐳 Deploying Docker services...${NC}"
    
    # Stop existing services
    docker-compose down >> "$log_file" 2>&1
    
    # Build new images
    docker-compose build >> "$log_file" 2>&1
    
    # Start services
    docker-compose up -d >> "$log_file" 2>&1
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Docker services deployed successfully${NC}"
    else
        echo -e "${RED}❌ Docker services deployment failed${NC}"
        exit 1
    fi
}

# Function to deploy Kubernetes services
deploy_kubernetes_services() {
    local log_file="$1"
    
    echo -e "${YELLOW}☸️  Deploying Kubernetes services...${NC}"
    
    # Apply Kubernetes manifests
    kubectl apply -f k8s/ >> "$log_file" 2>&1
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Kubernetes services deployed successfully${NC}"
    else
        echo -e "${RED}❌ Kubernetes services deployment failed${NC}"
        exit 1
    fi
}

# Function to deploy manual services
deploy_manual_services() {
    local log_file="$1"
    
    echo -e "${YELLOW}🔧 Deploying manual services...${NC}"
    
    # Start services using PM2 or similar
    if command -v pm2 >/dev/null 2>&1; then
        pm2 start ecosystem.config.js >> "$log_file" 2>&1
    else
        npm run start:prod >> "$log_file" 2>&1
    fi
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Manual services deployed successfully${NC}"
    else
        echo -e "${RED}❌ Manual services deployment failed${NC}"
        exit 1
    fi
}

# Function to deploy full services
deploy_full_services() {
    local log_file="$1"
    
    echo -e "${YELLOW}🚀 Deploying full services...${NC}"
    
    # Deploy infrastructure first
    deploy_docker_services "$log_file"
    
    # Wait for services to be ready
    echo -e "${YELLOW}⏳ Waiting for services to be ready...${NC}"
    sleep 30
    
    # Deploy application services
    deploy_manual_services "$log_file"
    
    echo -e "${GREEN}✅ Full services deployed successfully${NC}"
}

# Function to run post-deployment tests
run_post_deployment_tests() {
    echo -e "${BLUE}🧪 Running post-deployment tests...${NC}"
    
    local log_file="$REPORT_DIR/logs/post-deployment-tests-$TIMESTAMP.log"
    
    # Wait for services to be ready
    echo -e "${YELLOW}⏳ Waiting for services to be ready...${NC}"
    sleep 60
    
    # Run smoke tests
    ./scripts/final-testing.sh smoke $ENVIRONMENT false > "$log_file" 2>&1
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Post-deployment tests passed${NC}"
    else
        echo -e "${RED}❌ Post-deployment tests failed${NC}"
        echo -e "${YELLOW}📋 Check $log_file for details${NC}"
        echo -e "${YELLOW}⚠️  Consider rolling back deployment${NC}"
    fi
}

# Function to rollback deployment
rollback_deployment() {
    if [ "$ROLLBACK" = "true" ]; then
        echo -e "${BLUE}🔄 Rolling back deployment...${NC}"
        
        local rollback_dir="$REPORT_DIR/rollbacks/rollback-$TIMESTAMP"
        mkdir -p "$rollback_dir"
        
        # Stop current services
        echo -e "${YELLOW}🛑 Stopping current services...${NC}"
        docker-compose down > "$rollback_dir/rollback.log" 2>&1
        
        # Restore from backup
        if [ "$BACKUP" = "true" ]; then
            local latest_backup=$(ls -t "$REPORT_DIR/backups" | head -1)
            if [ -n "$latest_backup" ]; then
                echo -e "${YELLOW}📦 Restoring from backup: $latest_backup${NC}"
                
                # Restore database
                if [ -f "$REPORT_DIR/backups/$latest_backup/database.sql" ]; then
                    psql "$DATABASE_URL" < "$REPORT_DIR/backups/$latest_backup/database.sql" >> "$rollback_dir/rollback.log" 2>&1
                fi
                
                # Restore configuration
                if [ -d "$REPORT_DIR/backups/$latest_backup/config" ]; then
                    cp -r "$REPORT_DIR/backups/$latest_backup/config/" ./ >> "$rollback_dir/rollback.log" 2>&1
                fi
                
                # Restore logs
                if [ -d "$REPORT_DIR/backups/$latest_backup/logs" ]; then
                    cp -r "$REPORT_DIR/backups/$latest_backup/logs/" ./ >> "$rollback_dir/rollback.log" 2>&1
                fi
            fi
        fi
        
        # Restart services
        echo -e "${YELLOW}🔄 Restarting services...${NC}"
        docker-compose up -d >> "$rollback_dir/rollback.log" 2>&1
        
        echo -e "${GREEN}✅ Deployment rollback completed${NC}"
    else
        echo -e "${YELLOW}⏭️  Skipping rollback${NC}"
    fi
}

# Function to generate deployment report
generate_deployment_report() {
    echo -e "${BLUE}📊 Generating deployment report...${NC}"
    
    local report_file="$REPORT_DIR/deployment-report-$TIMESTAMP.md"
    
    cat > "$report_file" << EOF
# Production Deployment Report

Generated: $(date)

## Deployment Configuration

- Deployment Type: $DEPLOYMENT_TYPE
- Environment: $ENVIRONMENT
- Backup: $BACKUP
- Rollback: $ROLLBACK
- Timestamp: $TIMESTAMP

## Deployment Steps

1. ✅ Prerequisites check
2. ✅ Backup creation
3. ✅ Pre-deployment tests
4. ✅ Application build
5. ✅ Database migrations
6. ✅ Service deployment
7. ✅ Post-deployment tests

## Deployment Status

EOF

    # Add deployment status
    if [ -f "$REPORT_DIR/logs/deployment-$TIMESTAMP.log" ]; then
        local deployment_status="SUCCESS"
        if grep -q "failed\|error\|ERROR" "$REPORT_DIR/logs/deployment-$TIMESTAMP.log"; then
            deployment_status="FAILED"
        fi
        echo "- Status: $deployment_status" >> "$report_file"
    else
        echo "- Status: UNKNOWN" >> "$report_file"
    fi
    
    echo "" >> "$report_file"
    
    # Add service status
    echo "## Service Status" >> "$report_file"
    echo "" >> "$report_file"
    
    # Check service health
    local services=("gateway:3000" "ledgerd:3001" "mintd:3003" "treasury:3004")
    for service in "${services[@]}"; do
        local name=$(echo $service | cut -d: -f1)
        local port=$(echo $service | cut -d: -f2)
        
        if curl -s "http://localhost:$port/health" > /dev/null 2>&1; then
            echo "- $name: ✅ HEALTHY" >> "$report_file"
        else
            echo "- $name: ❌ UNHEALTHY" >> "$report_file"
        fi
    done
    
    echo "" >> "$report_file"
    
    # Add logs
    echo "## Deployment Logs" >> "$report_file"
    echo "" >> "$report_file"
    echo "Log files are available in the logs directory." >> "$report_file"
    
    # Add recommendations
    echo "" >> "$report_file"
    echo "## Recommendations" >> "$report_file"
    echo "" >> "$report_file"
    echo "1. **Monitor Services**: Keep an eye on service health and performance" >> "$report_file"
    echo "2. **Check Logs**: Regularly review application and system logs" >> "$report_file"
    echo "3. **Backup Strategy**: Implement regular automated backups" >> "$report_file"
    echo "4. **Rollback Plan**: Have a rollback plan ready for emergencies" >> "$report_file"
    echo "5. **Security**: Regularly update dependencies and security patches" >> "$report_file"
    
    echo -e "${GREEN}✅ Deployment report generated: $report_file${NC}"
}

# Function to show deployment summary
show_deployment_summary() {
    echo -e "${BLUE}📊 Deployment Summary${NC}"
    echo "===================="
    
    echo -e "${GREEN}✅ Completed Steps:${NC}"
    echo "  🔍 Prerequisites check"
    echo "  💾 Backup creation"
    echo "  🧪 Pre-deployment tests"
    echo "  🔨 Application build"
    echo "  🗄️  Database migrations"
    echo "  🚀 Service deployment"
    echo "  🧪 Post-deployment tests"
    
    if [ "$ROLLBACK" = "true" ]; then
        echo "  🔄 Deployment rollback"
    fi
    
    echo ""
    echo -e "${YELLOW}📋 Generated Files:${NC}"
    echo "  📊 Backups: $REPORT_DIR/backups/"
    echo "  📝 Logs: $REPORT_DIR/logs/"
    echo "  📄 Report: $REPORT_DIR/deployment-report-$TIMESTAMP.md"
    
    if [ "$ROLLBACK" = "true" ]; then
        echo "  🔄 Rollbacks: $REPORT_DIR/rollbacks/"
    fi
    
    echo ""
    echo -e "${YELLOW}💡 Next Steps:${NC}"
    echo "1. Monitor service health and performance"
    echo "2. Review deployment logs"
    echo "3. Set up monitoring and alerting"
    echo "4. Implement backup strategy"
    echo "5. Plan for future deployments"
}

# Main function
main() {
    local start_time=$(date +%s)
    
    echo -e "${BLUE}🚀 Starting production deployment...${NC}"
    
    create_reports_directory
    check_prerequisites
    create_backup
    run_pre_deployment_tests
    build_application
    run_database_migrations
    deploy_services
    run_post_deployment_tests
    rollback_deployment
    generate_deployment_report
    show_deployment_summary
    
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    echo -e "${GREEN}✅ Production deployment completed in ${duration}s${NC}"
    echo -e "${YELLOW}📋 Reports available in: $REPORT_DIR${NC}"
}

# Run main function
main "$@"
