import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { User } from '../../types/auth';

export interface UserState {
  user: User | null;
  profile: {
    height: number;
    weight: number;
    age: number;
    gender: 'male' | 'female' | 'other';
    activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
  } | null;
  goals: {
    dailyCalories: number;
    protein: number;
    carbs: number;
    fat: number;
    water: number;
    targetWeight: number;
  } | null;
  stats: {
    currentStreak: number;
    longestStreak: number;
    totalMeals: number;
    totalDays: number;
    avgCalories: number;
  } | null;
  isLoading: boolean;
  error: string | null;
  lastUpdated: string | null;
}

const initialState: UserState = {
  user: null,
  profile: null,
  goals: null,
  stats: null,
  isLoading: false,
  error: null,
  lastUpdated: null,
};

// Async thunks
export const fetchUserProfile = createAsyncThunk(
  'user/fetchProfile',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/v1/user/profile');
      if (!response.ok) throw new Error('Failed to fetch profile');
      const data = await response.json();
      return data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch profile');
    }
  }
);

export const updateUserProfile = createAsyncThunk(
  'user/updateProfile',
  async (profileData: Partial<UserState['profile']>, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/v1/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileData),
      });
      if (!response.ok) throw new Error('Failed to update profile');
      const data = await response.json();
      return data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to update profile');
    }
  }
);

export const updateUserGoals = createAsyncThunk(
  'user/updateGoals',
  async (goals: Partial<UserState['goals']>, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/v1/user/goals', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(goals),
      });
      if (!response.ok) throw new Error('Failed to update goals');
      const data = await response.json();
      return data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to update goals');
    }
  }
);

export const fetchUserStats = createAsyncThunk(
  'user/fetchStats',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/v1/user/stats');
      if (!response.ok) throw new Error('Failed to fetch stats');
      const data = await response.json();
      return data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch stats');
    }
  }
);

export const deleteUserAccount = createAsyncThunk(
  'user/deleteAccount',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/v1/user/account', {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete account');
      return true;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to delete account');
    }
  }
);

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    updateUserLocal: (state, action: PayloadAction<Partial<User>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    },
    updateProfileLocal: (state, action: PayloadAction<Partial<UserState['profile']>>) => {
      if (state.profile) {
        state.profile = { ...state.profile, ...action.payload };
      }
    },
    updateGoalsLocal: (state, action: PayloadAction<Partial<UserState['goals']>>) => {
      if (state.goals) {
        state.goals = { ...state.goals, ...action.payload };
      }
    },
    clearUserData: (state) => {
      state.user = null;
      state.profile = null;
      state.goals = null;
      state.stats = null;
      state.lastUpdated = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Profile
      .addCase(fetchUserProfile.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchUserProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.profile = action.payload.profile;
        state.goals = action.payload.goals;
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(fetchUserProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Update Profile
      .addCase(updateUserProfile.fulfilled, (state, action) => {
        state.profile = action.payload.profile;
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(updateUserProfile.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      // Update Goals
      .addCase(updateUserGoals.fulfilled, (state, action) => {
        state.goals = action.payload.goals;
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(updateUserGoals.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      // Fetch Stats
      .addCase(fetchUserStats.fulfilled, (state, action) => {
        state.stats = action.payload.stats;
      })
      .addCase(fetchUserStats.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      // Delete Account
      .addCase(deleteUserAccount.fulfilled, (state) => {
        state.user = null;
        state.profile = null;
        state.goals = null;
        state.stats = null;
      })
      .addCase(deleteUserAccount.rejected, (state, action) => {
        state.error = action.payload as string;
      });
  },
});

export const {
  clearError,
  updateUserLocal,
  updateProfileLocal,
  updateGoalsLocal,
  clearUserData,
} = userSlice.actions;

export default userSlice.reducer;
