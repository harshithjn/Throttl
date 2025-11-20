# API Rate Limiter as a Service

A production-grade, distributed API Rate Limiting service built with Go, Redis, PostgreSQL, Docker, Kubernetes, and AWS.  
This system provides a central service that other applications can query to determine whether a request should be **allowed** or **blocked** based on defined rate-limit rules.

## Key Features (Upcoming)
- Token Bucket & Sliding Window rate limiting
- Per-user, per-IP, and per-route limits
- Redis-based atomic counters for high performance
- PostgreSQL-backed configuration management
- React dashboard for monitoring and rule editing
- Prometheus + Grafana metrics and alerting
- Docker & Kubernetes deployment
- AWS-ready architecture
