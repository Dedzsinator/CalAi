import AsyncStorage from '@react-native-async-storage/async-storage';

interface ApiResponse<T = any> {
  data: T;
  status: number;
  statusText: string;
  headers: any;
}

interface ApiError {
  message: string;
  status?: number;
  data?: any;
}

class ApiClient {
  private baseURL: string;
  private defaultHeaders: Record<string, string>;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
    };
  }

  private async getAuthToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem('auth_token');
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  }

  private async request<T = any>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    const token = await this.getAuthToken();

    const headers = {
      ...this.defaultHeaders,
      ...options.headers,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      let data;
      const contentType = response.headers.get('content-type');
      
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else if (options.headers && (options.headers as any)['responseType'] === 'blob') {
        data = await response.blob();
      } else {
        data = await response.text();
      }

      if (!response.ok) {
        const error: ApiError = {
          message: data.message || `HTTP error! status: ${response.status}`,
          status: response.status,
          data,
        };
        throw error;
      }

      return {
        data,
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
      };
    } catch (error) {
      if (error instanceof TypeError) {
        throw {
          message: 'Network error - please check your connection',
          status: 0,
        } as ApiError;
      }
      throw error;
    }
  }

  async get<T = any>(endpoint: string, config?: RequestInit): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'GET',
      ...config,
    });
  }

  async post<T = any>(endpoint: string, data?: any, config?: RequestInit): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
      ...config,
    });
  }

  async put<T = any>(endpoint: string, data?: any, config?: RequestInit): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
      ...config,
    });
  }

  async patch<T = any>(endpoint: string, data?: any, config?: RequestInit): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
      ...config,
    });
  }

  async delete<T = any>(endpoint: string, config?: RequestInit): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'DELETE',
      ...config,
    });
  }
}

// Configuration
const API_BASE_URL = __DEV__ 
  ? 'http://localhost:4000/api/v1'  // Development
  : 'https://api.calai.app/api/v1'; // Production

// Create API client instance
export const apiClient = new ApiClient(API_BASE_URL);

// Export types for use in other files
export type { ApiResponse, ApiError };
