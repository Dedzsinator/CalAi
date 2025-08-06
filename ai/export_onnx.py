#!/usr/bin/env python3
"""
ONNX Model Export Script
Exports trained PyTorch models to ONNX format for web deployment.
"""

import torch
import onnx
from pathlib import Path
import argparse
import json
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def export_model_to_onnx(
    model_path: str,
    output_path: str,
    input_shape: tuple = (1, 3, 224, 224),
    opset_version: int = 11
):
    """Export PyTorch model to ONNX format."""
    
    logger.info(f"Loading model from {model_path}")
    
    # Load model checkpoint
    device = torch.device('cpu')  # Export for CPU inference
    checkpoint = torch.load(model_path, map_location=device)
    
    # Reconstruct model (assuming you have the model class available)
    from train import FoodClassificationModel
    
    model = FoodClassificationModel(
        num_classes=checkpoint['num_classes'],
        model_name=checkpoint['config']['model_name'],
        pretrained=False
    )
    
    model.load_state_dict(checkpoint['model_state_dict'])
    model.eval()
    
    # Create dummy input
    dummy_input = torch.randn(*input_shape)
    
    logger.info(f"Exporting to ONNX format: {output_path}")
    
    # Export to ONNX
    torch.onnx.export(
        model,
        dummy_input,
        output_path,
        export_params=True,
        opset_version=opset_version,
        do_constant_folding=True,
        input_names=['input'],
        output_names=['output'],
        dynamic_axes={
            'input': {0: 'batch_size'},
            'output': {0: 'batch_size'}
        }
    )
    
    # Verify ONNX model
    onnx_model = onnx.load(output_path)
    onnx.checker.check_model(onnx_model)
    
    logger.info("ONNX model exported and verified successfully")
    
    # Save metadata
    metadata = {
        'model_name': checkpoint['config']['model_name'],
        'num_classes': checkpoint['num_classes'],
        'class_names': checkpoint['class_names'],
        'input_shape': list(input_shape),
        'accuracy': checkpoint.get('accuracy', 0),
        'opset_version': opset_version
    }
    
    metadata_path = Path(output_path).with_suffix('.json')
    with open(metadata_path, 'w') as f:
        json.dump(metadata, f, indent=2)
    
    logger.info(f"Metadata saved to {metadata_path}")

def main():
    parser = argparse.ArgumentParser(description='Export PyTorch model to ONNX')
    parser.add_argument('--model', required=True, help='Path to PyTorch model')
    parser.add_argument('--output', required=True, help='Output ONNX file path')
    parser.add_argument('--input-shape', nargs=4, type=int, 
                       default=[1, 3, 224, 224], help='Input shape (batch, channels, height, width)')
    parser.add_argument('--opset-version', type=int, default=11, help='ONNX opset version')
    
    args = parser.parse_args()
    
    export_model_to_onnx(
        args.model,
        args.output,
        tuple(args.input_shape),
        args.opset_version
    )

if __name__ == '__main__':
    main()
