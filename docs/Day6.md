# Day 6 — Prometheus Metrics Integration

This document explains all work completed on Day 6, where observability and metrics were added to the Throttl rate-limiting service. Metrics are a critical component of any production system, enabling you to monitor performance, detect anomalies, and visualize system behavior over time.

---

# 1. Installed Prometheus Go Client

The Prometheus client library was added to enable metrics exposition:

```
go get github.com/prometheus/client_golang/prometheus
go get github.com/prometheus/client_golang/prometheus/promhttp
```

This allows Throttl to expose an HTTP `/metrics` endpoint that Prometheus can scrape.

---

# 2. Created Metrics Module

A new module was added under:

```
internal/metrics/metrics.go
```

This file defines all the counters and histograms used to track the health and behavior of the rate limiter.

### Metrics implemented:

- **Requests Allowed Counter**  
  Tracks total number of allowed requests per user and route.

- **Requests Blocked Counter**  
  Tracks total number of blocked requests per user and route.

- **Request Latency Histogram**  
  Measures how long each `/check` request takes to process.

### Code Summary

```go
var (
    RequestsAllowed = prometheus.NewCounterVec(...)
    RequestsBlocked = prometheus.NewCounterVec(...)
    RequestLatency  = prometheus.NewHistogramVec(...)
)

func Init() {
    prometheus.MustRegister(RequestsAllowed)
    prometheus.MustRegister(RequestsBlocked)
    prometheus.MustRegister(RequestLatency)
}
```

This makes the metrics available globally inside the application.

---

# 3. Updated `main.go` to Expose `/metrics`

In `cmd/server/main.go`, the following changes were made:

- Prometheus metrics were initialized with `metrics.Init()`.
- Added the metrics endpoint:
  ```go
  http.Handle("/metrics", promhttp.Handler())
  ```
- Ensured metrics are ready before starting the server.

### Result:

Metrics are now accessible at:

```
http://localhost:8080/metrics
```

---

# 4. Instrumented the `/check` Endpoint

The `/check` handler was updated to record metrics for:

### a. Allowed requests

```
metrics.RequestsAllowed.WithLabelValues(req.UserID, req.Route).Inc()
```

### b. Blocked requests

```
metrics.RequestsBlocked.WithLabelValues(req.UserID, req.Route).Inc()
```

### c. Request latency

```
metrics.RequestLatency.
    WithLabelValues(req.Route).
    Observe(time.Since(startTime).Seconds())
```

A timestamp is captured at the beginning of the request to measure total processing time.

---

# 5. Testing the Setup

To verify the metrics were working:

1. The server was launched with:

   ```
   go run cmd/server/main.go
   ```

2. The `/check` endpoint was triggered multiple times using the REST Client (test.http).

3. The `/metrics` endpoint was reloaded.

### Expected Output Example

```
throttl_requests_allowed_total{user_id="clientA",route="/login"} 5
throttl_requests_blocked_total{user_id="clientA",route="/login"} 2
throttl_request_latency_seconds_bucket{route="/login",le="0.005"} 7
```

This confirms that the rate limiter is now observable and Prometheus-ready.

---

# Summary of Day 6 Achievements

- Added Prometheus instrumentation to Throttl.
- Implemented counters for allowed/blocked requests.
- Added latency histograms for performance monitoring.
- Exposed `/metrics` endpoint for Prometheus scraping.
- Integrated metrics inside the `/check` handler.
- Enabled complete observability for the Throttl service.

Throttl is now ready for Day 7, where Grafana dashboards will be added to visualize these metrics.
