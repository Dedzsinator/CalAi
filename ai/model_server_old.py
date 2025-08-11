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

# Load model architecture (must match training)
class FoodClassificationModel(nn.Module):
    """CNN model for food classification - matches training architecture."""
    
    def __init__(self, num_classes: int, model_name: str = 'efficientnet_b0'):
        super().__init__()
        self.num_classes = num_classes
        self.model_name = model_name
        
        # Load backbone (matching training setup)
        if model_name == 'efficientnet_b0':
            self.backbone = efficientnet_b0(pretrained=False)
            self.backbone.classifier = nn.Identity()
            feature_dim = 1280
        else:
            raise ValueError(f"Unsupported model: {model_name}")
        
        # Classification head (matching training setup)
        self.classifier = nn.Sequential(
            nn.Dropout(0.2),
            nn.Linear(feature_dim, 512),
            nn.ReLU(inplace=True),
            nn.Dropout(0.1),
            nn.Linear(512, num_classes)
        )
        
        # Nutrition estimation head
        self.nutrition_head = nn.Sequential(
            nn.Dropout(0.2),
            nn.Linear(feature_dim, 256),
            nn.ReLU(inplace=True),
            nn.Linear(256, 4)  # calories, protein, carbs, fat
        )
    
    def forward(self, x: torch.Tensor, return_nutrition: bool = False) -> torch.Tensor:
        features = self.backbone(x)
        
        if return_nutrition:
            return self.classifier(features), self.nutrition_head(features)
        else:
            return self.classifier(features)

class CalAiModelServer:
    """Model server for CalAi food recognition."""
    
    def __init__(self, model_path: str = "best_model.pth"):
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        self.model = None
        self.class_names = []
        self.transform = None
        
        logger.info(f"Using device: {self.device}")
        self.load_model(model_path)
        self.setup_transforms()
    
    def load_model(self, model_path: str) -> None:
        """Load the trained model."""
        model_file = Path(model_path)
        if not model_file.exists():
            raise FileNotFoundError(f"Model file not found: {model_path}")
        
        logger.info(f"Loading model from {model_path}")
        
        # Load checkpoint
        checkpoint = torch.load(model_path, map_location=self.device)
        
        # Extract model info
        num_classes = checkpoint['num_classes']
        model_name = checkpoint['config']['model_name']
        self.class_names = checkpoint['class_names']
        
        logger.info(f"Model: {model_name}, Classes: {num_classes}")
        
        # Create model
        self.model = FoodClassificationModel(
            num_classes=num_classes,
            model_name=model_name
        ).to(self.device)
        
        # Load weights
        self.model.load_state_dict(checkpoint['model_state_dict'])
        self.model.eval()
        
        logger.info("Model loaded successfully")
    
    def setup_transforms(self) -> None:
        """Setup image preprocessing transforms."""
        self.transform = transforms.Compose([
            transforms.Resize((224, 224)),
            transforms.ToTensor(),
            transforms.Normalize(
                mean=[0.485, 0.456, 0.406],
                std=[0.229, 0.224, 0.225]
            )
        ])
    
    def predict(self, image: Image.Image, top_k: int = 5) -> List[Dict[str, Any]]:
        """Make prediction on image."""
        if self.model is None:
            raise RuntimeError("Model not loaded")
        
        # Preprocess image
        if image.mode != 'RGB':
            image = image.convert('RGB')
        
        input_tensor = self.transform(image).unsqueeze(0).to(self.device)
        
        # Inference
        with torch.no_grad():
            outputs = self.model(input_tensor)
            probabilities = torch.nn.functional.softmax(outputs, dim=1)
            top_probs, top_indices = torch.topk(probabilities, top_k)
        
        # Format results
        predictions = []
        for i in range(top_k):
            class_idx = top_indices[0][i].item()
            confidence = top_probs[0][i].item()
            class_name = self.class_names[class_idx]
            
            predictions.append({
                'food_name': self.format_food_name(class_name),
                'confidence': float(confidence),
                'class_index': class_idx,
                'raw_class_name': class_name
            })
        
        return predictions
    
    def predict_with_nutrition(self, image: Image.Image, top_k: int = 5) -> List[Dict[str, Any]]:
        """Make prediction with nutrition estimation."""
        if self.model is None:
            raise RuntimeError("Model not loaded")
        
        # Preprocess image
        if image.mode != 'RGB':
            image = image.convert('RGB')
        
        input_tensor = self.transform(image).unsqueeze(0).to(self.device)
        
        # Inference with nutrition
        with torch.no_grad():
            classification_output, nutrition_output = self.model(input_tensor, return_nutrition=True)
            probabilities = torch.nn.functional.softmax(classification_output, dim=1)
            top_probs, top_indices = torch.topk(probabilities, top_k)
            
            # Get nutrition predictions
            nutrition_pred = nutrition_output[0].cpu().numpy()
        
        # Format results
        predictions = []
        for i in range(top_k):
            class_idx = top_indices[0][i].item()
            confidence = top_probs[0][i].item()
            class_name = self.class_names[class_idx]
            
            predictions.append({
                'food_name': self.format_food_name(class_name),
                'confidence': float(confidence),
                'class_index': class_idx,
                'raw_class_name': class_name,
                'estimated_nutrition': {
                    'calories': max(0, float(nutrition_pred[0])),
                    'protein': max(0, float(nutrition_pred[1])),
                    'carbs': max(0, float(nutrition_pred[2])),
                    'fat': max(0, float(nutrition_pred[3]))
                }
            })
        
        return predictions
    
    def format_food_name(self, raw_name: str) -> str:
        """Format class name to readable food name."""
        return raw_name.replace('_', ' ').title()
    
    def get_model_info(self) -> Dict[str, Any]:
        """Get model information."""
        return {
            'num_classes': len(self.class_names),
            'class_names': self.class_names,
            'device': str(self.device),
            'model_loaded': self.model is not None
        }

# Flask API for serving the model
app = Flask(__name__)
model_server = None

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint."""
    return jsonify({
        'status': 'healthy',
        'model_loaded': model_server is not None and model_server.model is not None
    })

@app.route('/predict', methods=['POST'])
def predict():
    """Prediction endpoint."""
    try:
        if 'image' not in request.files:
            return jsonify({'error': 'No image provided'}), 400
        
        image_file = request.files['image']
        image = Image.open(image_file.stream)
        
        # Get parameters
        top_k = request.form.get('top_k', 5, type=int)
        with_nutrition = request.form.get('nutrition', 'false').lower() == 'true'
        
        # Make prediction
        if with_nutrition:
            predictions = model_server.predict_with_nutrition(image, top_k)
        else:
            predictions = model_server.predict(image, top_k)
        
        return jsonify({
            'success': True,
            'predictions': predictions,
            'model_info': model_server.get_model_info()
        })
    
    except Exception as e:
        logger.error(f"Prediction error: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/model/info', methods=['GET'])
def model_info():
    """Get model information."""
    if model_server is None:
        return jsonify({'error': 'Model server not initialized'}), 500
    
    return jsonify(model_server.get_model_info())

def main():
    """Main entry point."""
    global model_server
    
    import argparse
    parser = argparse.ArgumentParser(description='CalAi Model Server')
    parser.add_argument('--model', default='best_model.pth', help='Path to model file')
    parser.add_argument('--host', default='0.0.0.0', help='Host to bind to')
    parser.add_argument('--port', type=int, default=5000, help='Port to bind to')
    
    args = parser.parse_args()
    
    try:
        # Initialize model server
        model_server = CalAiModelServer(args.model)
        logger.info("Model server initialized successfully")
        
        # Start Flask app
        app.run(host=args.host, port=args.port, debug=False)
        
    except Exception as e:
        logger.error(f"Failed to start model server: {e}")
        sys.exit(1)

if __name__ == '__main__':
    main()
