package ratelimiter

import (
	"context"
	"fmt"
	"strconv"
	"time"

	"github.com/harshithjn/Throttl/internal/storage"
	"github.com/redis/go-redis/v9"
)

type SlidingWindowLimiter struct {
	Redis *storage.RedisClient
}

// AllowRequest checks if a request is allowed based on sliding window rules
// Uses Redis sorted sets to track requests within the time window
func (sw *SlidingWindowLimiter) AllowRequest(userID string, capacity int, windowSize int) (bool, error) {
	key := fmt.Sprintf("sw:%s", userID)
	now := time.Now().UnixMilli()
	windowStart := now - int64(windowSize*1000) // Convert seconds to milliseconds
	
	// Lua script for atomic sliding window operations
	luaScript := `
		local key = KEYS[1]
		local window_start = tonumber(ARGV[1])
		local now = tonumber(ARGV[2])
		local capacity = tonumber(ARGV[3])
		local window_size = tonumber(ARGV[4])
		
		-- Remove expired entries (outside the window)
		redis.call('ZREMRANGEBYSCORE', key, '-inf', window_start)
		
		-- Count current requests in the window
		local current_count = redis.call('ZCARD', key)
		
		-- Check if request can be allowed
		if current_count >= capacity then
			-- Set expiration for cleanup
			redis.call('EXPIRE', key, window_size + 60)
			return 0
		end
		
		-- Allow request and add to window
		redis.call('ZADD', key, now, now)
		redis.call('EXPIRE', key, window_size + 60)
		return 1
	`
	
	result, err := sw.Redis.Client.Eval(
		context.Background(),
		luaScript,
		[]string{key},
		windowStart, now, capacity, windowSize,
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

// GetWindowState returns current request count in the window for debugging/monitoring
func (sw *SlidingWindowLimiter) GetWindowState(userID string, windowSize int) (int, error) {
	key := fmt.Sprintf("sw:%s", userID)
	now := time.Now().UnixMilli()
	windowStart := now - int64(windowSize*1000)
	
	// Remove expired entries first
	_, err := sw.Redis.Client.ZRemRangeByScore(
		context.Background(),
		key,
		"-inf",
		strconv.FormatInt(windowStart, 10),
	).Result()
	if err != nil {
		return 0, err
	}
	
	// Count current requests
	count, err := sw.Redis.Client.ZCard(context.Background(), key).Result()
	if err != nil {
		if err == redis.Nil {
			return 0, nil
		}
		return 0, err
	}
	
	return int(count), nil
}

// Ensure SlidingWindowLimiter implements RateLimiter interface
var _ RateLimiter = (*SlidingWindowLimiter)(nil)