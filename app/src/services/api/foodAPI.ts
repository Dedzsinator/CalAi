import { apiClient } from './config';
import { Food } from '../../types/nutrition';

export const foodAPI = {
  // Search foods
  searchFoods: async (query: string, options?: {
    category?: string;
    limit?: number;
    offset?: number;
  }): Promise<{
    foods: Food[];
    totalCount: number;
  }> => {
    const params = new URLSearchParams({ q: query });
    if (options?.category) params.append('category', options.category);
    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.offset) params.append('offset', options.offset.toString());

    const response = await apiClient.get(`/foods/search?${params.toString()}`);
    return response.data;
  },

  // Get food by ID
  getFoodById: async (foodId: string): Promise<{ food: Food }> => {
    const response = await apiClient.get(`/foods/${foodId}`);
    return response.data;
  },

  // Get food by barcode
  getFoodByBarcode: async (barcode: string): Promise<{ food: Food }> => {
    const response = await apiClient.get(`/foods/barcode/${barcode}`);
    return response.data;
  },

  // Get popular foods
  getPopularFoods: async (limit: number = 20): Promise<{ foods: Food[] }> => {
    const response = await apiClient.get(`/foods/popular?limit=${limit}`);
    return response.data;
  },

  // Get foods by category
  getFoodsByCategory: async (
    category: string,
    options?: { limit?: number; offset?: number }
  ): Promise<{
    foods: Food[];
    totalCount: number;
  }> => {
    const params = new URLSearchParams({ category });
    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.offset) params.append('offset', options.offset.toString());

    const response = await apiClient.get(`/foods/category?${params.toString()}`);
    return response.data;
  },

  // Create custom food
  createFood: async (foodData: {
    name: string;
    brandName?: string;
    servingSize: number;
    servingUnit: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber?: number;
    sugar?: number;
    sodium?: number;
    category?: string;
    barcode?: string;
  }): Promise<{ food: Food }> => {
    const response = await apiClient.post('/foods', foodData);
    return response.data;
  },

  // Update food
  updateFood: async (
    foodId: string,
    updates: Partial<Food>
  ): Promise<{ food: Food }> => {
    const response = await apiClient.put(`/foods/${foodId}`, updates);
    return response.data;
  },

  // Delete food
  deleteFood: async (foodId: string): Promise<{ success: boolean }> => {
    const response = await apiClient.delete(`/foods/${foodId}`);
    return response.data;
  },

  // Get user's favorite foods
  getFavorites: async (): Promise<{ foods: Food[] }> => {
    const response = await apiClient.get('/foods/favorites');
    return response.data;
  },

  // Add food to favorites
  addToFavorites: async (foodId: string): Promise<{ success: boolean }> => {
    const response = await apiClient.post('/foods/favorites', { food_id: foodId });
    return response.data;
  },

  // Remove food from favorites
  removeFromFavorites: async (foodId: string): Promise<{ success: boolean }> => {
    const response = await apiClient.delete(`/foods/favorites/${foodId}`);
    return response.data;
  },

  // Get recently used foods
  getRecentlyUsed: async (limit: number = 20): Promise<{ foods: Food[] }> => {
    const response = await apiClient.get(`/foods/recent?limit=${limit}`);
    return response.data;
  },

  // Get food suggestions based on meal type and time
  getFoodSuggestions: async (params: {
    mealType?: string;
    time?: string;
    preferences?: string[];
  }): Promise<{
    suggestions: Food[];
  }> => {
    const queryParams = new URLSearchParams();
    if (params.mealType) queryParams.append('meal_type', params.mealType);
    if (params.time) queryParams.append('time', params.time);
    if (params.preferences) {
      params.preferences.forEach(pref => 
        queryParams.append('preferences', pref)
      );
    }

    const response = await apiClient.get(`/foods/suggestions?${queryParams.toString()}`);
    return response.data;
  },

  // Verify food data with external APIs
  verifyFood: async (foodData: {
    name: string;
    barcode?: string;
  }): Promise<{
    verified: boolean;
    suggestions: Food[];
  }> => {
    const response = await apiClient.post('/foods/verify', foodData);
    return response.data;
  },

  // Get nutrition information from image OCR
  extractNutritionFromImage: async (imageUri: string): Promise<{
    nutrition: {
      calories?: number;
      protein?: number;
      carbs?: number;
      fat?: number;
      fiber?: number;
      sugar?: number;
      sodium?: number;
    };
    confidence: number;
    rawText: string;
  }> => {
    const formData = new FormData();
    formData.append('image', {
      uri: imageUri,
      type: 'image/jpeg',
      name: 'nutrition_label.jpg',
    } as any);

    const response = await apiClient.post('/foods/extract-nutrition', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Get food alternatives/substitutions
  getFoodAlternatives: async (foodId: string): Promise<{
    alternatives: Array<{
      food: Food;
      reason: string;
      similarityScore: number;
    }>;
  }> => {
    const response = await apiClient.get(`/foods/${foodId}/alternatives`);
    return response.data;
  },

  // Report incorrect food data
  reportFood: async (
    foodId: string,
    report: {
      issue: string;
      description: string;
      correctData?: Partial<Food>;
    }
  ): Promise<{ success: boolean }> => {
    const response = await apiClient.post(`/foods/${foodId}/report`, report);
    return response.data;
  },

  // Bulk search foods by names
  bulkSearchFoods: async (foodNames: string[]): Promise<{
    results: Array<{
      query: string;
      foods: Food[];
    }>;
  }> => {
    const response = await apiClient.post('/foods/bulk-search', {
      food_names: foodNames,
    });
    return response.data;
  },

  // Get food categories
  getCategories: async (): Promise<{
    categories: Array<{
      id: string;
      name: string;
      icon: string;
      count: number;
    }>;
  }> => {
    const response = await apiClient.get('/foods/categories');
    return response.data;
  },
};

export default foodAPI;
