package storage

import (
	"time"
)

// Algorithm types
const (
	AlgorithmTokenBucket   = "token_bucket"
	AlgorithmSlidingWindow = "sliding_window"
)

type RateLimitConfig struct {
	ID          int       `json:"id"`
	ClientID    string    `json:"client_id"`
	Route       string    `json:"route"`
	Algorithm   string    `json:"algorithm"`
	Limit       int       `json:"limit"`
	RefillRate  int       `json:"refill_rate"`
	Capacity    int       `json:"capacity"`
	WindowSize  int       `json:"window_size"` // For sliding window (in seconds)
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

func (ps *PostgresStore) GetRateLimitConfig(clientID, route string) (*RateLimitConfig, error) {
	row := ps.DB.QueryRow(`
        SELECT id, client_id, route, algorithm, limit_value, refill_rate, capacity, window_size, created_at, updated_at
        FROM rate_limits
        WHERE client_id=$1 AND route=$2
    `, clientID, route)

	var cfg RateLimitConfig

	err := row.Scan(
		&cfg.ID, &cfg.ClientID, &cfg.Route, &cfg.Algorithm,
		&cfg.Limit, &cfg.RefillRate, &cfg.Capacity, &cfg.WindowSize,
		&cfg.CreatedAt, &cfg.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}

	return &cfg, nil
}

// GetRateLimitConfigsByClient returns all rate limit configs for a client
func (ps *PostgresStore) GetRateLimitConfigsByClient(clientID string) ([]RateLimitConfig, error) {
	rows, err := ps.DB.Query(`
        SELECT id, client_id, route, algorithm, limit_value, refill_rate, capacity, window_size, created_at, updated_at
        FROM rate_limits
        WHERE client_id=$1
        ORDER BY route
    `, clientID)
	
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var configs []RateLimitConfig
	for rows.Next() {
		var cfg RateLimitConfig
		err := rows.Scan(
			&cfg.ID, &cfg.ClientID, &cfg.Route, &cfg.Algorithm,
			&cfg.Limit, &cfg.RefillRate, &cfg.Capacity, &cfg.WindowSize,
			&cfg.CreatedAt, &cfg.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}
		configs = append(configs, cfg)
	}

	return configs, nil
}

// GetAllRateLimitConfigs returns all rate limit configs (admin use)
func (ps *PostgresStore) GetAllRateLimitConfigs() ([]RateLimitConfig, error) {
	rows, err := ps.DB.Query(`
        SELECT id, client_id, route, algorithm, limit_value, refill_rate, capacity, window_size, created_at, updated_at
        FROM rate_limits
        ORDER BY client_id, route
    `)
	
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var configs []RateLimitConfig
	for rows.Next() {
		var cfg RateLimitConfig
		err := rows.Scan(
			&cfg.ID, &cfg.ClientID, &cfg.Route, &cfg.Algorithm,
			&cfg.Limit, &cfg.RefillRate, &cfg.Capacity, &cfg.WindowSize,
			&cfg.CreatedAt, &cfg.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}
		configs = append(configs, cfg)
	}

	return configs, nil
}
