# CalAi Enhanced AI Food Recognition Pipeline

## Overview

CalAi now uses your locally trained `best_model.pth` as the **primary** AI model for food classification, with intelligent fallback to cloud services when needed. This provides superior accuracy while maintaining reliability.

## AI Model Priority System

### 1. **Primary: Local Trained Model (`best_model.pth`)**
- **Location**: `/ai/best_model.pth` 
- **Server**: FastAPI server on `http://localhost:5000`
- **Architecture**: EfficientNet/MobileNet (as trained)
- **Accuracy**: Based on your training results
- **Advantages**: 
  - Highest accuracy for your specific use case
  - Fast inference (local)
  - No API limits
  - Privacy-preserving

### 2. **Fallback: HuggingFace Models**
- **Primary Fallback**: `nateraw/food` (Food-101)
- **Secondary Fallback**: `microsoft/resnet-50`
- **Used when**: Local model server is unavailable
- **Advantages**: Always available, cloud-based reliability

### 3. **Final Fallback: Rule-based Estimation**
- **Used when**: All AI services fail
- **Provides**: Basic nutritional estimates
- **Ensures**: App never completely fails

## Model Server Architecture

### FastAPI Local Model Server (`model_server.py`)

```python
# Key endpoints:
GET  /health           # Health check
GET  /model/info       # Model information
POST /predict          # Image classification
POST /predict/base64   # Base64 image classification
```

### Model Loading Process

```python
# Loads best_model.pth with configuration
model_info = {
    "model_name": "efficientnet_b0",  # From checkpoint
    "num_classes": 101,               # Food-101 classes
    "accuracy": 0.85,                 # Your training accuracy
    "epoch": 50                       # Training epochs
}
```

## Backend Integration Flow

### 1. **Request Flow**
```mermaid
Frontend --> Backend API --> Local Model Server --> best_model.pth
                         \
                          --> HuggingFace (fallback)
```

### 2. **Service Layer** (`food_recognition.ex`)
```elixir
def classify_food_image(image_data, opts) do
  # 1. Try local model server first
  case call_local_model(image_data, max_predictions) do
    {:ok, predictions} -> 
      enhance_predictions_with_nutrition(predictions)
    
    {:error, _} ->
      # 2. Fallback to HuggingFace
      call_huggingface_api_with_fallback(image_data)
  end
end
```

### 3. **API Endpoints**
- `POST /api/v1/inference/classify` - Food classification
- `POST /api/v1/inference/nutrition` - Nutrition estimation  
- `POST /api/v1/inference/ocr` - Text extraction

## Data Enhancement Pipeline

### Local Model Output Enhancement
```elixir
predictions = [
  %{
    food_name: "Pizza",
    confidence: 0.95,
    calories: 285,
    protein: 12.0,
    carbs: 36.0,
    fat: 10.0,
    portion_estimate: "2 slices (150g)",
    source: "local_model"
  }
]
```

### OpenFoodFacts Integration
- **Triggered**: For high-confidence predictions
- **Enriches**: Detailed nutrition data, brand info, images
- **Caches**: Results in Redis for performance

## Frontend Integration

### AI Service Priority (`ai.ts`)
```typescript
async classifyFood(imageUri: string): Promise<FoodPrediction[]> {
  try {
    // Primary: Backend API (uses local model first)
    return await this.classifyFoodAPI(imageUri);
  } catch (error) {
    // Fallback: Local inference (if available)
    return await this.classifyFoodLocal(imageUri);
  }
}
```

### API Integration (`api.ts`)
```typescript
async inferFood(imageUri: string) {
  const formData = new FormData();
  formData.append('image', {
    uri: imageUri,
    type: 'image/jpeg',
    name: 'food.jpg',
  });
  
  return this.request('/inference/classify', {
    method: 'POST',
    body: formData,
  });
}
```

## Setup & Deployment

### 1. **Development Setup**
```bash
# 1. Ensure model is in place
ls ai/best_model.pth

# 2. Install Python dependencies
cd ai && pip install -r requirements.txt

# 3. Start model server
python model_server.py --host 0.0.0.0 --port 5000

# 4. Start backend
cd backend && mix phx.server

# 5. Start frontend
cd app && npm start
```

### 2. **Production Deployment**
```bash
# Model server as service
sudo systemctl enable calai-model-server
sudo systemctl start calai-model-server

# Backend with supervision
MIX_ENV=prod mix release
_build/prod/rel/calai/bin/calai daemon

# Frontend build
npm run build
```

## Testing & Validation

### 1. **Model Server Test**
```bash
# Health check
curl http://localhost:5000/health

# Model info
curl http://localhost:5000/model/info

# Prediction test
curl -X POST -F "image=@food.jpg" http://localhost:5000/predict
```

### 2. **Backend Integration Test**
```bash
# Classification
curl -X POST -F "image=@food.jpg" \
  http://localhost:4000/api/v1/inference/classify

# Nutrition estimation
curl -X POST -F "image=@food.jpg" \
  http://localhost:4000/api/v1/inference/nutrition
```

### 3. **Full AI Flow Test**
```bash
# Comprehensive test script
./test-local-model.sh
```

## Monitoring & Maintenance

### 1. **Model Server Health**
- Endpoint: `GET /health`
- Metrics: Model loaded, device, uptime
- Logs: `/var/log/calai/model-server.log`

### 2. **Performance Metrics**
- **Local Model**: ~50-200ms inference time
- **HuggingFace**: ~1-3s API response time
- **Fallback Rate**: Monitor local→cloud fallback ratio

### 3. **Error Handling**
```elixir
# Graceful degradation
case classify_food_image(image_data) do
  {:ok, result} -> success_response(result)
  {:error, :api_error} -> fallback_prediction()
  {:error, reason} -> generic_error(reason)
end
```

## Configuration

### Environment Variables
```bash
# Model server configuration
CALAI_MODEL_PATH="/path/to/best_model.pth"
CALAI_MODEL_HOST="0.0.0.0"
CALAI_MODEL_PORT="5000"

# Backend configuration
LOCAL_MODEL_URL="http://localhost:5000"
HUGGINGFACE_API_TOKEN="your_hf_token"
OPENFOODFACTS_URL="https://world.openfoodfacts.org/api/v0"
```

### Backend Configuration (`config.exs`)
```elixir
config :calai, :ai_models,
  local_model_url: System.get_env("LOCAL_MODEL_URL", "http://localhost:5000"),
  huggingface_token: System.get_env("HUGGINGFACE_API_TOKEN"),
  fallback_enabled: true,
  cache_predictions: true,
  max_retries: 3
```

## Troubleshooting

### Common Issues

1. **Model Server Won't Start**
   ```bash
   # Check dependencies
   pip install -r requirements.txt
   
   # Check model file
   ls -la ai/best_model.pth
   
   # Check logs
   tail -f model_server.log
   ```

2. **Backend Can't Connect to Model Server**
   ```bash
   # Test connectivity
   curl http://localhost:5000/health
   
   # Check firewall
   sudo ufw status
   
   # Verify configuration
   grep LOCAL_MODEL_URL backend/config/dev.exs
   ```

3. **Poor Prediction Accuracy**
   - Verify correct model file (`best_model.pth`)
   - Check model architecture matches training
   - Review image preprocessing pipeline
   - Consider model retraining with more data

### Performance Optimization

1. **Model Server Optimization**
   - Use GPU if available (`CUDA_VISIBLE_DEVICES=0`)
   - Optimize batch processing
   - Enable model quantization
   - Use TensorRT/ONNX for faster inference

2. **Caching Strategy**
   - Redis for prediction caching
   - Image hash-based cache keys
   - TTL-based cache expiration
   - Cache warming for common foods

## Future Enhancements

### Planned Features
- [ ] Model versioning and A/B testing
- [ ] Real-time model updates
- [ ] Federated learning integration
- [ ] Multi-model ensemble predictions
- [ ] Advanced portion size estimation
- [ ] Ingredient-level recognition
- [ ] Custom user model fine-tuning

### Scaling Considerations
- **Horizontal Scaling**: Multiple model server instances
- **Load Balancing**: nginx/HAProxy for model servers  
- **Model Serving**: TensorFlow Serving or TorchServe
- **GPU Clusters**: For high-throughput scenarios
- **Edge Deployment**: ONNX/TensorFlow Lite for mobile

## Resources

### Documentation
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [PyTorch Model Deployment](https://pytorch.org/tutorials/intermediate/flask_rest_api_tutorial.html)
- [Phoenix Framework](https://phoenixframework.org/)

### Model Training Resources
- [Food-101 Dataset](https://data.vision.ee.ethz.ch/cvl/datasets_extra/food-101/)
- [Nutrition5k Dataset](https://github.com/google-research-datasets/Nutrition5k)
- [Transfer Learning Guide](https://pytorch.org/tutorials/beginner/transfer_learning_tutorial.html)

---

**Status**: ✅ **Production Ready** - Your `best_model.pth` is now the primary AI model for CalAi food recognition!
