package ratelimiter

import "github.com/harshithjn/Throttl/internal/storage"

func NewTokenBucketLimiter(r *storage.RedisClient) *TokenBucketLimiter {
	return &TokenBucketLimiter{
		Redis: r,
	}
}
