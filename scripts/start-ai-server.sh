#!/bin/bash

# CalAi Enhanced AI Startup Script
# Starts the local AI model server with the trained model

set -e

AI_DIR="/home/deginandor/Documents/Programming/CalAi/ai"
MODEL_FILE="$AI_DIR/best_model.pth"
VENV_DIR="$AI_DIR/venv"

echo "🚀 Starting CalAi Enhanced AI System..."
echo "======================================="

# Check if model exists
if [ ! -f "$MODEL_FILE" ]; then
    echo "❌ Model file not found: $MODEL_FILE"
    echo "Please ensure best_model.pth is in the ai/ directory"
    exit 1
fi

echo "✅ Found trained model: $MODEL_FILE"

# Check if virtual environment exists
if [ ! -d "$VENV_DIR" ]; then
    echo "📦 Creating Python virtual environment..."
    cd "$AI_DIR"
    python3 -m venv venv
fi

# Activate virtual environment
echo "🔧 Activating virtual environment..."
cd "$AI_DIR"
source venv/bin/activate

# Install/update dependencies
echo "📥 Installing/updating Python dependencies..."
pip install -q --upgrade pip
pip install -q -r requirements.txt

# Check if the model server is already running
if curl -s http://localhost:5000/health > /dev/null 2>&1; then
    echo "⚠️  Model server already running on port 5000"
    echo "Stopping existing server..."
    pkill -f "python.*model_server.py" || true
    sleep 2
fi

echo "🤖 Starting AI Model Server..."
echo "Model: best_model.pth"
echo "Host: 0.0.0.0:5000"
echo "Health endpoint: http://localhost:5000/health"
echo ""

# Start the model server
python model_server.py --model best_model.pth --host 0.0.0.0 --port 5000 &
MODEL_PID=$!

# Wait for server to start
echo "⏳ Waiting for model server to initialize..."
for i in {1..30}; do
    if curl -s http://localhost:5000/health > /dev/null 2>&1; then
        echo "✅ AI Model Server is running! (PID: $MODEL_PID)"
        break
    fi
    
    if [ $i -eq 30 ]; then
        echo "❌ Model server failed to start within 30 seconds"
        kill $MODEL_PID 2>/dev/null || true
        exit 1
    fi
    
    sleep 1
    echo -n "."
done

echo ""
echo "🎉 CalAi Enhanced AI System Ready!"
echo "=================================="
echo ""
echo "Services:"
echo "🤖 AI Model Server:  http://localhost:5000"
echo "📊 Model Info:       http://localhost:5000/model/info"
echo "🏥 Health Check:     http://localhost:5000/health"
echo ""
echo "Usage:"
echo "curl -X POST -F 'image=@food.jpg' http://localhost:5000/predict"
echo ""
echo "To stop the server: kill $MODEL_PID"
echo ""

# Keep the script running to monitor the server
trap 'echo "Stopping AI Model Server..."; kill $MODEL_PID 2>/dev/null || true; exit 0' INT TERM

# Monitor the server
while kill -0 $MODEL_PID 2>/dev/null; do
    sleep 10
done

echo "AI Model Server stopped"
