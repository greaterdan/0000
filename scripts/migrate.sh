#!/bin/bash

# AIM Currency Database Migration Script
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT=${1:-production}
MIGRATION_DIR="./migrations"
BACKUP_DIR="./backups"
LOG_DIR="./logs"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

echo -e "${BLUE}🗄️  AIM Currency Database Migration${NC}"
echo "====================================="
echo -e "${YELLOW}Environment: $ENVIRONMENT${NC}"
echo -e "${YELLOW}Timestamp: $TIMESTAMP${NC}"

# Function to load environment configuration
load_environment() {
    local env_file="./config/${ENVIRONMENT}.env"
    
    if [ ! -f "$env_file" ]; then
        echo -e "${RED}❌ Environment file not found: $env_file${NC}"
        exit 1
    fi
    
    echo -e "${BLUE}📋 Loading environment configuration...${NC}"
    source "$env_file"
    
    # Validate required environment variables
    if [ -z "$POSTGRES_URL" ]; then
        echo -e "${RED}❌ POSTGRES_URL not configured${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ Environment configuration loaded${NC}"
}

# Function to create backup
create_backup() {
    echo -e "${BLUE}💾 Creating database backup...${NC}"
    
    local backup_file="$BACKUP_DIR/backup_${ENVIRONMENT}_${TIMESTAMP}.sql"
    mkdir -p "$BACKUP_DIR"
    
    # Create backup using pg_dump
    if pg_dump "$POSTGRES_URL" > "$backup_file"; then
        echo -e "${GREEN}✅ Database backup created: $backup_file${NC}"
        
        # Compress backup
        gzip "$backup_file"
        echo -e "${GREEN}✅ Backup compressed: ${backup_file}.gz${NC}"
        
        # Keep only last 10 backups
        ls -t "$BACKUP_DIR"/backup_${ENVIRONMENT}_*.sql.gz | tail -n +11 | xargs -r rm
        echo -e "${GREEN}✅ Old backups cleaned up${NC}"
    else
        echo -e "${RED}❌ Database backup failed${NC}"
        exit 1
    fi
}

# Function to check database connectivity
check_database() {
    echo -e "${BLUE}🔍 Checking database connectivity...${NC}"
    
    if psql "$POSTGRES_URL" -c "SELECT 1;" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Database connection successful${NC}"
    else
        echo -e "${RED}❌ Database connection failed${NC}"
        exit 1
    fi
}

# Function to run Prisma migrations
run_prisma_migrations() {
    echo -e "${BLUE}🔄 Running Prisma migrations...${NC}"
    
    local services=("ledgerd" "treasury" "agent-gateway" "disputes" "onramp")
    
    for service in "${services[@]}"; do
        if [ -d "$service" ] && [ -f "$service/prisma/schema.prisma" ]; then
            echo -e "${YELLOW}📦 Migrating $service...${NC}"
            cd "$service"
            
            # Generate Prisma client
            npx prisma generate
            
            # Run migrations
            if npx prisma migrate deploy; then
                echo -e "${GREEN}✅ $service migrated successfully${NC}"
            else
                echo -e "${RED}❌ $service migration failed${NC}"
                cd ..
                exit 1
            fi
            
            cd ..
        else
            echo -e "${YELLOW}⚠️  $service not found or no Prisma schema${NC}"
        fi
    done
}

# Function to run custom migrations
run_custom_migrations() {
    echo -e "${BLUE}🔄 Running custom migrations...${NC}"
    
    if [ ! -d "$MIGRATION_DIR" ]; then
        echo -e "${YELLOW}⚠️  No custom migrations directory found${NC}"
        return 0
    fi
    
    # Create migrations table if it doesn't exist
    psql "$POSTGRES_URL" -c "
        CREATE TABLE IF NOT EXISTS migrations (
            id SERIAL PRIMARY KEY,
            filename VARCHAR(255) NOT NULL UNIQUE,
            executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            checksum VARCHAR(64)
        );
    " > /dev/null
    
    # Get list of migration files
    local migration_files=($(ls "$MIGRATION_DIR"/*.sql 2>/dev/null || true))
    
    if [ ${#migration_files[@]} -eq 0 ]; then
        echo -e "${YELLOW}⚠️  No custom migration files found${NC}"
        return 0
    fi
    
    # Execute each migration
    for migration_file in "${migration_files[@]}"; do
        local filename=$(basename "$migration_file")
        
        # Check if migration already executed
        if psql "$POSTGRES_URL" -t -c "SELECT COUNT(*) FROM migrations WHERE filename = '$filename';" | grep -q "1"; then
            echo -e "${YELLOW}⏭️  Skipping already executed migration: $filename${NC}"
            continue
        fi
        
        echo -e "${YELLOW}📦 Executing migration: $filename${NC}"
        
        # Calculate checksum
        local checksum=$(sha256sum "$migration_file" | cut -d' ' -f1)
        
        # Execute migration
        if psql "$POSTGRES_URL" -f "$migration_file"; then
            # Record migration
            psql "$POSTGRES_URL" -c "INSERT INTO migrations (filename, checksum) VALUES ('$filename', '$checksum');" > /dev/null
            echo -e "${GREEN}✅ Migration executed: $filename${NC}"
        else
            echo -e "${RED}❌ Migration failed: $filename${NC}"
            exit 1
        fi
    done
}

# Function to run data migrations
run_data_migrations() {
    echo -e "${BLUE}🔄 Running data migrations...${NC}"
    
    local data_migration_dir="$MIGRATION_DIR/data"
    
    if [ ! -d "$data_migration_dir" ]; then
        echo -e "${YELLOW}⚠️  No data migrations directory found${NC}"
        return 0
    fi
    
    # Get list of data migration files
    local data_migration_files=($(ls "$data_migration_dir"/*.sql 2>/dev/null || true))
    
    if [ ${#data_migration_files[@]} -eq 0 ]; then
        echo -e "${YELLOW}⚠️  No data migration files found${NC}"
        return 0
    fi
    
    # Execute each data migration
    for migration_file in "${data_migration_files[@]}"; do
        local filename=$(basename "$migration_file")
        
        echo -e "${YELLOW}📦 Executing data migration: $filename${NC}"
        
        if psql "$POSTGRES_URL" -f "$migration_file"; then
            echo -e "${GREEN}✅ Data migration executed: $filename${NC}"
        else
            echo -e "${RED}❌ Data migration failed: $filename${NC}"
            exit 1
        fi
    done
}

# Function to verify migration
verify_migration() {
    echo -e "${BLUE}🔍 Verifying migration...${NC}"
    
    # Check if all required tables exist
    local required_tables=("accounts" "balances" "journal" "jobs" "policy" "checkpoints" "witnesses")
    
    for table in "${required_tables[@]}"; do
        if psql "$POSTGRES_URL" -c "SELECT 1 FROM $table LIMIT 1;" > /dev/null 2>&1; then
            echo -e "${GREEN}✅ Table $table exists${NC}"
        else
            echo -e "${RED}❌ Table $table missing${NC}"
            exit 1
        fi
    done
    
    # Check migration status
    local migration_count=$(psql "$POSTGRES_URL" -t -c "SELECT COUNT(*) FROM migrations;" 2>/dev/null | tr -d ' ' || echo "0")
    echo -e "${GREEN}✅ Migrations executed: $migration_count${NC}"
    
    echo -e "${GREEN}✅ Migration verification completed${NC}"
}

# Function to rollback migration
rollback_migration() {
    echo -e "${BLUE}⏪ Rolling back migration...${NC}"
    
    local rollback_file="$BACKUP_DIR/backup_${ENVIRONMENT}_${TIMESTAMP}.sql.gz"
    
    if [ ! -f "$rollback_file" ]; then
        echo -e "${RED}❌ Rollback file not found: $rollback_file${NC}"
        exit 1
    fi
    
    echo -e "${YELLOW}⚠️  This will restore the database from backup. Continue? (y/N)${NC}"
    read -r response
    
    if [[ "$response" =~ ^[Yy]$ ]]; then
        echo -e "${BLUE}🔄 Restoring database from backup...${NC}"
        
        # Drop and recreate database
        psql "$POSTGRES_URL" -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;" > /dev/null
        
        # Restore from backup
        gunzip -c "$rollback_file" | psql "$POSTGRES_URL"
        
        echo -e "${GREEN}✅ Database rollback completed${NC}"
    else
        echo -e "${YELLOW}⏭️  Rollback cancelled${NC}"
    fi
}

# Function to show migration status
show_migration_status() {
    echo -e "${BLUE}📊 Migration Status${NC}"
    echo "=================="
    
    # Show database version
    local db_version=$(psql "$POSTGRES_URL" -t -c "SELECT version();" 2>/dev/null | head -1)
    echo -e "${GREEN}Database Version: $db_version${NC}"
    
    # Show migration history
    echo -e "${BLUE}Migration History:${NC}"
    psql "$POSTGRES_URL" -c "SELECT filename, executed_at FROM migrations ORDER BY executed_at DESC LIMIT 10;" 2>/dev/null || echo "No migrations found"
    
    # Show table counts
    echo -e "${BLUE}Table Counts:${NC}"
    local tables=("accounts" "balances" "journal" "jobs" "policy" "checkpoints" "witnesses")
    
    for table in "${tables[@]}"; do
        local count=$(psql "$POSTGRES_URL" -t -c "SELECT COUNT(*) FROM $table;" 2>/dev/null | tr -d ' ' || echo "0")
        echo -e "${GREEN}$table: $count records${NC}"
    done
}

# Function to create migration template
create_migration_template() {
    local migration_name=$1
    
    if [ -z "$migration_name" ]; then
        echo -e "${RED}❌ Migration name required${NC}"
        echo "Usage: $0 create <migration_name>"
        exit 1
    fi
    
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local filename="${timestamp}_${migration_name}.sql"
    local filepath="$MIGRATION_DIR/$filename"
    
    mkdir -p "$MIGRATION_DIR"
    
    cat > "$filepath" << EOF
-- Migration: $migration_name
-- Created: $(date)
-- Description: [Add description here]

BEGIN;

-- Add your migration SQL here
-- Example:
-- CREATE TABLE example_table (
--     id SERIAL PRIMARY KEY,
--     name VARCHAR(255) NOT NULL,
--     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
-- );

-- Add indexes if needed
-- CREATE INDEX idx_example_table_name ON example_table(name);

COMMIT;
EOF
    
    echo -e "${GREEN}✅ Migration template created: $filepath${NC}"
}

# Main function
main() {
    local command=${1:-migrate}
    
    case $command in
        "migrate")
            load_environment
            check_database
            create_backup
            run_prisma_migrations
            run_custom_migrations
            run_data_migrations
            verify_migration
            echo -e "${GREEN}🎉 Migration completed successfully!${NC}"
            ;;
        "rollback")
            load_environment
            rollback_migration
            ;;
        "status")
            load_environment
            show_migration_status
            ;;
        "create")
            create_migration_template "$2"
            ;;
        "backup")
            load_environment
            create_backup
            ;;
        "verify")
            load_environment
            verify_migration
            ;;
        *)
            echo -e "${YELLOW}Usage: $0 {migrate|rollback|status|create|backup|verify} [environment]${NC}"
            echo ""
            echo "Commands:"
            echo "  migrate   - Run all migrations (default)"
            echo "  rollback  - Rollback to previous backup"
            echo "  status    - Show migration status"
            echo "  create    - Create new migration template"
            echo "  backup    - Create database backup only"
            echo "  verify    - Verify migration integrity"
            echo ""
            echo "Environment: production (default), staging, development"
            exit 1
            ;;
    esac
}

# Run main function
main "$@"