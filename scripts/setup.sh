#!/bin/bash

# CalAi Setup Script
set -e

echo "🚀 Setting up CalAi development environment..."

# Check prerequisites
check_prerequisites() {
    echo "📋 Checking prerequisites..."
    
    if ! command -v node &> /dev/null; then
        echo "❌ Node.js is required. Please install Node.js 18+"
        exit 1
    fi
    
    if ! command -v python3 &> /dev/null; then
        echo "❌ Python 3.9+ is required"
        exit 1
    fi
    
    if ! command -v elixir &> /dev/null; then
        echo "❌ Elixir is required. Please install Elixir 1.14+"
        exit 1
    fi
    
    if ! command -v docker &> /dev/null; then
        echo "❌ Docker is required"
        exit 1
    fi
    
    echo "✅ Prerequisites check passed"
}

# Setup backend
setup_backend() {
    echo "🔧 Setting up Phoenix backend..."
    cd backend
    
    # Install dependencies
    mix deps.get
    
    # Create database
    mix ecto.create
    mix ecto.migrate
    
    # Seed database
    mix run priv/repo/seeds.exs
    
    cd ..
}

# Setup frontend
setup_frontend() {
    echo "📱 Setting up React Native frontend..."
    cd app
    
    # Install dependencies
    npm install
    
    # Install iOS dependencies (if on macOS)
    if [[ "$OSTYPE" == "darwin"* ]]; then
        cd ios && pod install && cd ..
    fi
    
    cd ..
}

# Setup AI environment
setup_ai() {
    echo "🧠 Setting up AI training environment..."
    cd ai
    
    # Create virtual environment
    python3 -m venv venv
    source venv/bin/activate
    
    # Install dependencies
    pip install -r requirements.txt
    
    # Download initial datasets
    python scripts/download_datasets.py
    
    cd ..
}

# Setup Docker environment
setup_docker() {
    echo "🐳 Setting up Docker environment..."
    
    # Build development containers
    docker-compose build
    
    # Start databases
    docker-compose up -d postgres redis
    
    echo "⏳ Waiting for databases to be ready..."
    sleep 10
}

# Create initial directories
create_directories() {
    echo "📁 Creating project directories..."
    
    mkdir -p {app,backend,ai,deploy,docs,scripts}
    mkdir -p app/src/{screens,components,services,wasm,assets,utils,types}
    mkdir -p backend/lib/calai/{api,models,jobs,services}
    mkdir -p backend/lib/calai_web/{controllers,views,templates}
    mkdir -p backend/priv/repo/{migrations,seeds}
    mkdir -p ai/{datasets,training,models,export,scripts,tests}
    mkdir -p deploy/{k8s,terraform,scripts}
    mkdir -p docs/{api,architecture,deployment}
}

# Generate environment files
generate_env_files() {
    echo "⚙️ Generating environment files..."
    
    # Backend .env
    cat > backend/.env << EOF
DATABASE_URL=postgres://postgres:postgres@localhost:5432/calai_dev
REDIS_URL=redis://localhost:6379
SECRET_KEY_BASE=$(mix phx.gen.secret)
PHX_HOST=localhost
PHX_PORT=4000
ENVIRONMENT=development
LOG_LEVEL=debug
FOOD_API_KEY=your_food_api_key_here
HUGGINGFACE_API_KEY=your_hf_api_key_here
EOF

    # Frontend .env
    cat > app/.env << EOF
API_BASE_URL=http://localhost:4000/api/v1
MODEL_CDN_URL=http://localhost:8080/models
ENVIRONMENT=development
ENABLE_FLIPPER=true
EOF

    # AI .env
    cat > ai/.env << EOF
KAGGLE_USERNAME=your_kaggle_username
KAGGLE_KEY=your_kaggle_key
HUGGINGFACE_HUB_TOKEN=your_hf_token
WANDB_API_KEY=your_wandb_key
PYTHONPATH=/workspace
EOF
}

# Main setup function
main() {
    echo "🎯 CalAi Development Environment Setup"
    echo "====================================="
    
    check_prerequisites
    create_directories
    generate_env_files
    setup_docker
    setup_backend
    setup_frontend
    setup_ai
    
    echo ""
    echo "🎉 Setup complete!"
    echo ""
    echo "Next steps:"
    echo "1. Update API keys in .env files"
    echo "2. Start development: docker-compose up"
    echo "3. Access app at http://localhost:4000"
    echo "4. Run mobile app: cd app && npm run ios/android"
    echo ""
    echo "For AI training: cd ai && python train.py"
    echo "For more info: see README.md"
}

main "$@"
