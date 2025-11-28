package metrics

import (
	"github.com/prometheus/client_golang/prometheus"
)

var (
	RequestsAllowed = prometheus.NewCounterVec(
		prometheus.CounterOpts{
			Name: "throttl_requests_allowed_total",
			Help: "Total number of allowed requests",
		},
		[]string{"user_id", "route"},
	)

	RequestsBlocked = prometheus.NewCounterVec(
		prometheus.CounterOpts{
			Name: "throttl_requests_blocked_total",
			Help: "Total number of blocked requests",
		},
		[]string{"user_id", "route"},
	)

	RequestLatency = prometheus.NewHistogramVec(
		prometheus.HistogramOpts{
			Name:    "throttl_request_latency_seconds",
			Help:    "Latency of /check requests",
			Buckets: prometheus.DefBuckets,
		},
		[]string{"route"},
	)
)

func Init() {
	prometheus.MustRegister(RequestsAllowed)
	prometheus.MustRegister(RequestsBlocked)
	prometheus.MustRegister(RequestLatency)
}
