package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/harshithjn/Throttl/internal/metrics"
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
		startTime := time.Now() // track request latency

		var req CheckRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "invalid JSON body", http.StatusBadRequest)
			return
		}

		// Debug logs (keep or remove)
		fmt.Println("DEBUG: Request received:", req.UserID, req.Route)

		// Fetch dynamic rate-limit configuration from PostgreSQL
		cfg, err := store.GetRateLimitConfig(req.UserID, req.Route)
		if err != nil {
			http.Error(w, "rate limit config not found", http.StatusNotFound)
			return
		}

		// Apply the Token Bucket limiter
		allowed, err := rl.AllowRequest(
			req.UserID,
			cfg.Capacity,
			cfg.RefillRate,
		)

		// Observe request latency
		metrics.RequestLatency.
			WithLabelValues(req.Route).
			Observe(time.Since(startTime).Seconds())

		// Increment Prometheus counters
		if allowed {
			metrics.RequestsAllowed.WithLabelValues(req.UserID, req.Route).Inc()
		} else {
			metrics.RequestsBlocked.WithLabelValues(req.UserID, req.Route).Inc()
		}

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
