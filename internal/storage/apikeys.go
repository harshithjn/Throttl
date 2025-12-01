package storage

type APIKey struct {
	APIKey   string
	ClientID string
}

func (ps *PostgresStore) ValidateAPIKey(key string) (*APIKey, error) {
	row := ps.DB.QueryRow(`
        SELECT api_key, client_id
        FROM api_keys
        WHERE api_key = $1
    `, key)

	var a APIKey
	err := row.Scan(&a.APIKey, &a.ClientID)
	if err != nil {
		return nil, err
	}

	return &a, nil
}
