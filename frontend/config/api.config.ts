/**
 * API Configuration for CalAi Frontend
 * Handles different network configurations for development and production
 */

import { Platform } from 'react-native';

interface ApiConfig {
  baseUrl: string;
  timeout: number;
  retries: number;
}

/**
 * Get the appropriate API base URL based on the current environment and platform
 */
const getApiBaseUrl = (): string => {
  if (__DEV__) {
    // Development environment
    if (Platform.OS === 'web') {
      // Web development (Expo web)
      return 'http://localhost:4000';
    }
    
    // Mobile development (physical device or emulator)
    // IMPORTANT: Change this IP to your development machine's local IP
    // To find your IP: run `ip route get 1 | awk '{print $7}'` in terminal
    const DEV_MACHINE_IP = '192.168.1.9';
    return `http://${DEV_MACHINE_IP}:4000`;
  }
  
  // Production environment
  return 'https://api.calai.app';
};

/**
 * API Configuration object
 */
export const API_CONFIG: ApiConfig = {
  baseUrl: getApiBaseUrl(),
  timeout: 10000, // 10 seconds
  retries: 3
};

/**
 * Helper function to build full API URLs
 */
export const buildApiUrl = (endpoint: string): string => {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  return `${API_CONFIG.baseUrl}/api/v1/${cleanEndpoint}`;
};

/**
 * Development helper to test connectivity
 */
export const testApiConnectivity = async (): Promise<boolean> => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch(`${API_CONFIG.baseUrl}/health`, {
      method: 'GET',
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    return response.ok;
  } catch (error) {
    console.error('API connectivity test failed:', error);
    return false;
  }
};

// Log current configuration in development
if (__DEV__) {
  console.log('🔧 API Configuration:', {
    platform: Platform.OS,
    baseUrl: API_CONFIG.baseUrl,
    environment: __DEV__ ? 'development' : 'production'
  });
}
