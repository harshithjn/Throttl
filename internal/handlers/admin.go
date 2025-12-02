package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/harshithjn/Throttl/internal/storage"
)

type CreateKeyRequest struct {
	ClientID string `json:"client_id"`
}

func CreateAPIKeyHandler(store *storage.PostgresStore) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req CreateKeyRequest
		json.NewDecoder(r.Body).Decode(&req)

		key, err := store.CreateAPIKey(req.ClientID)
		if err != nil {
			http.Error(w, "could not create key", 500)
			return
		}

		json.NewEncoder(w).Encode(map[string]string{
			"api_key": key,
		})
	}
}

func ListAPIKeysHandler(store *storage.PostgresStore) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		clientID := r.URL.Query().Get("client_id")

		keys, err := store.ListAPIKeys(clientID)
		if err != nil {
			http.Error(w, "could not fetch keys", 500)
			return
		}

		json.NewEncoder(w).Encode(keys)
	}
}

func DeleteAPIKeyHandler(store *storage.PostgresStore) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		key := r.URL.Query().Get("api_key")

		err := store.DeleteAPIKey(key)
		if err != nil {
			http.Error(w, "could not delete key", 500)
			return
		}

		json.NewEncoder(w).Encode(map[string]string{
			"deleted": key,
		})
	}
}
