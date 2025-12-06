package ratelimiter

import (
	"context"
	"fmt"
	"time"

	"github.com/redis/go-redis/v9"
)

type SlidingWindowLimiter struct {
	Redis *redis.Client
}

func NewSlidingWindowLimiter(r *redis.Client) *SlidingWindowLimiter {
	return &SlidingWindowLimiter{Redis: r}
}

func (l *SlidingWindowLimiter) AllowRequest(userID string, limit int, windowSeconds int) (bool, error) {
	ctx := context.Background()
	key := fmt.Sprintf("sw:%s", userID)

	now := time.Now().Unix()

	// The window start time
	windowStart := now - int64(windowSeconds)

	// Remove timestamps older than window
	_, err := l.Redis.ZRemRangeByScore(ctx, key, "0", fmt.Sprintf("%d", windowStart)).Result()
	if err != nil {
		return false, err
	}

	// Count requests in the window
	count, err := l.Redis.ZCount(ctx, key, fmt.Sprintf("%d", windowStart), fmt.Sprintf("%d", now)).Result()
	if err != nil {
		return false, err
	}

	if int(count) >= limit {
		return false, nil // rate limit exceeded
	}

	// Add current request timestamp
	_, err = l.Redis.ZAdd(ctx, key, redis.Z{
		Score:  float64(now),
		Member: now,
	}).Result()
	if err != nil {
		return false, err
	}

	// Set expiration to avoid memory leak
	l.Redis.Expire(ctx, key, time.Duration(windowSeconds*2)*time.Second)

	return true, nil
}
