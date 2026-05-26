package storage

import (
	"crypto/sha256"
	"encoding/hex"
	"log"
	"os"
	"time"
)

type APIKey struct {
	ID         int       `json:"id"`
	KeyHash    string    `json:"key_hash"`
	ClientID   string    `json:"client_id"`
	Name       string    `json:"name,omitempty"`
	KeyType    string    `json:"key_type"`
	CreatedAt  time.Time `json:"created_at"`
	ExpiresAt  time.Time `json:"expires_at,omitempty"`
	IsActive   bool      `json:"is_active"`
	LastUsedAt time.Time `json:"last_used_at,omitempty"`
}

// IsExpired checks if the API key has expired
func (a *APIKey) IsExpired() bool {
	if a.ExpiresAt.IsZero() {
		return false // No expiration set
	}
	return time.Now().After(a.ExpiresAt)
}

// IsValid checks if the API key is valid (active and not expired)
func (a *APIKey) IsValid() bool {
	return a.IsActive && !a.IsExpired()
}

func (ps *PostgresStore) ValidateAPIKey(key string) (*APIKey, error) {
	// Hash the provided key to match against stored hash
	keyHash := sha256.Sum256([]byte(key))
	hashedKey := hex.EncodeToString(keyHash[:])

	row := ps.DB.QueryRow(`
        SELECT id, key_hash, client_id, name, key_type, created_at, expires_at, is_active, last_used_at
        FROM api_keys
        WHERE key_hash = $1
    `, hashedKey)

	var a APIKey
	var expiresAt, lastUsedAt *time.Time

	err := row.Scan(&a.ID, &a.KeyHash, &a.ClientID, &a.Name, &a.KeyType, 
		&a.CreatedAt, &expiresAt, &a.IsActive, &lastUsedAt)
	if err != nil {
		return nil, err
	}

	if expiresAt != nil {
		a.ExpiresAt = *expiresAt
	}
	if lastUsedAt != nil {
		a.LastUsedAt = *lastUsedAt
	}

	// Check if key is valid
	if !a.IsValid() {
		return nil, ErrAPIKeyNotFound // Don't reveal that key exists but is invalid
	}

	// Update last used timestamp asynchronously
	go func() {
		ps.UpdateAPIKeyLastUsed(hashedKey)
	}()

	return &a, nil
}

// BootstrapMasterKey seeds a default master key if the database is currently empty of keys
func (ps *PostgresStore) BootstrapMasterKey() error {
	var count int
	err := ps.DB.QueryRow("SELECT COUNT(*) FROM api_keys").Scan(&count)
	if err != nil {
		return err
	}
	if count > 0 {
		return nil // Already bootstrapped
	}

	masterKey := os.Getenv("ADMIN_MASTER_KEY")
	if masterKey == "" {
		masterKey = "admin-master-key-123456"
	}

	// Get default client ID/name
	var defaultClientName string
	err = ps.DB.QueryRow("SELECT name FROM clients WHERE name = 'default'").Scan(&defaultClientName)
	if err != nil {
		// If default client doesn't exist, create it
		_, err = ps.DB.Exec("INSERT INTO clients (name, description) VALUES ('default', 'Default client')")
		if err != nil {
			return err
		}
		defaultClientName = "default"
	}

	hashedKey := HashAPIKey(masterKey)
	_, err = ps.DB.Exec(`
		INSERT INTO api_keys (client_id, key_hash, key_prefix, name, key_type, is_active, created_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
	`, defaultClientName, hashedKey, "admin-", "Master Admin Key", "admin", true, time.Now())
	if err != nil {
		return err
	}

	log.Printf("🔑 Successfully Bootstrapped Master Admin Key: %s", masterKey)
	return nil
}

