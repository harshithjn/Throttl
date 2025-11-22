# Day 2 — Redis Setup and Connection Integration

This document explains all the work completed on Day 2.  
Today’s goal was to set up Redis locally using Docker, connect it to the Go backend, and verify the connection.

---

## 1. Added Redis Using Docker Compose

Redis is a fast in-memory data store. It will be used to store counters for rate limiting.

A `docker-compose.yml` file was added to the project:

```yaml
version: "3.8"

services:
  redis:
    image: redis:7-alpine
    container_name: throttl-redis
    ports:
      - "6379:6379"
    restart: always
```

Redis was started using:

```
docker compose up -d
```

The running container was confirmed using:

```
docker ps
```

---

## 2. Installed Redis Go Client Library

The official Go Redis client was added to the project:

```
go get github.com/redis/go-redis/v9
```

This gives the application the ability to communicate with Redis from Go.

---

## 3. Created Redis Client in `internal/storage/redis.go`

A reusable Redis client was implemented:

```go
package storage

import (
	"context"
	"fmt"

	"github.com/redis/go-redis/v9"
)

var Ctx = context.Background()

type RedisClient struct {
	Client *redis.Client
}

func NewRedisClient() *RedisClient {
	rdb := redis.NewClient(&redis.Options{
		Addr: "localhost:6379",
	})

	return &RedisClient{Client: rdb}
}

func (r *RedisClient) Ping() error {
	_, err := r.Client.Ping(Ctx).Result()
	if err != nil {
		return fmt.Errorf("failed to connect to Redis: %w", err)
	}
	return nil
}
```

This file is responsible for:

- creating a Redis connection
- providing a `.Ping()` method to test connectivity

---

## 4. Integrated Redis into the Server Startup

The Go server was updated to initialize the Redis client on startup and verify the connection.

Updated `cmd/server/main.go`:

```go
package main

import (
	"fmt"
	"net/http"

	"github.com/harshithjn/Throttl/internal/storage"
)

func main() {
	// Initialize Redis client
	redisClient := storage.NewRedisClient()

	// Test Redis connection
	if err := redisClient.Ping(); err != nil {
		panic(err)
	}

	fmt.Println("Connected to Redis successfully")

	// Health endpoint
	http.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte("OK"))
	})

	fmt.Println("Server running on :8080")
	http.ListenAndServe(":8080", nil)
}
```

If Redis fails to start, the program will stop immediately.

---

## 5. Verified the System

Steps performed:

1. Start Redis:

   ```
   docker compose up -d
   ```

2. Run the Go server:
   ```
   go run cmd/server/main.go
   ```

Expected console output:

```
Connected to Redis successfully
Server running on :8080
```

This confirms the backend successfully connects to Redis.

---

## 6. Git Branch and Commit Message

Branch name:

```
feature/redis-setup-and-connection
```

Commit message:

```
feat: add Redis setup and implement Redis client with connection test
```

This follows the industry standard for feature branches and commit messages.

---

# Summary of What You Accomplished

You successfully:

- added Redis via Docker Compose
- installed the Redis Go client
- created a Redis client implementation
- connected the Go backend to Redis
- verified the connection on application startup
- committed everything using a feature branch

This completes the foundation required to implement the actual rate-limiting algorithm next.
