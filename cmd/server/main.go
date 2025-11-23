package main

import (
	"fmt"
	"net/http"

	"github.com/harshithjn/Throttl/internal/ratelimiter"
	"github.com/harshithjn/Throttl/internal/storage"
)

func main() {
	// Initialize Redis client
	redisClient := storage.NewRedisClient()

	// Test Redis connection
	if err := redisClient.Ping(); err != nil {
		panic(err) // Fail fast if Redis is not reachable
	}

	fmt.Println("Connected to Redis successfully")

	// Test Token Bucket limiter
	limiter := ratelimiter.NewTokenBucketLimiter(redisClient)
	allowed, err := limiter.AllowRequest("user123", 10, 1)
	if err != nil {
		panic(err)
	}

	fmt.Println("Token Bucket test result (user123):", allowed)

	// Basic health endpoint
	http.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte("OK"))
	})

	fmt.Println("Server running on :8080")
	http.ListenAndServe(":8080", nil)
}
