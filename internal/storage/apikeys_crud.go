package storage

import (
	"time"

	"github.com/google/uuid"
)

// Create a new API key for a client
func (ps *PostgresStore) CreateAPIKey(clientID string) (string, error) {
	key := uuid.NewString()

	_, err := ps.DB.Exec(`
        INSERT INTO api_keys (api_key, client_id, created_at)
        VALUES ($1, $2, $3)
    `, key, clientID, time.Now())

	if err != nil {
		return "", err
	}

	return key, nil
}

// List all keys for a client
func (ps *PostgresStore) ListAPIKeys(clientID string) ([]APIKey, error) {
	rows, err := ps.DB.Query(`
        SELECT api_key, client_id
        FROM api_keys
        WHERE client_id = $1
    `, clientID)

	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var keys []APIKey
	for rows.Next() {
		var a APIKey
		if err := rows.Scan(&a.APIKey, &a.ClientID); err != nil {
			return nil, err
		}
		keys = append(keys, a)
	}

	return keys, nil
}

// Delete an API key
func (ps *PostgresStore) DeleteAPIKey(key string) error {
	_, err := ps.DB.Exec(`
        DELETE FROM api_keys WHERE api_key = $1
    `, key)

	return err
}
