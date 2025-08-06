import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

export interface AnalyticsData {
  dailyCalories: { date: string; calories: number }[];
  weeklyNutrition: {
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
  };
  monthlyTrends: {
    weight: { date: string; value: number }[];
    avgCalories: { date: string; value: number }[];
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

export interface AnalyticsState {
  data: AnalyticsData | null;
  isLoading: boolean;
  error: string | null;
  dateRange: 'week' | 'month' | 'year';
  lastUpdated: string | null;
}

const initialState: AnalyticsState = {
  data: null,
  isLoading: false,
  error: null,
  dateRange: 'week',
  lastUpdated: null,
};

// Async thunks
export const fetchAnalytics = createAsyncThunk(
  'analytics/fetch',
  async (dateRange: 'week' | 'month' | 'year', { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/v1/analytics?range=${dateRange}`);
      if (!response.ok) throw new Error('Failed to fetch analytics');
      const data = await response.json();
      return data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch analytics');
    }
  }
);

export const updateGoals = createAsyncThunk(
  'analytics/updateGoals',
  async (goals: Partial<AnalyticsData['goals']>, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/v1/user/goals', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(goals),
      });
      if (!response.ok) throw new Error('Failed to update goals');
      const data = await response.json();
      return data.goals;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to update goals');
    }
  }
);

export const getInsights = createAsyncThunk(
  'analytics/getInsights',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/v1/analytics/insights');
      if (!response.ok) throw new Error('Failed to get insights');
      const data = await response.json();
      return data.insights;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to get insights');
    }
  }
);

const analyticsSlice = createSlice({
  name: 'analytics',
  initialState,
  reducers: {
    setDateRange: (state, action: PayloadAction<'week' | 'month' | 'year'>) => {
      state.dateRange = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    clearData: (state) => {
      state.data = null;
      state.lastUpdated = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Analytics
      .addCase(fetchAnalytics.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchAnalytics.fulfilled, (state, action) => {
        state.isLoading = false;
        state.data = action.payload;
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(fetchAnalytics.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Update Goals
      .addCase(updateGoals.fulfilled, (state, action) => {
        if (state.data) {
          state.data.goals = { ...state.data.goals, ...action.payload };
        }
      })
      .addCase(updateGoals.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      // Get Insights
      .addCase(getInsights.rejected, (state, action) => {
        state.error = action.payload as string;
      });
  },
});

export const { setDateRange, clearError, clearData } = analyticsSlice.actions;
export default analyticsSlice.reducer;
