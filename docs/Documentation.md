# Throttl Engineering Details

## Project Overview

### Problem Statement

Rate limiting in distributed systems is fundamentally challenging because decisions must be made in milliseconds while maintaining consistency across multiple service instances. Traditional approaches either sacrifice accuracy for speed (local counters) or speed for accuracy (database-based counters).

### Why Rate Limiting is Hard in Distributed Systems

1. **State Synchronization**: Multiple service instances need shared, consistent state
2. **Latency Requirements**: Rate limiting decisions must be sub-10ms to avoid impacting user experience
3. **Race Conditions**: Concurrent requests can cause counter inconsistencies
4. **Configuration Management**: Rules need to be updated without service restarts
5. **Multi-tenancy**: Different clients need isolated rate limiting policies

### Real-World Use Cases

- **API Gateway Protection**: Prevent abuse of public APIs
- **Database Protection**: Limit expensive query rates per user
- **Resource Throttling**: Control access to limited resources (file uploads, email sending)
- **DDoS Mitigation**: Automatic traffic shaping during attacks
- **Fair Usage**: Ensure equitable resource distribution among users

## Phase-wise Breakdown

### Phase 1: Core Distributed Rate Limiting Engine

**Objective**: Build the fundamental rate limiting engine with atomic operations.

**Key Components**:
- HTTP `/check` endpoint for rate limit decisions
- Token Bucket algorithm implementation
- Redis Lua scripts for atomic operations
- PostgreSQL for configuration storage
- Basic Prometheus metrics

**Why This Phase**: Established the core distributed state management pattern. Redis Lua scripts ensure atomicity without complex locking mechanisms. PostgreSQL provides ACID guarantees for configuration data.

### Phase 2: Dynamic Configuration & Multi-Algorithm Support

**Objective**: Add runtime configurability and algorithm flexibility.

**Key Components**:
- Dynamic configuration loading from PostgreSQL
- Sliding Window algorithm implementation
- Algorithm selection system
- Admin CRUD APIs for rate limit rules
- Enhanced database schema with constraints

**Why This Phase**: Real production systems need multiple algorithms for different use cases. Token Bucket is ideal for burst handling, while Sliding Window provides precise time-based limiting. Dynamic configuration eliminates deployment overhead.

### Phase 3: Security, Multi-Tenancy & Platform Readiness

**Objective**: Transform from single-tenant service to multi-tenant platform.

**Key Components**:
- API key authentication with SHA-256 hashing
- Multi-tenant data isolation
- Secure key lifecycle management (create/rotate/revoke)
- Audit logging for compliance
- Role-based access control

**Why This Phase**: Security and multi-tenancy are prerequisites for any platform serving multiple organizations. API key authentication provides simple but secure access control. Audit trails enable compliance with security standards.

### Phase 4: Observability, Reliability & Operations

**Objective**: Add production-grade monitoring and operational capabilities.

**Key Components**:
- Comprehensive Prometheus metrics (20+ metrics)
- Grafana dashboards for visualization
- Load testing framework
- Metrics collection service
- HTTP metrics middleware
- Alerting rules

**Why This Phase**: Production systems require deep observability. Metrics enable capacity planning, performance optimization, and incident response. Load testing validates system behavior under stress.

### Phase 5: Frontend Admin Dashboard & Production Deployment

**Objective**: Complete the platform with user interface and deployment automation.

**Key Components**:
- React/Next.js admin dashboard
- Real-time system monitoring
- API key management interface
- Rate limit configuration UI
- Docker Compose orchestration
- Kubernetes manifests
- Cloud deployment guides (AWS, GCP, Azure)

**Why This Phase**: A platform without a user interface is just a service. The admin dashboard makes the system accessible to non-technical users. Deployment automation reduces time-to-value for adopters.

## File-by-File Explanation

### Core Application (`cmd/server/main.go`)
**Purpose**: Application entry point and service initialization
**Interactions**: Initializes all subsystems, sets up HTTP routes, starts metrics collection
**Key Decisions**: Uses Gin for HTTP routing due to performance and middleware ecosystem

### Rate Limiting Engine (`internal/ratelimiter/`)

#### `token_bucket.go`
**Purpose**: Implements Token Bucket algorithm with Redis backend
**Why**: Token Bucket allows burst traffic while maintaining average rate limits
**Interactions**: Uses Redis Lua scripts for atomic token consumption
**Key Algorithm**: Tokens refill at constant rate, requests consume tokens, burst capacity prevents token accumulation

#### `sliding_window.go`
**Purpose**: Implements Sliding Window algorithm for precise time-based limiting
**Why**: Provides more predictable rate limiting than fixed windows
**Interactions**: Uses Redis sorted sets to track request timestamps
**Key Algorithm**: Maintains request timestamps in sliding time window, counts requests in current window

#### `limiter.go`
**Purpose**: Algorithm selection and unified interface
**Why**: Abstracts algorithm details from HTTP handlers
**Interactions**: Routes requests to appropriate algorithm based on configuration

### Storage Layer (`internal/storage/`)

#### `redis.go`
**Purpose**: Redis connection management and Lua script execution
**Why**: Redis provides sub-millisecond operations with atomic Lua scripts
**Interactions**: Executes rate limiting logic atomically, manages connection pooling
**Key Scripts**: Token bucket refill/consume, sliding window cleanup/count

#### `postgres.go`
**Purpose**: PostgreSQL connection and configuration management
**Why**: PostgreSQL provides ACID guarantees for configuration data
**Interactions**: Stores rate limit rules, API keys, audit logs
**Schema Design**: Normalized tables with foreign key constraints, indexes for performance

#### `config.go`
**Purpose**: Configuration loading and caching
**Why**: Reduces database load while providing fresh configuration
**Interactions**: Caches configuration in memory, refreshes on updates

### HTTP Handlers (`internal/handlers/`)

#### `check.go`
**Purpose**: Main rate limiting endpoint
**Why**: Core business logic endpoint
**Interactions**: Validates requests, calls rate limiter, returns decisions
**Performance**: Sub-10ms response time requirement drives simple request/response pattern

#### `admin.go`
**Purpose**: Administrative operations (API keys, clients)
**Why**: Platform management requires CRUD operations
**Interactions**: Manages API keys, client configurations, audit logging
**Security**: Requires admin-level authentication

#### `config.go`
**Purpose**: Rate limit rule management
**Why**: Dynamic configuration without service restarts
**Interactions**: CRUD operations on rate limit rules, triggers configuration refresh

### Middleware (`internal/middleware/`)

#### `auth.go`
**Purpose**: API key authentication and authorization
**Why**: Secures all endpoints, enables multi-tenancy
**Interactions**: Validates API keys, extracts client context, enforces permissions
**Security**: Uses SHA-256 hashing, constant-time comparison

#### `metrics.go`
**Purpose**: HTTP request metrics collection
**Why**: Observability into API performance and usage
**Interactions**: Wraps HTTP handlers, records latency/status/path metrics

### Monitoring (`internal/metrics/`)

#### `metrics.go`
**Purpose**: Prometheus metrics definitions
**Why**: Standardized metrics for monitoring and alerting
**Interactions**: Defines counters, histograms, gauges for system metrics

#### `collector.go`
**Purpose**: Custom metrics collection
**Why**: Business-specific metrics beyond standard HTTP metrics
**Interactions**: Collects rate limiting decisions, client usage, system health

### Frontend (`frontend/`)

#### `src/app/page.tsx`
**Purpose**: Main dashboard with system overview
**Why**: Single-pane-of-glass for system monitoring
**Interactions**: Displays metrics, system status, quick actions

#### `src/app/api-keys/page.tsx`
**Purpose**: API key management interface
**Why**: Self-service key management reduces operational overhead
**Interactions**: CRUD operations on API keys, usage tracking

#### `src/app/rate-limits/page.tsx`
**Purpose**: Rate limit rule configuration
**Why**: Visual interface for complex rate limiting rules
**Interactions**: Rule builder, algorithm selection, testing interface

### Deployment (`k8s/`, `docker-compose.yml`)

#### Kubernetes Manifests
**Purpose**: Production-grade container orchestration
**Why**: Horizontal scaling, service discovery, health checks
**Components**: Deployments, Services, ConfigMaps, Ingress controllers

#### Docker Compose
**Purpose**: Local development and simple production deployment
**Why**: Single-command stack deployment
**Services**: API, Frontend, Redis, PostgreSQL, Prometheus, Grafana, Nginx

## Architecture Decisions

### Why Redis for Rate Limiting State

**Chosen**: Redis with Lua scripts
**Alternatives Considered**: 
- In-memory counters (not distributed)
- Database counters (too slow)
- Distributed caches like Hazelcast (more complex)

**Reasoning**: Redis provides sub-millisecond operations with atomic Lua scripts. The combination of speed and atomicity is crucial for rate limiting. Redis persistence options provide durability when needed.

### Why PostgreSQL for Configuration

**Chosen**: PostgreSQL
**Alternatives Considered**:
- NoSQL databases (less consistency guarantees)
- Configuration files (not dynamic)
- Redis (not ideal for complex queries)

**Reasoning**: Configuration changes are infrequent but require ACID guarantees. PostgreSQL's relational model handles complex queries for reporting and analytics. Strong consistency prevents configuration conflicts.

### Why Token Bucket and Sliding Window

**Chosen**: Both algorithms with runtime selection
**Alternatives Considered**:
- Fixed window (less accurate)
- Leaky bucket (more complex implementation)
- Only one algorithm (less flexible)

**Reasoning**: Token Bucket handles burst traffic naturally while maintaining average rates. Sliding Window provides precise time-based limiting. Different use cases benefit from different algorithms.

### Why Prometheus + Grafana

**Chosen**: Prometheus for metrics, Grafana for visualization
**Alternatives Considered**:
- ELK stack (overkill for metrics)
- Custom metrics system (reinventing wheel)
- Cloud monitoring (vendor lock-in)

**Reasoning**: Prometheus is the de facto standard for metrics in cloud-native systems. Pull-based model scales well. Grafana provides rich visualization and alerting capabilities.

### Why Go for This System

**Chosen**: Go
**Alternatives Considered**:
- Java (higher memory usage, slower startup)
- Node.js (single-threaded, less predictable performance)
- Rust (steeper learning curve, smaller ecosystem)
- Python (too slow for rate limiting)

**Reasoning**: Go provides excellent performance for I/O-bound workloads like rate limiting. Built-in concurrency primitives handle high request volumes. Fast startup times benefit containerized deployments. Strong standard library reduces dependencies.

## Trade-offs & Limitations

### Intentional Limitations

1. **No Complex Rate Limiting Logic**: Throttl focuses on standard algorithms rather than custom business logic
2. **No Built-in Circuit Breaking**: Rate limiting and circuit breaking are separate concerns
3. **No Request Queuing**: Rejected requests are not queued for later processing
4. **Limited Algorithm Parameters**: Algorithms use standard parameters rather than extensive customization

### Areas for Future Improvement

1. **Geographic Distribution**: Multi-region deployment with eventual consistency
2. **Advanced Algorithms**: Adaptive rate limiting based on system load
3. **Integration Ecosystem**: SDKs for popular frameworks and languages
4. **Machine Learning**: Anomaly detection for automatic rate limit adjustment
5. **Performance**: Further optimization for sub-millisecond response times

### Scaling Limitations

1. **Redis Bottleneck**: Single Redis instance limits throughput to ~100K ops/sec
2. **PostgreSQL Writes**: Configuration updates limited by database write performance
3. **Memory Usage**: Large numbers of clients require proportional memory
4. **Network Latency**: Cross-region deployments add latency to rate limiting decisions

### Current Scale Targets

- **Throughput**: 50,000 requests/second per instance
- **Latency**: Sub-10ms response time (95th percentile)
- **Clients**: 10,000 concurrent clients per instance
- **Rules**: 100,000 rate limiting rules
- **Uptime**: 99.9% availability target

## Performance Characteristics

### Benchmarks

- **Token Bucket**: ~8ms average response time
- **Sliding Window**: ~12ms average response time
- **Memory Usage**: ~100MB base + ~1KB per active client
- **Redis Operations**: ~2-3 operations per rate limit check
- **Database Queries**: Configuration cached, ~1 query per minute per instance

### Optimization Techniques

1. **Connection Pooling**: Reuse database and Redis connections
2. **Configuration Caching**: In-memory cache with TTL refresh
3. **Lua Scripts**: Atomic operations reduce network round trips
4. **Prepared Statements**: Reduce SQL parsing overhead
5. **Goroutine Pools**: Limit concurrent request processing

This engineering documentation provides the technical depth needed to understand, maintain, and extend the Throttl platform. The architecture decisions balance performance, reliability, and operational simplicity while providing a foundation for future enhancements.