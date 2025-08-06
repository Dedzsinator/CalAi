// User types
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  dateOfBirth?: Date;
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  heightCm?: number;
  weightKg?: number;
  activityLevel?: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
  goalType?: 'lose_weight' | 'maintain_weight' | 'gain_weight' | 'build_muscle';
  dailyCalorieGoal?: number;
  timezone?: string;
  preferences?: UserPreferences;
  isVerified: boolean;
  isActive: boolean;
  lastLoginAt?: Date;
  streakDays: number;
  totalMealsLogged: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserPreferences {
  units: 'metric' | 'imperial';
  theme: 'light' | 'dark' | 'auto';
  notifications: {
    mealReminders: boolean;
    habitInsights: boolean;
    weeklyReports: boolean;
    pushNotifications: boolean;
  };
  privacy: {
    shareData: boolean;
    analyticsOptOut: boolean;
  };
  diet: {
    restrictions: string[];
    allergies: string[];
    cuisinePreferences: string[];
  };
}

// Auth types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  acceptTerms: boolean;
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken?: string;
  expiresIn: number;
}

export interface TokenRefreshResponse {
  token: string;
  expiresIn: number;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: string[];
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
