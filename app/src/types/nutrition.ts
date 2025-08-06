// Food and nutrition types
export interface Food {
  id: string;
  name: string;
  brand?: string;
  barcode?: string;
  category: string;
  subcategory?: string;
  description?: string;
  
  // Nutritional information per 100g
  caloriesPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
  fiberPer100g?: number;
  sugarPer100g?: number;
  sodiumPer100g?: number;
  
  // Additional nutrients
  vitamins?: Record<string, number>;
  minerals?: Record<string, number>;
  allergens?: string[];
  
  // Metadata
  servingSizeG?: number;
  servingDescription?: string;
  confidenceScore?: number;
  source: string;
  dataQuality: 'high' | 'medium' | 'low';
  imageUrl?: string;
  verified: boolean;
  
  createdAt: Date;
  updatedAt: Date;
}

export interface Meal {
  id: string;
  name?: string;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'other';
  eatenAt: Date;
  timezone?: string;
  location?: string;
  notes?: string;
  imageUrl?: string;
  confidenceScore?: number;
  
  // Calculated totals
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  totalFiber?: number;
  totalSugar?: number;
  totalSodium?: number;
  
  // Status
  isVerified: boolean;
  aiGenerated: boolean;
  processingStatus: 'pending' | 'processing' | 'completed' | 'failed';
  
  // Relations
  userId: string;
  mealFoods: MealFood[];
  
  createdAt: Date;
  updatedAt: Date;
}

export interface MealFood {
  id: string;
  quantityGrams: number;
  quantityDescription?: string;
  confidenceScore?: number;
  estimatedPortion: boolean;
  userVerified: boolean;
  aiDetected: boolean;
  boundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  
  // Relations
  mealId: string;
  food: Food;
  
  createdAt: Date;
  updatedAt: Date;
}

export interface NutritionSummary {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar: number;
  sodium: number;
  
  // Percentages of daily goals
  caloriesPercent: number;
  proteinPercent: number;
  carbsPercent: number;
  fatPercent: number;
}

export interface DailyNutrition {
  date: string;
  meals: Meal[];
  summary: NutritionSummary;
  goalsMet: {
    calories: boolean;
    protein: boolean;
    hydration?: boolean;
  };
  streakDays: number;
}

// Search and filtering
export interface FoodSearchFilter {
  query?: string;
  category?: string;
  brand?: string;
  barcode?: string;
  verified?: boolean;
  hasImage?: boolean;
  limit?: number;
  offset?: number;
}

export interface MealSearchFilter {
  dateFrom?: Date;
  dateTo?: Date;
  mealType?: string;
  userId: string;
  limit?: number;
  offset?: number;
}
