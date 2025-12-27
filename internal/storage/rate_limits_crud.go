package storage

import (
	"time"
)

type RateLimitConfigInput struct {
	ClientID   string `json:"client_id"`
	Route      string `json:"route"`
	Algorithm  string `json:"algorithm"`
	Limit      int    `json:"limit"`
	RefillRate int    `json:"refill_rate"`
	Capacity   int    `json:"capacity"`
	WindowSize int    `json:"window_size"`
}

// Validate validates the rate limit configuration
func (cfg *RateLimitConfigInput) Validate() error {
	if cfg.ClientID == "" {
		return ErrInvalidClientID
	}
	if cfg.Route == "" {
		return ErrInvalidRoute
	}
	if cfg.Algorithm != AlgorithmTokenBucket && cfg.Algorithm != AlgorithmSlidingWindow {
		return ErrInvalidAlgorithm
	}
	if cfg.Limit <= 0 {
		return ErrInvalidLimit
	}
	if cfg.Algorithm == AlgorithmTokenBucket {
		if cfg.RefillRate <= 0 || cfg.Capacity <= 0 {
			return ErrInvalidTokenBucketParams
		}
	}
	if cfg.Algorithm == AlgorithmSlidingWindow {
		if cfg.WindowSize <= 0 {
			return ErrInvalidWindowSize
		}
	}
	return nil
}

// Create or update a rate-limit rule
func (ps *PostgresStore) UpsertRateLimitConfig(cfg RateLimitConfigInput) error {
	if err := cfg.Validate(); err != nil {
		return err
	}

	now := time.Now()
	_, err := ps.DB.Exec(`
        INSERT INTO rate_limits (client_id, route, algorithm, limit_value, refill_rate, capacity, window_size, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT (client_id, route)
        DO UPDATE SET
            algorithm = EXCLUDED.algorithm,
            limit_value = EXCLUDED.limit_value,
            refill_rate = EXCLUDED.refill_rate,
            capacity = EXCLUDED.capacity,
            window_size = EXCLUDED.window_size,
            updated_at = EXCLUDED.updated_at
    `, cfg.ClientID, cfg.Route, cfg.Algorithm, cfg.Limit, cfg.RefillRate, cfg.Capacity, cfg.WindowSize, now, now)

	return err
}

// Delete a rate limit config
func (ps *PostgresStore) DeleteRateLimitConfig(clientID, route string) error {
	result, err := ps.DB.Exec(`
        DELETE FROM rate_limits
        WHERE client_id = $1 AND route = $2
    `, clientID, route)

	if err != nil {
		return err
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return err
	}

	if rowsAffected == 0 {
		return ErrConfigNotFound
	}

	return nil
}

// List all configs for a client
func (ps *PostgresStore) ListRateLimitConfigs(clientID string) ([]RateLimitConfig, error) {
	if clientID == "" {
		// Return all configs if no client specified (admin use)
		return ps.GetAllRateLimitConfigs()
	}

	return ps.GetRateLimitConfigsByClient(clientID)
}
