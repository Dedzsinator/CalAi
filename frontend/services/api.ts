import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = __DEV__ ? 'http://localhost:4000' : 'https://api.calai.app';

interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

class ApiService {
  private baseURL: string;
  private token: string | null = null;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
    this.loadToken();
  }

  private async loadToken() {
    try {
      this.token = await AsyncStorage.getItem('auth_token');
    } catch (error) {
      console.error('Failed to load auth token:', error);
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}/api/v1${endpoint}`;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'API request failed');
      }

      return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Auth
  async login(email: string, password: string) {
    const response = await this.request<{ token: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (response.data.token) {
      this.token = response.data.token;
      await AsyncStorage.setItem('auth_token', this.token);
    }

    return response;
  }

  async register(email: string, password: string, name: string) {
    return this.request<{ token: string; user: any }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    });
  }

  async logout() {
    this.token = null;
    await AsyncStorage.removeItem('auth_token');
  }

  // Meals
  async logMeal(mealData: {
    foods: {
      name: string;
      calories: number;
      protein: number;
      carbs: number;
      fat: number;
      confidence: number;
      portion_size?: string;
    }[];
    image_url?: string;
    notes?: string;
    eaten_at?: string;
  }) {
    return this.request<any>('/meals', {
      method: 'POST',
      body: JSON.stringify(mealData),
    });
  }

  async getMeals(startDate?: string, endDate?: string) {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    
    return this.request<any[]>(`/meals?${params.toString()}`);
  }

  async getMeal(id: string) {
    return this.request<any>(`/meals/${id}`);
  }

  async updateMeal(id: string, mealData: any) {
    return this.request<any>(`/meals/${id}`, {
      method: 'PUT',
      body: JSON.stringify(mealData),
    });
  }

  async deleteMeal(id: string) {
    return this.request<any>(`/meals/${id}`, {
      method: 'DELETE',
    });
  }

  // Analytics
  async getAnalytics(period: 'day' | 'week' | 'month' = 'week') {
    const endpoint = period === 'day' ? '/analytics/daily' : 
                    period === 'week' ? '/analytics/weekly' : 
                    '/analytics/monthly';
    
    return this.request<{
      calories: { avg: number; total: number; trend: number[] };
      macros: { protein: number; carbs: number; fat: number };
      habits: { meal_times: any[]; common_foods: any[] };
    }>(endpoint);
  }

  // Food Database
  async searchFoods(query: string) {
    return this.request<{
      id: string;
      name: string;
      calories_per_100g: number;
      protein_per_100g: number;
      carbs_per_100g: number;
      fat_per_100g: number;
      brand?: string;
    }[]>(`/foods/search?q=${encodeURIComponent(query)}`);
  }

  // Barcode
  async lookupBarcode(barcode: string) {
    return this.request<{
      product: {
        name: string;
        brand: string;
        nutrition: {
          calories: number;
          protein: number;
          carbs: number;
          fat: number;
        };
      };
    }>(`/foods/barcode`, {
      method: 'POST',
      body: JSON.stringify({ barcode }),
    });
  }

  // AI Inference Fallback
  async inferFood(imageUri: string) {
    const formData = new FormData();
    formData.append('image', {
      uri: imageUri,
      type: 'image/jpeg',
      name: 'food.jpg',
    } as any);

    return this.request<{
      predictions: {
        food_name: string;
        confidence: number;
        calories: number;
        protein: number;
        carbs: number;
        fat: number;
        portion_estimate: string;
      }[];
    }>('/inference/classify', {
      method: 'POST',
      headers: {
        'Content-Type': 'multipart/form-data',
        ...(this.token && { 'Authorization': `Bearer ${this.token}` }),
      },
      body: formData,
    });
  }

  // User Profile
  async getProfile() {
    return this.request<{
      id: string;
      name: string;
      email: string;
      goals: {
        daily_calories: number;
        protein_percent: number;
        carbs_percent: number;
        fat_percent: number;
      };
      preferences: {
        diet_type?: string;
        allergies: string[];
        notifications_enabled: boolean;
      };
    }>('/profile');
  }

  async updateProfile(profileData: any) {
    return this.request<any>('/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  }
}

export default new ApiService();
