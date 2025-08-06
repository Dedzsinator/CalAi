#!/bin/bash

# CalAi Deployment Script
set -e

echo "🚀 CalAi Deployment Script"
echo "=========================="

# Configuration
ENVIRONMENT=${1:-development}
VERSION=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="./backups"
LOG_FILE="deploy_${VERSION}.log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a $LOG_FILE
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a $LOG_FILE
    exit 1
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1" | tee -a $LOG_FILE
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a $LOG_FILE
}

# Verify environment
verify_environment() {
    log "Verifying environment: $ENVIRONMENT"
    
    if [[ ! "$ENVIRONMENT" =~ ^(development|staging|production)$ ]]; then
        error "Invalid environment. Use: development, staging, or production"
    fi
    
    # Check required tools
    command -v docker >/dev/null 2>&1 || error "Docker is required"
    command -v docker-compose >/dev/null 2>&1 || error "Docker Compose is required"
    
    if [ "$ENVIRONMENT" = "production" ]; then
        command -v kubectl >/dev/null 2>&1 || warning "kubectl not found - skipping k8s deployment"
    fi
    
    success "Environment verification completed"
}

# Backup database
backup_database() {
    log "Creating database backup..."
    
    mkdir -p $BACKUP_DIR
    
    if [ "$ENVIRONMENT" = "production" ]; then
        # Production backup
        kubectl exec -n calai deployment/postgres -- pg_dump -U postgres calai_prod > $BACKUP_DIR/backup_${VERSION}.sql
    else
        # Development/staging backup
        docker-compose exec -T postgres pg_dump -U postgres calai_dev > $BACKUP_DIR/backup_${VERSION}.sql
    fi
    
    if [ $? -eq 0 ]; then
        success "Database backup created: $BACKUP_DIR/backup_${VERSION}.sql"
    else
        error "Database backup failed"
    fi
}

# Build and deploy backend
deploy_backend() {
    log "Deploying backend..."
    
    cd backend
    
    # Install dependencies
    log "Installing Elixir dependencies..."
    mix deps.get --only prod
    
    # Compile
    log "Compiling backend..."
    MIX_ENV=prod mix compile
    
    # Run migrations
    log "Running database migrations..."
    MIX_ENV=prod mix ecto.migrate
    
    if [ "$ENVIRONMENT" = "production" ]; then
        # Production deployment with Docker
        log "Building production Docker image..."
        docker build -t calai-backend:$VERSION -f Dockerfile.prod .
        docker tag calai-backend:$VERSION calai-backend:latest
        
        # Deploy to Kubernetes
        if command -v kubectl >/dev/null 2>&1; then
            log "Deploying to Kubernetes..."
            sed "s/{{VERSION}}/$VERSION/g" ../deploy/k8s/backend-deployment.yaml | kubectl apply -f -
            kubectl rollout status deployment/calai-backend -n calai
        fi
    else
        # Development/staging with docker-compose
        log "Building development Docker image..."
        docker-compose build backend
        docker-compose up -d backend
    fi
    
    cd ..
    success "Backend deployment completed"
}

# Build and deploy frontend
deploy_frontend() {
    log "Deploying frontend..."
    
    cd app
    
    # Install dependencies
    log "Installing Node.js dependencies..."
    npm ci
    
    # Type check
    log "Running type check..."
    npm run type-check
    
    # Build for different platforms
    if [ "$ENVIRONMENT" = "production" ]; then
        log "Building production Android APK..."
        cd android && ./gradlew assembleRelease && cd ..
        
        if [[ "$OSTYPE" == "darwin"* ]]; then
            log "Building production iOS archive..."
            cd ios && xcodebuild archive -workspace CalAi.xcworkspace -scheme CalAi -configuration Release && cd ..
        fi
    else
        log "Starting Metro bundler..."
        npm start &
        METRO_PID=$!
        echo $METRO_PID > metro.pid
    fi
    
    cd ..
    success "Frontend deployment completed"
}

# Deploy AI models
deploy_ai_models() {
    log "Deploying AI models..."
    
    cd ai
    
    # Check if models exist
    if [ ! -d "models" ] || [ -z "$(ls -A models)" ]; then
        warning "No trained models found. Skipping AI model deployment."
        warning "Run 'python train.py' to train models first."
        cd ..
        return
    fi
    
    # Export models to ONNX if not already done
    if [ ! -f "models/food_classifier.onnx" ]; then
        log "Exporting models to ONNX format..."
        python export_onnx.py --model models/best_model.pth --output models/food_classifier.onnx
    fi
    
    # Upload to CDN/model server
    if [ "$ENVIRONMENT" = "production" ]; then
        log "Uploading models to CDN..."
        # aws s3 sync models/ s3://calai-models/ --delete
        # Or use your preferred CDN upload method
        warning "CDN upload not configured. Models are available locally."
    else
        log "Starting local model server..."
        docker-compose up -d model-server
    fi
    
    cd ..
    success "AI models deployment completed"
}

# Health checks
run_health_checks() {
    log "Running health checks..."
    
    # Wait for services to start
    sleep 10
    
    # Check backend health
    if [ "$ENVIRONMENT" = "production" ]; then
        BACKEND_URL="https://api.calai.app"
    else
        BACKEND_URL="http://localhost:4000"
    fi
    
    log "Checking backend health at $BACKEND_URL/health"
    HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" $BACKEND_URL/health || echo "000")
    
    if [ "$HTTP_STATUS" = "200" ]; then
        success "Backend health check passed"
    else
        error "Backend health check failed (HTTP $HTTP_STATUS)"
    fi
    
    # Check database connection
    log "Checking database connection..."
    if [ "$ENVIRONMENT" = "production" ]; then
        kubectl exec -n calai deployment/postgres -- pg_isready -U postgres
    else
        docker-compose exec postgres pg_isready -U postgres
    fi
    
    if [ $? -eq 0 ]; then
        success "Database health check passed"
    else
        error "Database health check failed"
    fi
    
    # Check Redis connection
    log "Checking Redis connection..."
    if [ "$ENVIRONMENT" = "production" ]; then
        kubectl exec -n calai deployment/redis -- redis-cli ping
    else
        docker-compose exec redis redis-cli ping
    fi
    
    if [ $? -eq 0 ]; then
        success "Redis health check passed"
    else
        warning "Redis health check failed"
    fi
}

# Post-deployment tasks
post_deployment() {
    log "Running post-deployment tasks..."
    
    # Warm up application
    if [ "$ENVIRONMENT" = "production" ]; then
        log "Warming up application..."
        curl -s $BACKEND_URL/api/v1/foods/search?query=apple > /dev/null
    fi
    
    # Send deployment notification
    if [ -n "$SLACK_WEBHOOK_URL" ]; then
        log "Sending deployment notification..."
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"text\":\"✅ CalAi $ENVIRONMENT deployment completed successfully (v$VERSION)\"}" \
            $SLACK_WEBHOOK_URL
    fi
    
    success "Post-deployment tasks completed"
}

# Rollback function
rollback() {
    log "Rolling back deployment..."
    
    if [ "$ENVIRONMENT" = "production" ]; then
        kubectl rollout undo deployment/calai-backend -n calai
        kubectl rollout undo deployment/calai-frontend -n calai
    else
        docker-compose down
        docker-compose up -d
    fi
    
    success "Rollback completed"
}

# Main deployment flow
main() {
    log "Starting CalAi deployment (Environment: $ENVIRONMENT, Version: $VERSION)"
    
    # Trap errors and rollback
    trap 'error "Deployment failed. Check logs: $LOG_FILE"' ERR
    
    verify_environment
    
    if [ "$ENVIRONMENT" != "development" ]; then
        backup_database
    fi
    
    deploy_backend
    deploy_frontend
    deploy_ai_models
    run_health_checks
    post_deployment
    
    success "🎉 CalAi deployment completed successfully!"
    success "Version: $VERSION"
    success "Environment: $ENVIRONMENT"
    success "Logs: $LOG_FILE"
    
    if [ "$ENVIRONMENT" = "development" ]; then
        echo ""
        echo "Development URLs:"
        echo "  Backend API: http://localhost:4000"
        echo "  Frontend: Metro bundler on port 8081"
        echo "  Database: localhost:5432"
        echo "  Redis: localhost:6379"
        echo ""
        echo "To stop services: docker-compose down"
        echo "To view logs: docker-compose logs -f"
    fi
}

# Handle command line arguments
case "${1:-}" in
    "development"|"staging"|"production")
        main
        ;;
    "rollback")
        rollback
        ;;
    "health")
        run_health_checks
        ;;
    *)
        echo "Usage: $0 {development|staging|production|rollback|health}"
        echo ""
        echo "Examples:"
        echo "  $0 development  # Deploy to development environment"
        echo "  $0 production   # Deploy to production environment"
        echo "  $0 rollback     # Rollback last deployment"
        echo "  $0 health       # Run health checks only"
        exit 1
        ;;
esac
