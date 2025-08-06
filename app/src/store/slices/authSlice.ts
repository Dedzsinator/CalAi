import {createSlice, createAsyncThunk, PayloadAction} from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {authAPI} from '../../services/api/authAPI';
import {User, LoginCredentials, RegisterData} from '../../types/auth';

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  error: string | null;
  isFirstLaunch: boolean;
}

const initialState: AuthState = {
  isAuthenticated: false,
  user: null,
  token: null,
  refreshToken: null,
  isLoading: false,
  error: null,
  isFirstLaunch: true,
};

// Async thunks
export const login = createAsyncThunk(
  'auth/login',
  async (credentials: LoginCredentials, {rejectWithValue}) => {
    try {
      const response = await authAPI.login(credentials);
      await AsyncStorage.setItem('auth_token', response.token);
      if (response.refreshToken) {
        await AsyncStorage.setItem('refresh_token', response.refreshToken);
      }
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Login failed');
    }
  }
);

export const register = createAsyncThunk(
  'auth/register',
  async (userData: RegisterData, {rejectWithValue}) => {
    try {
      const response = await authAPI.register(userData);
      await AsyncStorage.setItem('auth_token', response.token);
      if (response.refreshToken) {
        await AsyncStorage.setItem('refresh_token', response.refreshToken);
      }
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Registration failed');
    }
  }
);

export const logout = createAsyncThunk(
  'auth/logout',
  async (_, {rejectWithValue}) => {
    try {
      await AsyncStorage.multiRemove(['auth_token', 'refresh_token']);
      return null;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Logout failed');
    }
  }
);

export const refreshToken = createAsyncThunk(
  'auth/refreshToken',
  async (_, {getState, rejectWithValue}) => {
    try {
      const state = getState() as {auth: AuthState};
      if (!state.auth.refreshToken) {
        throw new Error('No refresh token available');
      }
      
      const response = await authAPI.refreshToken(state.auth.refreshToken);
      await AsyncStorage.setItem('auth_token', response.token);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Token refresh failed');
    }
  }
);

export const loadStoredAuth = createAsyncThunk(
  'auth/loadStoredAuth',
  async (_, {rejectWithValue}) => {
    try {
      const [token, refreshToken] = await AsyncStorage.multiGet([
        'auth_token',
        'refresh_token',
      ]);
      
      if (token[1]) {
        // Validate token with backend
        const user = await authAPI.validateToken(token[1]);
        return {
          token: token[1],
          refreshToken: refreshToken[1],
          user,
        };
      }
      
      return null;
    } catch (error: any) {
      await AsyncStorage.multiRemove(['auth_token', 'refresh_token']);
      return rejectWithValue(error.message || 'Failed to load stored authentication');
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setFirstLaunch: (state, action: PayloadAction<boolean>) => {
      state.isFirstLaunch = action.payload;
    },
    updateUser: (state, action: PayloadAction<Partial<User>>) => {
      if (state.user) {
        state.user = {...state.user, ...action.payload};
      }
    },
  },
  extraReducers: (builder) => {
    // Login
    builder
      .addCase(login.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.refreshToken = action.payload.refreshToken || null;
        state.error = null;
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Register
    builder
      .addCase(register.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.refreshToken = action.payload.refreshToken || null;
        state.error = null;
      })
      .addCase(register.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Logout
    builder
      .addCase(logout.fulfilled, (state) => {
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
        state.refreshToken = null;
        state.error = null;
      });

    // Refresh Token
    builder
      .addCase(refreshToken.fulfilled, (state, action) => {
        state.token = action.payload.token;
        state.error = null;
      })
      .addCase(refreshToken.rejected, (state) => {
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
        state.refreshToken = null;
      });

    // Load Stored Auth
    builder
      .addCase(loadStoredAuth.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(loadStoredAuth.fulfilled, (state, action) => {
        state.isLoading = false;
        if (action.payload) {
          state.isAuthenticated = true;
          state.user = action.payload.user;
          state.token = action.payload.token;
          state.refreshToken = action.payload.refreshToken;
        }
      })
      .addCase(loadStoredAuth.rejected, (state) => {
        state.isLoading = false;
        state.isAuthenticated = false;
      });
  },
});

export const {clearError, setFirstLaunch, updateUser} = authSlice.actions;
export default authSlice.reducer;
