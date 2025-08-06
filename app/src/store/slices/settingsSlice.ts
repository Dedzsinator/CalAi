import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

export interface UserSettings {
  notifications: {
    mealReminders: boolean;
    waterReminders: boolean;
    weeklyReports: boolean;
    achievementAlerts: boolean;
  };
  privacy: {
    dataSharing: boolean;
    analytics: boolean;
    crashReporting: boolean;
  };
  preferences: {
    units: 'metric' | 'imperial';
    theme: 'light' | 'dark' | 'auto';
    language: string;
    defaultServingSize: number;
  };
  goals: {
    dailyCalories: number;
    protein: number;
    carbs: number;
    fat: number;
    water: number;
    weight: number;
    targetWeight: number;
  };
  profile: {
    height: number;
    weight: number;
    age: number;
    gender: 'male' | 'female' | 'other';
    activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
  };
}

export interface SettingsState {
  settings: UserSettings | null;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  lastUpdated: string | null;
}

const defaultSettings: UserSettings = {
  notifications: {
    mealReminders: true,
    waterReminders: true,
    weeklyReports: false,
    achievementAlerts: true,
  },
  privacy: {
    dataSharing: false,
    analytics: true,
    crashReporting: true,
  },
  preferences: {
    units: 'metric',
    theme: 'auto',
    language: 'en',
    defaultServingSize: 100,
  },
  goals: {
    dailyCalories: 2000,
    protein: 150,
    carbs: 250,
    fat: 65,
    water: 8,
    weight: 70,
    targetWeight: 70,
  },
  profile: {
    height: 170,
    weight: 70,
    age: 30,
    gender: 'other',
    activityLevel: 'moderate',
  },
};

const initialState: SettingsState = {
  settings: null,
  isLoading: false,
  isSaving: false,
  error: null,
  lastUpdated: null,
};

// Async thunks
export const loadSettings = createAsyncThunk(
  'settings/load',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/v1/user/settings');
      if (!response.ok) throw new Error('Failed to load settings');
      const data = await response.json();
      return data.settings || defaultSettings;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to load settings');
    }
  }
);

export const saveSettings = createAsyncThunk(
  'settings/save',
  async (settings: Partial<UserSettings>, { rejectWithValue, getState }) => {
    try {
      const response = await fetch('/api/v1/user/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      if (!response.ok) throw new Error('Failed to save settings');
      const data = await response.json();
      return data.settings;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to save settings');
    }
  }
);

export const resetSettings = createAsyncThunk(
  'settings/reset',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/v1/user/settings', {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to reset settings');
      return defaultSettings;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to reset settings');
    }
  }
);

export const exportData = createAsyncThunk(
  'settings/exportData',
  async (format: 'json' | 'csv', { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/v1/user/export?format=${format}`);
      if (!response.ok) throw new Error('Failed to export data');
      const blob = await response.blob();
      return URL.createObjectURL(blob);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to export data');
    }
  }
);

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    updateSettingsLocally: (state, action: PayloadAction<Partial<UserSettings>>) => {
      if (state.settings) {
        state.settings = { ...state.settings, ...action.payload };
      }
    },
    clearError: (state) => {
      state.error = null;
    },
    setTheme: (state, action: PayloadAction<'light' | 'dark' | 'auto'>) => {
      if (state.settings) {
        state.settings.preferences.theme = action.payload;
      }
    },
    setUnits: (state, action: PayloadAction<'metric' | 'imperial'>) => {
      if (state.settings) {
        state.settings.preferences.units = action.payload;
      }
    },
    toggleNotification: (state, action: PayloadAction<keyof UserSettings['notifications']>) => {
      if (state.settings) {
        const key = action.payload;
        state.settings.notifications[key] = !state.settings.notifications[key];
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Load Settings
      .addCase(loadSettings.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loadSettings.fulfilled, (state, action) => {
        state.isLoading = false;
        state.settings = action.payload;
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(loadSettings.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        // Load default settings on error
        state.settings = defaultSettings;
      })
      // Save Settings
      .addCase(saveSettings.pending, (state) => {
        state.isSaving = true;
        state.error = null;
      })
      .addCase(saveSettings.fulfilled, (state, action) => {
        state.isSaving = false;
        state.settings = action.payload;
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(saveSettings.rejected, (state, action) => {
        state.isSaving = false;
        state.error = action.payload as string;
      })
      // Reset Settings
      .addCase(resetSettings.fulfilled, (state, action) => {
        state.settings = action.payload;
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(resetSettings.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      // Export Data
      .addCase(exportData.rejected, (state, action) => {
        state.error = action.payload as string;
      });
  },
});

export const { 
  updateSettingsLocally, 
  clearError, 
  setTheme, 
  setUnits, 
  toggleNotification 
} = settingsSlice.actions;

export default settingsSlice.reducer;
