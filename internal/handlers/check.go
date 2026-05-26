package handlers

import (
	"context"
	"encoding/json"
	"log"
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
	Allowed   bool   `json:"allowed"`
	Message   string `json:"message,omitempty"`
	Algorithm string `json:"algorithm,omitempty"`
	Remaining int    `json:"remaining,omitempty"` // Optional: tokens/requests remaining
}

func CheckHandler(factory *ratelimiter.RateLimiterFactory, store *storage.PostgresStore) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		startTime := time.Now()

		// Ensure we're handling POST requests
		if r.Method != http.MethodPost {
			http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
			return
		}

		var req CheckRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			log.Printf("Invalid JSON in request: %v", err)
			metrics.RecordError("invalid_json", "rate_limiting")
			http.Error(w, "invalid JSON body", http.StatusBadRequest)
			return
		}

		// Validate required fields
		if req.UserID == "" || req.Route == "" {
			metrics.RecordError("invalid_request", "rate_limiting")
			http.Error(w, "user_id and route are required", http.StatusBadRequest)
			return
		}

		log.Printf("Rate limit check: user=%s, route=%s", req.UserID, req.Route)

		// Fetch dynamic rate-limit configuration from PostgreSQL
		dbStart := time.Now()
		cfg, err := store.GetRateLimitConfig(req.UserID, req.Route)
		dbDuration := time.Since(dbStart)
		metrics.RecordDatabaseOperation("SELECT", "rate_limits", dbDuration)

		if err != nil {
			log.Printf("Rate limit config not found for user=%s, route=%s: %v", req.UserID, req.Route, err)
			metrics.RecordError("config_not_found", "rate_limiting")
			http.Error(w, "rate limit config not found", http.StatusNotFound)
			return
		}

		// Apply the appropriate rate limiter based on algorithm
		var allowed bool
		redisStart := time.Now()
		
		switch cfg.Algorithm {
		case storage.AlgorithmTokenBucket:
			limiter := factory.CreateLimiter(storage.AlgorithmTokenBucket).(*ratelimiter.TokenBucketLimiter)
			allowed, err = limiter.AllowRequest(req.UserID, cfg.Capacity, cfg.RefillRate)
		case storage.AlgorithmSlidingWindow:
			limiter := factory.CreateLimiter(storage.AlgorithmSlidingWindow).(*ratelimiter.SlidingWindowLimiter)
			allowed, err = limiter.AllowRequest(req.UserID, cfg.Limit, cfg.WindowSize)
		default:
			log.Printf("Unknown algorithm %s, falling back to token bucket", cfg.Algorithm)
			limiter := factory.CreateLimiter(storage.AlgorithmTokenBucket).(*ratelimiter.TokenBucketLimiter)
			allowed, err = limiter.AllowRequest(req.UserID, cfg.Capacity, cfg.RefillRate)
		}

		redisDuration := time.Since(redisStart)
		metrics.RecordRedisOperation("rate_limit_check", cfg.Algorithm, redisDuration)

		if err != nil {
			log.Printf("Rate limiter error for user=%s: %v", req.UserID, err)
			metrics.RecordError("rate_limiter_error", "rate_limiting")
			http.Error(w, "internal error", http.StatusInternalServerError)
			return
		}

		// Record comprehensive metrics
		totalLatency := time.Since(startTime)
		metrics.RecordRateLimitDecision(req.UserID, req.Route, cfg.Algorithm, allowed, totalLatency)

		// Increment Redis metrics asynchronously to keep the main path fast
		go func(isAllowed bool, duration time.Duration) {
			ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
			defer cancel()
			
			pipe := factory.Redis.Client.Pipeline()
			pipe.Incr(ctx, "throttl:stats:total_requests")
			if isAllowed {
				pipe.Incr(ctx, "throttl:stats:allowed_requests")
			} else {
				pipe.Incr(ctx, "throttl:stats:blocked_requests")
			}
			pipe.IncrByFloat(ctx, "throttl:stats:total_latency_ms", float64(duration.Microseconds())/1000.0)
			
			_, err := pipe.Exec(ctx)
			if err != nil {
				log.Printf("Failed to increment Redis stats: %v", err)
			}
		}(allowed, totalLatency)

		if allowed {
			log.Printf("Request ALLOWED: user=%s, route=%s, algorithm=%s", req.UserID, req.Route, cfg.Algorithm)
		} else {
			log.Printf("Request BLOCKED: user=%s, route=%s, algorithm=%s", req.UserID, req.Route, cfg.Algorithm)
		}

		// Set proper content type
		w.Header().Set("Content-Type", "application/json")

		// Respond with allow/deny
		response := CheckResponse{
			Allowed:   allowed,
			Algorithm: cfg.Algorithm,
		}

		if !allowed {
			response.Message = "Rate limit exceeded"
		}

		json.NewEncoder(w).Encode(response)
	}
}
