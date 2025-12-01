package main

import (
	"fmt"
	"net/http"

	"github.com/harshithjn/Throttl/internal/handlers"
	"github.com/harshithjn/Throttl/internal/metrics"
	"github.com/harshithjn/Throttl/internal/ratelimiter"
	"github.com/harshithjn/Throttl/internal/storage"

	"github.com/harshithjn/Throttl/internal/middleware"
	"github.com/prometheus/client_golang/prometheus/promhttp"
)

func main() {
	// Redis
	redisClient := storage.NewRedisClient()
	if err := redisClient.Ping(); err != nil {
		panic(err)
	}
	fmt.Println("Connected to Redis successfully")

	// PostgreSQL
	pg, err := storage.NewPostgresStore()
	if err != nil {
		panic(err)
	}
	defer pg.Close()
	fmt.Println("Connected to PostgreSQL successfully")

	// Rate limiter
	limiter := ratelimiter.NewTokenBucketLimiter(redisClient)

	// Initialize Prometheus metrics
	metrics.Init()
	fmt.Println("Prometheus metrics initialized")

	// Routes
	http.Handle("/check",
		middleware.APIKeyAuth(pg)(
			http.HandlerFunc(handlers.CheckHandler(limiter, pg)),
		),
	)

	// Health check
	http.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte("OK"))
	})

	// Prometheus metrics endpoint
	http.Handle("/metrics", promhttp.Handler())

	fmt.Println("Server running on :8080")
	http.ListenAndServe(":8080", nil)
}
