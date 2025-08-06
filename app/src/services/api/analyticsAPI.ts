import { apiClient } from './config';

export interface AnalyticsData {
  dailyCalories: Array<{ date: string; calories: number }>;
  weeklyNutrition: {
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
  };
  monthlyTrends: {
    weight: Array<{ date: string; value: number }>;
    avgCalories: Array<{ date: string; value: number }>;
  };
  goals: {
    dailyCalories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  streaks: {
    currentStreak: number;
    longestStreak: number;
    totalDays: number;
  };
}

export const analyticsAPI = {
  // Get analytics data for specified date range
  getAnalytics: async (dateRange: 'week' | 'month' | 'year'): Promise<{
    analytics: AnalyticsData;
  }> => {
    const response = await apiClient.get(`/analytics?range=${dateRange}`);
    return response.data;
  },

  // Get detailed nutrition breakdown
  getNutritionBreakdown: async (params: {
    startDate: string;
    endDate: string;
    groupBy?: 'day' | 'week' | 'month';
  }): Promise<{
    breakdown: Array<{
      date: string;
      calories: number;
      protein: number;
      carbs: number;
      fat: number;
      fiber: number;
      sugar: number;
      sodium: number;
    }>;
  }> => {
    const queryParams = new URLSearchParams({
      start_date: params.startDate,
      end_date: params.endDate,
    });
    if (params.groupBy) queryParams.append('group_by', params.groupBy);

    const response = await apiClient.get(`/analytics/nutrition?${queryParams.toString()}`);
    return response.data;
  },

  // Get meal timing patterns
  getMealTimingAnalysis: async (days: number = 30): Promise<{
    patterns: Array<{
      mealType: string;
      avgTime: string;
      consistency: number; // 0-1 score
      recommendations: string[];
    }>;
  }> => {
    const response = await apiClient.get(`/analytics/meal-timing?days=${days}`);
    return response.data;
  },

  // Get calorie trends and predictions
  getCalorieTrends: async (params: {
    days: number;
    includePrediction?: boolean;
  }): Promise<{
    trends: Array<{ date: string; calories: number; predicted?: boolean }>;
    trendDirection: 'increasing' | 'decreasing' | 'stable';
    avgChange: number;
  }> => {
    const queryParams = new URLSearchParams({ days: params.days.toString() });
    if (params.includePrediction) {
      queryParams.append('include_prediction', 'true');
    }

    const response = await apiClient.get(`/analytics/calorie-trends?${queryParams.toString()}`);
    return response.data;
  },

  // Get weight progress (if user tracks weight)
  getWeightProgress: async (days: number = 90): Promise<{
    progress: Array<{ date: string; weight: number }>;
    trend: 'gaining' | 'losing' | 'maintaining';
    avgWeeklyChange: number;
  }> => {
    const response = await apiClient.get(`/analytics/weight-progress?days=${days}`);
    return response.data;
  },

  // Get habit analysis
  getHabits: async (): Promise<{
    habits: Array<{
      name: string;
      frequency: number; // times per week
      strength: number; // 0-1 score
      streak: number;
      lastOccurrence: string;
      suggestions: string[];
    }>;
  }> => {
    const response = await apiClient.get('/analytics/habits');
    return response.data;
  },

  // Get personalized insights
  getInsights: async (): Promise<{
    insights: Array<{
      type: 'success' | 'warning' | 'info' | 'tip';
      title: string;
      description: string;
      actionable: boolean;
      action?: string;
      priority: number; // 1-5
    }>;
  }> => {
    const response = await apiClient.get('/analytics/insights');
    return response.data;
  },

  // Get goal progress
  getGoalProgress: async (): Promise<{
    progress: {
      dailyCalories: { current: number; target: number; percentage: number };
      protein: { current: number; target: number; percentage: number };
      carbs: { current: number; target: number; percentage: number };
      fat: { current: number; target: number; percentage: number };
      water: { current: number; target: number; percentage: number };
    };
    streak: number;
    goalsMetToday: number;
    totalGoals: number;
  }> => {
    const response = await apiClient.get('/analytics/goal-progress');
    return response.data;
  },

  // Get food variety analysis
  getFoodVariety: async (days: number = 30): Promise<{
    variety: {
      uniqueFoods: number;
      avgFoodsPerDay: number;
      categories: Array<{
        name: string;
        percentage: number;
        count: number;
      }>;
    };
    recommendations: string[];
  }> => {
    const response = await apiClient.get(`/analytics/food-variety?days=${days}`);
    return response.data;
  },

  // Get macro distribution over time
  getMacroDistribution: async (params: {
    startDate: string;
    endDate: string;
  }): Promise<{
    distribution: Array<{
      date: string;
      proteinPercentage: number;
      carbsPercentage: number;
      fatPercentage: number;
    }>;
    averages: {
      protein: number;
      carbs: number;
      fat: number;
    };
    recommendations: string[];
  }> => {
    const response = await apiClient.get(
      `/analytics/macro-distribution?start_date=${params.startDate}&end_date=${params.endDate}`
    );
    return response.data;
  },

  // Get eating schedule analysis
  getEatingSchedule: async (days: number = 30): Promise<{
    schedule: Array<{
      hour: number;
      avgCalories: number;
      frequency: number;
      mealTypes: string[];
    }>;
    patterns: {
      firstMealTime: string;
      lastMealTime: string;
      eatingWindow: number; // hours
      mealFrequency: number;
    };
    suggestions: string[];
  }> => {
    const response = await apiClient.get(`/analytics/eating-schedule?days=${days}`);
    return response.data;
  },

  // Export analytics data
  exportData: async (params: {
    format: 'csv' | 'json' | 'pdf';
    startDate: string;
    endDate: string;
    includeGraphs?: boolean;
  }): Promise<{
    downloadUrl: string;
    expiresAt: string;
  }> => {
    const response = await apiClient.post('/analytics/export', params);
    return response.data;
  },

  // Get comparative analytics (vs previous period)
  getComparativeAnalytics: async (params: {
    currentStart: string;
    currentEnd: string;
    compareWith: 'previous_period' | 'same_period_last_year';
  }): Promise<{
    current: AnalyticsData;
    comparison: AnalyticsData;
    changes: {
      calories: { absolute: number; percentage: number };
      protein: { absolute: number; percentage: number };
      carbs: { absolute: number; percentage: number };
      fat: { absolute: number; percentage: number };
      weight: { absolute: number; percentage: number };
    };
  }> => {
    const response = await apiClient.post('/analytics/compare', params);
    return response.data;
  },

  // Get machine learning predictions
  getPredictions: async (type: 'weight' | 'calories' | 'habits'): Promise<{
    predictions: Array<{
      date: string;
      value: number;
      confidence: number;
    }>;
    accuracy: number;
    factors: Array<{
      name: string;
      importance: number;
    }>;
  }> => {
    const response = await apiClient.get(`/analytics/predictions?type=${type}`);
    return response.data;
  },
};

export default analyticsAPI;
