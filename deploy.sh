#!/bin/bash

# Homelab Visualizer Deployment Script
# This script automates the entire deployment process:
# 1. Git operations (commit, push)
# 2. Docker build and tag
# 3. Publish to GitHub Container Registry

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
REPO_NAME="homelab-visualiser"
REGISTRY="ghcr.io"
DOCKER_USERNAME="pradt"
PACKAGE_JSON_PATH="backend/package.json"

echo -e "${BLUE}🚀 Homelab Visualizer Deployment Script${NC}"
echo "=============================================="

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check if required tools are installed
check_dependencies() {
    print_info "Checking dependencies..."
    
    if ! command -v git &> /dev/null; then
        print_error "Git is not installed. Please install Git first."
        exit 1
    fi
    
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    # Check for jq and install if needed
    if ! command -v jq &> /dev/null; then
        print_warning "jq is not installed. Attempting to install..."
        
        # Detect package manager and install jq
        if command -v apt-get &> /dev/null; then
            print_info "Installing jq using apt-get..."
            sudo apt-get update && sudo apt-get install -y jq
        elif command -v yum &> /dev/null; then
            print_info "Installing jq using yum..."
            sudo yum install -y jq
        elif command -v dnf &> /dev/null; then
            print_info "Installing jq using dnf..."
            sudo dnf install -y jq
        elif command -v brew &> /dev/null; then
            print_info "Installing jq using brew..."
            brew install jq
        else
            print_error "Could not install jq automatically. Please install jq manually."
            print_info "You can install jq from: https://stedolan.github.io/jq/download/"
            exit 1
        fi
        
        # Verify installation
        if ! command -v jq &> /dev/null; then
            print_error "Failed to install jq. Please install manually."
            exit 1
        fi
        
        print_status "jq installed successfully"
    fi
    
    print_status "All dependencies are installed"
}

# Get current branch
get_current_branch() {
    git branch --show-current
}

# Get available branches
get_available_branches() {
    git branch -r | sed 's/origin\///' | grep -v HEAD
}

# Read version from package.json with fallback
get_version() {
    if [ ! -f "$PACKAGE_JSON_PATH" ]; then
        print_error "package.json not found at $PACKAGE_JSON_PATH"
        exit 1
    fi
    
    local version=""
    
    # Try using jq first
    if command -v jq &> /dev/null; then
        version=$(jq -r '.version' "$PACKAGE_JSON_PATH" 2>/dev/null)
        if [ "$version" != "null" ] && [ -n "$version" ]; then
            echo "$version"
            return 0
        fi
    fi
    
    # Fallback: use grep and sed
    print_warning "jq not available, using fallback method to read version"
    version=$(grep '"version"' "$PACKAGE_JSON_PATH" | sed 's/.*"version":\s*"\([^"]*\)".*/\1/')
    
    if [ -z "$version" ]; then
        print_error "Could not read version from $PACKAGE_JSON_PATH"
        exit 1
    fi
    
    echo "$version"
}

# Check if user is logged into Docker
check_docker_auth() {
    if ! docker info &> /dev/null; then
        print_warning "You are not logged in to Docker"
        return 1
    fi
    
    # Check if logged into ghcr.io
    if ! docker info | grep -q "ghcr.io"; then
        print_warning "You are not logged in to GitHub Container Registry"
        return 1
    fi
    
    return 0
}

# Login to GitHub Container Registry
login_to_ghcr() {
    local token="$1"
    
    if [ -z "$token" ]; then
        print_error "Personal Access Token is required"
        exit 1
    fi
    
    print_info "Logging in to GitHub Container Registry..."
    echo "$token" | docker login ghcr.io -u "$DOCKER_USERNAME" --password-stdin
    
    if [ $? -eq 0 ]; then
        print_status "Successfully logged in to GitHub Container Registry"
    else
        print_error "Failed to login to GitHub Container Registry"
        exit 1
    fi
}

# Git operations
git_operations() {
    local branch="$1"
    local commit_message="$2"
    
    print_info "Performing Git operations..."
    
    # Check if there are changes to commit
    if git diff-index --quiet HEAD --; then
        print_warning "No changes to commit - skipping git operations"
        return 0
    fi
    
    # Check if we're on the right branch
    local current_branch=$(get_current_branch)
    if [ "$current_branch" != "$branch" ]; then
        print_warning "Current branch ($current_branch) differs from target branch ($branch)"
        read -p "Switch to branch $branch? (y/N): " switch_branch
        if [[ $switch_branch =~ ^[Yy]$ ]]; then
            git checkout "$branch"
            print_status "Switched to branch $branch"
        else
            print_error "Deployment cancelled - branch mismatch"
            exit 1
        fi
    fi
    
    # Add all changes
    git add .
    print_status "Added all changes to staging"
    
    # Commit changes
    git commit -m "$commit_message"
    print_status "Committed changes: $commit_message"
    
    # Push to remote
    git push origin "$branch"
    print_status "Pushed to origin/$branch"
}

# Build and tag Docker image
build_docker_image() {
    local version="$1"
    
    print_info "Building Docker image..."
    
    # Build the image
    docker build -f docker/Dockerfile -t "$REPO_NAME:$version" .
    print_status "Built image: $REPO_NAME:$version"
    
    # Tag as latest
    docker tag "$REPO_NAME:$version" "$REPO_NAME:latest"
    print_status "Tagged as latest"
    
    # Tag for GitHub Container Registry
    docker tag "$REPO_NAME:$version" "$REGISTRY/$DOCKER_USERNAME/$REPO_NAME:$version"
    docker tag "$REPO_NAME:latest" "$REGISTRY/$DOCKER_USERNAME/$REPO_NAME:latest"
    print_status "Tagged for GitHub Container Registry"
}

# Push to GitHub Container Registry
push_to_ghcr() {
    local version="$1"
    
    print_info "Pushing to GitHub Container Registry..."
    
    # Push versioned tag
    docker push "$REGISTRY/$DOCKER_USERNAME/$REPO_NAME:$version"
    print_status "Pushed $REGISTRY/$DOCKER_USERNAME/$REPO_NAME:$version"
    
    # Push latest tag
    docker push "$REGISTRY/$DOCKER_USERNAME/$REPO_NAME:latest"
    print_status "Pushed $REGISTRY/$DOCKER_USERNAME/$REPO_NAME:latest"
}

# Main deployment function
deploy() {
    local branch="$1"
    local commit_message="$2"
    local token="$3"
    
    print_info "Starting deployment process..."
    
    # Check dependencies
    check_dependencies
    
    # Get version
    local version=$(get_version)
    print_info "Version from package.json: $version"
    
    # Check Docker authentication
    if ! check_docker_auth; then
        if [ -z "$token" ]; then
            print_error "Personal Access Token required for GitHub Container Registry"
            print_info "Please provide a token with 'write:packages' permission"
            exit 1
        fi
        login_to_ghcr "$token"
    fi
    
    # Git operations
    git_operations "$branch" "$commit_message"
    
    # Build Docker image
    build_docker_image "$version"
    
    # Push to GitHub Container Registry
    push_to_ghcr "$version"
    
    print_status "Deployment completed successfully!"
    echo ""
    print_info "Images available at:"
    echo "  $REGISTRY/$DOCKER_USERNAME/$REPO_NAME:$version"
    echo "  $REGISTRY/$DOCKER_USERNAME/$REPO_NAME:latest"
    echo ""
    print_info "To use the image:"
    echo "  docker pull $REGISTRY/$DOCKER_USERNAME/$REPO_NAME:latest"
}

# Interactive mode
interactive_mode() {
    print_info "Interactive deployment mode"
    echo ""
    
    # Get current branch
    local current_branch=$(get_current_branch)
    print_info "Current branch: $current_branch"
    
    # Ask for branch
    echo "Available branches:"
    get_available_branches | nl
    echo ""
    read -p "Enter branch to deploy to (default: $current_branch): " branch
    branch=${branch:-$current_branch}
    
    # Ask for commit message
    read -p "Enter commit message: " commit_message
    if [ -z "$commit_message" ]; then
        print_error "Commit message is required"
        exit 1
    fi
    
    # Check if Docker auth is needed
    local token=""
    if ! check_docker_auth; then
        read -s -p "Enter GitHub Personal Access Token: " token
        echo ""
        if [ -z "$token" ]; then
            print_error "Token is required for GitHub Container Registry"
            exit 1
        fi
    fi
    
    # Confirm deployment
    echo ""
    print_warning "Deployment Summary:"
    echo "  Branch: $branch"
    echo "  Commit message: $commit_message"
    echo "  Version: $(get_version)"
    echo ""
    read -p "Proceed with deployment? (y/N): " confirm
    
    if [[ $confirm =~ ^[Yy]$ ]]; then
        deploy "$branch" "$commit_message" "$token"
    else
        print_info "Deployment cancelled"
        exit 0
    fi
}

# Non-interactive mode
non_interactive_mode() {
    local branch="$1"
    local commit_message="$2"
    local token="$3"
    
    if [ -z "$branch" ] || [ -z "$commit_message" ]; then
        print_error "Usage: $0 --branch <branch> --message <commit_message> [--token <token>]"
        exit 1
    fi
    
    deploy "$branch" "$commit_message" "$token"
}

# Show help
show_help() {
    echo "Homelab Visualizer Deployment Script"
    echo ""
    echo "Usage:"
    echo "  $0                    # Interactive mode"
    echo "  $0 --help             # Show this help"
    echo "  $0 --branch <branch> --message <commit_message> [--token <token>]  # Non-interactive mode"
    echo ""
    echo "Options:"
    echo "  --branch <branch>     Branch to deploy to"
    echo "  --message <message>   Commit message"
    echo "  --token <token>       GitHub Personal Access Token (if not logged in)"
    echo ""
    echo "Examples:"
    echo "  $0"
    echo "  $0 --branch main --message 'feat: Add new feature'"
    echo "  $0 --branch main --message 'fix: Bug fix' --token ghp_xxxxxxxx"
}

# Parse command line arguments
if [ "$1" = "--help" ] || [ "$1" = "-h" ]; then
    show_help
    exit 0
fi

if [ $# -eq 0 ]; then
    interactive_mode
else
    # Parse non-interactive arguments
    branch=""
    commit_message=""
    token=""
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            --branch)
                branch="$2"
                shift 2
                ;;
            --message)
                commit_message="$2"
                shift 2
                ;;
            --token)
                token="$2"
                shift 2
                ;;
            *)
                print_error "Unknown option: $1"
                show_help
                exit 1
                ;;
        esac
    done
    
    non_interactive_mode "$branch" "$commit_message" "$token"
fi 