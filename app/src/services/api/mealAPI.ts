import { apiClient } from './config';
import { Meal, MealFood, CreateMealRequest, UpdateMealRequest } from '../../types/nutrition';

export const mealAPI = {
  // Get today's meals
  getTodaysMeals: async (): Promise<{ meals: Meal[] }> => {
    const today = new Date().toISOString().split('T')[0];
    const response = await apiClient.get(`/meals?date=${today}`);
    return response.data;
  },

  // Get meals with pagination and filters
  getMeals: async (params: {
    page?: number;
    limit?: number;
    date?: string;
    mealType?: string;
  }): Promise<{
    meals: Meal[];
    totalCount: number;
    totalPages: number;
    currentPage: number;
  }> => {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.date) queryParams.append('date', params.date);
    if (params.mealType) queryParams.append('meal_type', params.mealType);

    const response = await apiClient.get(`/meals?${queryParams.toString()}`);
    return response.data;
  },

  // Get meal by ID
  getMealById: async (mealId: string): Promise<{ meal: Meal }> => {
    const response = await apiClient.get(`/meals/${mealId}`);
    return response.data;
  },

  // Create a new meal
  createMeal: async (mealData: CreateMealRequest): Promise<{ meal: Meal }> => {
    const response = await apiClient.post('/meals', mealData);
    return response.data;
  },

  // Update an existing meal
  updateMeal: async (
    mealId: string, 
    updates: UpdateMealRequest
  ): Promise<{ meal: Meal }> => {
    const response = await apiClient.put(`/meals/${mealId}`, updates);
    return response.data;
  },

  // Delete a meal
  deleteMeal: async (mealId: string): Promise<{ success: boolean }> => {
    const response = await apiClient.delete(`/meals/${mealId}`);
    return response.data;
  },

  // Add food to meal
  addFoodToMeal: async (
    mealId: string,
    foodData: {
      foodId: string;
      quantity: number;
      unit: string;
      notes?: string;
    }
  ): Promise<{ mealFood: MealFood }> => {
    const response = await apiClient.post(`/meals/${mealId}/foods`, foodData);
    return response.data;
  },

  // Update food in meal
  updateMealFood: async (
    mealId: string,
    mealFoodId: string,
    updates: {
      quantity?: number;
      unit?: string;
      notes?: string;
    }
  ): Promise<{ mealFood: MealFood }> => {
    const response = await apiClient.put(
      `/meals/${mealId}/foods/${mealFoodId}`,
      updates
    );
    return response.data;
  },

  // Remove food from meal
  removeFoodFromMeal: async (
    mealId: string,
    mealFoodId: string
  ): Promise<{ success: boolean }> => {
    const response = await apiClient.delete(`/meals/${mealId}/foods/${mealFoodId}`);
    return response.data;
  },

  // Quick log meal from AI recognition
  quickLogMeal: async (data: {
    imageUri: string;
    predictions: Array<{
      foodName: string;
      confidence: number;
      quantity?: number;
      unit?: string;
    }>;
    mealType: string;
    timestamp?: string;
  }): Promise<{ meal: Meal }> => {
    const response = await apiClient.post('/meals/quick-log', data);
    return response.data;
  },

  // Get meal suggestions based on time and history
  getMealSuggestions: async (params: {
    mealType?: string;
    time?: string;
  }): Promise<{
    suggestions: Array<{
      name: string;
      foods: string[];
      estimatedCalories: number;
      reason: string;
    }>;
  }> => {
    const queryParams = new URLSearchParams();
    if (params.mealType) queryParams.append('meal_type', params.mealType);
    if (params.time) queryParams.append('time', params.time);

    const response = await apiClient.get(`/meals/suggestions?${queryParams.toString()}`);
    return response.data;
  },

  // Get nutrition summary for date range
  getNutritionSummary: async (params: {
    startDate: string;
    endDate: string;
  }): Promise<{
    summary: {
      totalCalories: number;
      avgCalories: number;
      totalProtein: number;
      totalCarbs: number;
      totalFat: number;
      totalFiber: number;
      mealCount: number;
    };
  }> => {
    const response = await apiClient.get(
      `/meals/nutrition-summary?start_date=${params.startDate}&end_date=${params.endDate}`
    );
    return response.data;
  },

  // Copy meal to another date
  copyMeal: async (
    mealId: string,
    targetDate: string
  ): Promise<{ meal: Meal }> => {
    const response = await apiClient.post(`/meals/${mealId}/copy`, {
      target_date: targetDate,
    });
    return response.data;
  },

  // Get frequent meal combinations
  getFrequentMeals: async (limit: number = 10): Promise<{
    meals: Array<{
      name: string;
      foods: string[];
      frequency: number;
      avgCalories: number;
    }>;
  }> => {
    const response = await apiClient.get(`/meals/frequent?limit=${limit}`);
    return response.data;
  },
};

export default mealAPI;
