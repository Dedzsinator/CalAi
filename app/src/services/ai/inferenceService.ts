/**
 * AI Inference Service for food recognition and nutrition estimation
 * Handles image preprocessing, model inference, and result processing
 */

import { getModelLoader, ModelMetadata } from './modelLoader';
import { getWASMLoader, ort } from './wasmLoader';

export interface FoodPrediction {
  foodName: string;
  confidence: number;
  nutrition: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
}

export interface InferenceResult {
  predictions: FoodPrediction[];
  processingTime: number;
  timestamp: string;
  imageSize: { width: number; height: number };
}

export interface ImagePreprocessingOptions {
  targetSize: { width: number; height: number };
  normalize: boolean;
  mean?: number[];
  std?: number[];
}

class InferenceService {
  private processingState = false;

  async runFoodRecognition(
    imageDataUri: string,
    modelId: string = 'food-classifier-v1'
  ): Promise<InferenceResult> {
    if (this.processingState) {
      throw new Error('Another inference is already in progress');
    }

    this.processingState = true;
    const startTime = performance.now();

    try {
      // Get model and metadata
      const modelLoader = getModelLoader();
      const model = modelLoader.getModel(modelId);
      const metadata = modelLoader.getModelMetadata(modelId);

      if (!model || !metadata) {
        throw new Error(`Model not loaded: ${modelId}`);
      }

      // Preprocess image
      const preprocessed = await this.preprocessImage(imageDataUri, {
        targetSize: { 
          width: metadata.inputShape[3], 
          height: metadata.inputShape[2] 
        },
        normalize: metadata.preprocessing.normalize,
        mean: metadata.preprocessing.mean,
        std: metadata.preprocessing.std,
      });

      // Run inference
      const inputTensor = new ort.Tensor('float32', preprocessed.data, metadata.inputShape);
      const feeds = { [model.inputNames[0]]: inputTensor };
      
      const output = await model.run(feeds);
      const outputTensor = output[model.outputNames[0]];

      // Process results
      const predictions = await this.processFoodClassificationResults(
        outputTensor.data as Float32Array,
        metadata.labels
      );

      // Get nutrition estimates for top predictions
      const enrichedPredictions = await this.enrichWithNutrition(predictions.slice(0, 3));

      const processingTime = performance.now() - startTime;

      return {
        predictions: enrichedPredictions,
        processingTime,
        timestamp: new Date().toISOString(),
        imageSize: { width: preprocessed.width, height: preprocessed.height },
      };
    } catch (error) {
      throw new Error(`Food recognition failed: ${error.message}`);
    } finally {
      this.processingState = false;
    }
  }

  async estimateNutrition(
    imageDataUri: string,
    foodType?: string
  ): Promise<{
    nutrition: {
      calories: number;
      protein: number;
      carbs: number;
      fat: number;
    };
    confidence: number;
    portionSize: number;
  }> {
    const modelId = 'nutrition-estimator-v1';
    const modelLoader = getModelLoader();
    const model = modelLoader.getModel(modelId);
    const metadata = modelLoader.getModelMetadata(modelId);

    if (!model || !metadata) {
      throw new Error(`Nutrition model not loaded: ${modelId}`);
    }

    try {
      // Preprocess image
      const preprocessed = await this.preprocessImage(imageDataUri, {
        targetSize: { 
          width: metadata.inputShape[3], 
          height: metadata.inputShape[2] 
        },
        normalize: metadata.preprocessing.normalize,
        mean: metadata.preprocessing.mean,
        std: metadata.preprocessing.std,
      });

      // Run inference
      const inputTensor = new ort.Tensor('float32', preprocessed.data, metadata.inputShape);
      const feeds = { [model.inputNames[0]]: inputTensor };
      
      const output = await model.run(feeds);
      const outputTensor = output[model.outputNames[0]];
      const results = outputTensor.data as Float32Array;

      // Extract nutrition values
      const nutrition = {
        calories: Math.max(0, results[0]),
        protein: Math.max(0, results[1]),
        carbs: Math.max(0, results[2]),
        fat: Math.max(0, results[3]),
      };

      // Calculate confidence based on model certainty
      const confidence = this.calculateNutritionConfidence(results);

      // Estimate portion size (simplified)
      const portionSize = this.estimatePortionSize(preprocessed.width, preprocessed.height);

      return {
        nutrition,
        confidence,
        portionSize,
      };
    } catch (error) {
      throw new Error(`Nutrition estimation failed: ${error.message}`);
    }
  }

  private async preprocessImage(
    imageDataUri: string,
    options: ImagePreprocessingOptions
  ): Promise<{
    data: Float32Array;
    width: number;
    height: number;
  }> {
    try {
      // Create image element
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = imageDataUri;
      });

      // Create canvas for preprocessing
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        throw new Error('Could not get canvas context');
      }

      // Resize image
      canvas.width = options.targetSize.width;
      canvas.height = options.targetSize.height;
      
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      
      // Get image data
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const pixels = imageData.data;

      // Convert to tensor format [1, 3, H, W]
      const tensorData = new Float32Array(3 * canvas.width * canvas.height);
      
      for (let i = 0; i < pixels.length; i += 4) {
        const pixelIndex = i / 4;
        const r = pixels[i] / 255.0;
        const g = pixels[i + 1] / 255.0;
        const b = pixels[i + 2] / 255.0;

        // Apply normalization if specified
        let normalizedR = r;
        let normalizedG = g;
        let normalizedB = b;

        if (options.normalize && options.mean && options.std) {
          normalizedR = (r - options.mean[0]) / options.std[0];
          normalizedG = (g - options.mean[1]) / options.std[1];
          normalizedB = (b - options.mean[2]) / options.std[2];
        }

        // Store in CHW format
        tensorData[pixelIndex] = normalizedR; // R channel
        tensorData[canvas.width * canvas.height + pixelIndex] = normalizedG; // G channel
        tensorData[2 * canvas.width * canvas.height + pixelIndex] = normalizedB; // B channel
      }

      return {
        data: tensorData,
        width: canvas.width,
        height: canvas.height,
      };
    } catch (error) {
      throw new Error(`Image preprocessing failed: ${error.message}`);
    }
  }

  private async processFoodClassificationResults(
    output: Float32Array,
    labels: string[]
  ): Promise<Array<{ foodName: string; confidence: number }>> {
    // Apply softmax to get probabilities
    const softmaxOutput = this.softmax(Array.from(output));
    
    // Create predictions with labels
    const predictions = softmaxOutput
      .map((confidence, index) => ({
        foodName: labels[index] || `unknown_${index}`,
        confidence,
      }))
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 5); // Top 5 predictions

    return predictions;
  }

  private async enrichWithNutrition(
    predictions: Array<{ foodName: string; confidence: number }>
  ): Promise<FoodPrediction[]> {
    // In a real app, this would query a nutrition database
    // For now, return mock nutrition data
    return predictions.map(pred => ({
      ...pred,
      nutrition: this.getMockNutrition(pred.foodName),
    }));
  }

  private getMockNutrition(foodName: string): {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  } {
    // Mock nutrition data - in real app, query nutrition database
    const nutritionMap: Record<string, any> = {
      apple: { calories: 52, protein: 0.3, carbs: 14, fat: 0.2 },
      banana: { calories: 89, protein: 1.1, carbs: 23, fat: 0.3 },
      bread: { calories: 265, protein: 9, carbs: 49, fat: 3.2 },
      // Add more foods...
    };

    return nutritionMap[foodName.toLowerCase()] || {
      calories: 100,
      protein: 5,
      carbs: 15,
      fat: 3,
    };
  }

  private softmax(values: number[]): number[] {
    const max = Math.max(...values);
    const exps = values.map(v => Math.exp(v - max));
    const sum = exps.reduce((a, b) => a + b, 0);
    return exps.map(exp => exp / sum);
  }

  private calculateNutritionConfidence(results: Float32Array): number {
    // Simple confidence calculation based on result magnitudes
    const variance = this.calculateVariance(Array.from(results));
    return Math.min(1, Math.max(0, 1 - variance / 100));
  }

  private calculateVariance(values: number[]): number {
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const squaredDiffs = values.map(value => Math.pow(value - mean, 2));
    return squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
  }

  private estimatePortionSize(width: number, height: number): number {
    // Simplified portion size estimation based on image dimensions
    // In a real app, this would use object detection and depth estimation
    const imageArea = width * height;
    const normalizedArea = imageArea / (224 * 224); // Normalize to standard input size
    return Math.min(500, Math.max(50, normalizedArea * 100)); // grams
  }

  getProcessingState(): boolean {
    return this.processingState;
  }

  // Batch processing for multiple images
  async batchInference(
    images: string[],
    modelId: string = 'food-classifier-v1'
  ): Promise<InferenceResult[]> {
    const results: InferenceResult[] = [];
    
    for (const image of images) {
      try {
        const result = await this.runFoodRecognition(image, modelId);
        results.push(result);
      } catch (error) {
        console.error('Batch inference error:', error);
        // Continue with next image
      }
    }
    
    return results;
  }
}

// Singleton instance
let inferenceService: InferenceService | null = null;

export const getInferenceService = (): InferenceService => {
  if (!inferenceService) {
    inferenceService = new InferenceService();
  }
  return inferenceService;
};

export const runFoodRecognition = async (
  imageData: string,
  modelId?: string
): Promise<InferenceResult> => {
  const service = getInferenceService();
  return await service.runFoodRecognition(imageData, modelId);
};
