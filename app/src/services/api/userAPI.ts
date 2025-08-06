import { apiClient } from './config';
import { User } from '../../types/auth';

export interface UserProfile {
  height: number;
  weight: number;
  age: number;
  gender: 'male' | 'female' | 'other';
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
}

export interface UserGoals {
  dailyCalories: number;
  protein: number;
  carbs: number;
  fat: number;
  water: number;
  targetWeight: number;
}

export interface UserStats {
  currentStreak: number;
  longestStreak: number;
  totalMeals: number;
  totalDays: number;
  avgCalories: number;
}

export const userAPI = {
  // Get user profile
  getProfile: async (): Promise<{
    user: User;
    profile: UserProfile;
    goals: UserGoals;
  }> => {
    const response = await apiClient.get('/user/profile');
    return response.data;
  },

  // Update user profile
  updateProfile: async (profileData: Partial<UserProfile>): Promise<{
    profile: UserProfile;
  }> => {
    const response = await apiClient.put('/user/profile', {
      profile: profileData,
    });
    return response.data;
  },

  // Update user goals
  updateGoals: async (goals: Partial<UserGoals>): Promise<{
    goals: UserGoals;
  }> => {
    const response = await apiClient.put('/user/goals', {
      goals,
    });
    return response.data;
  },

  // Get user statistics
  getStats: async (): Promise<{
    stats: UserStats;
  }> => {
    const response = await apiClient.get('/user/stats');
    return response.data;
  },

  // Update user basic info
  updateBasicInfo: async (userData: Partial<User>): Promise<{
    user: User;
  }> => {
    const response = await apiClient.put('/user', {
      user: userData,
    });
    return response.data;
  },

  // Delete user account
  deleteAccount: async (): Promise<void> => {
    await apiClient.delete('/user/account');
  },

  // Get user preferences
  getPreferences: async (): Promise<{
    preferences: {
      units: 'metric' | 'imperial';
      theme: 'light' | 'dark' | 'auto';
      language: string;
      notifications: {
        meals: boolean;
        water: boolean;
        insights: boolean;
        marketing: boolean;
      };
    };
  }> => {
    const response = await apiClient.get('/user/preferences');
    return response.data;
  },

  // Update user preferences
  updatePreferences: async (preferences: any): Promise<{
    preferences: any;
  }> => {
    const response = await apiClient.put('/user/preferences', {
      preferences,
    });
    return response.data;
  },

  // Export user data
  exportData: async (format: 'json' | 'csv'): Promise<Blob> => {
    const response = await apiClient.get(`/user/export?format=${format}`, {
      responseType: 'blob',
    });
    return response.data;
  },

  // Get user achievements
  getAchievements: async (): Promise<{
    achievements: Array<{
      id: string;
      name: string;
      description: string;
      icon: string;
      unlockedAt?: string;
      progress: number;
      target: number;
      category: 'meals' | 'streak' | 'nutrition' | 'goals';
    }>;
  }> => {
    const response = await apiClient.get('/user/achievements');
    return response.data;
  },

  // Get user insights
  getInsights: async (timeframe: 'week' | 'month' | 'year' = 'week'): Promise<{
    insights: Array<{
      id: string;
      type: 'suggestion' | 'warning' | 'achievement' | 'trend';
      title: string;
      message: string;
      data?: any;
      createdAt: string;
    }>;
  }> => {
    const response = await apiClient.get(`/user/insights?timeframe=${timeframe}`);
    return response.data;
  },

  // Update user weight entry
  logWeight: async (weightData: {
    weight: number;
    date: string;
    notes?: string;
  }): Promise<{
    entry: {
      id: string;
      weight: number;
      date: string;
      notes?: string;
    };
  }> => {
    const response = await apiClient.post('/user/weight', weightData);
    return response.data;
  },

  // Get weight history
  getWeightHistory: async (
    startDate?: string,
    endDate?: string
  ): Promise<{
    entries: Array<{
      id: string;
      weight: number;
      date: string;
      notes?: string;
    }>;
  }> => {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);

    const response = await apiClient.get(`/user/weight?${params.toString()}`);
    return response.data;
  },

  // Get user's meal history with pagination
  getMealHistory: async (params: {
    page?: number;
    limit?: number;
    startDate?: string;
    endDate?: string;
  } = {}): Promise<{
    meals: any[];
    totalCount: number;
    totalPages: number;
    currentPage: number;
  }> => {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.startDate) queryParams.append('start_date', params.startDate);
    if (params.endDate) queryParams.append('end_date', params.endDate);

    const response = await apiClient.get(`/user/meals?${queryParams.toString()}`);
    return response.data;
  },
};
