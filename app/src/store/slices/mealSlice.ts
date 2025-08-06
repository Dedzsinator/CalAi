import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Meal, MealFood, CreateMealRequest, UpdateMealRequest } from '../../types/nutrition';
import { mealAPI } from '../../services/api/mealAPI';

interface MealState {
  meals: Meal[];
  currentMeal: Meal | null;
  todaysMeals: Meal[];
  loading: boolean;
  error: string | null;
  syncing: boolean;
  offlineQueue: CreateMealRequest[];
}

const initialState: MealState = {
  meals: [],
  currentMeal: null,
  todaysMeals: [],
  loading: false,
  error: null,
  syncing: false,
  offlineQueue: [],
};

// Async thunks
export const fetchTodaysMeals = createAsyncThunk(
  'meals/fetchTodays',
  async (_, { rejectWithValue }) => {
    try {
      const response = await mealAPI.getTodaysMeals();
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch meals');
    }
  }
);

export const fetchMealHistory = createAsyncThunk(
  'meals/fetchHistory',
  async (params: { page: number; limit: number }, { rejectWithValue }) => {
    try {
      const response = await mealAPI.getMealHistory(params.page, params.limit);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch meal history');
    }
  }
);

export const createMeal = createAsyncThunk(
  'meals/create',
  async (mealData: CreateMealRequest, { rejectWithValue }) => {
    try {
      const response = await mealAPI.createMeal(mealData);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create meal');
    }
  }
);

export const updateMeal = createAsyncThunk(
  'meals/update',
  async ({ id, ...updateData }: UpdateMealRequest & { id: string }, { rejectWithValue }) => {
    try {
      const response = await mealAPI.updateMeal(id, updateData);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update meal');
    }
  }
);

export const deleteMeal = createAsyncThunk(
  'meals/delete',
  async (mealId: string, { rejectWithValue }) => {
    try {
      await mealAPI.deleteMeal(mealId);
      return mealId;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete meal');
    }
  }
);

export const syncOfflineMeals = createAsyncThunk(
  'meals/syncOffline',
  async (_, { getState, dispatch }) => {
    const state = getState() as { meals: MealState };
    const offlineQueue = state.meals.offlineQueue;
    
    const syncPromises = offlineQueue.map(mealData => 
      dispatch(createMeal(mealData))
    );
    
    await Promise.all(syncPromises);
    return offlineQueue.length;
  }
);

export const fetchMealById = createAsyncThunk(
  'meals/fetchById',
  async (mealId: string, { rejectWithValue }) => {
    try {
      const response = await mealAPI.getMealById(mealId);
      return response.meal;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch meal');
    }
  }
);

const mealSlice = createSlice({
  name: 'meals',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setCurrentMeal: (state, action: PayloadAction<Meal | null>) => {
      state.currentMeal = action.payload;
    },
    addToOfflineQueue: (state, action: PayloadAction<CreateMealRequest>) => {
      state.offlineQueue.push(action.payload);
    },
    clearOfflineQueue: (state) => {
      state.offlineQueue = [];
    },
    updateMealLocal: (state, action: PayloadAction<{ id: string; updates: Partial<Meal> }>) => {
      const { id, updates } = action.payload;
      const mealIndex = state.meals.findIndex(meal => meal.id === id);
      if (mealIndex !== -1) {
        state.meals[mealIndex] = { ...state.meals[mealIndex], ...updates };
      }
      
      const todayIndex = state.todaysMeals.findIndex(meal => meal.id === id);
      if (todayIndex !== -1) {
        state.todaysMeals[todayIndex] = { ...state.todaysMeals[todayIndex], ...updates };
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch today's meals
      .addCase(fetchTodaysMeals.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTodaysMeals.fulfilled, (state, action) => {
        state.loading = false;
        state.todaysMeals = action.payload;
      })
      .addCase(fetchTodaysMeals.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Fetch meal history
      .addCase(fetchMealHistory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMealHistory.fulfilled, (state, action) => {
        state.loading = false;
        state.meals = action.payload;
      })
      .addCase(fetchMealHistory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Create meal
      .addCase(createMeal.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createMeal.fulfilled, (state, action) => {
        state.loading = false;
        state.meals.unshift(action.payload);
        state.todaysMeals.unshift(action.payload);
      })
      .addCase(createMeal.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Update meal
      .addCase(updateMeal.fulfilled, (state, action) => {
        const updatedMeal = action.payload;
        const mealIndex = state.meals.findIndex(meal => meal.id === updatedMeal.id);
        if (mealIndex !== -1) {
          state.meals[mealIndex] = updatedMeal;
        }
        
        const todayIndex = state.todaysMeals.findIndex(meal => meal.id === updatedMeal.id);
        if (todayIndex !== -1) {
          state.todaysMeals[todayIndex] = updatedMeal;
        }
      })
      
      // Delete meal
      .addCase(deleteMeal.fulfilled, (state, action) => {
        const mealId = action.payload;
        state.meals = state.meals.filter(meal => meal.id !== mealId);
        state.todaysMeals = state.todaysMeals.filter(meal => meal.id !== mealId);
      })
      
      // Sync offline meals
      .addCase(syncOfflineMeals.pending, (state) => {
        state.syncing = true;
      })
      .addCase(syncOfflineMeals.fulfilled, (state) => {
        state.syncing = false;
        state.offlineQueue = [];
      })
      .addCase(syncOfflineMeals.rejected, (state) => {
        state.syncing = false;
      })
      
      // Fetch meal by ID
      .addCase(fetchMealById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMealById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentMeal = action.payload;
      })
      .addCase(fetchMealById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  clearError,
  setCurrentMeal,
  addToOfflineQueue,
  clearOfflineQueue,
  updateMealLocal,
} = mealSlice.actions;

export default mealSlice.reducer;
