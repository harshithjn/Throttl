#!/bin/bash

# Throttl Platform Management Script
# Usage: ./throttl.sh [start|stop|restart|status|logs]

case "$1" in
    start)
        echo "🚀 Starting Throttl Platform..."
        docker-compose up -d
        echo "✅ Platform started!"
        echo "🌐 Dashboard: http://localhost:3001"
        ;;
    stop)
        echo "🛑 Stopping Throttl Platform..."
        docker-compose down
        echo "✅ Platform stopped!"
        ;;
    restart)
        echo "🔄 Restarting Throttl Platform..."
        ./restart.sh
        ;;
    status)
        ./status.sh
        ;;
    logs)
        if [ -z "$2" ]; then
            echo "📋 Showing all service logs..."
            docker-compose logs -f
        else
            echo "📋 Showing logs for $2..."
            docker-compose logs -f "$2"
        fi
        ;;
    *)
        echo "Throttl Platform Management"
        echo "=========================="
        echo ""
        echo "Usage: $0 {start|stop|restart|status|logs [service]}"
        echo ""
        echo "Commands:"
        echo "  start    - Start all services"
        echo "  stop     - Stop all services"
        echo "  restart  - Clean restart with database reset"
        echo "  status   - Check service health"
        echo "  logs     - View logs (optionally for specific service)"
        echo ""
        echo "Services: throttl, frontend, postgres, redis, prometheus, grafana"
        echo ""
        echo "Quick Links:"
        echo "  Dashboard:    http://localhost:3001"
        echo "  Landing Page: http://localhost:3001/landing"
        echo "  API:          http://localhost:8080"
        echo "  Grafana:      http://localhost:3002"
        echo "  Prometheus:   http://localhost:9090"
        ;;
esac