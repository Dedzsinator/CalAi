import axios, {AxiosInstance, AxiosResponse} from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Config from '../config';
import {
  LoginCredentials,
  RegisterData,
  AuthResponse,
  TokenRefreshResponse,
  User,
} from '../../types/auth';

class AuthAPI {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: Config.API_BASE_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.api.interceptors.request.use(
      async (config) => {
        const token = await AsyncStorage.getItem('auth_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor for token refresh
    this.api.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            const refreshToken = await AsyncStorage.getItem('refresh_token');
            if (refreshToken) {
              const response = await this.refreshToken(refreshToken);
              await AsyncStorage.setItem('auth_token', response.token);
              
              // Retry original request with new token
              originalRequest.headers.Authorization = `Bearer ${response.token}`;
              return this.api(originalRequest);
            }
          } catch (refreshError) {
            // Refresh failed, redirect to login
            await AsyncStorage.multiRemove(['auth_token', 'refresh_token']);
            // Emit event for app to handle logout
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      }
    );
  }

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const response: AxiosResponse<AuthResponse> = await this.api.post('/auth/login', credentials);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Login failed');
    }
  }

  async register(userData: RegisterData): Promise<AuthResponse> {
    try {
      const response: AxiosResponse<AuthResponse> = await this.api.post('/auth/register', {
        user: userData,
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Registration failed');
    }
  }

  async refreshToken(refreshToken: string): Promise<TokenRefreshResponse> {
    try {
      const response: AxiosResponse<TokenRefreshResponse> = await this.api.post('/auth/refresh', {
        token: refreshToken,
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Token refresh failed');
    }
  }

  async validateToken(token: string): Promise<User> {
    try {
      const response: AxiosResponse<{user: User}> = await this.api.get('/profile', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data.user;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Token validation failed');
    }
  }

  async logout(): Promise<void> {
    try {
      await this.api.post('/auth/logout');
    } catch (error) {
      // Ignore logout errors, still clear local storage
      console.warn('Logout request failed:', error);
    }
  }

  async forgotPassword(email: string): Promise<void> {
    try {
      await this.api.post('/auth/forgot-password', {email});
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Password reset request failed');
    }
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    try {
      await this.api.post('/auth/reset-password', {
        token,
        password: newPassword,
      });
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Password reset failed');
    }
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    try {
      await this.api.post('/auth/change-password', {
        currentPassword,
        newPassword,
      });
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Password change failed');
    }
  }

  async verifyEmail(token: string): Promise<void> {
    try {
      await this.api.post('/auth/verify-email', {token});
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Email verification failed');
    }
  }

  async resendVerificationEmail(): Promise<void> {
    try {
      await this.api.post('/auth/resend-verification');
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to resend verification email');
    }
  }
}

export const authAPI = new AuthAPI();
