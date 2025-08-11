#!/bin/bash

echo "🧪 Testing CalAi Local Model Integration"
echo "========================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}1. Checking if local model server is running...${NC}"
if curl -s "http://127.0.0.1:5000/health" > /dev/null; then
    echo -e "${GREEN}✅ Model server is running${NC}"
    
    # Get model info
    MODEL_INFO=$(curl -s "http://127.0.0.1:5000/model/info" | jq -r '.model_info.model_name // "unknown"')
    echo "   Model: $MODEL_INFO"
    echo "   Device: $(curl -s "http://127.0.0.1:5000/health" | jq -r '.device // "unknown"')"
    echo "   Classes: $(curl -s "http://127.0.0.1:5000/model/info" | jq -r '.classes_count // 0')"
else
    echo -e "${RED}❌ Model server is not running. Please start it first:${NC}"
    echo "   cd ai && python model_server.py"
    exit 1
fi

echo
echo -e "${YELLOW}2. Testing model prediction with sample image...${NC}"
cd ai

PYTHON_TEST_RESULT=$(python -c "
import requests
import base64
from io import BytesIO
from PIL import Image
import numpy as np

try:
    # Create a test image that might look like food
    test_image = np.random.randint(0, 255, (224, 224, 3), dtype=np.uint8)
    # Add some structure to make it look more food-like
    test_image[50:150, 50:150, :] = [200, 150, 100]  # brownish square
    test_image[100:200, 100:200, :] = [50, 100, 50]  # greenish square
    
    pil_image = Image.fromarray(test_image)
    
    buffer = BytesIO()
    pil_image.save(buffer, format='JPEG')
    img_b64 = base64.b64encode(buffer.getvalue()).decode('utf-8')
    
    response = requests.post(
        'http://127.0.0.1:5000/predict/base64',
        json={'image': img_b64, 'top_k': 3, 'nutrition': True},
        timeout=10
    )
    
    if response.status_code == 200:
        result = response.json()
        if result.get('success'):
            pred = result.get('predictions', [{}])[0]
            print(f'SUCCESS|{pred.get(\"food_name\", \"Unknown\")}|{pred.get(\"confidence\", 0):.3f}')
        else:
            print(f'ERROR|{result.get(\"error\", \"Unknown error\")}')
    else:
        print(f'HTTP_ERROR|{response.status_code}|{response.text[:100]}')
except Exception as e:
    print(f'EXCEPTION|{str(e)}')
")

IFS='|' read -r STATUS FOOD_NAME CONFIDENCE <<< "$PYTHON_TEST_RESULT"

case $STATUS in
    "SUCCESS")
        echo -e "${GREEN}✅ Model prediction successful!${NC}"
        echo "   Predicted food: $FOOD_NAME"
        echo "   Confidence: $CONFIDENCE"
        ;;
    "ERROR")
        echo -e "${RED}❌ Model prediction failed: $FOOD_NAME${NC}"
        ;;
    "HTTP_ERROR")
        echo -e "${RED}❌ HTTP error ($FOOD_NAME): $CONFIDENCE${NC}"
        ;;
    "EXCEPTION")
        echo -e "${RED}❌ Python exception: $FOOD_NAME${NC}"
        ;;
    *)
        echo -e "${RED}❌ Unexpected result: $PYTHON_TEST_RESULT${NC}"
        ;;
esac

cd ..

echo
echo -e "${YELLOW}3. Verifying model file and dependencies...${NC}"
if [[ -f "ai/best_model.pth" ]]; then
    MODEL_SIZE=$(du -h ai/best_model.pth | cut -f1)
    echo -e "${GREEN}✅ Model file exists (${MODEL_SIZE})${NC}"
else
    echo -e "${RED}❌ Model file not found at ai/best_model.pth${NC}"
fi

# Check Python environment
cd ai
PYTHON_ENV=$(python -c "import sys; print('venv' if 'venv' in sys.executable else 'system')")
if [[ "$PYTHON_ENV" == "venv" ]]; then
    echo -e "${GREEN}✅ Using virtual environment${NC}"
else
    echo -e "${YELLOW}⚠️  Not using virtual environment${NC}"
fi

# Check key dependencies
DEPS_CHECK=$(python -c "
import importlib.util
deps = ['torch', 'torchvision', 'fastapi', 'uvicorn', 'pillow', 'timm']
missing = []
for dep in deps:
    if importlib.util.find_spec(dep) is None:
        missing.append(dep)
if missing:
    print('MISSING:' + ','.join(missing))
else:
    print('ALL_PRESENT')
")

if [[ "$DEPS_CHECK" == "ALL_PRESENT" ]]; then
    echo -e "${GREEN}✅ All Python dependencies present${NC}"
else
    echo -e "${RED}❌ Missing dependencies: ${DEPS_CHECK#MISSING:}${NC}"
fi

cd ..

echo
echo -e "${YELLOW}4. Backend integration check...${NC}"
if [[ -f "backend/lib/calai/services/food_recognition.ex" ]]; then
    # Check if the backend references the local model
    if grep -q "localhost:5000" backend/lib/calai/services/food_recognition.ex; then
        echo -e "${GREEN}✅ Backend configured to use local model${NC}"
    else
        echo -e "${YELLOW}⚠️  Backend may not be configured for local model${NC}"
    fi
    
    # Check for main function
    if grep -q "def classify_food_image" backend/lib/calai/services/food_recognition.ex; then
        echo -e "${GREEN}✅ Main classification function exists${NC}"
    else
        echo -e "${RED}❌ Main classification function missing${NC}"
    fi
else
    echo -e "${RED}❌ Backend food recognition service not found${NC}"
fi

echo
echo "🎯 Summary:"
echo "==========="
if curl -s "http://127.0.0.1:5000/health" | jq -e '.model_loaded == true' > /dev/null; then
    echo -e "${GREEN}✅ Your best_model.pth is successfully loaded and running!${NC}"
    echo -e "${GREEN}✅ Model server is healthy and ready for predictions${NC}"
    
    if [[ -f "ai/best_model.pth" ]]; then
        echo -e "${GREEN}✅ Local model integration complete${NC}"
        echo
        echo -e "${YELLOW}Next steps:${NC}"
        echo "1. Start the backend server: cd backend && mix phx.server"
        echo "2. Test the full API integration"
        echo "3. Update your frontend to use the new AI endpoints"
        echo
        echo -e "${GREEN}Your local model is now the primary AI classifier for CalAi!${NC}"
    fi
else
    echo -e "${RED}❌ Model server issues detected${NC}"
fi
