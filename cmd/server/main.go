package main

import (
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/harshithjn/Throttl/internal/handlers"
	"github.com/harshithjn/Throttl/internal/metrics"
	"github.com/harshithjn/Throttl/internal/middleware"
	"github.com/harshithjn/Throttl/internal/ratelimiter"
	"github.com/harshithjn/Throttl/internal/storage"

	"github.com/prometheus/client_golang/prometheus/promhttp"
)

func main() {
	log.Println("Starting Throttl Rate Limiting Service - Phase 4...")

	// Initialize Redis
	redisClient := storage.NewRedisClient()
	if err := redisClient.Ping(); err != nil {
		log.Fatalf("Failed to connect to Redis: %v", err)
	}
	log.Println("✓ Connected to Redis successfully")

	// Initialize PostgreSQL
	pg, err := storage.NewPostgresStore()
	if err != nil {
		log.Fatalf("Failed to connect to PostgreSQL: %v", err)
	}
	defer func() {
		if err := pg.Close(); err != nil {
			log.Printf("Error closing PostgreSQL connection: %v", err)
		}
	}()
	log.Println("✓ Connected to PostgreSQL successfully")

	// Initialize rate limiter factory
	limiterFactory := ratelimiter.NewRateLimiterFactory(redisClient)
	log.Println("✓ Rate limiter factory initialized (Token Bucket + Sliding Window)")

	// Initialize Prometheus metrics
	metrics.Init()
	log.Println("✓ Prometheus metrics initialized")

	// Start metrics collector
	metricsCollector := metrics.NewMetricsCollector(pg, redisClient, 30*time.Second)
	metricsCollector.Start()
	defer metricsCollector.Stop()
	log.Println("✓ Metrics collector started")

	// Setup routes with enhanced observability
	setupRoutes(limiterFactory, pg)

	// Setup graceful shutdown
	setupGracefulShutdown(redisClient, metricsCollector)

	// Get port from environment
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("🚀 Server starting on port %s", port)
	log.Printf("📊 Metrics available at http://localhost:%s/metrics", port)
	log.Printf("🏥 Health check at http://localhost:%s/health", port)
	log.Printf("🔐 Secure admin APIs at http://localhost:%s/admin/*", port)
	log.Printf("🛡️  Multi-tenant isolation enabled")
	log.Printf("📈 Observability stack ready (Prometheus + Grafana)")
	
	if err := http.ListenAndServe(":"+port, nil); err != nil {
		log.Fatalf("Server failed to start: %v", err)
	}
}

func setupRoutes(limiterFactory *ratelimiter.RateLimiterFactory, pg *storage.PostgresStore) {
	// Apply global middleware
	mux := http.NewServeMux()

	// Public rate limiting endpoint (requires valid API key)
	mux.Handle("/check",
		middleware.APIKeyAuth(pg)(
			http.HandlerFunc(handlers.CheckHandler(limiterFactory, pg)),
		),
	)

	// Admin API Key Management (admin only)
	mux.Handle("/admin/keys/create",
		middleware.APIKeyAuth(pg)(
			middleware.AdminOnly(
				http.HandlerFunc(handlers.CreateAPIKeyHandler(pg)),
			),
		),
	)

	mux.Handle("/admin/keys/list",
		middleware.APIKeyAuth(pg)(
			http.HandlerFunc(handlers.ListAPIKeysHandler(pg)), // Multi-tenancy handled inside
		),
	)

	mux.Handle("/admin/keys/rotate",
		middleware.APIKeyAuth(pg)(
			http.HandlerFunc(handlers.RotateAPIKeyHandler(pg)), // Multi-tenancy handled inside
		),
	)

	mux.Handle("/admin/keys/revoke",
		middleware.APIKeyAuth(pg)(
			http.HandlerFunc(handlers.RevokeAPIKeyHandler(pg)), // Multi-tenancy handled inside
		),
	)

	mux.Handle("/admin/keys/delete",
		middleware.APIKeyAuth(pg)(
			http.HandlerFunc(handlers.DeleteAPIKeyHandler(pg)), // Multi-tenancy handled inside
		),
	)

	// Rate Limit Configuration Management (with multi-tenancy)
	mux.Handle("/admin/config/create",
		middleware.APIKeyAuth(pg)(
			http.HandlerFunc(handlers.UpsertConfigHandler(pg)), // Multi-tenancy handled inside
		),
	)

	mux.Handle("/admin/config/update",
		middleware.APIKeyAuth(pg)(
			http.HandlerFunc(handlers.UpsertConfigHandler(pg)), // Multi-tenancy handled inside
		),
	)

	mux.Handle("/admin/config/get",
		middleware.APIKeyAuth(pg)(
			http.HandlerFunc(handlers.GetConfigHandler(pg)), // Multi-tenancy handled inside
		),
	)

	mux.Handle("/admin/config/delete",
		middleware.APIKeyAuth(pg)(
			http.HandlerFunc(handlers.DeleteConfigHandler(pg)), // Multi-tenancy handled inside
		),
	)

	mux.Handle("/admin/config/list",
		middleware.APIKeyAuth(pg)(
			http.HandlerFunc(handlers.ListConfigsHandler(pg)), // Multi-tenancy handled inside
		),
	)

	// Client Statistics (admin can see all, clients see own)
	mux.Handle("/admin/stats/client",
		middleware.APIKeyAuth(pg)(
			http.HandlerFunc(handlers.GetClientStatsHandler(pg)), // Multi-tenancy handled inside
		),
	)

	// Health check endpoint (no authentication required)
	mux.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(`{"status":"healthy","service":"throttl","phase":"4","observability":"enabled"}`))
	})

	// Prometheus metrics endpoint (no authentication required)
	mux.Handle("/metrics", promhttp.Handler())

	// Security info endpoint (no authentication required)
	mux.HandleFunc("/security", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(`{
			"authentication": "API key required",
			"authorization": "Multi-tenant isolation",
			"admin_features": "Admin key prefix required",
			"key_security": "SHA-256 hashed storage",
			"https_recommended": true,
			"security_headers": "Enabled",
			"observability": "Prometheus + Grafana",
			"metrics_collection": "Enabled"
		}`))
	})

	// Apply middleware chain
	handler := middleware.MetricsMiddleware(
		middleware.ErrorMetricsMiddleware(mux),
	)

	http.Handle("/", handler)
}

func setupGracefulShutdown(redisClient *storage.RedisClient, metricsCollector *metrics.MetricsCollector) {
	c := make(chan os.Signal, 1)
	signal.Notify(c, os.Interrupt, syscall.SIGTERM)

	go func() {
		<-c
		log.Println("Shutting down gracefully...")
		
		// Stop metrics collection
		metricsCollector.Stop()
		
		if err := redisClient.Close(); err != nil {
			log.Printf("Error closing Redis connection: %v", err)
		}
		
		log.Println("Shutdown complete")
		os.Exit(0)
	}()
}
