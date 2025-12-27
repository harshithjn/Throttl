package middleware

import (
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/harshithjn/Throttl/internal/metrics"
)

// responseWriter wraps http.ResponseWriter to capture status code
type responseWriter struct {
	http.ResponseWriter
	statusCode int
	written    bool
}

func (rw *responseWriter) WriteHeader(code int) {
	if !rw.written {
		rw.statusCode = code
		rw.written = true
		rw.ResponseWriter.WriteHeader(code)
	}
}

func (rw *responseWriter) Write(b []byte) (int, error) {
	if !rw.written {
		rw.statusCode = http.StatusOK
		rw.written = true
	}
	return rw.ResponseWriter.Write(b)
}

// MetricsMiddleware collects HTTP metrics for all requests
func MetricsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		
		// Wrap the response writer to capture status code
		wrapped := &responseWriter{
			ResponseWriter: w,
			statusCode:     http.StatusOK,
		}
		
		// Get endpoint pattern (normalize dynamic parts)
		endpoint := normalizeEndpoint(r.URL.Path)
		
		// Process request
		next.ServeHTTP(wrapped, r)
		
		// Record metrics
		duration := time.Since(start)
		statusCode := strconv.Itoa(wrapped.statusCode)
		
		metrics.RecordHTTPRequest(r.Method, endpoint, statusCode, duration)
	})
}

// normalizeEndpoint normalizes URL paths to reduce cardinality
func normalizeEndpoint(path string) string {
	// Remove trailing slash
	path = strings.TrimSuffix(path, "/")
	
	// Handle empty path
	if path == "" {
		return "/"
	}
	
	// Normalize common patterns
	switch {
	case strings.HasPrefix(path, "/admin/keys"):
		return "/admin/keys/*"
	case strings.HasPrefix(path, "/admin/config"):
		return "/admin/config/*"
	case strings.HasPrefix(path, "/admin/stats"):
		return "/admin/stats/*"
	case strings.HasPrefix(path, "/admin"):
		return "/admin/*"
	case path == "/check":
		return "/check"
	case path == "/health":
		return "/health"
	case path == "/metrics":
		return "/metrics"
	case path == "/security":
		return "/security"
	default:
		// For unknown paths, use a generic pattern
		return "/other"
	}
}

// ErrorMetricsMiddleware records error metrics
func ErrorMetricsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		wrapped := &responseWriter{
			ResponseWriter: w,
			statusCode:     http.StatusOK,
		}
		
		next.ServeHTTP(wrapped, r)
		
		// Record errors based on status code
		if wrapped.statusCode >= 400 {
			errorType := getErrorType(wrapped.statusCode)
			component := getComponentFromPath(r.URL.Path)
			metrics.RecordError(errorType, component)
		}
	})
}

// getErrorType categorizes errors by HTTP status code
func getErrorType(statusCode int) string {
	switch {
	case statusCode >= 400 && statusCode < 500:
		switch statusCode {
		case 401:
			return "authentication_error"
		case 403:
			return "authorization_error"
		case 404:
			return "not_found_error"
		case 429:
			return "rate_limit_error"
		default:
			return "client_error"
		}
	case statusCode >= 500:
		return "server_error"
	default:
		return "unknown_error"
	}
}

// getComponentFromPath determines the component based on request path
func getComponentFromPath(path string) string {
	switch {
	case strings.HasPrefix(path, "/admin/keys"):
		return "api_key_management"
	case strings.HasPrefix(path, "/admin/config"):
		return "configuration_management"
	case strings.HasPrefix(path, "/admin/stats"):
		return "statistics"
	case strings.HasPrefix(path, "/admin"):
		return "admin"
	case path == "/check":
		return "rate_limiting"
	case path == "/health":
		return "health_check"
	case path == "/metrics":
		return "metrics"
	default:
		return "unknown"
	}
}