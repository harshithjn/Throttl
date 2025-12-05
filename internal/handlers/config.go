package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/harshithjn/Throttl/internal/storage"
)

func UpsertConfigHandler(store *storage.PostgresStore) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var cfg storage.RateLimitConfigInput
		if err := json.NewDecoder(r.Body).Decode(&cfg); err != nil {
			http.Error(w, "invalid JSON", 400)
			return
		}

		if err := store.UpsertRateLimitConfig(cfg); err != nil {
			http.Error(w, "failed to save config", 500)
			return
		}

		json.NewEncoder(w).Encode(map[string]string{
			"status": "saved",
		})
	}
}

func DeleteConfigHandler(store *storage.PostgresStore) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		clientID := r.URL.Query().Get("client_id")
		route := r.URL.Query().Get("route")

		if err := store.DeleteRateLimitConfig(clientID, route); err != nil {
			http.Error(w, "delete failed", 500)
			return
		}

		json.NewEncoder(w).Encode(map[string]string{
			"deleted": route,
		})
	}
}

func ListConfigsHandler(store *storage.PostgresStore) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		clientID := r.URL.Query().Get("client_id")

		configs, err := store.ListRateLimitConfigs(clientID)
		if err != nil {
			http.Error(w, "failed to fetch configs", 500)
			return
		}

		json.NewEncoder(w).Encode(configs)
	}
}
