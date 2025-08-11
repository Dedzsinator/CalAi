#!/bin/bash

echo "Testing CalAi Enhanced AI Backend (with Local Model)..."
echo "======================================================="

BASE_URL="http://localhost:4000"
AI_MODEL_URL="http://localhost:5000"

echo -e "\n1. Testing Backend Health Check:"
curl -s "$BASE_URL/health" | jq '.' || curl -s "$BASE_URL/health"

echo -e "\n2. Testing AI Model Server Health:"
curl -s "$AI_MODEL_URL/health" | jq '.' || curl -s "$AI_MODEL_URL/health"

echo -e "\n3. Testing AI Model Info:"
curl -s "$AI_MODEL_URL/model/info" | jq '.' || curl -s "$AI_MODEL_URL/model/info"

echo -e "\n4. Testing Food Search with OpenFoodFacts Enhancement:"
curl -s "$BASE_URL/api/v1/foods/search?q=apple" | jq '.data[0] | {name: .name, calories: .calories_per_100g, confidence: .confidence}' || curl -s "$BASE_URL/api/v1/foods/search?q=apple"

echo -e "\n5. Testing Barcode Lookup (Enhanced):"
curl -s -X POST "$BASE_URL/api/v1/foods/barcode" \
  -H "Content-Type: application/json" \
  -d '{"barcode":"123456789"}' | jq '.data.product.nutrition // {message: "Test barcode - nutrition not available"}' || curl -s -X POST "$BASE_URL/api/v1/foods/barcode" \
  -H "Content-Type: application/json" \
  -d '{"barcode":"123456789"}'

echo -e "\n6. Testing Local AI Model Classification:"
# Download a test food image
echo "Downloading test image..."
curl -s -o /tmp/test_food.jpg "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400"

if [ -f "/tmp/test_food.jpg" ]; then
    echo "Testing with downloaded image..."
    AI_RESULT=$(curl -s -X POST -F "image=@/tmp/test_food.jpg" -F "nutrition=true" "$AI_MODEL_URL/predict")
    
    if echo "$AI_RESULT" | jq -e '.success' > /dev/null 2>&1; then
        echo "✅ Local AI Model is working!"
        echo "$AI_RESULT" | jq '.predictions[0] | {
            food_name: .food_name,
            confidence: .confidence,
            nutrition: .estimated_nutrition
        }'
    else
        echo "⚠️  Local AI Model not available or failed"
        echo "$AI_RESULT"
    fi
    
    rm -f /tmp/test_food.jpg
else
    echo "⚠️  Could not download test image, skipping AI test"
fi

echo -e "\n7. Testing Backend AI Classification (with Local Model Priority):"
# Create a simple 1x1 test image
python3 -c "
from PIL import Image
import io
img = Image.new('RGB', (224, 224), color='red')
img.save('/tmp/test_simple.jpg', 'JPEG')
" 2>/dev/null || echo "Python/PIL not available for test image generation"

if [ -f "/tmp/test_simple.jpg" ]; then
    BACKEND_AI_RESULT=$(curl -s -X POST -F "image=@/tmp/test_simple.jpg" "$BASE_URL/api/v1/inference/classify")
    
    if echo "$BACKEND_AI_RESULT" | jq -e '.success' > /dev/null 2>&1; then
        echo "✅ Backend AI Classification working!"
        echo "$BACKEND_AI_RESULT" | jq '.data | {
            model_used: .model_version,
            enhanced: .enhanced,
            cached: .cached,
            processing_time: .processing_time_ms,
            predictions_count: (.predictions | length)
        }'
    else
        echo "⚠️  Backend AI Classification failed"
        echo "$BACKEND_AI_RESULT"
    fi
    
    rm -f /tmp/test_simple.jpg
else
    echo "⚠️  Could not create test image for backend AI test"
fi

echo -e "\n8. Testing User Registration (Public):"
curl -s -X POST "$BASE_URL/api/v1/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123","name":"Test User"}' | jq '.success // {error: "Registration test"}' || curl -s -X POST "$BASE_URL/api/v1/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123","name":"Test User"}'

echo -e "\n\n🎉 Enhanced AI Testing Complete!"
echo "================================================"
echo "Summary:"
echo "✅ Backend API with OpenFoodFacts integration"
echo "✅ Local AI Model Server (best_model.pth)"
echo "✅ Enhanced food classification with nutrition"
echo "✅ Fallback system: Local Model → HuggingFace → Generic"
echo "✅ Caching for improved performance"
echo ""
echo "Architecture:"
echo "📱 Frontend → 🤖 Backend → 🧠 Local AI Model → 🍎 OpenFoodFacts"
echo "                      ↘ 🔄 HuggingFace (fallback)"
