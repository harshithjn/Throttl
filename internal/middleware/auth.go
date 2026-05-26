package middleware

import (
	"context"
	"crypto/subtle"
	"log"
	"net/http"
	"strings"
	"time"

	"github.com/harshithjn/Throttl/internal/metrics"
	"github.com/harshithjn/Throttl/internal/storage"
)

// ContextKey type for context keys to avoid collisions
type ContextKey string

const (
	// Context keys for request data
	ClientIDKey ContextKey = "client_id"
	APIKeyKey   ContextKey = "api_key"
	IsAdminKey  ContextKey = "is_admin"
)

// AuthConfig holds authentication configuration
type AuthConfig struct {
	AdminKeyPrefix string
	RequireHTTPS   bool
	MaxKeyAge      time.Duration
}

// DefaultAuthConfig returns default authentication configuration
func DefaultAuthConfig() *AuthConfig {
	return &AuthConfig{
		AdminKeyPrefix: "admin-",
		RequireHTTPS:   false, // Set to true in production
		MaxKeyAge:      365 * 24 * time.Hour, // 1 year
	}
}

// APIKeyAuth creates an authentication middleware with enhanced security
func APIKeyAuth(store *storage.PostgresStore) func(http.Handler) http.Handler {
	return APIKeyAuthWithConfig(store, DefaultAuthConfig())
}

// APIKeyAuthWithConfig creates authentication middleware with custom configuration
func APIKeyAuthWithConfig(store *storage.PostgresStore, config *AuthConfig) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			// Security headers
			w.Header().Set("X-Content-Type-Options", "nosniff")
			w.Header().Set("X-Frame-Options", "DENY")
			w.Header().Set("X-XSS-Protection", "1; mode=block")

			// HTTPS enforcement (if configured)
			if config.RequireHTTPS && r.Header.Get("X-Forwarded-Proto") != "https" && r.TLS == nil {
				metrics.RecordAuthFailure("https_required")
				http.Error(w, "HTTPS required", http.StatusUpgradeRequired)
				return
			}

			// Extract API key from multiple possible locations
			apiKey := extractAPIKey(r)
			if apiKey == "" {
				log.Printf("Authentication failed: missing API key from %s", r.RemoteAddr)
				metrics.RecordAuthFailure("missing_key")
				http.Error(w, "missing API key", http.StatusUnauthorized)
				return
			}

			// Validate API key
			keyData, err := store.ValidateAPIKey(apiKey)
			if err != nil {
				log.Printf("Authentication failed: invalid API key from %s: %v", r.RemoteAddr, err)
				metrics.RecordAuthFailure("invalid_key")
				http.Error(w, "invalid API key", http.StatusUnauthorized)
				return
			}

			// Check if key is active
			if !keyData.IsActive {
				log.Printf("Authentication failed: inactive API key %s from %s", keyData.KeyHash, r.RemoteAddr)
				metrics.RecordAuthFailure("inactive_key")
				http.Error(w, "API key is inactive", http.StatusUnauthorized)
				return
			}

			// Check key age (optional security measure)
			if config.MaxKeyAge > 0 && time.Since(keyData.CreatedAt) > config.MaxKeyAge {
				log.Printf("Authentication failed: expired API key %s from %s", keyData.KeyHash, r.RemoteAddr)
				metrics.RecordAuthFailure("expired_key")
				http.Error(w, "API key has expired", http.StatusUnauthorized)
				return
			}

			// Determine if this is an admin key
			isAdmin := keyData.KeyType == "admin"

			// Record successful API key usage
			metrics.RecordAPIKeyUsage(keyData.ClientID, keyData.KeyType)

			// Add authentication data to request context
			ctx := context.WithValue(r.Context(), ClientIDKey, keyData.ClientID)
			ctx = context.WithValue(ctx, APIKeyKey, keyData.KeyHash)
			ctx = context.WithValue(ctx, IsAdminKey, isAdmin)

			// Log successful authentication
			log.Printf("Authentication successful: client=%s, admin=%v, from=%s", 
				keyData.ClientID, isAdmin, r.RemoteAddr)

			// Continue with authenticated request
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

// AdminOnly middleware ensures only admin keys can access the endpoint
func AdminOnly(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		isAdmin, ok := r.Context().Value(IsAdminKey).(bool)
		if !ok || !isAdmin {
			clientID, _ := r.Context().Value(ClientIDKey).(string)
			log.Printf("Authorization failed: non-admin access attempt by client=%s from=%s", 
				clientID, r.RemoteAddr)
			http.Error(w, "admin access required", http.StatusForbidden)
			return
		}

		next.ServeHTTP(w, r)
	})
}

// ClientOnly middleware ensures clients can only access their own data
func ClientOnly(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		clientID, ok := r.Context().Value(ClientIDKey).(string)
		if !ok {
			log.Printf("Authorization failed: missing client ID in context from %s", r.RemoteAddr)
			http.Error(w, "authentication required", http.StatusUnauthorized)
			return
		}

		// For admin users, allow access to any client data
		if isAdmin, _ := r.Context().Value(IsAdminKey).(bool); isAdmin {
			next.ServeHTTP(w, r)
			return
		}

		// For regular clients, ensure they can only access their own data
		requestedClientID := r.URL.Query().Get("client_id")
		if requestedClientID != "" && requestedClientID != clientID {
			log.Printf("Authorization failed: client=%s attempted to access client=%s data from=%s", 
				clientID, requestedClientID, r.RemoteAddr)
			http.Error(w, "access denied: can only access own data", http.StatusForbidden)
			return
		}

		next.ServeHTTP(w, r)
	})
}

// RateLimitByKey middleware applies rate limiting per API key
func RateLimitByKey(store *storage.PostgresStore) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			_, ok := r.Context().Value(APIKeyKey).(string)
			if !ok {
				http.Error(w, "authentication required", http.StatusUnauthorized)
				return
			}

			// Apply rate limiting per API key (could be enhanced with Redis)
			// For now, this is a placeholder for future implementation
			
			next.ServeHTTP(w, r)
		})
	}
}

// extractAPIKey extracts API key from various request locations
func extractAPIKey(r *http.Request) string {
	// Try Authorization header (Bearer token)
	if auth := r.Header.Get("Authorization"); auth != "" {
		if strings.HasPrefix(auth, "Bearer ") {
			return strings.TrimPrefix(auth, "Bearer ")
		}
	}

	// Try X-API-Key header
	if key := r.Header.Get("X-API-Key"); key != "" {
		return key
	}

	// Try query parameter (less secure, but sometimes needed)
	if key := r.URL.Query().Get("api_key"); key != "" {
		return key
	}

	return ""
}

// SecureCompare performs constant-time string comparison to prevent timing attacks
func SecureCompare(a, b string) bool {
	return subtle.ConstantTimeCompare([]byte(a), []byte(b)) == 1
}
