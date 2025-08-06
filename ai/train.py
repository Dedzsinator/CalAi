#!/usr/bin/env python3
"""
CalAi Food Recognition Model Training
Trains CNN models for food classification and nutrition estimation.
"""

import os
import sys
import logging
import json
from pathlib import Path
from typing import Dict, Any, Tuple, List, Optional
from datetime import datetime
import argparse

# Scientific computing
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import classification_report, confusion_matrix

# Deep learning
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader, Dataset
import torchvision.transforms as transforms
from torchvision.models import efficientnet_b0, mobilenet_v2, resnet50
import timm

# Image processing
from PIL import Image
import cv2
import albumentations as A
from albumentations.pytorch import ToTensorV2

# Utilities
from tqdm import tqdm
import wandb
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(f'training_{datetime.now().strftime("%Y%m%d_%H%M%S")}.log'),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

class FoodDataset(Dataset):
    """Dataset class for food images and nutrition data."""
    
    def __init__(
        self, 
        image_paths: List[str], 
        labels: List[int], 
        nutrition_data: Optional[List[Dict]] = None,
        transform: Optional[A.Compose] = None,
        mode: str = 'classification'
    ):
        self.image_paths = image_paths
        self.labels = labels
        self.nutrition_data = nutrition_data or [{}] * len(image_paths)
        self.transform = transform
        self.mode = mode
        
    def __len__(self) -> int:
        return len(self.image_paths)
    
    def __getitem__(self, idx: int) -> Tuple[torch.Tensor, torch.Tensor]:
        # Load and process image
        image = cv2.imread(self.image_paths[idx])
        image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        
        if self.transform:
            transformed = self.transform(image=image)
            image = transformed['image']
        else:
            image = torch.from_numpy(image).permute(2, 0, 1).float() / 255.0
        
        # Prepare targets
        if self.mode == 'classification':
            target = torch.tensor(self.labels[idx], dtype=torch.long)
        elif self.mode == 'nutrition':
            # Multi-target for nutrition estimation
            nutrition = self.nutrition_data[idx]
            target = torch.tensor([
                nutrition.get('calories', 0),
                nutrition.get('protein', 0),
                nutrition.get('carbs', 0),
                nutrition.get('fat', 0)
            ], dtype=torch.float32)
        else:
            target = torch.tensor(self.labels[idx], dtype=torch.long)
        
        return image, target

class FoodClassificationModel(nn.Module):
    """CNN model for food classification."""
    
    def __init__(
        self, 
        num_classes: int, 
        model_name: str = 'efficientnet_b0',
        pretrained: bool = True
    ):
        super().__init__()
        self.num_classes = num_classes
        self.model_name = model_name
        
        # Load backbone
        if model_name == 'efficientnet_b0':
            self.backbone = efficientnet_b0(pretrained=pretrained)
            self.backbone.classifier = nn.Identity()
            feature_dim = 1280
        elif model_name == 'mobilenet_v2':
            self.backbone = mobilenet_v2(pretrained=pretrained)
            self.backbone.classifier = nn.Identity()
            feature_dim = 1280
        elif model_name == 'resnet50':
            self.backbone = resnet50(pretrained=pretrained)
            self.backbone.fc = nn.Identity()
            feature_dim = 2048
        else:
            # Use timm for other models
            self.backbone = timm.create_model(model_name, pretrained=pretrained, num_classes=0)
            feature_dim = self.backbone.num_features
        
        # Classification head
        self.classifier = nn.Sequential(
            nn.Dropout(0.2),
            nn.Linear(feature_dim, 512),
            nn.ReLU(inplace=True),
            nn.Dropout(0.1),
            nn.Linear(512, num_classes)
        )
        
        # Nutrition estimation head (optional)
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

class FoodTrainer:
    """Trainer class for food recognition models."""
    
    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        logger.info(f"Using device: {self.device}")
        
        # Initialize wandb if API key is available
        if os.getenv('WANDB_API_KEY'):
            wandb.init(
                project='calai-food-recognition',
                config=config,
                name=f"{config['model_name']}_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
            )
        
        self.model = None
        self.train_loader = None
        self.val_loader = None
        self.test_loader = None
        self.label_encoder = LabelEncoder()
    
    def prepare_data(self, data_dir: str) -> None:
        """Prepare datasets for training."""
        logger.info("Preparing data...")
        
        # Load Food-101 dataset (primary dataset)
        food101_dir = Path(data_dir) / 'food101'
        if not food101_dir.exists():
            raise FileNotFoundError(f"Food-101 dataset not found at {food101_dir}")
        
        # Load image paths and labels
        image_paths = []
        labels = []
        nutrition_data = []
        
        # Process Food-101 structure
        classes_file = food101_dir / 'meta' / 'classes.txt'
        if classes_file.exists():
            with open(classes_file, 'r') as f:
                class_names = [line.strip() for line in f.readlines()]
        else:
            # Fallback: scan directories
            class_names = [d.name for d in (food101_dir / 'images').iterdir() if d.is_dir()]
        
        logger.info(f"Found {len(class_names)} food classes")
        
        # Load images and labels
        for class_idx, class_name in enumerate(class_names):
            class_dir = food101_dir / 'images' / class_name
            if class_dir.exists():
                for img_path in class_dir.glob('*.jpg'):
                    image_paths.append(str(img_path))
                    labels.append(class_idx)
                    
                    # Mock nutrition data (in real scenario, load from nutrition DB)
                    nutrition_data.append({
                        'calories': np.random.randint(100, 600),
                        'protein': np.random.uniform(5, 30),
                        'carbs': np.random.uniform(10, 80),
                        'fat': np.random.uniform(2, 40)
                    })
        
        logger.info(f"Loaded {len(image_paths)} images")
        
        # Split data
        train_paths, temp_paths, train_labels, temp_labels, train_nutrition, temp_nutrition = train_test_split(
            image_paths, labels, nutrition_data, 
            test_size=0.3, 
            random_state=42, 
            stratify=labels
        )
        
        val_paths, test_paths, val_labels, test_labels, val_nutrition, test_nutrition = train_test_split(
            temp_paths, temp_labels, temp_nutrition,
            test_size=0.5,
            random_state=42,
            stratify=temp_labels
        )
        
        # Transforms
        train_transform = A.Compose([
            A.Resize(224, 224),
            A.HorizontalFlip(p=0.5),
            A.RandomBrightnessContrast(p=0.2),
            A.ShiftScaleRotate(shift_limit=0.1, scale_limit=0.1, rotate_limit=15, p=0.5),
            A.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
            ToTensorV2()
        ])
        
        val_transform = A.Compose([
            A.Resize(224, 224),
            A.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
            ToTensorV2()
        ])
        
        # Create datasets
        train_dataset = FoodDataset(train_paths, train_labels, train_nutrition, train_transform)
        val_dataset = FoodDataset(val_paths, val_labels, val_nutrition, val_transform)
        test_dataset = FoodDataset(test_paths, test_labels, test_nutrition, val_transform)
        
        # Create data loaders
        self.train_loader = DataLoader(
            train_dataset, 
            batch_size=self.config['batch_size'], 
            shuffle=True, 
            num_workers=4,
            pin_memory=True
        )
        self.val_loader = DataLoader(
            val_dataset, 
            batch_size=self.config['batch_size'], 
            shuffle=False, 
            num_workers=4,
            pin_memory=True
        )
        self.test_loader = DataLoader(
            test_dataset, 
            batch_size=self.config['batch_size'], 
            shuffle=False, 
            num_workers=4,
            pin_memory=True
        )
        
        # Store class names for later use
        self.class_names = class_names
        self.num_classes = len(class_names)
        
        logger.info(f"Data split: {len(train_dataset)} train, {len(val_dataset)} val, {len(test_dataset)} test")
    
    def build_model(self) -> None:
        """Build and initialize the model."""
        logger.info(f"Building {self.config['model_name']} model...")
        
        self.model = FoodClassificationModel(
            num_classes=self.num_classes,
            model_name=self.config['model_name'],
            pretrained=self.config['pretrained']
        ).to(self.device)
        
        logger.info(f"Model built with {sum(p.numel() for p in self.model.parameters())} parameters")
    
    def train(self) -> None:
        """Train the model."""
        logger.info("Starting training...")
        
        # Optimizer and scheduler
        optimizer = optim.AdamW(
            self.model.parameters(), 
            lr=self.config['learning_rate'],
            weight_decay=self.config['weight_decay']
        )
        
        scheduler = optim.lr_scheduler.CosineAnnealingLR(
            optimizer, 
            T_max=self.config['epochs']
        )
        
        # Loss function
        criterion = nn.CrossEntropyLoss()
        
        best_val_acc = 0.0
        
        for epoch in range(self.config['epochs']):
            # Training phase
            self.model.train()
            train_loss = 0.0
            train_correct = 0
            train_total = 0
            
            pbar = tqdm(self.train_loader, desc=f'Epoch {epoch+1}/{self.config["epochs"]}')
            for batch_idx, (images, labels) in enumerate(pbar):
                images, labels = images.to(self.device), labels.to(self.device)
                
                optimizer.zero_grad()
                outputs = self.model(images)
                loss = criterion(outputs, labels)
                loss.backward()
                optimizer.step()
                
                train_loss += loss.item()
                _, predicted = outputs.max(1)
                train_total += labels.size(0)
                train_correct += predicted.eq(labels).sum().item()
                
                # Update progress bar
                pbar.set_postfix({
                    'Loss': f'{loss.item():.4f}',
                    'Acc': f'{100.*train_correct/train_total:.2f}%'
                })
            
            # Validation phase
            val_loss, val_acc = self.validate()
            
            # Update scheduler
            scheduler.step()
            
            # Logging
            train_acc = 100. * train_correct / train_total
            logger.info(f'Epoch {epoch+1}: Train Loss: {train_loss/len(self.train_loader):.4f}, '
                       f'Train Acc: {train_acc:.2f}%, Val Loss: {val_loss:.4f}, Val Acc: {val_acc:.2f}%')
            
            # Log to wandb
            if os.getenv('WANDB_API_KEY'):
                wandb.log({
                    'epoch': epoch + 1,
                    'train_loss': train_loss / len(self.train_loader),
                    'train_acc': train_acc,
                    'val_loss': val_loss,
                    'val_acc': val_acc,
                    'lr': optimizer.param_groups[0]['lr']
                })
            
            # Save best model
            if val_acc > best_val_acc:
                best_val_acc = val_acc
                self.save_model('best_model.pth', epoch, val_acc)
                logger.info(f'New best model saved with validation accuracy: {val_acc:.2f}%')
        
        logger.info(f'Training completed. Best validation accuracy: {best_val_acc:.2f}%')
    
    def validate(self) -> Tuple[float, float]:
        """Validate the model."""
        self.model.eval()
        val_loss = 0.0
        correct = 0
        total = 0
        criterion = nn.CrossEntropyLoss()
        
        with torch.no_grad():
            for images, labels in self.val_loader:
                images, labels = images.to(self.device), labels.to(self.device)
                outputs = self.model(images)
                loss = criterion(outputs, labels)
                
                val_loss += loss.item()
                _, predicted = outputs.max(1)
                total += labels.size(0)
                correct += predicted.eq(labels).sum().item()
        
        val_loss /= len(self.val_loader)
        val_acc = 100. * correct / total
        
        return val_loss, val_acc
    
    def test(self) -> Dict[str, Any]:
        """Test the model and generate metrics."""
        logger.info("Testing model...")
        
        self.model.eval()
        all_preds = []
        all_labels = []
        
        with torch.no_grad():
            for images, labels in tqdm(self.test_loader, desc='Testing'):
                images, labels = images.to(self.device), labels.to(self.device)
                outputs = self.model(images)
                _, predicted = outputs.max(1)
                
                all_preds.extend(predicted.cpu().numpy())
                all_labels.extend(labels.cpu().numpy())
        
        # Calculate metrics
        test_acc = 100. * np.mean(np.array(all_preds) == np.array(all_labels))
        
        # Classification report
        report = classification_report(
            all_labels, all_preds, 
            target_names=self.class_names,
            output_dict=True
        )
        
        logger.info(f'Test Accuracy: {test_acc:.2f}%')
        
        return {
            'test_accuracy': test_acc,
            'classification_report': report,
            'predictions': all_preds,
            'labels': all_labels
        }
    
    def save_model(self, filename: str, epoch: int, accuracy: float) -> None:
        """Save model checkpoint."""
        model_dir = Path('models')
        model_dir.mkdir(exist_ok=True)
        
        checkpoint = {
            'epoch': epoch,
            'model_state_dict': self.model.state_dict(),
            'accuracy': accuracy,
            'config': self.config,
            'class_names': self.class_names,
            'num_classes': self.num_classes
        }
        
        torch.save(checkpoint, model_dir / filename)
        logger.info(f'Model saved to {model_dir / filename}')
    
    def export_onnx(self, model_path: str, output_path: str) -> None:
        """Export model to ONNX format."""
        logger.info("Exporting model to ONNX...")
        
        # Load model
        checkpoint = torch.load(model_path, map_location=self.device)
        self.model.load_state_dict(checkpoint['model_state_dict'])
        self.model.eval()
        
        # Create dummy input
        dummy_input = torch.randn(1, 3, 224, 224).to(self.device)
        
        # Export
        torch.onnx.export(
            self.model,
            dummy_input,
            output_path,
            export_params=True,
            opset_version=11,
            do_constant_folding=True,
            input_names=['input'],
            output_names=['output'],
            dynamic_axes={
                'input': {0: 'batch_size'},
                'output': {0: 'batch_size'}
            }
        )
        
        logger.info(f'ONNX model exported to {output_path}')

def main():
    """Main training function."""
    parser = argparse.ArgumentParser(description='Train CalAi food recognition model')
    parser.add_argument('--data-dir', default='./datasets', help='Data directory')
    parser.add_argument('--model', default='efficientnet_b0', help='Model architecture')
    parser.add_argument('--epochs', type=int, default=50, help='Number of epochs')
    parser.add_argument('--batch-size', type=int, default=32, help='Batch size')
    parser.add_argument('--lr', type=float, default=1e-3, help='Learning rate')
    parser.add_argument('--weight-decay', type=float, default=1e-4, help='Weight decay')
    parser.add_argument('--pretrained', action='store_true', help='Use pretrained model')
    parser.add_argument('--export-onnx', help='Export model to ONNX')
    
    args = parser.parse_args()
    
    # Configuration
    config = {
        'model_name': args.model,
        'epochs': args.epochs,
        'batch_size': args.batch_size,
        'learning_rate': args.lr,
        'weight_decay': args.weight_decay,
        'pretrained': args.pretrained,
    }
    
    # Create trainer
    trainer = FoodTrainer(config)
    
    # Prepare data
    trainer.prepare_data(args.data_dir)
    
    # Build model
    trainer.build_model()
    
    # Train
    trainer.train()
    
    # Test
    test_results = trainer.test()
    
    # Save test results
    with open('test_results.json', 'w') as f:
        json.dump(test_results, f, indent=2, default=str)
    
    # Export ONNX if requested
    if args.export_onnx:
        trainer.export_onnx('models/best_model.pth', args.export_onnx)

if __name__ == '__main__':
    main()
