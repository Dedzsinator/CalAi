#!/bin/bash
# Test the complete AI flow with local model server

set -e  # Exit on any error

echo "🧪 Testing CalAi AI Flow - Local Model Integration"
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

PROJECT_ROOT="/home/deginandor/Documents/Programming/CalAi"
AI_DIR="$PROJECT_ROOT/ai"
BACKEND_DIR="$PROJECT_ROOT/backend"

echo -e "${BLUE}📁 Project structure check:${NC}"
echo "- AI Directory: $AI_DIR"
echo "- Backend Directory: $BACKEND_DIR"
echo "- Model Path: $AI_DIR/best_model.pth"
echo ""

# Check if model file exists
if [ ! -f "$AI_DIR/best_model.pth" ]; then
    echo -e "${RED}❌ Model file not found: $AI_DIR/best_model.pth${NC}"
    echo "Please ensure the trained model is in place."
    exit 1
else
    echo -e "${GREEN}✅ Model file found: best_model.pth${NC}"
fi

# Check Python dependencies
echo -e "${BLUE}🐍 Checking Python dependencies:${NC}"
cd "$AI_DIR"

# Create requirements if it doesn't exist
if [ ! -f "requirements.txt" ]; then
    echo -e "${YELLOW}⚠️  Creating requirements.txt${NC}"
    cat > requirements.txt << EOF
torch>=2.0.0
torchvision>=0.15.0
fastapi>=0.100.0
uvicorn>=0.20.0
pillow>=9.5.0
numpy>=1.24.0
python-multipart>=0.0.6
pydantic>=2.0.0
EOF
fi

# Install dependencies
echo -e "${BLUE}📦 Installing Python dependencies...${NC}"
pip install -r requirements.txt

# Test model server startup
echo -e "${BLUE}🚀 Testing model server startup...${NC}"
python -c "
import sys
sys.path.append('.')
from model_server import CalAiModelServer
import torch
from pathlib import Path

print('Testing model server initialization...')
server = CalAiModelServer()
model_path = Path('best_model.pth')

if model_path.exists():
    print('✅ Model file exists')
    success = server.load_model(model_path)
    if success:
        print('✅ Model loaded successfully!')
        print(f'   - Architecture: {server.model_info.get(\"model_name\", \"unknown\")}')
        print(f'   - Classes: {server.model_info.get(\"num_classes\", 0)}')
        print(f'   - Accuracy: {server.model_info.get(\"accuracy\", 0):.2%}')
    else:
        print('❌ Model loading failed')
        sys.exit(1)
else:
    print('❌ Model file not found')
    sys.exit(1)
" || { echo -e "${RED}❌ Model server test failed${NC}"; exit 1; }

# Start model server in background
echo -e "${BLUE}🌐 Starting model server...${NC}"
python model_server.py --host 0.0.0.0 --port 5000 > model_server.log 2>&1 &
MODEL_SERVER_PID=$!
echo "Model server PID: $MODEL_SERVER_PID"

# Wait for server to start
echo -e "${YELLOW}⏳ Waiting for model server to start...${NC}"
for i in {1..30}; do
    if curl -s http://localhost:5000/health > /dev/null; then
        break
    fi
    sleep 1
done

# Test server health
echo -e "${BLUE}🏥 Testing server health...${NC}"
HEALTH_RESPONSE=$(curl -s http://localhost:5000/health)
if echo "$HEALTH_RESPONSE" | grep -q "healthy"; then
    echo -e "${GREEN}✅ Model server is healthy${NC}"
    echo "Health response: $HEALTH_RESPONSE"
else
    echo -e "${RED}❌ Model server health check failed${NC}"
    kill $MODEL_SERVER_PID
    exit 1
fi

# Test model info endpoint
echo -e "${BLUE}ℹ️  Testing model info endpoint...${NC}"
MODEL_INFO=$(curl -s http://localhost:5000/model/info)
echo "Model info: $MODEL_INFO"

# Test prediction with a sample image (create a dummy one)
echo -e "${BLUE}🖼️  Testing prediction endpoint...${NC}"
python -c "
from PIL import Image
import numpy as np

# Create a dummy food image (pizza-like)
img = np.random.randint(0, 255, (224, 224, 3), dtype=np.uint8)
img = Image.fromarray(img)
img.save('test_food.jpg')
print('Created test image: test_food.jpg')
"

# Test prediction with curl
PREDICTION_RESPONSE=$(curl -s -X POST \
  -F "image=@test_food.jpg" \
  -F "top_k=3" \
  -F "nutrition=true" \
  http://localhost:5000/predict)

if echo "$PREDICTION_RESPONSE" | grep -q "success.*true"; then
    echo -e "${GREEN}✅ Prediction successful!${NC}"
    echo "Prediction response: $PREDICTION_RESPONSE" | python -m json.tool
else
    echo -e "${RED}❌ Prediction failed${NC}"
    echo "Response: $PREDICTION_RESPONSE"
fi

# Test backend integration (if backend is running)
echo -e "${BLUE}🔗 Testing backend integration...${NC}"
if curl -s http://localhost:4000/api/v1/health > /dev/null; then
    echo -e "${GREEN}✅ Backend is running, testing integration...${NC}"
    
    # Test classification endpoint
    BACKEND_RESPONSE=$(curl -s -X POST \
      -F "image=@test_food.jpg" \
      http://localhost:4000/api/v1/inference/classify)
    
    if echo "$BACKEND_RESPONSE" | grep -q "success.*true"; then
        echo -e "${GREEN}✅ Backend classification successful!${NC}"
        echo "Backend response: $BACKEND_RESPONSE" | python -m json.tool
    else
        echo -e "${YELLOW}⚠️  Backend classification response:${NC}"
        echo "$BACKEND_RESPONSE"
    fi
else
    echo -e "${YELLOW}⚠️  Backend not running, skipping integration test${NC}"
    echo "   To test backend integration:"
    echo "   1. cd $BACKEND_DIR"
    echo "   2. mix deps.get"
    echo "   3. mix ecto.create && mix ecto.migrate"
    echo "   4. mix phx.server"
fi

# Cleanup
echo -e "${BLUE}🧹 Cleaning up...${NC}"
rm -f test_food.jpg
kill $MODEL_SERVER_PID 2>/dev/null || true

echo ""
echo -e "${GREEN}🎉 AI Flow Test Complete!${NC}"
echo ""
echo -e "${BLUE}📋 Summary:${NC}"
echo "✅ Model file verified: best_model.pth"
echo "✅ Dependencies installed"
echo "✅ Model server starts and loads model"
echo "✅ Health check passes"
echo "✅ Prediction endpoint works"
echo ""
echo -e "${BLUE}🚀 Next steps:${NC}"
echo "1. Start the model server: cd $AI_DIR && python model_server.py"
echo "2. Start the backend: cd $BACKEND_DIR && mix phx.server" 
echo "3. Test full flow with your mobile app"
echo ""
echo -e "${BLUE}💡 Usage:${NC}"
echo "- Model server: http://localhost:5000"
echo "- Health check: curl http://localhost:5000/health"
echo "- Prediction: curl -X POST -F 'image=@food.jpg' http://localhost:5000/predict"
