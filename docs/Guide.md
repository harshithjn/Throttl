# Run and Deploy Throttl

## Local Development

### Prerequisites

- Docker and Docker Compose
- Go 1.21+ (for development)
- Node.js 18+ (for frontend development)

### Quick Start

```bash
# Clone the repository
git clone <repository-url>
cd throttl

# Start the complete platform
./scripts/start.sh

# Access the dashboard
open http://localhost
```

### Manual Setup

If you prefer to run components individually:

```bash
# Start dependencies
docker run -d --name throttl-redis -p 6379:6379 redis:7-alpine
docker run -d --name throttl-postgres -p 5432:5432 \
  -e POSTGRES_USER=throttl \
  -e POSTGRES_PASSWORD=throttl \
  -e POSTGRES_DB=throttl \
  postgres:15-alpine

# Initialize database
psql -h localhost -U throttl -d throttl -f scripts/setup.sql

# Set environment variables
export REDIS_URL=localhost:6379
export DATABASE_URL=postgres://throttl:throttl@localhost:5432/throttl?sslmode=disable
export PORT=8080

# Run the API
go run cmd/server/main.go

# Run the frontend (in another terminal)
cd frontend
npm install
npm run dev
```

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `REDIS_URL` | Redis connection string | `localhost:6379` |
| `DATABASE_URL` | PostgreSQL connection string | Required |
| `PORT` | HTTP server port | `8080` |
| `THROTTL_ENV` | Environment (development/production) | `development` |

### Testing the API

```bash
# Health check
curl http://localhost:8080/health

# Create a client
curl -X POST http://localhost:8080/admin/clients \
  -H 'Content-Type: application/json' \
  -d '{"name": "test-client", "description": "Test client"}'

# Test rate limiting (replace with actual API key)
curl -X POST http://localhost:8080/check \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer your-api-key' \
  -d '{"client_id": "test-client", "route": "/api/test", "identifier": "user123"}'
```

## Docker Deployment

### Using Docker Compose

The included `docker-compose.yml` provides a complete production-ready stack:

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Services Included

- **Throttl API**: Main rate limiting service
- **Frontend**: React admin dashboard
- **Redis**: Rate limiting state storage
- **PostgreSQL**: Configuration and audit storage
- **Prometheus**: Metrics collection
- **Grafana**: Monitoring dashboards
- **Nginx**: Reverse proxy and load balancer

### Custom Configuration

Create a `.env` file to override default settings:

```bash
# Database settings
POSTGRES_USER=throttl
POSTGRES_PASSWORD=your-secure-password
POSTGRES_DB=throttl

# Redis settings (if using external Redis)
REDIS_URL=your-redis-host:6379

# Application settings
THROTTL_ENV=production
```

## Kubernetes Deployment

### Prerequisites

- Kubernetes cluster (1.24+)
- kubectl configured
- Ingress controller (nginx, traefik, etc.)

### Deploy to Kubernetes

```bash
# Create namespace and apply manifests
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/

# Check deployment status
kubectl get pods -n throttl
kubectl get services -n throttl
```

### Configuration

Update `k8s/configmap.yaml` with your environment-specific values:

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: throttl-config
  namespace: throttl
data:
  REDIS_URL: "redis:6379"
  DATABASE_URL: "postgres://throttl:password@postgres:5432/throttl?sslmode=require"
  PORT: "8080"
  THROTTL_ENV: "production"
```

### Scaling

```bash
# Scale API instances
kubectl scale deployment throttl-api --replicas=5 -n throttl

# Scale frontend instances
kubectl scale deployment throttl-frontend --replicas=3 -n throttl
```

### Monitoring

```bash
# Port forward to access Grafana
kubectl port-forward service/grafana 3000:3000 -n throttl

# Port forward to access Prometheus
kubectl port-forward service/prometheus 9090:9090 -n throttl
```

## Cloud Deployment

### AWS (EKS)

```bash
# Create EKS cluster
eksctl create cluster --name throttl-cluster --region us-west-2

# Deploy application
kubectl apply -f k8s/

# Set up load balancer
kubectl apply -f k8s/ingress-aws.yaml
```

See `docs/DEPLOYMENT_AWS.md` for detailed AWS deployment instructions.

### Google Cloud (GKE)

```bash
# Create GKE cluster
gcloud container clusters create throttl-cluster \
  --zone us-central1-a \
  --num-nodes 3

# Deploy application
kubectl apply -f k8s/

# Set up ingress
kubectl apply -f k8s/ingress-gcp.yaml
```

See `docs/DEPLOYMENT_GCP.md` for detailed GCP deployment instructions.

### Azure (AKS)

```bash
# Create AKS cluster
az aks create \
  --resource-group throttl-rg \
  --name throttl-cluster \
  --node-count 3

# Deploy application
kubectl apply -f k8s/

# Set up ingress
kubectl apply -f k8s/ingress-azure.yaml
```

See `docs/DEPLOYMENT_AZURE.md` for detailed Azure deployment instructions.

## Production Considerations

### Security

1. **Use HTTPS**: Configure SSL certificates for all endpoints
2. **Secure Secrets**: Use Kubernetes secrets or cloud secret managers
3. **Network Policies**: Implement network segmentation
4. **Regular Updates**: Keep dependencies and base images updated

### Performance

1. **Resource Limits**: Set appropriate CPU and memory limits
2. **Connection Pooling**: Configure database connection pools
3. **Caching**: Enable Redis persistence for durability
4. **Monitoring**: Set up alerts for key metrics

### Backup and Recovery

1. **Database Backups**: Automated PostgreSQL backups
2. **Redis Persistence**: Configure RDB or AOF persistence
3. **Configuration Backup**: Version control for Kubernetes manifests
4. **Disaster Recovery**: Multi-region deployment for high availability

### Monitoring and Alerting

Key metrics to monitor:

- Request rate and latency
- Error rates
- Database and Redis performance
- Resource utilization
- Rate limiting effectiveness

Set up alerts for:

- High error rates (>1%)
- High latency (>50ms p95)
- Resource exhaustion (>80% CPU/memory)
- Service unavailability

## Troubleshooting

### Common Issues

**API not responding**:
```bash
# Check service status
kubectl get pods -n throttl
kubectl logs deployment/throttl-api -n throttl
```

**Database connection errors**:
```bash
# Verify database connectivity
kubectl exec -it deployment/throttl-api -n throttl -- \
  psql $DATABASE_URL -c "SELECT 1"
```

**Redis connection errors**:
```bash
# Test Redis connectivity
kubectl exec -it deployment/throttl-api -n throttl -- \
  redis-cli -h redis ping
```

**High latency**:
- Check Redis performance: `redis-cli --latency`
- Monitor database queries: Enable slow query logging
- Review resource limits: `kubectl top pods -n throttl`

### Performance Tuning

**Database optimization**:
```sql
-- Add indexes for frequently queried columns
CREATE INDEX CONCURRENTLY idx_rate_limits_client_route 
ON rate_limits(client_id, route_pattern);

-- Analyze query performance
EXPLAIN ANALYZE SELECT * FROM rate_limits WHERE client_id = 'test';
```

**Redis optimization**:
```bash
# Monitor Redis performance
redis-cli --latency-history
redis-cli info memory
```

**Application tuning**:
- Adjust connection pool sizes
- Configure garbage collection settings
- Enable HTTP/2 for better performance

This guide provides everything needed to run Throttl locally, deploy to production, and maintain the system effectively.