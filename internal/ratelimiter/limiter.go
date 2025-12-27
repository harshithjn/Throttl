package ratelimiter

import "github.com/harshithjn/Throttl/internal/storage"

// RateLimiter defines the interface for all rate limiting algorithms
type RateLimiter interface {
	AllowRequest(userID string, capacity int, refillRate int) (bool, error)
}

// SlidingWindowRateLimiter defines interface for sliding window algorithm
type SlidingWindowRateLimiter interface {
	AllowRequest(userID string, capacity int, windowSize int) (bool, error)
}

// RateLimiterFactory creates rate limiters based on algorithm type
type RateLimiterFactory struct {
	Redis *storage.RedisClient
}

// NewRateLimiterFactory creates a new rate limiter factory
func NewRateLimiterFactory(r *storage.RedisClient) *RateLimiterFactory {
	return &RateLimiterFactory{Redis: r}
}

// CreateLimiter creates a rate limiter based on the algorithm type
func (f *RateLimiterFactory) CreateLimiter(algorithm string) interface{} {
	switch algorithm {
	case storage.AlgorithmTokenBucket:
		return NewTokenBucketLimiter(f.Redis)
	case storage.AlgorithmSlidingWindow:
		return NewSlidingWindowLimiter(f.Redis)
	default:
		return NewTokenBucketLimiter(f.Redis) // Default fallback
	}
}

// NewTokenBucketLimiter creates a new token bucket rate limiter
func NewTokenBucketLimiter(r *storage.RedisClient) *TokenBucketLimiter {
	return &TokenBucketLimiter{
		Redis: r,
	}
}

// NewSlidingWindowLimiter creates a new sliding window rate limiter
func NewSlidingWindowLimiter(r *storage.RedisClient) *SlidingWindowLimiter {
	return &SlidingWindowLimiter{
		Redis: r,
	}
}

// Ensure implementations satisfy interfaces
var _ RateLimiter = (*TokenBucketLimiter)(nil)
var _ SlidingWindowRateLimiter = (*SlidingWindowLimiter)(nil)
