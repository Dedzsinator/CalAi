#!/usr/bin/env python3
"""
CalAi Model Server - Enhanced Version
Loads the trained best_model.pth and serves predictions via FastAPI.
Integrated with the main CalAi backend for food classification.
"""

import os
import sys
import torch
import torch.nn as nn
from torchvision.models import efficientnet_b0, mobilenet_v2, resnet50
import timm
import json
import logging
from pathlib import Path
from PIL import Image
import torchvision.transforms as transforms
from fastapi import FastAPI, File, UploadFile, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import numpy as np
import io
import base64
import asyncio
from typing import Dict, List, Any

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Model path
MODEL_PATH = Path(__file__).parent / "best_model.pth"

# Food-101 class labels (standard order)
FOOD101_CLASSES = [
    "apple_pie", "baby_back_ribs", "baklava", "beef_carpaccio", "beef_tartare", "beet_salad",
    "beignets", "bibimbap", "bread_pudding", "breakfast_burrito", "bruschetta", "caesar_salad",
    "cannoli", "caprese_salad", "carrot_cake", "ceviche", "cheese_plate", "cheesecake",
    "chicken_curry", "chicken_quesadilla", "chicken_wings", "chocolate_cake", "chocolate_mousse",
    "churros", "clam_chowder", "club_sandwich", "crab_cakes", "creme_brulee", "croque_madame",
    "cup_cakes", "deviled_eggs", "donuts", "dumplings", "edamame", "eggs_benedict", "escargots",
    "falafel", "filet_mignon", "fish_and_chips", "foie_gras", "french_fries", "french_onion_soup",
    "french_toast", "fried_calamari", "fried_rice", "frozen_yogurt", "garlic_bread", "gnocchi",
    "greek_salad", "grilled_cheese_sandwich", "grilled_salmon", "guacamole", "gyoza", "hamburger",
    "hot_and_sour_soup", "hot_dog", "huevos_rancheros", "hummus", "ice_cream", "lasagna",
    "lobster_bisque", "lobster_roll_sandwich", "macaroni_and_cheese", "macarons", "miso_soup",
    "mussels", "nachos", "omelette", "onion_rings", "oysters", "pad_thai", "paella", "pancakes",
    "panna_cotta", "peking_duck", "pho", "pizza", "pork_chop", "poutine", "prime_rib", "pulled_pork_sandwich",
    "ramen", "ravioli", "red_velvet_cake", "risotto", "samosa", "sashimi", "scallops", "seaweed_salad",
    "shrimp_and_grits", "spaghetti_bolognese", "spaghetti_carbonara", "spring_rolls", "steak", "strawberry_shortcake",
    "sushi", "tacos", "takoyaki", "tiramisu", "tuna_tartare", "waffles"
]

# The model architecture is now handled directly by loading EfficientNet-B0

class CalAiModelServer:
    """Model server for CalAi food classification."""
    
    def __init__(self):
        self.model = None
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        self.transform = None
        self.model_info = {}
        self.class_names = FOOD101_CLASSES
        logger.info(f"Using device: {self.device}")
    
    def load_model(self, model_path: Path) -> bool:
        """Load the trained model from checkpoint."""
        try:
            if not model_path.exists():
                logger.error(f"Model file not found: {model_path}")
                return False
            
            logger.info(f"Loading model from {model_path}")
            checkpoint = torch.load(model_path, map_location=self.device)
            
            # Try to load as a direct EfficientNet-B0 model (matches your checkpoint structure)
            self.model = efficientnet_b0(pretrained=False)
            
            # Modify classifier for Food-101 (101 classes)
            num_classes = len(FOOD101_CLASSES)
            self.model.classifier = nn.Sequential(
                nn.Dropout(p=0.2, inplace=True),
                nn.Linear(self.model.classifier[1].in_features, num_classes)
            )
            
            # Load the state dict
            state_dict = torch.load(model_path, map_location=self.device)
            self.model.load_state_dict(state_dict)
            self.model.to(self.device)
            self.model.eval()
            
            # Set model info
            self.model_info = {
                "model_name": "efficientnet_b0",
                "num_classes": num_classes,
                "epoch": "final",
                "accuracy": "best_trained_model",
                "class_names": self.class_names
            }
            self.model.eval()
            
            # Setup transforms (same as training validation)
            self.transform = transforms.Compose([
                transforms.Resize(256),
                transforms.CenterCrop(224),
                transforms.ToTensor(),
                transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
            ])
            
            logger.info(f"✅ Model loaded successfully!")
            logger.info(f"   - Architecture: {self.model_info['model_name']}")
            logger.info(f"   - Classes: {self.model_info['num_classes']}")
            logger.info(f"   - Model: {self.model_info['accuracy']}")
            logger.info(f"   - Epoch: {self.model_info['epoch']}")
            
            return True
            
        except Exception as e:
            logger.error(f"Failed to load model: {e}")
            import traceback
            traceback.print_exc()
            return False
    
    def preprocess_image(self, image: Image.Image) -> torch.Tensor:
        """Preprocess image for inference."""
        if image.mode != 'RGB':
            image = image.convert('RGB')
        
        input_tensor = self.transform(image)
        return input_tensor.unsqueeze(0).to(self.device)
    
    def predict(self, image: Image.Image, return_nutrition: bool = False, top_k: int = 3) -> Dict[str, Any]:
        """Predict food class and optionally estimate nutrition."""
        if self.model is None:
            raise RuntimeError("Model not loaded")
        
        try:
            # Preprocess
            input_tensor = self.preprocess_image(image)
            
            # Inference
            with torch.no_grad():
                outputs = self.model(input_tensor)
            
            # Get predictions
            probabilities = torch.nn.functional.softmax(outputs, dim=1)
            top_probs, top_indices = torch.topk(probabilities, min(top_k, len(self.class_names)))
            
            # Format results
            predictions = []
            for i in range(top_k):
                if i >= len(top_indices[0]):
                    break
                    
                class_idx = top_indices[0][i].item()
                confidence = top_probs[0][i].item()
                
                if class_idx < len(self.class_names):
                    class_name = self.class_names[class_idx]
                    formatted_name = class_name.replace('_', ' ').title()
                    
                    prediction = {
                        "food_name": formatted_name,
                        "confidence": round(confidence, 3),
                        "class_index": class_idx,
                        "raw_class": class_name
                    }
                    
                    # Add basic nutrition estimation if requested (simplified)
                    if return_nutrition:
                        # Basic nutrition estimates based on food type (this is a placeholder)
                        # In a real implementation, you'd have a nutrition database lookup
                        base_nutrition = self._estimate_nutrition(class_name)
                        prediction["estimated_nutrition"] = base_nutrition
                    
                    predictions.append(prediction)
            
            return {
                "success": True,
                "predictions": predictions,
                "model_info": self.model_info
            }
            
        except Exception as e:
            logger.error(f"Prediction failed: {e}")
            import traceback
            traceback.print_exc()
            return {
                "success": False,
                "error": str(e),
                "predictions": []
            }
    
    def _estimate_nutrition(self, food_name: str) -> Dict[str, float]:
        """Basic nutrition estimation based on food type."""
        # This is a simplified nutrition estimator
        # In production, you'd use a proper nutrition database
        nutrition_defaults = {
            # Desserts and sweets
            "cake": {"calories": 350, "protein": 5, "carbs": 50, "fat": 15},
            "pie": {"calories": 320, "protein": 4, "carbs": 45, "fat": 14},
            "chocolate": {"calories": 400, "protein": 6, "carbs": 45, "fat": 20},
            "ice_cream": {"calories": 250, "protein": 4, "carbs": 30, "fat": 12},
            "donut": {"calories": 300, "protein": 4, "carbs": 35, "fat": 16},
            
            # Main dishes
            "pizza": {"calories": 280, "protein": 12, "carbs": 30, "fat": 12},
            "hamburger": {"calories": 350, "protein": 20, "carbs": 25, "fat": 18},
            "steak": {"calories": 400, "protein": 30, "carbs": 0, "fat": 28},
            "chicken": {"calories": 250, "protein": 25, "carbs": 0, "fat": 12},
            "fish": {"calories": 200, "protein": 22, "carbs": 0, "fat": 8},
            
            # Default
            "default": {"calories": 250, "protein": 10, "carbs": 25, "fat": 10}
        }
        
        # Find matching category
        for category, values in nutrition_defaults.items():
            if category in food_name.lower():
                return values
        
        return nutrition_defaults["default"]

# Initialize FastAPI
app = FastAPI(
    title="CalAi Local Model Server",
    description="Local PyTorch model server for food classification",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global model server instance
model_server = CalAiModelServer()

@app.on_event("startup")
async def startup_event():
    """Load model on startup."""
    success = model_server.load_model(MODEL_PATH)
    if not success:
        logger.error("❌ Failed to load model on startup!")
    else:
        logger.info("🚀 Model server ready!")

@app.get("/health")
async def health_check():
    """Health check."""
    return {
        "status": "healthy",
        "model_loaded": model_server.model is not None,
        "device": str(model_server.device),
        "model_path": str(MODEL_PATH),
        "timestamp": asyncio.get_event_loop().time()
    }

@app.get("/model/info")
async def get_model_info():
    """Get model information."""
    if model_server.model is None:
        raise HTTPException(status_code=503, detail="Model not loaded")
    
    return {
        "success": True,
        "model_info": model_server.model_info,
        "device": str(model_server.device),
        "classes_count": len(model_server.class_names),
        "model_path": str(MODEL_PATH)
    }

@app.post("/predict")
async def predict_food(
    image: UploadFile = File(...),
    nutrition: bool = Form(default=False),
    top_k: int = Form(default=3)
):
    """Predict food from uploaded image."""
    if model_server.model is None:
        raise HTTPException(status_code=503, detail="Model not loaded")
    
    try:
        # Read image
        image_data = await image.read()
        pil_image = Image.open(io.BytesIO(image_data))
        
        # Predict
        result = model_server.predict(
            image=pil_image,
            return_nutrition=nutrition,
            top_k=min(top_k, 10)
        )
        
        return result
        
    except Exception as e:
        logger.error(f"Prediction failed: {e}")
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")

@app.post("/predict/base64")
async def predict_food_base64(request: Dict[str, Any]):
    """Predict food from base64 image."""
    if model_server.model is None:
        raise HTTPException(status_code=503, detail="Model not loaded")
    
    try:
        # Decode base64
        image_b64 = request.get("image")
        if not image_b64:
            raise ValueError("No image data provided")
        
        if "," in image_b64:
            image_b64 = image_b64.split(",")[1]
        
        image_data = base64.b64decode(image_b64)
        pil_image = Image.open(io.BytesIO(image_data))
        
        # Parameters
        nutrition = request.get("nutrition", False)
        top_k = request.get("top_k", 3)
        
        # Predict
        result = model_server.predict(
            image=pil_image,
            return_nutrition=nutrition,
            top_k=min(top_k, 10)
        )
        
        return result
        
    except Exception as e:
        logger.error(f"Base64 prediction failed: {e}")
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="CalAi Local AI Model Server")
    parser.add_argument("--host", default="0.0.0.0", help="Host address")
    parser.add_argument("--port", type=int, default=5000, help="Port number")
    parser.add_argument("--model", default=str(MODEL_PATH), help="Path to model file")
    
    args = parser.parse_args()
    
    if args.model != str(MODEL_PATH):
        MODEL_PATH = Path(args.model)
    
    logger.info(f"🚀 Starting CalAi Model Server")
    logger.info(f"   Host: {args.host}:{args.port}")
    logger.info(f"   Model: {MODEL_PATH}")
    
    uvicorn.run(
        "model_server:app",
        host=args.host,
        port=args.port,
        reload=False,
        log_level="info"
    )
