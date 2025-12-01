package middleware

import (
	"net/http"

	"github.com/harshithjn/Throttl/internal/storage"
)

func APIKeyAuth(store *storage.PostgresStore) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {

			key := r.Header.Get("X-API-Key")
			if key == "" {
				http.Error(w, "missing API key", http.StatusUnauthorized)
				return
			}

			data, err := store.ValidateAPIKey(key)
			if err != nil || data == nil {
				http.Error(w, "invalid API key", http.StatusUnauthorized)
				return
			}

			// API key is valid → continue request
			next.ServeHTTP(w, r)
		})
	}
}
