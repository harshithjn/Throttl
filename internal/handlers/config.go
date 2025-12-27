package handlers

import (
	"encoding/json"
	"log"
	"net/http"

	"github.com/harshithjn/Throttl/internal/metrics"
	"github.com/harshithjn/Throttl/internal/middleware"
	"github.com/harshithjn/Throttl/internal/storage"
)

func UpsertConfigHandler(store *storage.PostgresStore) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost && r.Method != http.MethodPut {
			http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
			return
		}

		// Get authenticated client info
		authClientID, _ := r.Context().Value(middleware.ClientIDKey).(string)
		isAdmin, _ := r.Context().Value(middleware.IsAdminKey).(bool)

		var cfg storage.RateLimitConfigInput
		if err := json.NewDecoder(r.Body).Decode(&cfg); err != nil {
			log.Printf("Invalid JSON in config request: %v", err)
			http.Error(w, "invalid JSON", http.StatusBadRequest)
			return
		}

		// Multi-tenancy: Non-admin users can only create configs for themselves
		if !isAdmin && cfg.ClientID != authClientID {
			log.Printf("Authorization failed: client %s attempted to create config for %s", authClientID, cfg.ClientID)
			http.Error(w, "can only create configs for your own client", http.StatusForbidden)
			return
		}

		// Validate the configuration
		if err := cfg.Validate(); err != nil {
			log.Printf("Invalid config: %v", err)
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}

		if err := store.UpsertRateLimitConfig(cfg); err != nil {
			log.Printf("Failed to save config for client %s, route %s: %v", cfg.ClientID, cfg.Route, err)
			metrics.RecordError("config_save_failed", "configuration_management")
			http.Error(w, "failed to save config", http.StatusInternalServerError)
			return
		}

		// Record configuration change
		operation := "CREATE"
		if r.Method == http.MethodPut {
			operation = "UPDATE"
		}
		metrics.RecordConfigurationChange(operation, "rate_limit", cfg.ClientID)

		log.Printf("Saved rate limit config: client=%s, route=%s, algorithm=%s, admin=%v", 
			cfg.ClientID, cfg.Route, cfg.Algorithm, isAdmin)

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{
			"status":    "saved",
			"client_id": cfg.ClientID,
			"route":     cfg.Route,
			"algorithm": cfg.Algorithm,
		})
	}
}

func DeleteConfigHandler(store *storage.PostgresStore) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodDelete {
			http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
			return
		}

		// Get authenticated client info
		authClientID, _ := r.Context().Value(middleware.ClientIDKey).(string)
		isAdmin, _ := r.Context().Value(middleware.IsAdminKey).(bool)

		clientID := r.URL.Query().Get("client_id")
		route := r.URL.Query().Get("route")

		if clientID == "" || route == "" {
			http.Error(w, "client_id and route parameters are required", http.StatusBadRequest)
			return
		}

		// Multi-tenancy: Non-admin users can only delete their own configs
		if !isAdmin && clientID != authClientID {
			log.Printf("Authorization failed: client %s attempted to delete config for %s", authClientID, clientID)
			http.Error(w, "can only delete your own configs", http.StatusForbidden)
			return
		}

		if err := store.DeleteRateLimitConfig(clientID, route); err != nil {
			if err == storage.ErrConfigNotFound {
				http.Error(w, "config not found", http.StatusNotFound)
				return
			}
			log.Printf("Failed to delete config for client %s, route %s: %v", clientID, route, err)
			metrics.RecordError("config_delete_failed", "configuration_management")
			http.Error(w, "delete failed", http.StatusInternalServerError)
			return
		}

		// Record configuration change
		metrics.RecordConfigurationChange("DELETE", "rate_limit", clientID)

		log.Printf("Deleted rate limit config: client=%s, route=%s, admin=%v", clientID, route, isAdmin)

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]string{
			"deleted":   route,
			"client_id": clientID,
			"status":    "success",
		})
	}
}

func ListConfigsHandler(store *storage.PostgresStore) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet {
			http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
			return
		}

		// Get authenticated client info
		authClientID, _ := r.Context().Value(middleware.ClientIDKey).(string)
		isAdmin, _ := r.Context().Value(middleware.IsAdminKey).(bool)

		requestedClientID := r.URL.Query().Get("client_id")

		// Multi-tenancy: Non-admin users can only list their own configs
		if !isAdmin {
			if requestedClientID != "" && requestedClientID != authClientID {
				log.Printf("Authorization failed: client %s attempted to list configs for %s", authClientID, requestedClientID)
				http.Error(w, "can only list your own configs", http.StatusForbidden)
				return
			}
			requestedClientID = authClientID // Force to own client
		}

		configs, err := store.ListRateLimitConfigs(requestedClientID)
		if err != nil {
			log.Printf("Failed to fetch configs for client %s: %v", requestedClientID, err)
			http.Error(w, "failed to fetch configs", http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{
			"configs":   configs,
			"client_id": requestedClientID,
			"count":     len(configs),
			"is_admin":  isAdmin,
		})
	}
}

// GetConfigHandler returns a specific rate limit configuration
func GetConfigHandler(store *storage.PostgresStore) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet {
			http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
			return
		}

		// Get authenticated client info
		authClientID, _ := r.Context().Value(middleware.ClientIDKey).(string)
		isAdmin, _ := r.Context().Value(middleware.IsAdminKey).(bool)

		clientID := r.URL.Query().Get("client_id")
		route := r.URL.Query().Get("route")

		if clientID == "" || route == "" {
			http.Error(w, "client_id and route parameters are required", http.StatusBadRequest)
			return
		}

		// Multi-tenancy: Non-admin users can only get their own configs
		if !isAdmin && clientID != authClientID {
			log.Printf("Authorization failed: client %s attempted to get config for %s", authClientID, clientID)
			http.Error(w, "can only access your own configs", http.StatusForbidden)
			return
		}

		config, err := store.GetRateLimitConfig(clientID, route)
		if err != nil {
			if err.Error() == "sql: no rows in result set" {
				http.Error(w, "config not found", http.StatusNotFound)
				return
			}
			log.Printf("Failed to get config for client %s, route %s: %v", clientID, route, err)
			http.Error(w, "failed to get config", http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(config)
	}
}

// GetClientStatsHandler returns statistics for a client (admin only or own stats)
func GetClientStatsHandler(store *storage.PostgresStore) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet {
			http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
			return
		}

		// Get authenticated client info
		authClientID, _ := r.Context().Value(middleware.ClientIDKey).(string)
		isAdmin, _ := r.Context().Value(middleware.IsAdminKey).(bool)

		requestedClientID := r.URL.Query().Get("client_id")

		// Multi-tenancy: Non-admin users can only get their own stats
		if !isAdmin {
			if requestedClientID != "" && requestedClientID != authClientID {
				log.Printf("Authorization failed: client %s attempted to get stats for %s", authClientID, requestedClientID)
				http.Error(w, "can only access your own stats", http.StatusForbidden)
				return
			}
			requestedClientID = authClientID
		}

		if requestedClientID == "" {
			http.Error(w, "client_id parameter is required", http.StatusBadRequest)
			return
		}

		// Get configs count
		configs, err := store.ListRateLimitConfigs(requestedClientID)
		if err != nil {
			log.Printf("Failed to get configs for stats: %v", err)
			http.Error(w, "failed to get client stats", http.StatusInternalServerError)
			return
		}

		// Get API keys count
		keys, err := store.ListAPIKeys(requestedClientID)
		if err != nil {
			log.Printf("Failed to get keys for stats: %v", err)
			http.Error(w, "failed to get client stats", http.StatusInternalServerError)
			return
		}

		// Count active keys
		activeKeys := 0
		for _, key := range keys {
			if key.IsValid() {
				activeKeys++
			}
		}

		// Algorithm distribution
		algorithmCount := make(map[string]int)
		for _, config := range configs {
			algorithmCount[config.Algorithm]++
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{
			"client_id":        requestedClientID,
			"total_configs":    len(configs),
			"total_keys":       len(keys),
			"active_keys":      activeKeys,
			"algorithm_count":  algorithmCount,
			"is_admin_view":    isAdmin,
		})
	}
}
