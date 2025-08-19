#!/bin/bash

# Contract & Invoice Reconciliation Platform - Development Startup Script

echo "🚀 Starting Contract & Invoice Reconciliation Platform"
echo "=================================================="

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Check if docker-compose is available
if ! command -v docker-compose &> /dev/null; then
    echo "❌ docker-compose is not installed. Please install Docker Compose."
    exit 1
fi

# Create environment files if they don't exist
if [ ! -f "./backend/.env" ]; then
    echo "📝 Creating backend environment file..."
    cp ./backend/.env.example ./backend/.env
    echo "⚠️  Please edit backend/.env with your configuration"
fi

if [ ! -f "./frontend/.env.local" ]; then
    echo "📝 Creating frontend environment file..."
    cp ./frontend/.env.example ./frontend/.env.local
fi

echo "🐳 Starting services with Docker Compose..."
docker-compose up -d

echo ""
echo "✅ Services starting! Please wait a moment for initialization..."
echo ""
echo "📊 Application URLs:"
echo "   Frontend: http://localhost:3000"
echo "   Backend API: http://localhost:3001"
echo "   Database: localhost:5432"
echo "   Redis: localhost:6379"
echo ""
echo "🔐 Default Admin Login:"
echo "   Email: admin@contractflow.com"
echo "   Password: admin123"
echo ""
echo "📋 Useful Commands:"
echo "   View logs: docker-compose logs -f"
echo "   Stop services: docker-compose down"
echo "   Restart services: docker-compose restart"
echo ""
echo "📖 For more information, see README.md"