#!/bin/bash

echo "🚀 Throttl Platform - Clean Restart"
echo "=================================="

# Stop all services and clean volumes
echo "1. Stopping all services..."
docker-compose down -v

# Clean up any orphaned containers
echo "2. Cleaning up..."
docker system prune -f

# Start core services first
echo "3. Starting core services..."
docker-compose up -d redis postgres

# Wait for databases to be ready
echo "4. Waiting for databases..."
sleep 10

# Start application services
echo "5. Starting application..."
docker-compose up -d throttl

# Wait for API to be ready
echo "6. Waiting for API..."
sleep 5

# Start monitoring and frontend
echo "7. Starting monitoring and frontend..."
docker-compose up -d prometheus grafana frontend

echo ""
echo "✅ Throttl Platform Started!"
echo ""
echo "🌐 Services:"
echo "   Dashboard:    http://localhost:3001"
echo "   Landing Page: http://localhost:3001/landing"
echo "   API:          http://localhost:8080"
echo "   Grafana:      http://localhost:3002 (admin/admin)"
echo "   Prometheus:   http://localhost:9090"
echo ""
echo "📊 Check status: docker-compose ps"
echo "📋 View logs:    docker-compose logs -f [service]"