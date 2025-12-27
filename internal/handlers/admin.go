package handlers

import (
	"encoding/json"
	"log"
	"net/http"
	"time"

	"github.com/harshithjn/Throttl/internal/middleware"
	"github.com/harshithjn/Throttl/internal/storage"
)

type CreateKeyRequest struct {
	ClientID  string `json:"client_id"`
	Name      string `json:"name,omitempty"`
	KeyType   string `json:"key_type,omitempty"` // "client" or "admin"
	ExpiresIn int    `json:"expires_in,omitempty"` // Hours until expiration
}

type CreateKeyResponse struct {
	APIKey    string    `json:"api_key"`
	ClientID  string    `json:"client_id"`
	Name      string    `json:"name,omitempty"`
	KeyType   string    `json:"key_type"`
	ExpiresAt time.Time `json:"expires_at,omitempty"`
	Warning   string    `json:"warning,omitempty"`
}

type RotateKeyRequest struct {
	KeyHash string `json:"key_hash"`
}

type RotateKeyResponse struct {
	NewAPIKey string `json:"new_api_key"`
	OldKeyHash string `json:"old_key_hash"`
	Warning   string `json:"warning"`
}

func CreateAPIKeyHandler(store *storage.PostgresStore) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
			return
		}

		// Get authenticated client info
		authClientID, _ := r.Context().Value(middleware.ClientIDKey).(string)
		isAdmin, _ := r.Context().Value(middleware.IsAdminKey).(bool)

		var req CreateKeyRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			log.Printf("Invalid JSON in create key request: %v", err)
			http.Error(w, "invalid JSON body", http.StatusBadRequest)
			return
		}

		// Validate required fields
		if req.ClientID == "" {
			http.Error(w, "client_id is required", http.StatusBadRequest)
			return
		}

		// Multi-tenancy: Non-admin users can only create keys for themselves
		if !isAdmin && req.ClientID != authClientID {
			log.Printf("Authorization failed: client %s attempted to create key for %s", authClientID, req.ClientID)
			http.Error(w, "can only create keys for your own client", http.StatusForbidden)
			return
		}

		// Default key type
		keyType := storage.APIKeyTypeClient
		if req.KeyType == "admin" {
			// Only admins can create admin keys
			if !isAdmin {
				log.Printf("Authorization failed: non-admin client %s attempted to create admin key", authClientID)
				http.Error(w, "only admins can create admin keys", http.StatusForbidden)
				return
			}
			keyType = storage.APIKeyTypeAdmin
		}

		// Create key with or without expiration
		var key string
		var err error
		var expiresAt time.Time

		if req.ExpiresIn > 0 {
			expiresAt = time.Now().Add(time.Duration(req.ExpiresIn) * time.Hour)
			key, err = store.CreateAPIKeyWithExpiry(req.ClientID, req.Name, keyType, expiresAt)
		} else {
			key, err = store.CreateAPIKey(req.ClientID, req.Name, keyType)
		}

		if err != nil {
			log.Printf("Failed to create API key for client %s: %v", req.ClientID, err)
			http.Error(w, "could not create key", http.StatusInternalServerError)
			return
		}

		log.Printf("Created API key: client=%s, type=%s, admin=%v", req.ClientID, keyType, isAdmin)

		w.Header().Set("Content-Type", "application/json")
		response := CreateKeyResponse{
			APIKey:   key,
			ClientID: req.ClientID,
			Name:     req.Name,
			KeyType:  string(keyType),
			Warning:  "Store this key securely. It will not be shown again.",
		}

		if !expiresAt.IsZero() {
			response.ExpiresAt = expiresAt
		}

		json.NewEncoder(w).Encode(response)
	}
}

func ListAPIKeysHandler(store *storage.PostgresStore) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet {
			http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
			return
		}

		// Get authenticated client info
		authClientID, _ := r.Context().Value(middleware.ClientIDKey).(string)
		isAdmin, _ := r.Context().Value(middleware.IsAdminKey).(bool)

		requestedClientID := r.URL.Query().Get("client_id")

		// Multi-tenancy: Non-admin users can only list their own keys
		if !isAdmin {
			if requestedClientID != "" && requestedClientID != authClientID {
				log.Printf("Authorization failed: client %s attempted to list keys for %s", authClientID, requestedClientID)
				http.Error(w, "can only list your own keys", http.StatusForbidden)
				return
			}
			requestedClientID = authClientID // Force to own client
		}

		keys, err := store.ListAPIKeys(requestedClientID)
		if err != nil {
			log.Printf("Failed to list API keys for client %s: %v", requestedClientID, err)
			http.Error(w, "could not fetch keys", http.StatusInternalServerError)
			return
		}

		// Filter sensitive information for non-admin users
		if !isAdmin {
			for i := range keys {
				// Mask the key hash for security
				if len(keys[i].KeyHash) > 8 {
					keys[i].KeyHash = keys[i].KeyHash[:8] + "..."
				}
			}
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{
			"keys":      keys,
			"client_id": requestedClientID,
			"count":     len(keys),
			"is_admin":  isAdmin,
		})
	}
}

func RotateAPIKeyHandler(store *storage.PostgresStore) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
			return
		}

		// Get authenticated client info
		authClientID, _ := r.Context().Value(middleware.ClientIDKey).(string)
		isAdmin, _ := r.Context().Value(middleware.IsAdminKey).(bool)

		var req RotateKeyRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			log.Printf("Invalid JSON in rotate key request: %v", err)
			http.Error(w, "invalid JSON body", http.StatusBadRequest)
			return
		}

		if req.KeyHash == "" {
			http.Error(w, "key_hash is required", http.StatusBadRequest)
			return
		}

		// Multi-tenancy: Verify ownership of the key being rotated
		if !isAdmin {
			// Get key details to verify ownership
			keys, err := store.ListAPIKeys(authClientID)
			if err != nil {
				http.Error(w, "could not verify key ownership", http.StatusInternalServerError)
				return
			}

			keyFound := false
			for _, key := range keys {
				if key.KeyHash == req.KeyHash {
					keyFound = true
					break
				}
			}

			if !keyFound {
				log.Printf("Authorization failed: client %s attempted to rotate unowned key %s", authClientID, req.KeyHash)
				http.Error(w, "can only rotate your own keys", http.StatusForbidden)
				return
			}
		}

		newKey, err := store.RotateAPIKey(req.KeyHash)
		if err != nil {
			if err == storage.ErrAPIKeyNotFound {
				http.Error(w, "API key not found", http.StatusNotFound)
				return
			}
			log.Printf("Failed to rotate API key %s: %v", req.KeyHash, err)
			http.Error(w, "could not rotate key", http.StatusInternalServerError)
			return
		}

		log.Printf("Rotated API key: old=%s, client=%s, admin=%v", req.KeyHash, authClientID, isAdmin)

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(RotateKeyResponse{
			NewAPIKey:  newKey,
			OldKeyHash: req.KeyHash,
			Warning:    "Old key has been deactivated. Update your applications with the new key.",
		})
	}
}

func RevokeAPIKeyHandler(store *storage.PostgresStore) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
			return
		}

		// Get authenticated client info
		authClientID, _ := r.Context().Value(middleware.ClientIDKey).(string)
		isAdmin, _ := r.Context().Value(middleware.IsAdminKey).(bool)

		keyHash := r.URL.Query().Get("key_hash")
		if keyHash == "" {
			http.Error(w, "key_hash parameter is required", http.StatusBadRequest)
			return
		}

		// Multi-tenancy: Verify ownership of the key being revoked
		if !isAdmin {
			keys, err := store.ListAPIKeys(authClientID)
			if err != nil {
				http.Error(w, "could not verify key ownership", http.StatusInternalServerError)
				return
			}

			keyFound := false
			for _, key := range keys {
				if key.KeyHash == keyHash {
					keyFound = true
					break
				}
			}

			if !keyFound {
				log.Printf("Authorization failed: client %s attempted to revoke unowned key %s", authClientID, keyHash)
				http.Error(w, "can only revoke your own keys", http.StatusForbidden)
				return
			}
		}

		err := store.RevokeAPIKey(keyHash)
		if err != nil {
			if err == storage.ErrAPIKeyNotFound {
				http.Error(w, "API key not found", http.StatusNotFound)
				return
			}
			log.Printf("Failed to revoke API key %s: %v", keyHash, err)
			http.Error(w, "could not revoke key", http.StatusInternalServerError)
			return
		}

		log.Printf("Revoked API key: key=%s, client=%s, admin=%v", keyHash, authClientID, isAdmin)

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]string{
			"revoked":  keyHash,
			"status":   "success",
			"message":  "API key has been revoked and is no longer valid",
		})
	}
}

func DeleteAPIKeyHandler(store *storage.PostgresStore) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodDelete {
			http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
			return
		}

		// Get authenticated client info
		authClientID, _ := r.Context().Value(middleware.ClientIDKey).(string)
		isAdmin, _ := r.Context().Value(middleware.IsAdminKey).(bool)

		keyHash := r.URL.Query().Get("key_hash")
		if keyHash == "" {
			http.Error(w, "key_hash parameter is required", http.StatusBadRequest)
			return
		}

		// Multi-tenancy: Verify ownership of the key being deleted
		if !isAdmin {
			keys, err := store.ListAPIKeys(authClientID)
			if err != nil {
				http.Error(w, "could not verify key ownership", http.StatusInternalServerError)
				return
			}

			keyFound := false
			for _, key := range keys {
				if key.KeyHash == keyHash {
					keyFound = true
					break
				}
			}

			if !keyFound {
				log.Printf("Authorization failed: client %s attempted to delete unowned key %s", authClientID, keyHash)
				http.Error(w, "can only delete your own keys", http.StatusForbidden)
				return
			}
		}

		err := store.DeleteAPIKeyByHash(keyHash)
		if err != nil {
			if err == storage.ErrAPIKeyNotFound {
				http.Error(w, "API key not found", http.StatusNotFound)
				return
			}
			log.Printf("Failed to delete API key %s: %v", keyHash, err)
			http.Error(w, "could not delete key", http.StatusInternalServerError)
			return
		}

		log.Printf("Deleted API key: key=%s, client=%s, admin=%v", keyHash, authClientID, isAdmin)

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]string{
			"deleted": keyHash,
			"status":  "success",
		})
	}
}
