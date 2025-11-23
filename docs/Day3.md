# Day 3 — Implementing the Token Bucket Rate Limiter

This document explains the work completed on Day 3.  
Today’s goal was to implement the **Token Bucket** rate-limiting algorithm using Redis and test it inside the Go server.

---

## 1. Created the Token Bucket Implementation

The Token Bucket algorithm controls how many requests a user can make within a certain time window. It works by:

- giving each user a "bucket" of tokens
- each request uses one token
- tokens refill over time
- if the bucket is empty → requests are denied

A new file was added:

```
internal/ratelimiter/token_bucket.go
```

The implementation:

```go
package ratelimiter

import (
	"time"

	"github.com/harshithjn/Throttl/internal/storage"
	"github.com/redis/go-redis/v9"
)

type TokenBucketLimiter struct {
	Redis *storage.RedisClient
}

// AllowRequest checks if a request is allowed using token bucket rules
func (tb *TokenBucketLimiter) AllowRequest(userID string, capacity int, refillRate int) (bool, error) {
	keyTokens := "tb:tokens:" + userID
	keyTimestamp := "tb:ts:" + userID

	// Fetch current tokens and last timestamp atomically
	pipe := tb.Redis.Client.TxPipeline()

	tokensCmd := pipe.Get(storage.Ctx, keyTokens)
	tsCmd := pipe.Get(storage.Ctx, keyTimestamp)

	_, err := pipe.Exec(storage.Ctx)
	if err != nil && err != redis.Nil {
		return false, err
	}

	// Parse values
	var tokens int
	var lastTs int64

	if tokensCmd.Err() == redis.Nil {
		tokens = capacity
	} else {
		tokens, _ = tokensCmd.Int()
	}

	if tsCmd.Err() == redis.Nil {
		lastTs = time.Now().Unix()
	} else {
		lastTs, _ = tsCmd.Int64()
	}

	// Refill tokens based on elapsed time
	now := time.Now().Unix()
	elapsed := now - lastTs

	refilled := int(elapsed) * refillRate
	tokens = min(capacity, tokens+refilled)

	// If bucket is empty → deny
	if tokens <= 0 {
		return false, nil
	}

	// Allow request → consume 1 token
	tokens--

	// Save updated values
	pipe2 := tb.Redis.Client.TxPipeline()
	pipe2.Set(storage.Ctx, keyTokens, tokens, 0)
	pipe2.Set(storage.Ctx, keyTimestamp, now, 0)
	_, err = pipe2.Exec(storage.Ctx)

	if err != nil {
		return false, err
	}

	return true, nil
}

func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}
```

---

## 2. Added a Constructor for the Token Bucket Limiter

A helper function was added to create a limiter instance:

File:

```
internal/ratelimiter/limiter.go
```

```go
package ratelimiter

import "github.com/harshithjn/Throttl/internal/storage"

func NewTokenBucketLimiter(r *storage.RedisClient) *TokenBucketLimiter {
	return &TokenBucketLimiter{
		Redis: r,
	}
}
```

---

## 3. Integrated and Tested Token Bucket in `main.go`

The server was temporarily updated to test the limiter at startup.

Updated file:

```
cmd/server/main.go
```

```go
package main

import (
	"fmt"
	"net/http"

	"github.com/harshithjn/Throttl/internal/ratelimiter"
	"github.com/harshithjn/Throttl/internal/storage"
)

func main() {
	redisClient := storage.NewRedisClient()

	if err := redisClient.Ping(); err != nil {
		panic(err)
	}

	fmt.Println("Connected to Redis successfully")

	// Temporary test for Day 3
	limiter := ratelimiter.NewTokenBucketLimiter(redisClient)
	allowed, err := limiter.AllowRequest("user123", 10, 1)
	if err != nil {
		panic(err)
	}

	fmt.Println("Token Bucket test result (user123):", allowed)

	http.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte("OK"))
	})

	fmt.Println("Server running on :8080")
	http.ListenAndServe(":8080", nil)
}
```

Running the server:

```
go run cmd/server/main.go
```

Expected output:

```
Connected to Redis successfully
Token Bucket test result (user123): true
Server running on :8080
```

Running it multiple times quickly will eventually return `false` because tokens run out, proving the bucket logic is working.

---

## 4. Git Branch and Commit Message

Branch name:

```
feature/token-bucket-implementation
```

Commit message:

```
feat: implement Redis-backed token bucket rate limiting logic
```

---

# Summary of What You Accomplished

You successfully:

- created the Token Bucket rate limiter
- stored token counters and timestamps in Redis
- implemented refill logic
- tested the limiter in the Go server
- confirmed correct ALLOW/DENY behavior
- committed changes using an industry-style branch and message

This completes the first real rate-limiting mechanism and prepares the foundation for building the public `/check` API next.
