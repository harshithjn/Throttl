#!/bin/bash

echo "🔍 Throttl Platform Status Check"
echo "================================"

echo ""
echo "📊 Service Status:"
docker-compose ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}"

echo ""
echo "🌐 Service Health:"

# Check API health
echo -n "API (8080): "
if curl -s http://localhost:8080/health > /dev/null 2>&1; then
    echo "✅ Healthy"
else
    echo "❌ Not responding"
fi

# Check Frontend health
echo -n "Frontend (3001): "
if curl -s http://localhost:3001/health > /dev/null 2>&1; then
    echo "✅ Healthy"
else
    echo "❌ Not responding"
fi

# Check Prometheus
echo -n "Prometheus (9090): "
if curl -s http://localhost:9090/-/healthy > /dev/null 2>&1; then
    echo "✅ Healthy"
else
    echo "❌ Not responding"
fi

# Check Grafana
echo -n "Grafana (3002): "
if curl -s http://localhost:3002/api/health > /dev/null 2>&1; then
    echo "✅ Healthy"
else
    echo "❌ Not responding"
fi

echo ""
echo "🔗 Quick Links:"
echo "   Dashboard:    http://localhost:3001"
echo "   Landing Page: http://localhost:3001/landing"
echo "   API Health:   http://localhost:8080/health"
echo "   Grafana:      http://localhost:3002"
echo "   Prometheus:   http://localhost:9090"