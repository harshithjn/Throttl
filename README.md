# Throttl

A distributed rate limiting platform for protecting APIs at scale. Throttl provides sub-10ms rate limiting decisions with horizontal scaling, multi-tenancy, and real-time configuration updates.

## Architecture

Throttl uses a distributed architecture with Redis for shared state and PostgreSQL for configuration storage. The system supports multiple rate limiting algorithms (Token Bucket, Sliding Window) and provides a modern admin dashboard for management.

```
Client Apps → Load Balancer → Throttl API → Redis (rate data)
                                         → PostgreSQL (config)
```

## Tech Stack

- **Backend**: Go with Gin framework
- **Storage**: Redis for rate limiting state, PostgreSQL for configuration
- **Frontend**: React/Next.js with TypeScript and Tailwind CSS
- **Deployment**: Docker Compose

## Why This Project Exists

Rate limiting is critical for API protection but becomes complex in distributed systems. Existing solutions are either too expensive (cloud services charge per request) or too basic (single-node solutions). Throttl provides enterprise-grade rate limiting that organizations can self-host and customize.

## Quick Start

```bash
# Start the complete platform
./scripts/start.sh

# Access the dashboard
open http://localhost
```


