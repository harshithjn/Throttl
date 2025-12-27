package metrics

import (
	"context"
	"log"
	"runtime"
	"time"

	"github.com/harshithjn/Throttl/internal/storage"
)

// MetricsCollector collects and updates system metrics
type MetricsCollector struct {
	store       *storage.PostgresStore
	redisClient *storage.RedisClient
	interval    time.Duration
	stopCh      chan struct{}
}

// NewMetricsCollector creates a new metrics collector
func NewMetricsCollector(store *storage.PostgresStore, redisClient *storage.RedisClient, interval time.Duration) *MetricsCollector {
	return &MetricsCollector{
		store:       store,
		redisClient: redisClient,
		interval:    interval,
		stopCh:      make(chan struct{}),
	}
}

// Start begins collecting metrics
func (mc *MetricsCollector) Start() {
	log.Println("Starting metrics collector...")
	
	// Collect initial metrics
	mc.collectMetrics()
	
	// Start periodic collection
	ticker := time.NewTicker(mc.interval)
	go func() {
		defer ticker.Stop()
		for {
			select {
			case <-ticker.C:
				mc.collectMetrics()
			case <-mc.stopCh:
				log.Println("Metrics collector stopped")
				return
			}
		}
	}()
}

// Stop stops the metrics collector
func (mc *MetricsCollector) Stop() {
	close(mc.stopCh)
}

// collectMetrics collects all system metrics
func (mc *MetricsCollector) collectMetrics() {
	mc.collectRuntimeMetrics()
	mc.collectDatabaseMetrics()
	mc.collectRedisMetrics()
	mc.collectBusinessMetrics()
}

// collectRuntimeMetrics collects Go runtime metrics
func (mc *MetricsCollector) collectRuntimeMetrics() {
	var m runtime.MemStats
	runtime.ReadMemStats(&m)
	
	UpdateMemoryUsage("heap", float64(m.HeapAlloc))
	UpdateMemoryUsage("stack", float64(m.StackInuse))
	UpdateMemoryUsage("system", float64(m.Sys))
	UpdateGoroutineCount(float64(runtime.NumGoroutine()))
}

// collectDatabaseMetrics collects database-related metrics
func (mc *MetricsCollector) collectDatabaseMetrics() {
	if mc.store == nil {
		return
	}

	// Get database connection stats
	stats := mc.store.DB.Stats()
	UpdateDatabaseConnections("postgres", "open", float64(stats.OpenConnections))
	UpdateDatabaseConnections("postgres", "in_use", float64(stats.InUse))
	UpdateDatabaseConnections("postgres", "idle", float64(stats.Idle))

	// Collect API key metrics
	mc.collectAPIKeyMetrics()
	
	// Collect configuration metrics
	mc.collectConfigurationMetrics()
}

// collectAPIKeyMetrics collects API key related metrics
func (mc *MetricsCollector) collectAPIKeyMetrics() {
	// Get all API keys
	keys, err := mc.store.ListAPIKeys("")
	if err != nil {
		log.Printf("Error collecting API key metrics: %v", err)
		return
	}

	// Count by client and type
	clientTypeCounts := make(map[string]map[string]int)
	for _, key := range keys {
		if clientTypeCounts[key.ClientID] == nil {
			clientTypeCounts[key.ClientID] = make(map[string]int)
		}
		if key.IsValid() {
			clientTypeCounts[key.ClientID][key.KeyType]++
		}
	}

	// Update metrics
	for clientID, typeCounts := range clientTypeCounts {
		for keyType, count := range typeCounts {
			UpdateActiveAPIKeys(clientID, keyType, float64(count))
		}
	}
}

// collectConfigurationMetrics collects configuration related metrics
func (mc *MetricsCollector) collectConfigurationMetrics() {
	// Get all configurations
	configs, err := mc.store.GetAllRateLimitConfigs()
	if err != nil {
		log.Printf("Error collecting configuration metrics: %v", err)
		return
	}

	// Count by client and algorithm
	clientAlgorithmCounts := make(map[string]map[string]int)
	algorithmCounts := make(map[string]int)
	
	for _, config := range configs {
		if clientAlgorithmCounts[config.ClientID] == nil {
			clientAlgorithmCounts[config.ClientID] = make(map[string]int)
		}
		clientAlgorithmCounts[config.ClientID][config.Algorithm]++
		algorithmCounts[config.Algorithm]++
	}

	// Update client-specific metrics
	for clientID, algorithmCounts := range clientAlgorithmCounts {
		for algorithm, count := range algorithmCounts {
			UpdateRateLimitConfigs(clientID, algorithm, float64(count))
		}
	}

	// Update global algorithm usage
	for algorithm, count := range algorithmCounts {
		UpdateAlgorithmUsage(algorithm, float64(count))
	}
}

// collectRedisMetrics collects Redis-related metrics
func (mc *MetricsCollector) collectRedisMetrics() {
	if mc.redisClient == nil {
		return
	}

	// Get Redis info
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	_, err := mc.redisClient.Client.Info(ctx).Result()
	if err != nil {
		log.Printf("Error collecting Redis metrics: %v", err)
		UpdateRedisConnections("error", 1)
		return
	}

	// Parse basic connection info (simplified)
	UpdateRedisConnections("connected", 1)
	
	// Could parse more detailed info from the INFO command response
	// For now, just indicate Redis is connected
}

// collectBusinessMetrics collects business-specific metrics
func (mc *MetricsCollector) collectBusinessMetrics() {
	// This could include metrics like:
	// - Most active clients
	// - Peak usage times
	// - Algorithm performance comparisons
	// - Rate limit effectiveness
	
	// For now, we'll collect basic client activity
	mc.collectClientActivity()
}

// collectClientActivity collects client activity metrics
func (mc *MetricsCollector) collectClientActivity() {
	// Get recent API key usage (this would require additional tracking)
	// For now, we'll use the number of configurations as a proxy for activity
	
	configs, err := mc.store.GetAllRateLimitConfigs()
	if err != nil {
		return
	}

	clientActivity := make(map[string]int)
	for _, config := range configs {
		clientActivity[config.ClientID]++
	}

	for clientID, configCount := range clientActivity {
		UpdateClientActivity(clientID, "config_count", float64(configCount))
	}
}