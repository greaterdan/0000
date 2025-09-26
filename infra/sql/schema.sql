-- AIM Currency Database Schema
-- PostgreSQL 16 with ACID compliance and append-only journal

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
CREATE TYPE account_kind AS ENUM ('human', 'agent', 'treasury');
CREATE TYPE account_status AS ENUM ('active', 'suspended', 'closed');
CREATE TYPE journal_type AS ENUM ('mint', 'transfer', 'adjust', 'demurrage');
CREATE TYPE job_status AS ENUM ('submitted', 'scored', 'minted', 'rejected');
CREATE TYPE agent_kind AS ENUM ('service', 'tool', 'model');
CREATE TYPE meter_mode AS ENUM ('per_call', 'per_second', 'per_token');
CREATE TYPE webhook_event AS ENUM ('mint_posted', 'transfer_posted', 'usage_closed', 'balance_low', 'checkpoint_published');

-- AI Service Types
CREATE TYPE model_type AS ENUM ('text', 'image', 'audio', 'video', 'multimodal');
CREATE TYPE architecture_type AS ENUM ('transformer', 'cnn', 'rnn', 'lstm', 'gru', 'gan', 'vae', 'diffusion');
CREATE TYPE data_type AS ENUM ('text', 'image', 'audio', 'video', 'tabular', 'multimodal');
CREATE TYPE request_type AS ENUM ('text', 'image', 'audio', 'video', 'multimodal');
CREATE TYPE training_status AS ENUM ('pending', 'running', 'completed', 'failed', 'cancelled');
CREATE TYPE inference_status AS ENUM ('pending', 'processing', 'completed', 'failed');
CREATE TYPE session_status AS ENUM ('active', 'paused', 'completed');

-- AI Data Marketplace Types
CREATE TYPE data_product_type AS ENUM ('text', 'image', 'audio', 'video', 'tabular', 'multimodal');
CREATE TYPE data_license AS ENUM ('commercial', 'research', 'open', 'custom');

-- AI Agent Registry Types
CREATE TYPE agent_type AS ENUM ('service', 'tool', 'model', 'assistant');
CREATE TYPE agent_status AS ENUM ('pending', 'verified', 'active', 'suspended', 'banned');
CREATE TYPE subscription_plan AS ENUM ('basic', 'premium', 'enterprise');

-- AI Content Generation Types
CREATE TYPE content_type AS ENUM ('text', 'image', 'audio', 'video', 'code');
CREATE TYPE content_category AS ENUM ('blog', 'social', 'marketing', 'educational', 'entertainment', 'technical', 'creative');

-- AI Model Validation Types
CREATE TYPE validation_type AS ENUM ('safety', 'performance', 'accuracy', 'bias', 'security', 'compliance', 'robustness');
CREATE TYPE validation_status AS ENUM ('pending', 'in_progress', 'completed', 'failed');

-- AI Model Deployment Types
CREATE TYPE deployment_type AS ENUM ('endpoint', 'service', 'batch', 'streaming');
CREATE TYPE deployment_environment AS ENUM ('development', 'staging', 'production');
CREATE TYPE deployment_status AS ENUM ('pending', 'deploying', 'active', 'suspended', 'failed');

-- Accounts table
CREATE TABLE accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    status account_status NOT NULL DEFAULT 'active',
    kind account_kind NOT NULL,
    display_name VARCHAR(255) NOT NULL,
    reputation_score NUMERIC(10,2) NOT NULL DEFAULT 0.0,
    tpm_attested BOOLEAN NOT NULL DEFAULT FALSE,
    
    CONSTRAINT accounts_display_name_not_empty CHECK (LENGTH(display_name) > 0),
    CONSTRAINT accounts_reputation_score_range CHECK (reputation_score >= 0.0 AND reputation_score <= 100.0)
);

-- Balances table
CREATE TABLE balances (
    account_id UUID PRIMARY KEY REFERENCES accounts(id) ON DELETE CASCADE,
    micro_amount NUMERIC(38,0) NOT NULL DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    CONSTRAINT balances_micro_amount_non_negative CHECK (micro_amount >= 0)
);

-- Journal table (append-only ledger)
CREATE TABLE journal (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ts TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    type journal_type NOT NULL,
    payload JSONB NOT NULL,
    prev_hash BYTEA NOT NULL,
    leaf_hash BYTEA NOT NULL,
    merkle_root BYTEA NOT NULL,
    sig_dilithium BYTEA NOT NULL,
    sig_sphincs BYTEA NOT NULL,
    signer_id VARCHAR(255) NOT NULL,
    
    CONSTRAINT journal_payload_not_empty CHECK (jsonb_typeof(payload) = 'object'),
    CONSTRAINT journal_hashes_not_empty CHECK (
        LENGTH(prev_hash) > 0 AND 
        LENGTH(leaf_hash) > 0 AND 
        LENGTH(merkle_root) > 0
    ),
    CONSTRAINT journal_signatures_not_empty CHECK (
        LENGTH(sig_dilithium) > 0 AND 
        LENGTH(sig_sphincs) > 0
    )
);

-- Jobs table
CREATE TABLE jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    submitter_account_id UUID NOT NULL REFERENCES accounts(id),
    spec JSONB NOT NULL,
    inputs_hash BYTEA NOT NULL,
    attestation JSONB,
    status job_status NOT NULL DEFAULT 'submitted',
    score REAL,
    verifier_report JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    CONSTRAINT jobs_spec_not_empty CHECK (jsonb_typeof(spec) = 'object'),
    CONSTRAINT jobs_inputs_hash_not_empty CHECK (LENGTH(inputs_hash) > 0),
    CONSTRAINT jobs_score_range CHECK (score IS NULL OR (score >= 0.0 AND score <= 1.0))
);

-- Policy table
CREATE TABLE policy (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key VARCHAR(255) UNIQUE NOT NULL,
    value JSONB NOT NULL,
    
    CONSTRAINT policy_key_not_empty CHECK (LENGTH(key) > 0),
    CONSTRAINT policy_value_not_empty CHECK (jsonb_typeof(value) = 'object')
);

-- Checkpoints table (transparency log)
CREATE TABLE checkpoints (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    merkle_root BYTEA NOT NULL,
    witness_sigs JSONB NOT NULL,
    object_store_uri VARCHAR(500) NOT NULL,
    published_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    CONSTRAINT checkpoints_period_valid CHECK (period_end > period_start),
    CONSTRAINT checkpoints_merkle_root_not_empty CHECK (LENGTH(merkle_root) > 0),
    CONSTRAINT checkpoints_witness_sigs_not_empty CHECK (jsonb_typeof(witness_sigs) = 'object'),
    CONSTRAINT checkpoints_object_store_uri_not_empty CHECK (LENGTH(object_store_uri) > 0)
);

-- Witnesses table
CREATE TABLE witnesses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) UNIQUE NOT NULL,
    pubkey_dilithium BYTEA NOT NULL,
    pubkey_sphincs BYTEA NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    
    CONSTRAINT witnesses_name_not_empty CHECK (LENGTH(name) > 0),
    CONSTRAINT witnesses_pubkeys_not_empty CHECK (
        LENGTH(pubkey_dilithium) > 0 AND 
        LENGTH(pubkey_sphincs) > 0
    )
);

-- Quotes table
CREATE TABLE quotes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ts TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    usd_bid NUMERIC(10,4) NOT NULL,
    usd_ask NUMERIC(10,4) NOT NULL,
    basket_quote JSONB NOT NULL,
    
    CONSTRAINT quotes_usd_bid_positive CHECK (usd_bid > 0),
    CONSTRAINT quotes_usd_ask_positive CHECK (usd_ask > 0),
    CONSTRAINT quotes_spread_valid CHECK (usd_ask >= usd_bid),
    CONSTRAINT quotes_basket_quote_not_empty CHECK (jsonb_typeof(basket_quote) = 'object')
);

-- Agents table
CREATE TABLE agents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) UNIQUE NOT NULL,
    kind agent_kind NOT NULL,
    description TEXT,
    capabilities TEXT[] DEFAULT '{}',
    client_id VARCHAR(255) UNIQUE NOT NULL,
    client_secret_hash VARCHAR(255) NOT NULL,
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    CONSTRAINT agents_name_not_empty CHECK (LENGTH(name) > 0),
    CONSTRAINT agents_client_id_not_empty CHECK (LENGTH(client_id) > 0)
);

-- Credit lines table
CREATE TABLE credit_lines (
    account_id UUID PRIMARY KEY REFERENCES accounts(id) ON DELETE CASCADE,
    micro_limit NUMERIC(38,0) NOT NULL DEFAULT 0,
    micro_used NUMERIC(38,0) NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    CONSTRAINT credit_lines_limit_non_negative CHECK (micro_limit >= 0),
    CONSTRAINT credit_lines_used_non_negative CHECK (micro_used >= 0),
    CONSTRAINT credit_lines_used_within_limit CHECK (micro_used <= micro_limit)
);

-- Reputation table
CREATE TABLE reputation (
    account_id UUID PRIMARY KEY REFERENCES accounts(id) ON DELETE CASCADE,
    score NUMERIC(5,2) NOT NULL DEFAULT 50.0,
    last_update TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    CONSTRAINT reputation_score_range CHECK (score >= 0.0 AND score <= 100.0)
);

-- Meters table
CREATE TABLE meters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    provider_account_id UUID NOT NULL REFERENCES accounts(id),
    resource VARCHAR(255) NOT NULL,
    mode meter_mode NOT NULL,
    unit VARCHAR(50) NOT NULL,
    price_micro_aim NUMERIC(38,0) NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    CONSTRAINT meters_resource_not_empty CHECK (LENGTH(resource) > 0),
    CONSTRAINT meters_unit_not_empty CHECK (LENGTH(unit) > 0),
    CONSTRAINT meters_price_positive CHECK (price_micro_aim > 0)
);

-- Usage sessions table
CREATE TABLE usage_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    meter_id UUID NOT NULL REFERENCES meters(id),
    payer_account_id UUID NOT NULL REFERENCES accounts(id),
    session_id VARCHAR(255) UNIQUE NOT NULL,
    units_consumed NUMERIC(38,0) NOT NULL DEFAULT 0,
    total_cost_micro_aim NUMERIC(38,0) NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    closed_at TIMESTAMP WITH TIME ZONE,
    
    CONSTRAINT usage_sessions_units_non_negative CHECK (units_consumed >= 0),
    CONSTRAINT usage_sessions_cost_non_negative CHECK (total_cost_micro_aim >= 0),
    CONSTRAINT usage_sessions_status_valid CHECK (status IN ('active', 'closed', 'cancelled'))
);

-- Capabilities table
CREATE TABLE capabilities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    provider_account_id UUID NOT NULL REFERENCES accounts(id),
    name VARCHAR(255) NOT NULL,
    endpoint VARCHAR(500) NOT NULL,
    description TEXT,
    pricing JSONB NOT NULL,
    sla JSONB,
    meters UUID[] DEFAULT '{}',
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    CONSTRAINT capabilities_name_not_empty CHECK (LENGTH(name) > 0),
    CONSTRAINT capabilities_endpoint_not_empty CHECK (LENGTH(endpoint) > 0),
    CONSTRAINT capabilities_pricing_not_empty CHECK (jsonb_typeof(pricing) = 'object')
);

-- Webhook endpoints table
CREATE TABLE webhook_endpoints (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    url VARCHAR(500) NOT NULL,
    secret VARCHAR(255) NOT NULL,
    events webhook_event[] NOT NULL DEFAULT '{}',
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    CONSTRAINT webhook_endpoints_url_not_empty CHECK (LENGTH(url) > 0),
    CONSTRAINT webhook_endpoints_secret_not_empty CHECK (LENGTH(secret) > 0)
);

-- Webhook deliveries table (for retry logic)
CREATE TABLE webhook_deliveries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    webhook_endpoint_id UUID NOT NULL REFERENCES webhook_endpoints(id) ON DELETE CASCADE,
    event_type webhook_event NOT NULL,
    payload JSONB NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    attempts INTEGER NOT NULL DEFAULT 0,
    last_attempt_at TIMESTAMP WITH TIME ZONE,
    next_retry_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    CONSTRAINT webhook_deliveries_payload_not_empty CHECK (jsonb_typeof(payload) = 'object'),
    CONSTRAINT webhook_deliveries_attempts_non_negative CHECK (attempts >= 0),
    CONSTRAINT webhook_deliveries_status_valid CHECK (status IN ('pending', 'delivered', 'failed', 'dead_letter'))
);

-- Indexes for performance
CREATE INDEX idx_journal_ts ON journal(ts);
CREATE INDEX idx_journal_type ON journal(type);
CREATE INDEX idx_journal_merkle_root ON journal(merkle_root);
CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_jobs_submitter ON jobs(submitter_account_id);
CREATE INDEX idx_jobs_created_at ON jobs(created_at);
CREATE INDEX idx_balances_account_id ON balances(account_id);
CREATE INDEX idx_checkpoints_period ON checkpoints(period_start, period_end);
CREATE INDEX idx_quotes_ts ON quotes(ts);
CREATE INDEX idx_agents_client_id ON agents(client_id);
CREATE INDEX idx_agents_account_id ON agents(account_id);
CREATE INDEX idx_agents_active ON agents(active);
CREATE INDEX idx_credit_lines_account_id ON credit_lines(account_id);
CREATE INDEX idx_reputation_account_id ON reputation(account_id);
CREATE INDEX idx_meters_provider ON meters(provider_account_id);
CREATE INDEX idx_meters_active ON meters(active);
CREATE INDEX idx_usage_sessions_meter_id ON usage_sessions(meter_id);
CREATE INDEX idx_usage_sessions_payer ON usage_sessions(payer_account_id);
CREATE INDEX idx_usage_sessions_status ON usage_sessions(status);
CREATE INDEX idx_capabilities_provider ON capabilities(provider_account_id);
CREATE INDEX idx_capabilities_active ON capabilities(active);
CREATE INDEX idx_webhook_endpoints_account_id ON webhook_endpoints(account_id);
CREATE INDEX idx_webhook_endpoints_active ON webhook_endpoints(active);
CREATE INDEX idx_webhook_deliveries_status ON webhook_deliveries(status);
CREATE INDEX idx_webhook_deliveries_next_retry ON webhook_deliveries(next_retry_at);

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_jobs_updated_at BEFORE UPDATE ON jobs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_balances_updated_at BEFORE UPDATE ON balances
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_agents_updated_at BEFORE UPDATE ON agents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_credit_lines_updated_at BEFORE UPDATE ON credit_lines
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default policy values
INSERT INTO policy (key, value) VALUES
('mint.threshold', '0.85'),
('mint.curve.base', '100000'),
('mint.curve.scale', '"linear"'),
('mint.max_per_hour', '1000000'),
('mint.max_per_day', '10000000'),
('demurrage.annual', '0.02'),
('demurrage.exempt_accounts', '["treasury", "witnesses"]'),
('demurrage.min_balance', '1000'),
('corridor.bid', '0.99'),
('corridor.ask', '1.01'),
('corridor.spread_max', '0.05'),
('witness.count', '3'),
('witness.required_signatures', '2'),
('witness.rotation_period', '30'),
('security.transfer_limit_per_account', '1000000'),
('security.api_rate_limit', '100'),
('security.session_timeout', '3600'),
('transparency.checkpoint_interval', '3600'),
('transparency.retention_days', '365'),
('transparency.proof_cache_size', '10000');

-- Insert production witnesses (keys should be generated securely)
-- TODO: Replace with real generated keys in production
INSERT INTO witnesses (name, pubkey_dilithium, pubkey_sphincs, active) VALUES
('wit1', decode('${WITNESS1_DILITHIUM_KEY}', 'hex'), decode('${WITNESS1_SPHINCS_KEY}', 'hex'), TRUE),
('wit2', decode('${WITNESS2_DILITHIUM_KEY}', 'hex'), decode('${WITNESS2_SPHINCS_KEY}', 'hex'), TRUE),
('wit3', decode('${WITNESS3_DILITHIUM_KEY}', 'hex'), decode('${WITNESS3_SPHINCS_KEY}', 'hex'), TRUE);

-- Insert treasury account
INSERT INTO accounts (id, kind, display_name, reputation_score, tpm_attested) VALUES
('00000000-0000-0000-0000-000000000001', 'treasury', 'AIM Treasury', 100.0, TRUE);

INSERT INTO balances (account_id, micro_amount) VALUES
('00000000-0000-0000-0000-000000000001', 100000000000000); -- 100M AIM

-- AI Model Marketplace Tables
CREATE TABLE ai_models (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    creator_id UUID NOT NULL REFERENCES accounts(id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    model_type model_type NOT NULL,
    model_size BIGINT NOT NULL, -- in bytes
    version VARCHAR(50) NOT NULL DEFAULT '1.0.0',
    cost_per_token DECIMAL(18,8) NOT NULL, -- AIM tokens per token
    total_earnings BIGINT NOT NULL DEFAULT 0, -- Total AIM earned
    usage_count INTEGER NOT NULL DEFAULT 0,
    rating DECIMAL(3,2), -- 0.00 to 5.00
    tags TEXT[] DEFAULT '{}',
    is_public BOOLEAN NOT NULL DEFAULT TRUE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    model_url VARCHAR(500),
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    CONSTRAINT ai_models_name_not_empty CHECK (LENGTH(name) > 0),
    CONSTRAINT ai_models_cost_per_token_positive CHECK (cost_per_token > 0),
    CONSTRAINT ai_models_rating_range CHECK (rating IS NULL OR (rating >= 0.00 AND rating <= 5.00))
);

-- AI Model Usage tracking
CREATE TABLE ai_model_usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES accounts(id),
    model_id UUID NOT NULL REFERENCES ai_models(id),
    tokens_used INTEGER NOT NULL,
    cost_aim BIGINT NOT NULL, -- AIM tokens spent
    input_size INTEGER NOT NULL DEFAULT 0,
    output_size INTEGER NOT NULL DEFAULT 0,
    duration INTEGER NOT NULL DEFAULT 0, -- milliseconds
    success BOOLEAN NOT NULL DEFAULT TRUE,
    error_message TEXT,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    CONSTRAINT ai_model_usage_tokens_positive CHECK (tokens_used >= 0),
    CONSTRAINT ai_model_usage_cost_non_negative CHECK (cost_aim >= 0)
);

-- AI Model Reviews
CREATE TABLE ai_model_reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES accounts(id),
    model_id UUID NOT NULL REFERENCES ai_models(id),
    rating DECIMAL(3,2) NOT NULL, -- 0.00 to 5.00
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    CONSTRAINT ai_model_reviews_rating_range CHECK (rating >= 0.00 AND rating <= 5.00),
    CONSTRAINT ai_model_reviews_unique_user_model UNIQUE(user_id, model_id)
);

-- AI Training Jobs
CREATE TABLE ai_training_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES accounts(id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    model_type model_type NOT NULL,
    architecture architecture_type NOT NULL,
    dataset_id UUID,
    dataset_url VARCHAR(500),
    hyperparameters JSONB NOT NULL,
    status training_status NOT NULL DEFAULT 'pending',
    progress DECIMAL(3,2) NOT NULL DEFAULT 0.0, -- 0.0 to 1.0
    cost_aim BIGINT NOT NULL, -- AIM tokens cost
    estimated_duration INTEGER, -- seconds
    actual_duration INTEGER, -- seconds
    gpu_hours DECIMAL(10,2),
    model_url VARCHAR(500), -- URL to trained model
    metrics JSONB, -- Training metrics (loss, accuracy, etc.)
    logs TEXT[] DEFAULT '{}',
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    
    CONSTRAINT ai_training_jobs_name_not_empty CHECK (LENGTH(name) > 0),
    CONSTRAINT ai_training_jobs_progress_range CHECK (progress >= 0.0 AND progress <= 1.0),
    CONSTRAINT ai_training_jobs_cost_positive CHECK (cost_aim >= 0)
);

-- AI Training Datasets
CREATE TABLE ai_training_datasets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES accounts(id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    data_type data_type NOT NULL,
    size BIGINT NOT NULL, -- bytes
    record_count INTEGER NOT NULL,
    cost_aim BIGINT NOT NULL, -- AIM tokens to use this dataset
    is_public BOOLEAN NOT NULL DEFAULT FALSE,
    download_url VARCHAR(500),
    metadata JSONB,
    usage_count INTEGER NOT NULL DEFAULT 0,
    rating DECIMAL(3,2), -- 0.00 to 5.00
    tags TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    CONSTRAINT ai_training_datasets_name_not_empty CHECK (LENGTH(name) > 0),
    CONSTRAINT ai_training_datasets_size_positive CHECK (size > 0),
    CONSTRAINT ai_training_datasets_record_count_positive CHECK (record_count > 0),
    CONSTRAINT ai_training_datasets_cost_non_negative CHECK (cost_aim >= 0),
    CONSTRAINT ai_training_datasets_rating_range CHECK (rating IS NULL OR (rating >= 0.00 AND rating <= 5.00))
);

-- AI Training Resources
CREATE TABLE ai_training_resources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL, -- gpu, cpu, tpu
    specifications JSONB NOT NULL,
    cost_per_hour_aim BIGINT NOT NULL, -- AIM tokens per hour
    is_available BOOLEAN NOT NULL DEFAULT TRUE,
    current_jobs INTEGER NOT NULL DEFAULT 0,
    max_jobs INTEGER NOT NULL DEFAULT 1,
    location VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    CONSTRAINT ai_training_resources_name_not_empty CHECK (LENGTH(name) > 0),
    CONSTRAINT ai_training_resources_cost_positive CHECK (cost_per_hour_aim > 0),
    CONSTRAINT ai_training_resources_current_jobs_non_negative CHECK (current_jobs >= 0),
    CONSTRAINT ai_training_resources_max_jobs_positive CHECK (max_jobs > 0)
);

-- AI Training Queue
CREATE TABLE ai_training_queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id UUID NOT NULL REFERENCES ai_training_jobs(id) ON DELETE CASCADE,
    priority INTEGER NOT NULL DEFAULT 0,
    estimated_start TIMESTAMP WITH TIME ZONE NOT NULL,
    resource_id UUID REFERENCES ai_training_resources(id),
    status VARCHAR(50) NOT NULL DEFAULT 'queued',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- AI Inference Sessions
CREATE TABLE ai_inference_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES accounts(id),
    model_id UUID NOT NULL,
    session_name VARCHAR(255),
    total_requests INTEGER NOT NULL DEFAULT 0,
    total_tokens INTEGER NOT NULL DEFAULT 0,
    total_cost_aim BIGINT NOT NULL DEFAULT 0,
    average_latency DECIMAL(10,2), -- milliseconds
    status session_status NOT NULL DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    last_used_at TIMESTAMP WITH TIME ZONE,
    
    CONSTRAINT ai_inference_sessions_total_requests_non_negative CHECK (total_requests >= 0),
    CONSTRAINT ai_inference_sessions_total_tokens_non_negative CHECK (total_tokens >= 0),
    CONSTRAINT ai_inference_sessions_total_cost_non_negative CHECK (total_cost_aim >= 0)
);

-- AI Inference Requests
CREATE TABLE ai_inference_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES ai_inference_sessions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES accounts(id),
    model_id UUID NOT NULL,
    request_type request_type NOT NULL,
    input JSONB NOT NULL,
    output JSONB,
    tokens_used INTEGER NOT NULL DEFAULT 0,
    cost_aim BIGINT NOT NULL DEFAULT 0,
    latency INTEGER NOT NULL DEFAULT 0, -- milliseconds
    status inference_status NOT NULL DEFAULT 'pending',
    error_message TEXT,
    retry_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    
    CONSTRAINT ai_inference_requests_tokens_non_negative CHECK (tokens_used >= 0),
    CONSTRAINT ai_inference_requests_cost_non_negative CHECK (cost_aim >= 0),
    CONSTRAINT ai_inference_requests_latency_non_negative CHECK (latency >= 0),
    CONSTRAINT ai_inference_requests_retry_count_non_negative CHECK (retry_count >= 0)
);

-- AI Model Endpoints
CREATE TABLE ai_model_endpoints (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    model_id UUID NOT NULL,
    endpoint_url VARCHAR(500) NOT NULL,
    endpoint_type VARCHAR(50) NOT NULL, -- http, websocket, grpc
    max_concurrency INTEGER NOT NULL DEFAULT 10,
    current_load INTEGER NOT NULL DEFAULT 0,
    average_latency DECIMAL(10,2),
    is_healthy BOOLEAN NOT NULL DEFAULT TRUE,
    last_health_check TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    CONSTRAINT ai_model_endpoints_max_concurrency_positive CHECK (max_concurrency > 0),
    CONSTRAINT ai_model_endpoints_current_load_non_negative CHECK (current_load >= 0)
);

-- AI Inference Performance Metrics
CREATE TABLE ai_inference_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    model_id UUID NOT NULL,
    date DATE NOT NULL,
    total_requests INTEGER NOT NULL DEFAULT 0,
    successful_requests INTEGER NOT NULL DEFAULT 0,
    failed_requests INTEGER NOT NULL DEFAULT 0,
    average_latency DECIMAL(10,2),
    total_tokens INTEGER NOT NULL DEFAULT 0,
    total_cost_aim BIGINT NOT NULL DEFAULT 0,
    peak_concurrency INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    CONSTRAINT ai_inference_metrics_total_requests_non_negative CHECK (total_requests >= 0),
    CONSTRAINT ai_inference_metrics_successful_requests_non_negative CHECK (successful_requests >= 0),
    CONSTRAINT ai_inference_metrics_failed_requests_non_negative CHECK (failed_requests >= 0),
    CONSTRAINT ai_inference_metrics_total_tokens_non_negative CHECK (total_tokens >= 0),
    CONSTRAINT ai_inference_metrics_total_cost_non_negative CHECK (total_cost_aim >= 0),
    CONSTRAINT ai_inference_metrics_peak_concurrency_non_negative CHECK (peak_concurrency >= 0),
    CONSTRAINT ai_inference_metrics_unique_model_date UNIQUE(model_id, date)
);

-- Create indexes for AI tables
CREATE INDEX idx_ai_models_creator_id ON ai_models(creator_id);
CREATE INDEX idx_ai_models_model_type ON ai_models(model_type);
CREATE INDEX idx_ai_models_is_public ON ai_models(is_public);
CREATE INDEX idx_ai_models_is_active ON ai_models(is_active);
CREATE INDEX idx_ai_models_rating ON ai_models(rating DESC);

CREATE INDEX idx_ai_model_usage_user_id ON ai_model_usage(user_id);
CREATE INDEX idx_ai_model_usage_model_id ON ai_model_usage(model_id);
CREATE INDEX idx_ai_model_usage_timestamp ON ai_model_usage(timestamp);

CREATE INDEX idx_ai_model_reviews_model_id ON ai_model_reviews(model_id);
CREATE INDEX idx_ai_model_reviews_rating ON ai_model_reviews(rating);

CREATE INDEX idx_ai_training_jobs_user_id ON ai_training_jobs(user_id);
CREATE INDEX idx_ai_training_jobs_status ON ai_training_jobs(status);
CREATE INDEX idx_ai_training_jobs_model_type ON ai_training_jobs(model_type);
CREATE INDEX idx_ai_training_jobs_created_at ON ai_training_jobs(created_at);

CREATE INDEX idx_ai_training_datasets_user_id ON ai_training_datasets(user_id);
CREATE INDEX idx_ai_training_datasets_data_type ON ai_training_datasets(data_type);
CREATE INDEX idx_ai_training_datasets_is_public ON ai_training_datasets(is_public);

CREATE INDEX idx_ai_training_queue_priority ON ai_training_queue(priority DESC);
CREATE INDEX idx_ai_training_queue_estimated_start ON ai_training_queue(estimated_start);
CREATE INDEX idx_ai_training_queue_status ON ai_training_queue(status);

CREATE INDEX idx_ai_inference_sessions_user_id ON ai_inference_sessions(user_id);
CREATE INDEX idx_ai_inference_sessions_model_id ON ai_inference_sessions(model_id);
CREATE INDEX idx_ai_inference_sessions_status ON ai_inference_sessions(status);

CREATE INDEX idx_ai_inference_requests_session_id ON ai_inference_requests(session_id);
CREATE INDEX idx_ai_inference_requests_user_id ON ai_inference_requests(user_id);
CREATE INDEX idx_ai_inference_requests_model_id ON ai_inference_requests(model_id);
CREATE INDEX idx_ai_inference_requests_status ON ai_inference_requests(status);
CREATE INDEX idx_ai_inference_requests_created_at ON ai_inference_requests(created_at);

CREATE INDEX idx_ai_model_endpoints_model_id ON ai_model_endpoints(model_id);
CREATE INDEX idx_ai_model_endpoints_is_healthy ON ai_model_endpoints(is_healthy);

CREATE INDEX idx_ai_inference_metrics_model_id ON ai_inference_metrics(model_id);
CREATE INDEX idx_ai_inference_metrics_date ON ai_inference_metrics(date);

-- AI Data Marketplace Tables
CREATE TABLE ai_data_products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    creator_id UUID NOT NULL REFERENCES accounts(id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    data_type data_product_type NOT NULL,
    category VARCHAR(100) NOT NULL,
    size BIGINT NOT NULL,
    record_count INTEGER NOT NULL,
    cost_aim BIGINT NOT NULL,
    is_public BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    download_url VARCHAR(500),
    preview_url VARCHAR(500),
    metadata JSONB,
    tags TEXT[] DEFAULT '{}',
    license data_license,
    usage_count INTEGER NOT NULL DEFAULT 0,
    rating DECIMAL(3,2),
    total_earnings BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    CONSTRAINT ai_data_products_name_not_empty CHECK (LENGTH(name) > 0),
    CONSTRAINT ai_data_products_cost_aim_positive CHECK (cost_aim > 0),
    CONSTRAINT ai_data_products_rating_range CHECK (rating IS NULL OR (rating >= 0.00 AND rating <= 5.00))
);

CREATE TABLE ai_data_purchases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    buyer_id UUID NOT NULL REFERENCES accounts(id),
    data_product_id UUID NOT NULL REFERENCES ai_data_products(id),
    cost_aim BIGINT NOT NULL,
    download_url VARCHAR(500),
    download_expiry TIMESTAMP WITH TIME ZONE,
    download_count INTEGER NOT NULL DEFAULT 0,
    max_downloads INTEGER NOT NULL DEFAULT 5,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    purchased_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE ai_data_reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES accounts(id),
    data_product_id UUID NOT NULL REFERENCES ai_data_products(id),
    rating DECIMAL(3,2) NOT NULL,
    comment TEXT,
    quality DECIMAL(3,2),
    completeness DECIMAL(3,2),
    accuracy DECIMAL(3,2),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    CONSTRAINT ai_data_reviews_unique_user_product UNIQUE(user_id, data_product_id),
    CONSTRAINT ai_data_reviews_rating_range CHECK (rating >= 0.00 AND rating <= 5.00)
);

-- AI Agent Registry Tables
CREATE TABLE ai_agents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID NOT NULL REFERENCES accounts(id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    agent_type agent_type NOT NULL,
    capabilities TEXT[] DEFAULT '{}',
    version VARCHAR(50) NOT NULL DEFAULT '1.0.0',
    status agent_status NOT NULL DEFAULT 'pending',
    registration_cost BIGINT NOT NULL,
    monthly_fee BIGINT NOT NULL,
    api_endpoint VARCHAR(500),
    documentation TEXT,
    pricing JSONB,
    reputation DECIMAL(3,2) NOT NULL DEFAULT 0.0,
    total_earnings BIGINT NOT NULL DEFAULT 0,
    usage_count INTEGER NOT NULL DEFAULT 0,
    is_public BOOLEAN NOT NULL DEFAULT TRUE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    tags TEXT[] DEFAULT '{}',
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    verified_at TIMESTAMP WITH TIME ZONE,
    
    CONSTRAINT ai_agents_name_not_empty CHECK (LENGTH(name) > 0),
    CONSTRAINT ai_agents_reputation_range CHECK (reputation >= 0.00 AND reputation <= 5.00)
);

CREATE TABLE ai_agent_interactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID NOT NULL REFERENCES ai_agents(id),
    user_id UUID NOT NULL REFERENCES accounts(id),
    interaction_type VARCHAR(50) NOT NULL,
    input JSONB,
    output JSONB,
    tokens_used INTEGER NOT NULL DEFAULT 0,
    cost_aim BIGINT NOT NULL DEFAULT 0,
    duration INTEGER NOT NULL DEFAULT 0,
    success BOOLEAN NOT NULL DEFAULT TRUE,
    error_message TEXT,
    satisfaction DECIMAL(3,2),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    CONSTRAINT ai_agent_interactions_satisfaction_range CHECK (satisfaction IS NULL OR (satisfaction >= 0.00 AND satisfaction <= 5.00))
);

-- AI Content Generation Tables
CREATE TABLE ai_content (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    creator_id UUID NOT NULL REFERENCES accounts(id),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    content_type content_type NOT NULL,
    category content_category NOT NULL,
    prompt TEXT NOT NULL,
    generated_content JSONB NOT NULL,
    metadata JSONB,
    cost_aim BIGINT NOT NULL,
    is_public BOOLEAN NOT NULL DEFAULT FALSE,
    is_for_sale BOOLEAN NOT NULL DEFAULT FALSE,
    sale_price BIGINT,
    download_url VARCHAR(500),
    preview_url VARCHAR(500),
    tags TEXT[] DEFAULT '{}',
    usage_count INTEGER NOT NULL DEFAULT 0,
    rating DECIMAL(3,2),
    total_earnings BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    CONSTRAINT ai_content_title_not_empty CHECK (LENGTH(title) > 0),
    CONSTRAINT ai_content_rating_range CHECK (rating IS NULL OR (rating >= 0.00 AND rating <= 5.00))
);

CREATE TABLE ai_content_generations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    content_id UUID NOT NULL REFERENCES ai_content(id),
    user_id UUID NOT NULL REFERENCES accounts(id),
    prompt TEXT NOT NULL,
    parameters JSONB NOT NULL,
    model VARCHAR(100) NOT NULL,
    tokens_used INTEGER NOT NULL,
    cost_aim BIGINT NOT NULL,
    duration INTEGER NOT NULL DEFAULT 0,
    success BOOLEAN NOT NULL DEFAULT TRUE,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- AI Model Validation Tables
CREATE TABLE ai_model_validations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    model_id UUID NOT NULL REFERENCES ai_models(id),
    validator_id UUID NOT NULL REFERENCES accounts(id),
    validation_type validation_type NOT NULL,
    status validation_status NOT NULL DEFAULT 'pending',
    test_suite JSONB NOT NULL,
    results JSONB,
    score DECIMAL(5,4),
    passed_tests INTEGER NOT NULL DEFAULT 0,
    total_tests INTEGER NOT NULL DEFAULT 0,
    cost_aim BIGINT NOT NULL,
    duration INTEGER NOT NULL DEFAULT 0,
    report_url VARCHAR(500),
    comments TEXT,
    is_public BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    
    CONSTRAINT ai_model_validations_score_range CHECK (score IS NULL OR (score >= 0.0000 AND score <= 1.0000))
);

CREATE TABLE ai_model_test_cases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    validation_id UUID NOT NULL REFERENCES ai_model_validations(id),
    test_name VARCHAR(255) NOT NULL,
    test_type VARCHAR(50) NOT NULL,
    input JSONB NOT NULL,
    expected_output JSONB,
    actual_output JSONB,
    passed BOOLEAN NOT NULL DEFAULT FALSE,
    score DECIMAL(5,4),
    error_message TEXT,
    duration INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    CONSTRAINT ai_model_test_cases_score_range CHECK (score IS NULL OR (score >= 0.0000 AND score <= 1.0000))
);

-- AI Model Deployment Tables
CREATE TABLE ai_model_deployments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    model_id UUID NOT NULL REFERENCES ai_models(id),
    deployer_id UUID NOT NULL REFERENCES accounts(id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    deployment_type deployment_type NOT NULL,
    environment deployment_environment NOT NULL DEFAULT 'production',
    status deployment_status NOT NULL DEFAULT 'pending',
    endpoint VARCHAR(500),
    version VARCHAR(50) NOT NULL DEFAULT '1.0.0',
    replicas INTEGER NOT NULL DEFAULT 1,
    resources JSONB,
    scaling JSONB,
    monitoring JSONB,
    cost_aim BIGINT NOT NULL,
    monthly_fee BIGINT NOT NULL,
    total_earnings BIGINT NOT NULL DEFAULT 0,
    usage_count INTEGER NOT NULL DEFAULT 0,
    is_public BOOLEAN NOT NULL DEFAULT TRUE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    deployed_at TIMESTAMP WITH TIME ZONE,
    
    CONSTRAINT ai_model_deployments_name_not_empty CHECK (LENGTH(name) > 0),
    CONSTRAINT ai_model_deployments_replicas_positive CHECK (replicas > 0)
);

CREATE TABLE ai_model_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    deployment_id UUID NOT NULL REFERENCES ai_model_deployments(id),
    user_id UUID NOT NULL REFERENCES accounts(id),
    request_type VARCHAR(50) NOT NULL,
    input JSONB NOT NULL,
    output JSONB,
    tokens_used INTEGER NOT NULL DEFAULT 0,
    cost_aim BIGINT NOT NULL DEFAULT 0,
    duration INTEGER NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    error_message TEXT,
    user_agent VARCHAR(500),
    ip_address INET,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE ai_model_deployment_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    deployment_id UUID NOT NULL REFERENCES ai_model_deployments(id),
    metric VARCHAR(100) NOT NULL,
    value DECIMAL(10,4) NOT NULL,
    unit VARCHAR(20) NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    metadata JSONB
);

-- Create indexes for new AI service tables
CREATE INDEX idx_ai_data_products_creator_id ON ai_data_products(creator_id);
CREATE INDEX idx_ai_data_products_data_type ON ai_data_products(data_type);
CREATE INDEX idx_ai_data_products_category ON ai_data_products(category);
CREATE INDEX idx_ai_data_products_is_public ON ai_data_products(is_public);
CREATE INDEX idx_ai_data_products_is_active ON ai_data_products(is_active);
CREATE INDEX idx_ai_data_products_rating ON ai_data_products(rating DESC);

CREATE INDEX idx_ai_data_purchases_buyer_id ON ai_data_purchases(buyer_id);
CREATE INDEX idx_ai_data_purchases_data_product_id ON ai_data_purchases(data_product_id);

CREATE INDEX idx_ai_data_reviews_data_product_id ON ai_data_reviews(data_product_id);
CREATE INDEX idx_ai_data_reviews_rating ON ai_data_reviews(rating);

CREATE INDEX idx_ai_agents_owner_id ON ai_agents(owner_id);
CREATE INDEX idx_ai_agents_agent_type ON ai_agents(agent_type);
CREATE INDEX idx_ai_agents_status ON ai_agents(status);
CREATE INDEX idx_ai_agents_reputation ON ai_agents(reputation DESC);

CREATE INDEX idx_ai_agent_interactions_agent_id ON ai_agent_interactions(agent_id);
CREATE INDEX idx_ai_agent_interactions_user_id ON ai_agent_interactions(user_id);

CREATE INDEX idx_ai_content_creator_id ON ai_content(creator_id);
CREATE INDEX idx_ai_content_content_type ON ai_content(content_type);
CREATE INDEX idx_ai_content_category ON ai_content(category);
CREATE INDEX idx_ai_content_is_public ON ai_content(is_public);
CREATE INDEX idx_ai_content_is_for_sale ON ai_content(is_for_sale);
CREATE INDEX idx_ai_content_rating ON ai_content(rating DESC);

CREATE INDEX idx_ai_model_validations_model_id ON ai_model_validations(model_id);
CREATE INDEX idx_ai_model_validations_validator_id ON ai_model_validations(validator_id);
CREATE INDEX idx_ai_model_validations_validation_type ON ai_model_validations(validation_type);
CREATE INDEX idx_ai_model_validations_status ON ai_model_validations(status);

CREATE INDEX idx_ai_model_deployments_model_id ON ai_model_deployments(model_id);
CREATE INDEX idx_ai_model_deployments_deployer_id ON ai_model_deployments(deployer_id);
CREATE INDEX idx_ai_model_deployments_deployment_type ON ai_model_deployments(deployment_type);
CREATE INDEX idx_ai_model_deployments_environment ON ai_model_deployments(environment);
CREATE INDEX idx_ai_model_deployments_status ON ai_model_deployments(status);

CREATE INDEX idx_ai_model_requests_deployment_id ON ai_model_requests(deployment_id);
CREATE INDEX idx_ai_model_requests_user_id ON ai_model_requests(user_id);
CREATE INDEX idx_ai_model_requests_status ON ai_model_requests(status);

CREATE INDEX idx_ai_model_deployment_metrics_deployment_id ON ai_model_deployment_metrics(deployment_id);
CREATE INDEX idx_ai_model_deployment_metrics_timestamp ON ai_model_deployment_metrics(timestamp);

-- Insert genesis journal entry
INSERT INTO journal (
    id,
    type,
    payload,
    prev_hash,
    leaf_hash,
    merkle_root,
    sig_dilithium,
    sig_sphincs,
    signer_id
) VALUES (
    '00000000-0000-0000-0000-000000000001',
    'mint',
    '{"reason": "genesis", "account_id": "00000000-0000-0000-0000-000000000001", "micro_amount": "100000000000000"}',
    '\x00',
    '\x0102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f20',
    '\x0102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f20',
    '\x0102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f20',
    '\x2122232425262728292a2b2c2d2e2f303132333435363738393a3b3c3d3e3f40',
    'genesis'
);
