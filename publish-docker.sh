#!/bin/bash

# Homelab Visualizer Docker Publishing Script
# This script helps publish the Docker image to a registry

set -e

# Configuration
DOCKER_USERNAME=${DOCKER_USERNAME:-"yourusername"}
IMAGE_NAME="homelab-visualiser"
TAG=${TAG:-"latest"}
REGISTRY=${REGISTRY:-"docker.io"}  # docker.io for Docker Hub, ghcr.io for GitHub, etc.

echo "🐳 Homelab Visualizer Docker Publishing"
echo "======================================="

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if user is logged in to Docker
if ! docker info &> /dev/null; then
    echo "❌ You are not logged in to Docker. Please run 'docker login' first."
    exit 1
fi

# Build the image
echo "🔨 Building Docker image..."
docker build -f docker/Dockerfile -t ${IMAGE_NAME}:${TAG} .

# Tag for registry
FULL_IMAGE_NAME="${REGISTRY}/${DOCKER_USERNAME}/${IMAGE_NAME}:${TAG}"
echo "🏷️ Tagging image as: ${FULL_IMAGE_NAME}"
docker tag ${IMAGE_NAME}:${TAG} ${FULL_IMAGE_NAME}

# Push to registry
echo "📤 Pushing to ${REGISTRY}..."
docker push ${FULL_IMAGE_NAME}

echo "✅ Successfully published ${FULL_IMAGE_NAME}"
echo ""
echo "📋 To use this image, update your docker-compose.yml:"
echo "   image: ${FULL_IMAGE_NAME}"
echo ""
echo "🔗 Or pull it on another machine:"
echo "   docker pull ${FULL_IMAGE_NAME}" 