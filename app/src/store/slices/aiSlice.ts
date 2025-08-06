import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

export interface AIModel {
  id: string;
  name: string;
  version: string;
  size: number;
  accuracy: number;
  isLoaded: boolean;
  isLoading: boolean;
  downloadProgress: number;
}

export interface AIInferenceResult {
  predictions: Array<{
    foodName: string;
    confidence: number;
    nutrition: {
      calories: number;
      protein: number;
      carbs: number;
      fat: number;
    };
  }>;
  processingTime: number;
  timestamp: string;
}

export interface AIState {
  models: AIModel[];
  currentModel: AIModel | null;
  inferenceResults: AIInferenceResult[];
  isInitialized: boolean;
  isInferring: boolean;
  error: string | null;
  offlineMode: boolean;
  capabilities: {
    foodRecognition: boolean;
    nutritionEstimation: boolean;
    portionEstimation: boolean;
    ocrProcessing: boolean;
  };
}

const initialState: AIState = {
  models: [],
  currentModel: null,
  inferenceResults: [],
  isInitialized: false,
  isInferring: false,
  error: null,
  offlineMode: false,
  capabilities: {
    foodRecognition: false,
    nutritionEstimation: false,
    portionEstimation: false,
    ocrProcessing: false,
  },
};

// Async thunks
export const initializeAI = createAsyncThunk(
  'ai/initialize',
  async (_, { rejectWithValue }) => {
    try {
      // Initialize WASM runtime
      const wasmModule = await import('../../services/ai/wasmLoader');
      await wasmModule.initializeWASM();
      
      // Check available models
      const response = await fetch('/api/v1/ai/models');
      if (!response.ok) throw new Error('Failed to fetch models');
      const data = await response.json();
      
      return {
        models: data.models,
        capabilities: data.capabilities,
      };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to initialize AI');
    }
  }
);

export const loadModel = createAsyncThunk(
  'ai/loadModel',
  async (modelId: string, { rejectWithValue, dispatch }) => {
    try {
      dispatch(setModelLoading({ modelId, isLoading: true }));
      
      // Download model if not cached
      const modelLoader = await import('../../services/ai/modelLoader');
      const model = await modelLoader.loadModel(modelId, (progress: number) => {
        dispatch(setModelDownloadProgress({ modelId, progress }));
      });
      
      return model;
    } catch (error: any) {
      dispatch(setModelLoading({ modelId, isLoading: false }));
      return rejectWithValue(error.message || 'Failed to load model');
    }
  }
);

export const runInference = createAsyncThunk(
  'ai/runInference',
  async ({ imageData, modelId }: { imageData: string; modelId?: string }, { rejectWithValue, getState }) => {
    try {
      const state = getState() as { ai: AIState };
      const model = modelId ? 
        state.ai.models.find(m => m.id === modelId) : 
        state.ai.currentModel;
      
      if (!model || !model.isLoaded) {
        throw new Error('No model loaded for inference');
      }
      
      const aiService = await import('../../services/ai/inferenceService');
      const result = await aiService.runFoodRecognition(imageData, model.id);
      
      return result;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Inference failed');
    }
  }
);

export const runOCRInference = createAsyncThunk(
  'ai/runOCRInference',
  async (imageData: string, { rejectWithValue }) => {
    try {
      const ocrService = await import('../../services/ai/ocrService');
      const result = await ocrService.extractText(imageData);
      return result;
    } catch (error: any) {
      return rejectWithValue(error.message || 'OCR failed');
    }
  }
);

export const estimatePortion = createAsyncThunk(
  'ai/estimatePortion',
  async ({ imageData, foodType }: { imageData: string; foodType: string }, { rejectWithValue }) => {
    try {
      const portionService = await import('../../services/ai/portionEstimation');
      const result = await portionService.estimatePortion(imageData, foodType);
      return result;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Portion estimation failed');
    }
  }
);

const aiSlice = createSlice({
  name: 'ai',
  initialState,
  reducers: {
    setOfflineMode: (state, action: PayloadAction<boolean>) => {
      state.offlineMode = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    clearInferenceResults: (state) => {
      state.inferenceResults = [];
    },
    setCurrentModel: (state, action: PayloadAction<string>) => {
      const model = state.models.find(m => m.id === action.payload);
      if (model) {
        state.currentModel = model;
      }
    },
    setModelLoading: (state, action: PayloadAction<{ modelId: string; isLoading: boolean }>) => {
      const model = state.models.find(m => m.id === action.payload.modelId);
      if (model) {
        model.isLoading = action.payload.isLoading;
      }
    },
    setModelDownloadProgress: (state, action: PayloadAction<{ modelId: string; progress: number }>) => {
      const model = state.models.find(m => m.id === action.payload.modelId);
      if (model) {
        model.downloadProgress = action.payload.progress;
      }
    },
    addInferenceResult: (state, action: PayloadAction<AIInferenceResult>) => {
      state.inferenceResults.unshift(action.payload);
      // Keep only last 50 results
      if (state.inferenceResults.length > 50) {
        state.inferenceResults = state.inferenceResults.slice(0, 50);
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Initialize AI
      .addCase(initializeAI.pending, (state) => {
        state.error = null;
      })
      .addCase(initializeAI.fulfilled, (state, action) => {
        state.isInitialized = true;
        state.models = action.payload.models;
        state.capabilities = action.payload.capabilities;
        // Set first available model as current
        if (action.payload.models.length > 0) {
          state.currentModel = action.payload.models[0];
        }
      })
      .addCase(initializeAI.rejected, (state, action) => {
        state.error = action.payload as string;
        state.offlineMode = true; // Fallback to offline mode
      })
      // Load Model
      .addCase(loadModel.fulfilled, (state, action) => {
        const model = state.models.find(m => m.id === action.payload.id);
        if (model) {
          model.isLoaded = true;
          model.isLoading = false;
          model.downloadProgress = 100;
        }
        state.currentModel = action.payload;
      })
      .addCase(loadModel.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      // Run Inference
      .addCase(runInference.pending, (state) => {
        state.isInferring = true;
        state.error = null;
      })
      .addCase(runInference.fulfilled, (state, action) => {
        state.isInferring = false;
        state.inferenceResults.unshift(action.payload);
        // Keep only last 50 results
        if (state.inferenceResults.length > 50) {
          state.inferenceResults = state.inferenceResults.slice(0, 50);
        }
      })
      .addCase(runInference.rejected, (state, action) => {
        state.isInferring = false;
        state.error = action.payload as string;
      })
      // OCR Inference
      .addCase(runOCRInference.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      // Portion Estimation
      .addCase(estimatePortion.rejected, (state, action) => {
        state.error = action.payload as string;
      });
  },
});

export const {
  setOfflineMode,
  clearError,
  clearInferenceResults,
  setCurrentModel,
  setModelLoading,
  setModelDownloadProgress,
  addInferenceResult,
} = aiSlice.actions;

export default aiSlice.reducer;
