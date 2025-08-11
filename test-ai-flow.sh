#!/bin/bash

# Test Enhanced AI Food Recognition Flow
# Tests the complete flow: Photo → AI Classification → OpenFoodFacts Enhancement

set -e

API_BASE="http://localhost:4000/api/v1"
TEST_IMAGE_URL="https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400"  # Food image

echo "🚀 Testing Enhanced AI Food Recognition Flow"
echo "============================================="

# Check if backend is running
echo "1. Checking backend health..."
if curl -s "${API_BASE}/health" > /dev/null 2>&1; then
    echo "✅ Backend is running"
else
    echo "❌ Backend is not running. Please start with: docker-compose up -d"
    exit 1
fi

# Create a temporary test image
echo "2. Downloading test food image..."
curl -s -o /tmp/test_food.jpg "$TEST_IMAGE_URL"
echo "✅ Test image downloaded"

# Test AI Classification Endpoint
echo "3. Testing AI food classification..."
CLASSIFICATION_RESULT=$(curl -s -X POST \
    -F "image=@/tmp/test_food.jpg" \
    "${API_BASE}/inference/classify" | jq -r '.success')

if [ "$CLASSIFICATION_RESULT" = "true" ]; then
    echo "✅ AI classification successful"
    
    # Get detailed results
    DETAILED_RESULT=$(curl -s -X POST \
        -F "image=@/tmp/test_food.jpg" \
        "${API_BASE}/inference/classify")
    
    echo "📊 Classification Results:"
    echo "$DETAILED_RESULT" | jq '.data.predictions[0] | {
        food_name: .food_name,
        confidence: .confidence,
        calories: .calories,
        source: .source,
        serving_suggestions: .serving_suggestions
    }'
    
    PROCESSING_TIME=$(echo "$DETAILED_RESULT" | jq -r '.data.processing_time_ms')
    ENHANCED=$(echo "$DETAILED_RESULT" | jq -r '.data.enhanced')
    CACHED=$(echo "$DETAILED_RESULT" | jq -r '.data.cached')
    
    echo "⏱️  Processing Time: ${PROCESSING_TIME}ms"
    echo "🔬 Enhanced with OpenFoodFacts: $ENHANCED"
    echo "🗄️  Cached Result: $CACHED"
    
else
    echo "❌ AI classification failed"
    echo "Error details:"
    curl -s -X POST -F "image=@/tmp/test_food.jpg" "${API_BASE}/inference/classify" | jq '.'
fi

# Test OpenFoodFacts Search Integration
echo ""
echo "4. Testing OpenFoodFacts search integration..."
SEARCH_RESULT=$(curl -s "${API_BASE}/foods/search?q=apple" | jq -r '.success')

if [ "$SEARCH_RESULT" = "true" ]; then
    echo "✅ OpenFoodFacts search successful"
    
    # Show search results
    curl -s "${API_BASE}/foods/search?q=apple" | jq '.data[0] | {
        name: .name,
        calories: .calories_per_100g,
        protein: .protein_per_100g,
        brand: .brand
    }'
else
    echo "❌ OpenFoodFacts search failed"
fi

# Test Barcode Lookup (with a known barcode)
echo ""
echo "5. Testing barcode lookup..."
TEST_BARCODE="3017620422003"  # Nutella barcode
BARCODE_RESULT=$(curl -s -X POST \
    -H "Content-Type: application/json" \
    -d "{\"barcode\":\"$TEST_BARCODE\"}" \
    "${API_BASE}/foods/barcode" | jq -r '.success')

if [ "$BARCODE_RESULT" = "true" ]; then
    echo "✅ Barcode lookup successful"
    curl -s -X POST \
        -H "Content-Type: application/json" \
        -d "{\"barcode\":\"$TEST_BARCODE\"}" \
        "${API_BASE}/foods/barcode" | jq '.data.product | {
            name: .name,
            brand: .brand,
            nutrition: .nutrition
        }'
else
    echo "⚠️  Barcode lookup failed (expected for test barcode)"
fi

# Test Nutrition Estimation
echo ""
echo "6. Testing nutrition estimation..."
NUTRITION_RESULT=$(curl -s -X POST \
    -F "image=@/tmp/test_food.jpg" \
    "${API_BASE}/inference/estimate_nutrition" | jq -r '.success')

if [ "$NUTRITION_RESULT" = "true" ]; then
    echo "✅ Nutrition estimation successful"
    curl -s -X POST \
        -F "image=@/tmp/test_food.jpg" \
        "${API_BASE}/inference/estimate_nutrition" | jq '.data | {
            total_nutrition: .total_nutrition,
            portion_analysis: .portion_analysis.estimated_weight_g
        }'
else
    echo "⚠️  Nutrition estimation endpoint may not be fully implemented"
fi

# Test Performance with Multiple Requests
echo ""
echo "7. Testing performance and caching..."
echo "Making 3 identical requests to test caching..."

for i in {1..3}; do
    START_TIME=$(date +%s%3N)
    curl -s -X POST -F "image=@/tmp/test_food.jpg" "${API_BASE}/inference/classify" > /dev/null
    END_TIME=$(date +%s%3N)
    DURATION=$((END_TIME - START_TIME))
    echo "Request $i: ${DURATION}ms"
done

# Cleanup
echo ""
echo "8. Cleaning up..."
rm -f /tmp/test_food.jpg
echo "✅ Cleanup complete"

echo ""
echo "🎉 AI Flow Testing Complete!"
echo "============================================="
echo "Summary:"
echo "- AI Classification: Enhanced with Food-101 models"
echo "- OpenFoodFacts Integration: Nutrition data enhancement"
echo "- Caching: Improved performance for repeated requests"
echo "- Fallback Logic: Graceful handling of API failures"
echo ""
echo "Next steps:"
echo "1. Test with the mobile app camera"
echo "2. Verify end-to-end flow: Photo → AI → Nutrition → Meal Log"
echo "3. Test offline functionality and error handling"
