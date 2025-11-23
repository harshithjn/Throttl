package ratelimiter

import (
	"time"

	"github.com/harshithjn/Throttl/internal/storage"
	"github.com/redis/go-redis/v9"
)

type TokenBucketLimiter struct {
	Redis *storage.RedisClient
}

// AllowRequest checks if a request is allowed based on token bucket rules
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

	// Parse current state
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

	// Calculate refill
	now := time.Now().Unix()
	elapsed := now - lastTs

	refilled := int(elapsed) * refillRate
	tokens = min(capacity, tokens+refilled)

	if tokens <= 0 {
		// Not allowed
		return false, nil
	}

	// Allow request → deduct 1 token
	tokens--

	// Store updated values back in Redis
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
