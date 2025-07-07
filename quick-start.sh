#!/bin/bash

# Homelab Visualizer Quick Start Script
# This script will build and run the application using Docker Compose

set -e

echo "🚀 Homelab Visualizer Quick Start"
echo "=================================="

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Create data directory if it doesn't exist
if [ ! -d "data" ]; then
    echo "📁 Creating data directory..."
    mkdir -p data
fi

# Build the Docker image
echo "🔨 Building Docker image..."
docker build -f docker/Dockerfile -t homelab-visualiser:latest .

# Start the application
echo "🚀 Starting Homelab Visualizer..."
docker-compose up -d

# Wait a moment for the container to start
sleep 3

# Check if the container is running
if docker-compose ps | grep -q "Up"; then
    echo "✅ Homelab Visualizer is now running!"
    echo "🌐 Access the application at: http://localhost:3000"
    echo ""
    echo "📁 Your data will be stored in: ./data/containers.json"
    echo ""
    echo "To stop the application, run: docker-compose down"
    echo "To view logs, run: docker-compose logs -f"
else
    echo "❌ Failed to start the application. Check the logs:"
    docker-compose logs
    exit 1
fi 