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

# Start frontend and reverse proxy Nginx
echo "7. Starting frontend and Nginx..."
docker-compose up -d frontend nginx

echo ""
echo "✅ Throttl Platform Started!"
echo ""
echo "🌐 Services:"
echo "   Dashboard & Landing Page: http://localhost (Port 80)"
echo "   API Base URL:            http://localhost/api"
echo ""
echo "📊 Check status: docker-compose ps"
echo "📋 View logs:    docker-compose logs -f [service]"