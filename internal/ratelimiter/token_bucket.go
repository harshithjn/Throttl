package ratelimiter

import (
	"context"
	"fmt"
	"strconv"
	"time"

	"github.com/harshithjn/Throttl/internal/storage"
	"github.com/redis/go-redis/v9"
)

type TokenBucketLimiter struct {
	Redis *storage.RedisClient
}

// AllowRequest checks if a request is allowed based on token bucket rules
// Uses Lua script for atomic operations to prevent race conditions
func (tb *TokenBucketLimiter) AllowRequest(userID string, capacity int, refillRate int) (bool, error) {
	key := fmt.Sprintf("tb:%s", userID)
	now := time.Now().Unix()
	
	// Lua script for atomic token bucket operations
	luaScript := `
		local key = KEYS[1]
		local capacity = tonumber(ARGV[1])
		local refill_rate = tonumber(ARGV[2])
		local now = tonumber(ARGV[3])
		
		-- Get current bucket state
		local bucket = redis.call('HMGET', key, 'tokens', 'last_refill')
		local tokens = tonumber(bucket[1]) or capacity
		local last_refill = tonumber(bucket[2]) or now
		
		-- Calculate tokens to add based on elapsed time
		local elapsed = math.max(0, now - last_refill)
		local tokens_to_add = elapsed * refill_rate
		tokens = math.min(capacity, tokens + tokens_to_add)
		
		-- Check if request can be allowed
		if tokens < 1 then
			-- Update timestamp even if request is denied
			redis.call('HMSET', key, 'tokens', tokens, 'last_refill', now)
			redis.call('EXPIRE', key, 3600) -- 1 hour TTL
			return 0
		end
		
		-- Allow request and consume token
		tokens = tokens - 1
		redis.call('HMSET', key, 'tokens', tokens, 'last_refill', now)
		redis.call('EXPIRE', key, 3600) -- 1 hour TTL
		return 1
	`
	
	result, err := tb.Redis.Client.Eval(
		context.Background(),
		luaScript,
		[]string{key},
		capacity, refillRate, now,
	).Result()
	
	if err != nil {
		return false, fmt.Errorf("redis eval error: %w", err)
	}
	
	allowed, ok := result.(int64)
	if !ok {
		return false, fmt.Errorf("unexpected redis response type")
	}
	
	return allowed == 1, nil
}

// GetBucketState returns current token count for debugging/monitoring
func (tb *TokenBucketLimiter) GetBucketState(userID string) (int, error) {
	key := fmt.Sprintf("tb:%s", userID)
	
	result, err := tb.Redis.Client.HGet(context.Background(), key, "tokens").Result()
	if err != nil {
		if err == redis.Nil {
			return 0, nil // Bucket doesn't exist yet
		}
		return 0, err
	}
	
	tokens, err := strconv.Atoi(result)
	if err != nil {
		return 0, fmt.Errorf("invalid token count in redis: %w", err)
	}
	
	return tokens, nil
}
