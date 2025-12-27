package metrics

import (
	"time"

	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promauto"
)

var (
	// Rate Limiting Metrics
	RequestsAllowed = promauto.NewCounterVec(
		prometheus.CounterOpts{
			Name: "throttl_requests_allowed_total",
			Help: "Total number of allowed requests",
		},
		[]string{"client_id", "route", "algorithm"},
	)

	RequestsBlocked = promauto.NewCounterVec(
		prometheus.CounterOpts{
			Name: "throttl_requests_blocked_total",
			Help: "Total number of blocked requests",
		},
		[]string{"client_id", "route", "algorithm"},
	)

	RequestLatency = promauto.NewHistogramVec(
		prometheus.HistogramOpts{
			Name:    "throttl_request_latency_seconds",
			Help:    "Latency of /check requests",
			Buckets: []float64{0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1.0, 2.5, 5.0},
		},
		[]string{"route", "algorithm"},
	)

	// API Key Metrics
	APIKeyUsage = promauto.NewCounterVec(
		prometheus.CounterOpts{
			Name: "throttl_api_key_usage_total",
			Help: "Total API key usage by client and key type",
		},
		[]string{"client_id", "key_type"},
	)

	APIKeyAuthFailures = promauto.NewCounterVec(
		prometheus.CounterOpts{
			Name: "throttl_api_key_auth_failures_total",
			Help: "Total API key authentication failures",
		},
		[]string{"reason"},
	)

	ActiveAPIKeys = promauto.NewGaugeVec(
		prometheus.GaugeOpts{
			Name: "throttl_active_api_keys",
			Help: "Number of active API keys by client and type",
		},
		[]string{"client_id", "key_type"},
	)

	// Configuration Metrics
	RateLimitConfigs = promauto.NewGaugeVec(
		prometheus.GaugeOpts{
			Name: "throttl_rate_limit_configs",
			Help: "Number of rate limit configurations by client and algorithm",
		},
		[]string{"client_id", "algorithm"},
	)

	ConfigurationChanges = promauto.NewCounterVec(
		prometheus.CounterOpts{
			Name: "throttl_configuration_changes_total",
			Help: "Total configuration changes by operation type",
		},
		[]string{"operation", "resource_type", "client_id"},
	)

	// System Health Metrics
	DatabaseConnections = promauto.NewGaugeVec(
		prometheus.GaugeOpts{
			Name: "throttl_database_connections",
			Help: "Number of database connections by state",
		},
		[]string{"database", "state"},
	)

	RedisConnections = promauto.NewGaugeVec(
		prometheus.GaugeOpts{
			Name: "throttl_redis_connections",
			Help: "Number of Redis connections by state",
		},
		[]string{"state"},
	)

	DatabaseOperationDuration = promauto.NewHistogramVec(
		prometheus.HistogramOpts{
			Name:    "throttl_database_operation_duration_seconds",
			Help:    "Duration of database operations",
			Buckets: []float64{0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1.0},
		},
		[]string{"operation", "table"},
	)

	RedisOperationDuration = promauto.NewHistogramVec(
		prometheus.HistogramOpts{
			Name:    "throttl_redis_operation_duration_seconds",
			Help:    "Duration of Redis operations",
			Buckets: []float64{0.0001, 0.0005, 0.001, 0.0025, 0.005, 0.01, 0.025, 0.05, 0.1},
		},
		[]string{"operation", "algorithm"},
	)

	// HTTP Metrics
	HTTPRequestsTotal = promauto.NewCounterVec(
		prometheus.CounterOpts{
			Name: "throttl_http_requests_total",
			Help: "Total HTTP requests by method, endpoint, and status",
		},
		[]string{"method", "endpoint", "status_code"},
	)

	HTTPRequestDuration = promauto.NewHistogramVec(
		prometheus.HistogramOpts{
			Name:    "throttl_http_request_duration_seconds",
			Help:    "HTTP request duration",
			Buckets: []float64{0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1.0, 2.5, 5.0},
		},
		[]string{"method", "endpoint"},
	)

	// Business Metrics
	ClientActivity = promauto.NewGaugeVec(
		prometheus.GaugeOpts{
			Name: "throttl_client_activity",
			Help: "Client activity metrics",
		},
		[]string{"client_id", "metric_type"},
	)

	AlgorithmUsage = promauto.NewGaugeVec(
		prometheus.GaugeOpts{
			Name: "throttl_algorithm_usage",
			Help: "Usage distribution of rate limiting algorithms",
		},
		[]string{"algorithm"},
	)

	// Error Metrics
	ErrorsTotal = promauto.NewCounterVec(
		prometheus.CounterOpts{
			Name: "throttl_errors_total",
			Help: "Total errors by type and component",
		},
		[]string{"error_type", "component"},
	)

	// Performance Metrics
	MemoryUsage = promauto.NewGaugeVec(
		prometheus.GaugeOpts{
			Name: "throttl_memory_usage_bytes",
			Help: "Memory usage by component",
		},
		[]string{"component"},
	)

	GoroutineCount = promauto.NewGauge(
		prometheus.GaugeOpts{
			Name: "throttl_goroutines",
			Help: "Number of goroutines",
		},
	)
)

// RecordRateLimitDecision records a rate limiting decision
func RecordRateLimitDecision(clientID, route, algorithm string, allowed bool, latency time.Duration) {
	if allowed {
		RequestsAllowed.WithLabelValues(clientID, route, algorithm).Inc()
	} else {
		RequestsBlocked.WithLabelValues(clientID, route, algorithm).Inc()
	}
	RequestLatency.WithLabelValues(route, algorithm).Observe(latency.Seconds())
}

// RecordAPIKeyUsage records API key usage
func RecordAPIKeyUsage(clientID, keyType string) {
	APIKeyUsage.WithLabelValues(clientID, keyType).Inc()
}

// RecordAuthFailure records authentication failure
func RecordAuthFailure(reason string) {
	APIKeyAuthFailures.WithLabelValues(reason).Inc()
}

// RecordConfigurationChange records configuration changes
func RecordConfigurationChange(operation, resourceType, clientID string) {
	ConfigurationChanges.WithLabelValues(operation, resourceType, clientID).Inc()
}

// RecordDatabaseOperation records database operation metrics
func RecordDatabaseOperation(operation, table string, duration time.Duration) {
	DatabaseOperationDuration.WithLabelValues(operation, table).Observe(duration.Seconds())
}

// RecordRedisOperation records Redis operation metrics
func RecordRedisOperation(operation, algorithm string, duration time.Duration) {
	RedisOperationDuration.WithLabelValues(operation, algorithm).Observe(duration.Seconds())
}

// RecordHTTPRequest records HTTP request metrics
func RecordHTTPRequest(method, endpoint, statusCode string, duration time.Duration) {
	HTTPRequestsTotal.WithLabelValues(method, endpoint, statusCode).Inc()
	HTTPRequestDuration.WithLabelValues(method, endpoint).Observe(duration.Seconds())
}

// RecordError records error metrics
func RecordError(errorType, component string) {
	ErrorsTotal.WithLabelValues(errorType, component).Inc()
}

// UpdateActiveAPIKeys updates the count of active API keys
func UpdateActiveAPIKeys(clientID, keyType string, count float64) {
	ActiveAPIKeys.WithLabelValues(clientID, keyType).Set(count)
}

// UpdateRateLimitConfigs updates the count of rate limit configurations
func UpdateRateLimitConfigs(clientID, algorithm string, count float64) {
	RateLimitConfigs.WithLabelValues(clientID, algorithm).Set(count)
}

// UpdateClientActivity updates client activity metrics
func UpdateClientActivity(clientID, metricType string, value float64) {
	ClientActivity.WithLabelValues(clientID, metricType).Set(value)
}

// UpdateAlgorithmUsage updates algorithm usage distribution
func UpdateAlgorithmUsage(algorithm string, count float64) {
	AlgorithmUsage.WithLabelValues(algorithm).Set(count)
}

// UpdateDatabaseConnections updates database connection metrics
func UpdateDatabaseConnections(database, state string, count float64) {
	DatabaseConnections.WithLabelValues(database, state).Set(count)
}

// UpdateRedisConnections updates Redis connection metrics
func UpdateRedisConnections(state string, count float64) {
	RedisConnections.WithLabelValues(state).Set(count)
}

// UpdateMemoryUsage updates memory usage metrics
func UpdateMemoryUsage(component string, bytes float64) {
	MemoryUsage.WithLabelValues(component).Set(bytes)
}

// UpdateGoroutineCount updates goroutine count
func UpdateGoroutineCount(count float64) {
	GoroutineCount.Set(count)
}

// Init initializes metrics (kept for backward compatibility)
func Init() {
	// Metrics are now auto-registered with promauto
	// This function is kept for backward compatibility
}
