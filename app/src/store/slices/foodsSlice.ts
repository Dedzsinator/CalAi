import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Food } from '../../types/nutrition';

export interface FoodsState {
  foods: Food[];
  searchResults: Food[];
  favorites: Food[];
  recentlyUsed: Food[];
  isLoading: boolean;
  isSearching: boolean;
  error: string | null;
  searchQuery: string;
}

const initialState: FoodsState = {
  foods: [],
  searchResults: [],
  favorites: [],
  recentlyUsed: [],
  isLoading: false,
  isSearching: false,
  error: null,
  searchQuery: '',
};

// Async thunks
export const searchFoods = createAsyncThunk(
  'foods/search',
  async (query: string, { rejectWithValue }) => {
    try {
      // TODO: Replace with actual API call
      const response = await fetch(`/api/v1/foods/search?q=${encodeURIComponent(query)}`);
      if (!response.ok) throw new Error('Search failed');
      const data = await response.json();
      return data.foods;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Search failed');
    }
  }
);

export const getFoodByBarcode = createAsyncThunk(
  'foods/getByBarcode',
  async (barcode: string, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/v1/foods/barcode/${barcode}`);
      if (!response.ok) throw new Error('Barcode lookup failed');
      const data = await response.json();
      return data.food;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Barcode lookup failed');
    }
  }
);

export const addFoodToFavorites = createAsyncThunk(
  'foods/addToFavorites',
  async (food: Food, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/v1/foods/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ food_id: food.id }),
      });
      if (!response.ok) throw new Error('Failed to add favorite');
      return food;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to add favorite');
    }
  }
);

export const removeFoodFromFavorites = createAsyncThunk(
  'foods/removeFromFavorites',
  async (foodId: string, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/v1/foods/favorites/${foodId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to remove favorite');
      return foodId;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to remove favorite');
    }
  }
);

export const getFavorites = createAsyncThunk(
  'foods/getFavorites',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/v1/foods/favorites');
      if (!response.ok) throw new Error('Failed to get favorites');
      const data = await response.json();
      return data.foods;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to get favorites');
    }
  }
);

export const getRecentlyUsed = createAsyncThunk(
  'foods/getRecentlyUsed',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/v1/foods/recent');
      if (!response.ok) throw new Error('Failed to get recent foods');
      const data = await response.json();
      return data.foods;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to get recent foods');
    }
  }
);

const foodsSlice = createSlice({
  name: 'foods',
  initialState,
  reducers: {
    clearSearchResults: (state) => {
      state.searchResults = [];
      state.searchQuery = '';
    },
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    addToRecentlyUsed: (state, action: PayloadAction<Food>) => {
      const food = action.payload;
      state.recentlyUsed = [
        food,
        ...state.recentlyUsed.filter(f => f.id !== food.id)
      ].slice(0, 20); // Keep last 20 items
    },
  },
  extraReducers: (builder) => {
    builder
      // Search Foods
      .addCase(searchFoods.pending, (state) => {
        state.isSearching = true;
        state.error = null;
      })
      .addCase(searchFoods.fulfilled, (state, action) => {
        state.isSearching = false;
        state.searchResults = action.payload;
      })
      .addCase(searchFoods.rejected, (state, action) => {
        state.isSearching = false;
        state.error = action.payload as string;
      })
      // Get Food by Barcode
      .addCase(getFoodByBarcode.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getFoodByBarcode.fulfilled, (state, action) => {
        state.isLoading = false;
        // Add to search results
        state.searchResults = [action.payload];
      })
      .addCase(getFoodByBarcode.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Add to Favorites
      .addCase(addFoodToFavorites.fulfilled, (state, action) => {
        const food = action.payload;
        if (!state.favorites.find(f => f.id === food.id)) {
          state.favorites.push(food);
        }
      })
      .addCase(addFoodToFavorites.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      // Remove from Favorites
      .addCase(removeFoodFromFavorites.fulfilled, (state, action) => {
        state.favorites = state.favorites.filter(f => f.id !== action.payload);
      })
      .addCase(removeFoodFromFavorites.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      // Get Favorites
      .addCase(getFavorites.fulfilled, (state, action) => {
        state.favorites = action.payload;
      })
      .addCase(getFavorites.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      // Get Recently Used
      .addCase(getRecentlyUsed.fulfilled, (state, action) => {
        state.recentlyUsed = action.payload;
      })
      .addCase(getRecentlyUsed.rejected, (state, action) => {
        state.error = action.payload as string;
      });
  },
});

export const { 
  clearSearchResults, 
  setSearchQuery, 
  clearError, 
  addToRecentlyUsed 
} = foodsSlice.actions;

export default foodsSlice.reducer;
