# Day 7 — Grafana Dashboards & Monitoring Setup

This document describes all work completed on Day 7, where the Throttl rate-limiting service was integrated with a full Prometheus + Grafana monitoring stack. This turns raw metrics into real-time visual dashboards, enabling powerful observability into the behavior of the rate limiter under load.

---

# 1. Created Monitoring Stack with Docker Compose

A new Docker Compose file was introduced to run both Prometheus and Grafana:

```
docker-compose.monitoring.yml
```

It contains two services:

- **Prometheus** for scraping metrics
- **Grafana** for visualization

### Prometheus and Grafana configuration:

```yaml
version: "3.9"

services:
  prometheus:
    image: prom/prometheus:latest
    container_name: throttl-prometheus
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
    ports:
      - "9090:9090"

  grafana:
    image: grafana/grafana:10.0.0
    container_name: throttl-grafana
    ports:
      - "3000:3000"
    depends_on:
      - prometheus
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
```

The monitoring stack is started using:

```
docker compose -f docker-compose.monitoring.yml up -d
```

Prometheus becomes available at **http://localhost:9090**  
Grafana becomes available at **http://localhost:3000**

---

# 2. Created Prometheus Scrape Configuration

A `prometheus.yml` file was added with the following content:

```yaml
global:
  scrape_interval: 2s

scrape_configs:
  - job_name: "throttl"
    static_configs:
      - targets: ["host.docker.internal:8080"]
```

This instructs Prometheus to scrape the Throttl application every 2 seconds by calling:

```
http://host.docker.internal:8080/metrics
```

---

# 3. Added Prometheus As Data Source in Grafana

Inside Grafana:

1. Logged in with admin credentials (`admin / admin`)
2. Opened **Connections → Data Sources**
3. Selected **Prometheus**
4. Set the URL to:

```
http://prometheus:9090
```

5. Saved and verified connection

Grafana is now able to pull data from Prometheus correctly.

---

# 4. Built Grafana Dashboards

A new dashboard was created in Grafana to visualize key metrics exposed by the Throttl service.

### Panels added:

---

## 4.1 Allowed Requests

Query:

```
throttl_requests_allowed_total
```

This shows how many requests were allowed per user and route.

---

## 4.2 Blocked Requests

Query:

```
throttl_requests_blocked_total
```

This shows how many requests were denied due to rate limits.

---

## 4.3 Request Latency (Histograms)

Query:

```
rate(throttl_request_latency_seconds_bucket[1m])
```

This visualizes the distribution of request processing times.

---

## 4.4 Allow/Block Ratio

Query:

```
sum(throttl_requests_allowed_total) /
sum(throttl_requests_allowed_total + throttl_requests_blocked_total)
```

This panel monitors overall system health.

---

## 4.5 Requests by Route

Query:

```
sum by (route) (throttl_requests_allowed_total)
```

Shows traffic across different routes.

---

## 4.6 Requests by User

Query:

```
sum by (user_id) (throttl_requests_allowed_total)
```

Shows user-specific traffic and usage patterns.

---

# 5. Load Testing to Populate the Dashboard

To generate real traffic and observe live metrics, load tests were run using `hey`:

```
hey -n 200 -c 10 -m POST \
    -H "Content-Type: application/json" \
    -d '{"user_id":"clientA","route":"/login"}' \
    http://localhost:8080/check
```

If `hey` was not installed, a fallback load-test using curl loops was used.

These load tests immediately populated the Grafana panels, showing:

- spikes in allowed requests
- blocked requests as limits were reached
- latency distribution curves
- user-specific request volumes

---

# Summary of Day 7 Achievements

- Set up a complete Prometheus + Grafana monitoring stack
- Added Prometheus configuration for Throttl
- Connected Prometheus as a Grafana data source
- Built a detailed observability dashboard
- Successfully load-tested the rate limiter to generate real traffic
- Enabled real-time visibility into allowed/blocked requests and latency

Throttl now has full production-grade monitoring and observability, making it significantly more powerful and professionally valuable.

---
