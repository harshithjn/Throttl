-- Throttl Database Setup
-- Complete schema for distributed rate limiting platform

-- Drop existing tables if they exist
DROP TABLE IF EXISTS audit_log CASCADE;
DROP TABLE IF EXISTS rate_limits CASCADE;
DROP TABLE IF EXISTS api_keys CASCADE;
DROP TABLE IF EXISTS clients CASCADE;

-- Create clients table for multi-tenancy
CREATE TABLE clients (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create API keys table with security features
CREATE TABLE api_keys (
    id SERIAL PRIMARY KEY,
    client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    key_hash VARCHAR(64) NOT NULL UNIQUE,
    key_prefix VARCHAR(8) NOT NULL,
    name VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_used_at TIMESTAMP,
    expires_at TIMESTAMP
);

-- Create rate limits table with algorithm support
CREATE TABLE rate_limits (
    id SERIAL PRIMARY KEY,
    client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    route_pattern VARCHAR(255) NOT NULL,
    algorithm VARCHAR(20) NOT NULL CHECK (algorithm IN ('token_bucket', 'sliding_window')),
    limit_value INTEGER NOT NULL CHECK (limit_value > 0),
    window_seconds INTEGER NOT NULL CHECK (window_seconds > 0),
    burst_capacity INTEGER,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(client_id, route_pattern)
);

-- Create audit log table
CREATE TABLE audit_log (
    id SERIAL PRIMARY KEY,
    client_id INTEGER REFERENCES clients(id),
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50) NOT NULL,
    resource_id VARCHAR(255),
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX idx_api_keys_hash ON api_keys(key_hash);
CREATE INDEX idx_api_keys_client ON api_keys(client_id);
CREATE INDEX idx_rate_limits_client ON rate_limits(client_id);
CREATE INDEX idx_rate_limits_active ON rate_limits(is_active);
CREATE INDEX idx_audit_log_client ON audit_log(client_id);
CREATE INDEX idx_audit_log_timestamp ON audit_log(timestamp);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_clients_updated_at 
    BEFORE UPDATE ON clients 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rate_limits_updated_at 
    BEFORE UPDATE ON rate_limits 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Insert default client
INSERT INTO clients (name, description) VALUES 
('default', 'Default client for testing and development');

-- Insert default rate limit configuration
INSERT INTO rate_limits (client_id, route_pattern, algorithm, limit_value, window_seconds, burst_capacity)
SELECT c.id, '*', 'token_bucket', 100, 60, 10
FROM clients c WHERE c.name = 'default';

-- Create view for active configurations
CREATE VIEW active_rate_limits AS
SELECT 
    rl.id,
    c.name as client_name,
    rl.route_pattern,
    rl.algorithm,
    rl.limit_value,
    rl.window_seconds,
    rl.burst_capacity
FROM rate_limits rl
JOIN clients c ON rl.client_id = c.id
WHERE rl.is_active = true;

-- Verify setup
SELECT 'Setup completed successfully' as status;
SELECT COUNT(*) as client_count FROM clients;
SELECT COUNT(*) as rate_limit_count FROM rate_limits;