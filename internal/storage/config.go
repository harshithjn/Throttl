package storage

type RateLimitConfig struct {
	ClientID   string
	Route      string
	Limit      int
	RefillRate int
	Capacity   int
}

func (ps *PostgresStore) GetRateLimitConfig(clientID, route string) (*RateLimitConfig, error) {
	row := ps.DB.QueryRow(`
        SELECT client_id, route, limit_value, refill_rate, capacity
        FROM rate_limits
        WHERE client_id=$1 AND route=$2
    `, clientID, route)

	var cfg RateLimitConfig

	err := row.Scan(&cfg.ClientID, &cfg.Route, &cfg.Limit, &cfg.RefillRate, &cfg.Capacity)
	if err != nil {
		return nil, err
	}

	return &cfg, nil
}
