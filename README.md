# Throttl — Distributed Rate Limiter as a Service

Throttl is a high-performance, distributed rate-limiting service built using Go, Redis, PostgreSQL, Prometheus, and Grafana. It provides a clean `/check` API for enforcing per-user and per-route rate limits, with full observability and production-ready architecture.

---

## Features

- Distributed Token Bucket algorithm (Redis-backed)
- Dynamic rate limit configurations stored in PostgreSQL
- `/check` API to allow/deny requests in real time
- Prometheus metrics for allowed, blocked, and latency stats
- Grafana dashboards for monitoring system behavior
- Docker-based environment for easy setup and scaling

---

## Architecture

```
Client → /check API → PostgreSQL (rules)
                       ↓
                     Redis (tokens)
                       ↓
              Allow / Block Decision
                       ↓
           Prometheus → Grafana
```

---

## API

### POST `/check`

Request:

```json
{
  "user_id": "clientA",
  "route": "/login"
}
```

Response:

```json
{
  "allowed": true
}
```

---

## Run Locally

### Start Redis & PostgreSQL

```
docker compose up -d
```

### Start Monitoring (Prometheus + Grafana)

```
docker compose -f docker-compose.monitoring.yml up -d
```

### Run the Go Server

```
go run cmd/server/main.go
```

---

## Prometheus & Grafana

- Metrics: `http://localhost:8080/metrics`
- Prometheus: `http://localhost:9090`
- Grafana: `http://localhost:3000` (admin / admin)

---

## Folder Structure

```
cmd/server/            # main entrypoint
internal/handlers/     # HTTP handlers
internal/ratelimiter/  # token bucket logic
internal/storage/      # Redis + PostgreSQL
internal/metrics/      # Prometheus metrics
docs/                  # day-wise documentation
```

---

## Load Testing

```
hey -n 200 -c 10 -m POST \
  -H "Content-Type: application/json" \
  -d '{"user_id":"clientA","route":"/login"}' \
  http://localhost:8080/check
```

---

## Tech Stack

- Go
- Redis
- PostgreSQL
- Prometheus
- Grafana
- Docker

---

## Roadmap

- Sliding Window algorithm
- API key authentication
- Admin config APIs
- Kubernetes deployment

---
