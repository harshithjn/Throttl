# Day 4 & Day 5 — `/check` API and Dynamic Configuration System

This document describes the work completed across **Day 4** and **Day 5**, where the project evolved from a basic in-memory limiter into a **fully functional, configurable, API-driven rate limiting service** using Go, Redis, and PostgreSQL.

---

# 1. Added the `/check` API Endpoint (Day 4)

The `/check` endpoint allows external services to ask:

```
Is this user allowed to make this request?
```

This endpoint serves as the core of the rate-limiting service.

## Work Done

### a. Created `internal/handlers/check.go`

A new handler was introduced to:

- Accept POST requests with JSON:
  ```json
  {
    "user_id": "clientA",
    "route": "/login"
  }
  ```
- Apply the Token Bucket algorithm.
- Return whether the request is allowed.

### Sample Handler (before dynamic config)

```go
func CheckHandler(rl *ratelimiter.TokenBucketLimiter) http.HandlerFunc {
    return func(w http.ResponseWriter, r *http.Request) {
        var req CheckRequest
        json.NewDecoder(r.Body).Decode(&req)

        allowed, err := rl.AllowRequest(req.UserID, 10, 1)
        if err != nil {
            http.Error(w, "internal error", 500)
            return
        }

        json.NewEncoder(w).Encode(CheckResponse{
            Allowed: allowed,
        })
    }
}
```

This was the initial version before integrating dynamic PostgreSQL configurations.

---

# 2. Integrated `/check` into the Server (Day 4)

`cmd/server/main.go` was updated to register the new endpoint:

```go
http.HandleFunc("/check", handlers.CheckHandler(limiter))
http.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
    w.Write([]byte("OK"))
})
```

At this stage, the rate limits were still hardcoded.

---

# 3. Added PostgreSQL for Dynamic Rate Limit Configurations (Day 5)

To make rate limits configurable per user and route, PostgreSQL was introduced.

## a. Added PostgreSQL service to Docker

A `postgres` service was added in `docker-compose.yml`:

```yaml
postgres:
  image: postgres:15-alpine
  container_name: throttl-postgres
  environment:
    POSTGRES_USER: throttl
    POSTGRES_PASSWORD: throttl
    POSTGRES_DB: throttl
  ports:
    - "5432:5432"
  restart: always
```

## b. Created database table for rules

Inside PostgreSQL:

```sql
CREATE TABLE rate_limits (
    client_id TEXT NOT NULL,
    route TEXT NOT NULL,
    limit_value INT NOT NULL,
    refill_rate INT NOT NULL,
    capacity INT NOT NULL,
    PRIMARY KEY (client_id, route)
);
```

A sample configuration was inserted:

```sql
INSERT INTO rate_limits (client_id, route, limit_value, refill_rate, capacity)
VALUES ('clientA', '/login', 10, 1, 10);
```

---

# 4. Added PostgreSQL Client in Go (Day 5)

A new file was created: `internal/storage/postgres.go`.

This file establishes a connection to PostgreSQL and exposes methods to query rate-limit configurations.

### Example:

```go
func NewPostgresStore() (*PostgresStore, error) {
    connStr := "postgres://throttl:throttl@127.0.0.1:5432/throttl?sslmode=disable"
    db, err := sql.Open("postgres", connStr)
    if err != nil {
        return nil, err
    }
    return &PostgresStore{DB: db}, nil
}
```

---

# 5. Created the `RateLimitConfig` model (Day 5)

```go
type RateLimitConfig struct {
    ClientID   string
    Route      string
    Limit      int
    RefillRate int
    Capacity   int
}
```

---

# 6. Added Function to Fetch Config From PostgreSQL

`GetRateLimitConfig` was added to query configurations:

```go
func (ps *PostgresStore) GetRateLimitConfig(clientID, route string) (*RateLimitConfig, error) {
    row := ps.DB.QueryRow(`
        SELECT client_id, route, limit_value, refill_rate, capacity
        FROM rate_limits
        WHERE client_id=$1 AND route=$2
    `, clientID, route)

    var cfg RateLimitConfig
    err := row.Scan(&cfg.ClientID, &cfg.Route, &cfg.Limit, &cfg.RefillRate, &cfg.Capacity)
    if err != nil {
        return nil, err
    }
    return &cfg, nil
}
```

---

# 7. Updated `/check` Handler to Use Dynamic Configs (Day 5)

The handler was updated to fetch limits from PostgreSQL instead of hardcoded values.

### Updated Handler

```go
func CheckHandler(rl *TokenBucketLimiter, store *PostgresStore) http.HandlerFunc {
    return func(w http.ResponseWriter, r *http.Request) {
        var req CheckRequest
        if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
            http.Error(w, "invalid JSON body", http.StatusBadRequest)
            return
        }

        cfg, err := store.GetRateLimitConfig(req.UserID, req.Route)
        if err != nil {
            http.Error(w, "rate limit config not found", 404)
            return
        }

        allowed, err := rl.AllowRequest(req.UserID, cfg.Capacity, cfg.RefillRate)
        if err != nil {
            http.Error(w, "internal error", 500)
            return
        }

        json.NewEncoder(w).Encode(CheckResponse{
            Allowed: allowed,
        })
    }
}
```

---

# 8. Updated `main.go` to Inject PostgreSQL Store

The server was modified to include PostgreSQL:

```go
pg, err := storage.NewPostgresStore()
if err != nil {
    panic(err)
}
defer pg.Close()

http.HandleFunc("/check", handlers.CheckHandler(limiter, pg))
```

Now the entire request flow is:

HTTP → `/check` → PostgreSQL config → Redis-based Token Bucket → Response

---

# 9. Testing With VS Code REST Client

A test file was created:

```
test.http
```

With the content:

```
POST http://localhost:8080/check
Content-Type: application/json

{
  "user_id": "clientA",
  "route": "/login"
}
```

This allows easy testing of the API without curl or external tools.

---

# Summary of Day 4 & Day 5 Achievements

- Added a real public API: `/check`
- Integrated Redis-backed Token Bucket algorithm
- Added PostgreSQL for dynamic, per-user, per-route configuration
- Built a robust configuration-fetching layer
- Updated handlers and server to use dynamic limits
- Established the foundational architecture for a real API rate-limiting service

This completes the core logic for a production-grade distributed rate limiter.
