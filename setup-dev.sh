#!/bin/bash

# CalAi Development Setup Script
# This script sets up the complete development environment

echo "🚀 Setting up CalAi Development Environment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is installed and running
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed. Please install Docker first."
    exit 1
fi

if ! docker info &> /dev/null; then
    print_error "Docker is not running. Please start Docker first."
    exit 1
fi

print_success "Docker is installed and running"

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

print_success "Docker Compose is installed"

# Start the databases
print_status "Starting TimescaleDB and Redis..."
docker-compose up -d postgres redis

# Wait for databases to be ready
print_status "Waiting for databases to be ready..."
sleep 10

# Test database connections
print_status "Testing database connections..."

# Test PostgreSQL/TimescaleDB
if docker-compose exec -T postgres pg_isready -U postgres; then
    print_success "TimescaleDB is ready"
else
    print_error "TimescaleDB is not responding"
    exit 1
fi

# Test Redis
if docker-compose exec -T redis redis-cli ping | grep -q PONG; then
    print_success "Redis is ready"
else
    print_error "Redis is not responding"
    exit 1
fi

# Check if Elixir/Erlang is installed
if ! command -v elixir &> /dev/null; then
    print_warning "Elixir is not installed. Please install Elixir 1.15+ and Erlang/OTP 26+"
    print_status "You can install using:"
    echo "  - asdf: asdf install elixir 1.15.7-otp-26 && asdf install erlang 26.1.2"
    echo "  - Homebrew (macOS): brew install elixir"
    echo "  - Package manager (Linux): check your distribution's package manager"
    exit 1
fi

print_success "Elixir is installed"

# Set up Elixir backend
print_status "Setting up Elixir backend..."
cd backend

# Install dependencies
print_status "Installing Elixir dependencies..."
mix deps.get

# Create database
print_status "Setting up database..."
mix ecto.create

# Run migrations
print_status "Running database migrations..."
mix ecto.migrate

# Install Node.js dependencies for frontend
cd ../frontend
print_status "Setting up React Native frontend..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_warning "Node.js is not installed. Please install Node.js 18+ and npm/yarn"
    exit 1
fi

print_success "Node.js is installed"

# Check if yarn is available, otherwise use npm
if command -v yarn &> /dev/null; then
    print_status "Installing dependencies with yarn..."
    yarn install
else
    print_status "Installing dependencies with npm..."
    npm install
fi

# Set up Python AI environment
cd ../ai
print_status "Setting up Python AI environment..."

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    print_warning "Python 3 is not installed. Please install Python 3.9+"
    exit 1
fi

print_success "Python 3 is installed"

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    print_status "Creating Python virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment and install dependencies
print_status "Installing Python dependencies..."
source venv/bin/activate
pip install -r requirements.txt

# Return to project root
cd ..

print_success "✅ CalAi development environment setup complete!"
print_status ""
print_status "🎯 Next steps:"
print_status "1. Start the backend: cd backend && mix phx.server"
print_status "2. Start the frontend: cd frontend && npx expo start"
print_status "3. Optional: Train AI models: cd ai && python train.py"
print_status ""
print_status "📊 Services running:"
print_status "- TimescaleDB: localhost:5432"
print_status "- Redis: localhost:6379"
print_status "- Backend API: http://localhost:4000"
print_status "- Frontend Dev: http://localhost:8081"
print_status ""
print_status "🗄️  Database credentials:"
print_status "- Database: calai_dev"
print_status "- Username: postgres"
print_status "- Password: postgres"
print_status ""
print_status "🔧 Useful commands:"
print_status "- Stop databases: docker-compose down"
print_status "- View logs: docker-compose logs -f"
print_status "- Reset database: cd backend && mix ecto.reset"
print_status ""
print_success "Happy coding! 🎉"
