/**
 * Model loader for downloading and caching AI models
 * Handles model versioning, updates, and local storage
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { getWASMLoader, ort } from './wasmLoader';

export interface AIModel {
  id: string;
  name: string;
  version: string;
  size: number;
  accuracy: number;
  downloadUrl: string;
  isLoaded: boolean;
  isLoading: boolean;
  downloadProgress: number;
  localPath?: string;
  checksum?: string;
}

export interface ModelMetadata {
  inputShape: number[];
  outputShape: number[];
  labels: string[];
  preprocessing: {
    normalize: boolean;
    mean?: number[];
    std?: number[];
  };
}

class ModelLoader {
  private models: Map<string, ort.InferenceSession> = new Map();
  private modelMetadata: Map<string, ModelMetadata> = new Map();
  private downloadProgress: Map<string, number> = new Map();

  constructor() {
    this.initializeCache();
  }

  private async initializeCache(): Promise<void> {
    try {
      const cachedModels = await AsyncStorage.getItem('cached_models');
      if (cachedModels) {
        const models = JSON.parse(cachedModels);
        console.log('📦 Found cached models:', Object.keys(models));
      }
    } catch (error) {
      console.error('Failed to initialize model cache:', error);
    }
  }

  async loadModel(
    modelId: string, 
    onProgress?: (progress: number) => void
  ): Promise<AIModel> {
    try {
      // Check if model is already loaded
      if (this.models.has(modelId)) {
        const cached = await this.getCachedModelInfo(modelId);
        return { ...cached, isLoaded: true, isLoading: false };
      }

      // Get model info from server
      const modelInfo = await this.fetchModelInfo(modelId);
      
      // Check if model is cached locally
      const cachedPath = await this.getCachedModelPath(modelId);
      let modelBuffer: ArrayBuffer;

      if (cachedPath && await this.validateCache(modelId, cachedPath)) {
        console.log('📱 Loading model from cache:', modelId);
        modelBuffer = await this.loadFromCache(cachedPath);
      } else {
        console.log('📥 Downloading model:', modelId);
        modelBuffer = await this.downloadModel(modelInfo, onProgress);
        await this.cacheModel(modelId, modelBuffer, modelInfo);
      }

      // Initialize WASM if needed
      const wasmLoader = getWASMLoader();
      if (!wasmLoader.isInitialized()) {
        throw new Error('WASM runtime not initialized');
      }

      // Create inference session
      const sessionOptions: ort.InferenceSession.SessionOptions = {
        executionProviders: wasmLoader.getExecutionProviders(),
        graphOptimizationLevel: 'all',
        executionMode: 'parallel',
      };

      const session = await ort.InferenceSession.create(modelBuffer, sessionOptions);
      this.models.set(modelId, session);

      // Load model metadata
      const metadata = await this.loadModelMetadata(modelId);
      this.modelMetadata.set(modelId, metadata);

      console.log('✅ Model loaded successfully:', modelId);
      
      return {
        ...modelInfo,
        isLoaded: true,
        isLoading: false,
        downloadProgress: 100,
      };
    } catch (error) {
      console.error('❌ Failed to load model:', modelId, error);
      throw new Error(`Model loading failed: ${error.message}`);
    }
  }

  private async fetchModelInfo(modelId: string): Promise<AIModel> {
    // In a real app, this would fetch from your API
    // For now, return mock data
    const modelInfos: Record<string, AIModel> = {
      'food-classifier-v1': {
        id: 'food-classifier-v1',
        name: 'Food Classifier',
        version: '1.0.0',
        size: 25 * 1024 * 1024, // 25MB
        accuracy: 0.92,
        downloadUrl: '/api/v1/models/food-classifier-v1.onnx',
        isLoaded: false,
        isLoading: false,
        downloadProgress: 0,
        checksum: 'sha256:abc123...',
      },
      'nutrition-estimator-v1': {
        id: 'nutrition-estimator-v1',
        name: 'Nutrition Estimator',
        version: '1.0.0',
        size: 15 * 1024 * 1024, // 15MB
        accuracy: 0.85,
        downloadUrl: '/api/v1/models/nutrition-estimator-v1.onnx',
        isLoaded: false,
        isLoading: false,
        downloadProgress: 0,
        checksum: 'sha256:def456...',
      },
    };

    const info = modelInfos[modelId];
    if (!info) {
      throw new Error(`Model not found: ${modelId}`);
    }

    return info;
  }

  private async downloadModel(
    modelInfo: AIModel,
    onProgress?: (progress: number) => void
  ): Promise<ArrayBuffer> {
    try {
      const response = await fetch(modelInfo.downloadUrl);
      
      if (!response.ok) {
        throw new Error(`Download failed: ${response.statusText}`);
      }

      const contentLength = response.headers.get('Content-Length');
      const total = contentLength ? parseInt(contentLength, 10) : modelInfo.size;
      
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Response body is not readable');
      }

      const chunks: Uint8Array[] = [];
      let receivedLength = 0;

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;
        
        chunks.push(value);
        receivedLength += value.length;
        
        const progress = Math.round((receivedLength / total) * 100);
        this.downloadProgress.set(modelInfo.id, progress);
        onProgress?.(progress);
      }

      // Combine chunks into single ArrayBuffer
      const combinedArray = new Uint8Array(receivedLength);
      let position = 0;
      for (const chunk of chunks) {
        combinedArray.set(chunk, position);
        position += chunk.length;
      }

      return combinedArray.buffer;
    } catch (error) {
      throw new Error(`Model download failed: ${error.message}`);
    }
  }

  private async cacheModel(
    modelId: string,
    modelBuffer: ArrayBuffer,
    modelInfo: AIModel
  ): Promise<void> {
    try {
      // Convert ArrayBuffer to base64 for storage
      const base64 = this.arrayBufferToBase64(modelBuffer);
      
      const cacheKey = `model_${modelId}`;
      const cacheData = {
        id: modelId,
        version: modelInfo.version,
        data: base64,
        checksum: modelInfo.checksum,
        cachedAt: Date.now(),
      };

      await AsyncStorage.setItem(cacheKey, JSON.stringify(cacheData));
      
      // Update cached models list
      const cachedModels = await AsyncStorage.getItem('cached_models') || '{}';
      const modelsList = JSON.parse(cachedModels);
      modelsList[modelId] = {
        version: modelInfo.version,
        size: modelBuffer.byteLength,
        cachedAt: Date.now(),
      };
      await AsyncStorage.setItem('cached_models', JSON.stringify(modelsList));

      console.log('💾 Model cached successfully:', modelId);
    } catch (error) {
      console.error('Failed to cache model:', error);
      // Don't throw, caching failure shouldn't break model loading
    }
  }

  private async loadFromCache(modelId: string): Promise<ArrayBuffer> {
    try {
      const cacheKey = `model_${modelId}`;
      const cachedData = await AsyncStorage.getItem(cacheKey);
      
      if (!cachedData) {
        throw new Error('Model not found in cache');
      }

      const { data } = JSON.parse(cachedData);
      return this.base64ToArrayBuffer(data);
    } catch (error) {
      throw new Error(`Failed to load from cache: ${error.message}`);
    }
  }

  private async getCachedModelPath(modelId: string): Promise<string | null> {
    try {
      const cachedModels = await AsyncStorage.getItem('cached_models') || '{}';
      const modelsList = JSON.parse(cachedModels);
      return modelsList[modelId] ? `model_${modelId}` : null;
    } catch (error) {
      return null;
    }
  }

  private async validateCache(modelId: string, cachePath: string): Promise<boolean> {
    try {
      const modelInfo = await this.fetchModelInfo(modelId);
      const cachedData = await AsyncStorage.getItem(cachePath);
      
      if (!cachedData) return false;
      
      const { version, checksum } = JSON.parse(cachedData);
      return version === modelInfo.version && checksum === modelInfo.checksum;
    } catch (error) {
      return false;
    }
  }

  private async getCachedModelInfo(modelId: string): Promise<AIModel> {
    const modelInfo = await this.fetchModelInfo(modelId);
    return { ...modelInfo, isLoaded: true };
  }

  private async loadModelMetadata(modelId: string): Promise<ModelMetadata> {
    // Mock metadata - in real app, this would be fetched or included with model
    const metadataMap: Record<string, ModelMetadata> = {
      'food-classifier-v1': {
        inputShape: [1, 3, 224, 224],
        outputShape: [1, 101],
        labels: ['apple', 'banana', 'bread', /* ... 101 food classes */],
        preprocessing: {
          normalize: true,
          mean: [0.485, 0.456, 0.406],
          std: [0.229, 0.224, 0.225],
        },
      },
      'nutrition-estimator-v1': {
        inputShape: [1, 3, 224, 224],
        outputShape: [1, 4], // calories, protein, carbs, fat
        labels: ['calories', 'protein', 'carbs', 'fat'],
        preprocessing: {
          normalize: true,
          mean: [0.485, 0.456, 0.406],
          std: [0.229, 0.224, 0.225],
        },
      },
    };

    return metadataMap[modelId] || {
      inputShape: [1, 3, 224, 224],
      outputShape: [1, 1],
      labels: [],
      preprocessing: { normalize: false },
    };
  }

  getModel(modelId: string): ort.InferenceSession | null {
    return this.models.get(modelId) || null;
  }

  getModelMetadata(modelId: string): ModelMetadata | null {
    return this.modelMetadata.get(modelId) || null;
  }

  getDownloadProgress(modelId: string): number {
    return this.downloadProgress.get(modelId) || 0;
  }

  async unloadModel(modelId: string): Promise<void> {
    const session = this.models.get(modelId);
    if (session) {
      await session.release();
      this.models.delete(modelId);
      this.modelMetadata.delete(modelId);
      console.log('🗑️ Model unloaded:', modelId);
    }
  }

  async clearCache(): Promise<void> {
    try {
      const cachedModels = await AsyncStorage.getItem('cached_models') || '{}';
      const modelsList = JSON.parse(cachedModels);
      
      for (const modelId of Object.keys(modelsList)) {
        await AsyncStorage.removeItem(`model_${modelId}`);
      }
      
      await AsyncStorage.removeItem('cached_models');
      console.log('🧹 Model cache cleared');
    } catch (error) {
      console.error('Failed to clear cache:', error);
    }
  }

  // Utility methods
  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }
}

// Singleton instance
let modelLoader: ModelLoader | null = null;

export const getModelLoader = (): ModelLoader => {
  if (!modelLoader) {
    modelLoader = new ModelLoader();
  }
  return modelLoader;
};

export const loadModel = async (
  modelId: string,
  onProgress?: (progress: number) => void
): Promise<AIModel> => {
  const loader = getModelLoader();
  return await loader.loadModel(modelId, onProgress);
};
