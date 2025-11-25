package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/harshithjn/Throttl/internal/ratelimiter"
	"github.com/harshithjn/Throttl/internal/storage"
)

type CheckRequest struct {
	UserID string `json:"user_id"`
	Route  string `json:"route"`
}

type CheckResponse struct {
	Allowed bool   `json:"allowed"`
	Message string `json:"message,omitempty"`
}

func CheckHandler(rl *ratelimiter.TokenBucketLimiter, store *storage.PostgresStore) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req CheckRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "invalid JSON body", http.StatusBadRequest)
			return
		}

		// Fetch dynamic rate-limit configuration from PostgreSQL
		cfg, err := store.GetRateLimitConfig(req.UserID, req.Route)
		if err != nil {
			http.Error(w, "rate limit config not found", http.StatusNotFound)
			return
		}

		// Apply the Token Bucket limiter using config values
		allowed, err := rl.AllowRequest(
			req.UserID,
			cfg.Capacity,
			cfg.RefillRate,
		)
		if err != nil {
			http.Error(w, "internal error", http.StatusInternalServerError)
			return
		}

		// Respond with allow/deny
		json.NewEncoder(w).Encode(CheckResponse{
			Allowed: allowed,
			Message: "",
		})
	}
}
