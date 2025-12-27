package storage

import "errors"

// Storage errors
var (
	ErrConfigNotFound           = errors.New("rate limit config not found")
	ErrAPIKeyNotFound          = errors.New("API key not found")
	ErrInvalidClientID         = errors.New("invalid client ID")
	ErrInvalidRoute            = errors.New("invalid route")
	ErrInvalidAlgorithm        = errors.New("invalid algorithm")
	ErrInvalidLimit            = errors.New("invalid limit")
	ErrInvalidTokenBucketParams = errors.New("invalid token bucket parameters")
	ErrInvalidWindowSize       = errors.New("invalid window size")
)