-- Initialize AIM Currency Database
-- This script sets up the database and runs migrations

-- Create database if it doesn't exist
SELECT 'CREATE DATABASE aim'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'aim')\gexec

-- Connect to the aim database
\c aim;

-- Run the main schema
\i schema.sql;

-- Create a user for the application
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'aim') THEN
        CREATE ROLE aim WITH LOGIN PASSWORD 'aim';
    END IF;
END
$$;

-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE aim TO aim;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO aim;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO aim;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO aim;

-- Set default privileges for future objects
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO aim;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO aim;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO aim;
