package storage

type RateLimitConfigInput struct {
	ClientID   string
	Route      string
	Limit      int
	RefillRate int
	Capacity   int
}

// Create or update a rate-limit rule
func (ps *PostgresStore) UpsertRateLimitConfig(cfg RateLimitConfigInput) error {
	_, err := ps.DB.Exec(`
        INSERT INTO rate_limits (client_id, route, limit_value, refill_rate, capacity)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (client_id, route)
        DO UPDATE SET
            limit_value = EXCLUDED.limit_value,
            refill_rate = EXCLUDED.refill_rate,
            capacity = EXCLUDED.capacity
    `, cfg.ClientID, cfg.Route, cfg.Limit, cfg.RefillRate, cfg.Capacity)

	return err
}

// Delete a rate limit config
func (ps *PostgresStore) DeleteRateLimitConfig(clientID, route string) error {
	_, err := ps.DB.Exec(`
        DELETE FROM rate_limits
        WHERE client_id = $1 AND route = $2
    `, clientID, route)

	return err
}

// List all configs for a client
func (ps *PostgresStore) ListRateLimitConfigs(clientID string) ([]RateLimitConfig, error) {
	rows, err := ps.DB.Query(`
        SELECT client_id, route, limit_value, refill_rate, capacity
        FROM rate_limits
        WHERE client_id = $1
    `, clientID)

	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var configs []RateLimitConfig
	for rows.Next() {
		var cfg RateLimitConfig
		if err := rows.Scan(&cfg.ClientID, &cfg.Route, &cfg.Limit, &cfg.RefillRate, &cfg.Capacity); err != nil {
			return nil, err
		}
		configs = append(configs, cfg)
	}

	return configs, nil
}
