import {Platform} from 'react-native';

// Environment configuration
const ENV = __DEV__ ? 'development' : 'production';

const Config = {
  // API Configuration
  API_BASE_URL: __DEV__ 
    ? (Platform.OS === 'ios' ? 'http://localhost:4000/api/v1' : 'http://10.0.2.2:4000/api/v1')
    : 'https://api.calai.app/api/v1',
  
  // AI Model Configuration
  MODEL_CDN_URL: __DEV__
    ? 'http://localhost:8080/models'
    : 'https://cdn.calai.app/models',
  
  // App Configuration
  APP_NAME: 'CalAi',
  APP_VERSION: '1.0.0',
  ENVIRONMENT: ENV,
  
  // Feature Flags
  FEATURES: {
    ENABLE_AI_INFERENCE: true,
    ENABLE_BARCODE_SCANNING: true,
    ENABLE_CAMERA_RECOGNITION: true,
    ENABLE_OFFLINE_MODE: true,
    ENABLE_ANALYTICS: true,
    ENABLE_NOTIFICATIONS: true,
    ENABLE_BIOMETRIC_AUTH: Platform.OS === 'ios' || Platform.OS === 'android',
  },
  
  // AI Configuration
  AI: {
    INFERENCE_TIMEOUT: 30000,
    CONFIDENCE_THRESHOLD: 0.7,
    MAX_IMAGE_SIZE: 1024 * 1024, // 1MB
    SUPPORTED_FORMATS: ['jpg', 'jpeg', 'png', 'webp'],
    MODEL_CACHE_SIZE: 100 * 1024 * 1024, // 100MB
  },
  
  // Camera Configuration
  CAMERA: {
    QUALITY: 0.8,
    MAX_WIDTH: 1024,
    MAX_HEIGHT: 1024,
    INCLUDE_BASE64: false,
    MEDIA_TYPE: 'photo' as const,
    CROP_ASPECT_RATIO: [4, 3] as [number, number],
  },
  
  // Storage Configuration
  STORAGE_KEYS: {
    AUTH_TOKEN: 'auth_token',
    REFRESH_TOKEN: 'refresh_token',
    USER_PREFERENCES: 'user_preferences',
    OFFLINE_QUEUE: 'offline_queue',
    MODEL_CACHE: 'model_cache',
    ONBOARDING_COMPLETED: 'onboarding_completed',
  },
  
  // Notification Configuration
  NOTIFICATIONS: {
    CHANNELS: {
      MEAL_REMINDERS: 'meal_reminders',
      HABIT_INSIGHTS: 'habit_insights',
      WEEKLY_REPORTS: 'weekly_reports',
    },
    DEFAULT_TIMES: {
      BREAKFAST: '08:00',
      LUNCH: '12:30',
      DINNER: '19:00',
    },
  },
  
  // Analytics Configuration
  ANALYTICS: {
    TRACK_CRASHES: !__DEV__,
    TRACK_PERFORMANCE: !__DEV__,
    TRACK_USER_BEHAVIOR: true,
  },
  
  // External APIs
  EXTERNAL_APIS: {
    OPENFOODFACTS_URL: 'https://world.openfoodfacts.org/api/v0',
    USDA_API_URL: 'https://api.nal.usda.gov/fdc/v1',
    BARCODE_LOOKUP_URL: 'https://api.barcodelookup.com/v3',
  },
  
  // Limits and Constraints
  LIMITS: {
    MAX_DAILY_MEALS: 20,
    MAX_FOODS_PER_MEAL: 50,
    MAX_IMAGE_UPLOADS_PER_DAY: 100,
    MAX_OFFLINE_QUEUE_SIZE: 1000,
    SEARCH_RESULTS_LIMIT: 50,
  },
  
  // Theme Configuration
  THEME: {
    ANIMATION_DURATION: 250,
    BORDER_RADIUS: 12,
    SHADOW_OPACITY: 0.1,
    HAPTIC_FEEDBACK: true,
  },
  
  // Development Configuration
  DEV: {
    ENABLE_FLIPPER: __DEV__,
    SHOW_DEV_MENU: __DEV__,
    LOG_LEVEL: __DEV__ ? 'debug' : 'error',
    MOCK_AI_RESPONSES: false,
    MOCK_API_RESPONSES: false,
  },
};

export default Config;
