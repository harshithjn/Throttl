package storage

import (
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"time"
)

// APIKeyType represents different types of API keys
type APIKeyType string

const (
	APIKeyTypeClient APIKeyType = "client"
	APIKeyTypeAdmin  APIKeyType = "admin"
)

// GenerateSecureAPIKey generates a cryptographically secure API key
func GenerateSecureAPIKey(keyType APIKeyType) (string, error) {
	// Generate 32 random bytes
	bytes := make([]byte, 32)
	if _, err := rand.Read(bytes); err != nil {
		return "", fmt.Errorf("failed to generate random bytes: %w", err)
	}

	// Convert to hex string
	randomHex := hex.EncodeToString(bytes)

	// Create key with prefix based on type
	var prefix string
	switch keyType {
	case APIKeyTypeAdmin:
		prefix = "admin-"
	case APIKeyTypeClient:
		prefix = "client-"
	default:
		prefix = "key-"
	}

	// Combine prefix with random hex and timestamp for uniqueness
	timestamp := time.Now().Unix()
	key := fmt.Sprintf("%s%d-%s", prefix, timestamp, randomHex[:24])

	return key, nil
}

// HashAPIKey creates a SHA-256 hash of the API key for secure storage
func HashAPIKey(key string) string {
	hash := sha256.Sum256([]byte(key))
	return hex.EncodeToString(hash[:])
}

// CreateAPIKey creates a new API key with enhanced security
func (ps *PostgresStore) CreateAPIKey(clientID, name string, keyType APIKeyType) (string, error) {
	// Generate secure API key
	key, err := GenerateSecureAPIKey(keyType)
	if err != nil {
		return "", fmt.Errorf("failed to generate API key: %w", err)
	}

	// Hash the key for storage (never store plain text keys)
	keyHash := HashAPIKey(key)

	// Insert into database
	_, err = ps.DB.Exec(`
        INSERT INTO api_keys (key_hash, client_id, name, key_type, created_at, is_active)
        VALUES ($1, $2, $3, $4, $5, $6)
    `, keyHash, clientID, name, string(keyType), time.Now(), true)

	if err != nil {
		return "", fmt.Errorf("failed to store API key: %w", err)
	}

	// Return the plain text key (only time it's available)
	return key, nil
}

// CreateAPIKeyWithExpiry creates an API key with expiration date
func (ps *PostgresStore) CreateAPIKeyWithExpiry(clientID, name string, keyType APIKeyType, expiresAt time.Time) (string, error) {
	key, err := GenerateSecureAPIKey(keyType)
	if err != nil {
		return "", fmt.Errorf("failed to generate API key: %w", err)
	}

	keyHash := HashAPIKey(key)

	_, err = ps.DB.Exec(`
        INSERT INTO api_keys (key_hash, client_id, name, key_type, created_at, expires_at, is_active)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, keyHash, clientID, name, string(keyType), time.Now(), expiresAt, true)

	if err != nil {
		return "", fmt.Errorf("failed to store API key: %w", err)
	}

	return key, nil
}

// RotateAPIKey creates a new key and deactivates the old one
func (ps *PostgresStore) RotateAPIKey(oldKeyHash string) (string, error) {
	// Get the old key details
	var clientID, name, keyType string
	err := ps.DB.QueryRow(`
        SELECT client_id, name, key_type
        FROM api_keys
        WHERE key_hash = $1 AND is_active = true
    `, oldKeyHash).Scan(&clientID, &name, &keyType)

	if err != nil {
		return "", fmt.Errorf("old key not found: %w", err)
	}

	// Create new key
	newKey, err := ps.CreateAPIKey(clientID, name+" (rotated)", APIKeyType(keyType))
	if err != nil {
		return "", fmt.Errorf("failed to create new key: %w", err)
	}

	// Deactivate old key
	_, err = ps.DB.Exec(`
        UPDATE api_keys 
        SET is_active = false, updated_at = $1
        WHERE key_hash = $2
    `, time.Now(), oldKeyHash)

	if err != nil {
		// If deactivation fails, we should clean up the new key
		ps.DeleteAPIKeyByHash(HashAPIKey(newKey))
		return "", fmt.Errorf("failed to deactivate old key: %w", err)
	}

	return newKey, nil
}

// RevokeAPIKey deactivates an API key
func (ps *PostgresStore) RevokeAPIKey(keyHash string) error {
	result, err := ps.DB.Exec(`
        UPDATE api_keys 
        SET is_active = false, updated_at = $1
        WHERE key_hash = $2
    `, time.Now(), keyHash)

	if err != nil {
		return fmt.Errorf("failed to revoke API key: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to check affected rows: %w", err)
	}

	if rowsAffected == 0 {
		return ErrAPIKeyNotFound
	}

	return nil
}

// DeleteAPIKeyByHash permanently deletes an API key by hash
func (ps *PostgresStore) DeleteAPIKeyByHash(keyHash string) error {
	result, err := ps.DB.Exec(`
        DELETE FROM api_keys WHERE key_hash = $1
    `, keyHash)

	if err != nil {
		return fmt.Errorf("failed to delete API key: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to check affected rows: %w", err)
	}

	if rowsAffected == 0 {
		return ErrAPIKeyNotFound
	}

	return nil
}

// List all keys for a client with enhanced filtering
func (ps *PostgresStore) ListAPIKeys(clientID string) ([]APIKey, error) {
	var query string
	var args []interface{}

	if clientID == "" {
		// Admin view - list all keys
		query = `
			SELECT id, key_hash, client_id, name, key_type, created_at, expires_at, is_active, last_used_at
			FROM api_keys
			ORDER BY created_at DESC
		`
	} else {
		// Client view - list keys for specific client
		query = `
			SELECT id, key_hash, client_id, name, key_type, created_at, expires_at, is_active, last_used_at
			FROM api_keys
			WHERE client_id = $1
			ORDER BY created_at DESC
		`
		args = append(args, clientID)
	}

	rows, err := ps.DB.Query(query, args...)
	if err != nil {
		return nil, fmt.Errorf("failed to query API keys: %w", err)
	}
	defer rows.Close()

	var keys []APIKey
	for rows.Next() {
		var a APIKey
		var expiresAt, lastUsedAt *time.Time

		err := rows.Scan(&a.ID, &a.KeyHash, &a.ClientID, &a.Name, &a.KeyType, 
			&a.CreatedAt, &expiresAt, &a.IsActive, &lastUsedAt)
		if err != nil {
			return nil, fmt.Errorf("failed to scan API key: %w", err)
		}

		if expiresAt != nil {
			a.ExpiresAt = *expiresAt
		}
		if lastUsedAt != nil {
			a.LastUsedAt = *lastUsedAt
		}

		keys = append(keys, a)
	}

	return keys, nil
}

// UpdateAPIKeyLastUsed updates the last used timestamp
func (ps *PostgresStore) UpdateAPIKeyLastUsed(keyHash string) error {
	_, err := ps.DB.Exec(`
        UPDATE api_keys 
        SET last_used_at = $1
        WHERE key_hash = $2 AND is_active = true
    `, time.Now(), keyHash)

	return err
}

// Delete an API key (backward compatibility)
func (ps *PostgresStore) DeleteAPIKey(key string) error {
	keyHash := HashAPIKey(key)
	return ps.DeleteAPIKeyByHash(keyHash)
}
