import AsyncStorage from '@react-native-async-storage/async-storage';

interface MealLog {
  id: string;
  foods: Array<{
    name: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    confidence: number;
    portion_size?: string;
  }>;
  image_uri?: string;
  notes?: string;
  eaten_at: string;
  synced: boolean;
  created_at: string;
}

interface UserProfile {
  name: string;
  email: string;
  goals: {
    daily_calories: number;
    protein_percent: number;
    carbs_percent: number;
    fat_percent: number;
  };
  preferences: {
    diet_type?: string;
    allergies: string[];
    notifications_enabled: boolean;
  };
}

interface CachedData {
  key: string;
  data: any;
  expires_at: number;
}

class StorageService {
  private readonly KEYS = {
    MEALS: 'calai_meals',
    PROFILE: 'calai_profile',
    CACHE: 'calai_cache',
    SYNC_QUEUE: 'calai_sync_queue',
    SETTINGS: 'calai_settings',
    NUTRITION_GOALS: 'calai_nutrition_goals',
  };

  // Meal Management
  async saveMeal(meal: Omit<MealLog, 'id' | 'created_at'>): Promise<string> {
    const id = this.generateId();
    const newMeal: MealLog = {
      ...meal,
      id,
      created_at: new Date().toISOString(),
    };

    const meals = await this.getMeals();
    meals.unshift(newMeal);

    await AsyncStorage.setItem(this.KEYS.MEALS, JSON.stringify(meals));

    // Add to sync queue if not already synced
    if (!meal.synced) {
      await this.addToSyncQueue('meal', newMeal);
    }

    return id;
  }

  async getMeals(limit?: number): Promise<MealLog[]> {
    try {
      const mealsJson = await AsyncStorage.getItem(this.KEYS.MEALS);
      const meals: MealLog[] = mealsJson ? JSON.parse(mealsJson) : [];
      
      return limit ? meals.slice(0, limit) : meals;
    } catch (error) {
      console.error('Failed to get meals:', error);
      return [];
    }
  }

  async getMeal(id: string): Promise<MealLog | null> {
    const meals = await this.getMeals();
    return meals.find(meal => meal.id === id) || null;
  }

  async updateMeal(id: string, updates: Partial<MealLog>): Promise<void> {
    const meals = await this.getMeals();
    const index = meals.findIndex(meal => meal.id === id);
    
    if (index !== -1) {
      meals[index] = { ...meals[index], ...updates };
      await AsyncStorage.setItem(this.KEYS.MEALS, JSON.stringify(meals));
      
      // Add to sync queue
      await this.addToSyncQueue('meal_update', { id, updates });
    }
  }

  async deleteMeal(id: string): Promise<void> {
    const meals = await this.getMeals();
    const filteredMeals = meals.filter(meal => meal.id !== id);
    
    await AsyncStorage.setItem(this.KEYS.MEALS, JSON.stringify(filteredMeals));
    
    // Add to sync queue
    await this.addToSyncQueue('meal_delete', { id });
  }

  // Get meals for specific date range
  async getMealsByDateRange(startDate: Date, endDate: Date): Promise<MealLog[]> {
    const meals = await this.getMeals();
    
    return meals.filter(meal => {
      const mealDate = new Date(meal.eaten_at);
      return mealDate >= startDate && mealDate <= endDate;
    });
  }

  // Analytics helpers
  async getTodaysMeals(): Promise<MealLog[]> {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(endOfDay.getDate() + 1);

    return this.getMealsByDateRange(startOfDay, endOfDay);
  }

  async getWeeklyMeals(): Promise<MealLog[]> {
    const today = new Date();
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    return this.getMealsByDateRange(weekAgo, today);
  }

  // Profile Management
  async saveProfile(profile: UserProfile): Promise<void> {
    await AsyncStorage.setItem(this.KEYS.PROFILE, JSON.stringify(profile));
    await this.addToSyncQueue('profile', profile);
  }

  async getProfile(): Promise<UserProfile | null> {
    try {
      const profileJson = await AsyncStorage.getItem(this.KEYS.PROFILE);
      return profileJson ? JSON.parse(profileJson) : null;
    } catch (error) {
      console.error('Failed to get profile:', error);
      return null;
    }
  }

  // Cache Management
  async cacheData(key: string, data: any, ttlMinutes: number = 30): Promise<void> {
    const cacheItem: CachedData = {
      key,
      data,
      expires_at: Date.now() + (ttlMinutes * 60 * 1000),
    };

    const cacheKey = `${this.KEYS.CACHE}_${key}`;
    await AsyncStorage.setItem(cacheKey, JSON.stringify(cacheItem));
  }

  async getCachedData(key: string): Promise<any | null> {
    try {
      const cacheKey = `${this.KEYS.CACHE}_${key}`;
      const cacheJson = await AsyncStorage.getItem(cacheKey);
      
      if (!cacheJson) return null;
      
      const cacheItem: CachedData = JSON.parse(cacheJson);
      
      // Check if expired
      if (Date.now() > cacheItem.expires_at) {
        await AsyncStorage.removeItem(cacheKey);
        return null;
      }
      
      return cacheItem.data;
    } catch (error) {
      console.error('Failed to get cached data:', error);
      return null;
    }
  }

  async clearExpiredCache(): Promise<void> {
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      const cacheKeys = allKeys.filter((key: string) => key.startsWith(this.KEYS.CACHE));
      
      for (const key of cacheKeys) {
        const cacheJson = await AsyncStorage.getItem(key);
        if (cacheJson) {
          const cacheItem: CachedData = JSON.parse(cacheJson);
          if (Date.now() > cacheItem.expires_at) {
            await AsyncStorage.removeItem(key);
          }
        }
      }
    } catch (error) {
      console.error('Failed to clear expired cache:', error);
    }
  }

  // Sync Queue Management
  private async addToSyncQueue(type: string, data: any): Promise<void> {
    try {
      const queueJson = await AsyncStorage.getItem(this.KEYS.SYNC_QUEUE);
      const queue = queueJson ? JSON.parse(queueJson) : [];
      
      queue.push({
        id: this.generateId(),
        type,
        data,
        created_at: new Date().toISOString(),
        retries: 0,
      });
      
      await AsyncStorage.setItem(this.KEYS.SYNC_QUEUE, JSON.stringify(queue));
    } catch (error) {
      console.error('Failed to add to sync queue:', error);
    }
  }

  async getSyncQueue(): Promise<any[]> {
    try {
      const queueJson = await AsyncStorage.getItem(this.KEYS.SYNC_QUEUE);
      return queueJson ? JSON.parse(queueJson) : [];
    } catch (error) {
      console.error('Failed to get sync queue:', error);
      return [];
    }
  }

  async removeSyncItem(itemId: string): Promise<void> {
    try {
      const queue = await this.getSyncQueue();
      const filteredQueue = queue.filter(item => item.id !== itemId);
      await AsyncStorage.setItem(this.KEYS.SYNC_QUEUE, JSON.stringify(filteredQueue));
    } catch (error) {
      console.error('Failed to remove sync item:', error);
    }
  }

  async clearSyncQueue(): Promise<void> {
    await AsyncStorage.removeItem(this.KEYS.SYNC_QUEUE);
  }

  // Settings Management
  async saveSetting(key: string, value: any): Promise<void> {
    try {
      const settingsJson = await AsyncStorage.getItem(this.KEYS.SETTINGS);
      const settings = settingsJson ? JSON.parse(settingsJson) : {};
      
      settings[key] = value;
      
      await AsyncStorage.setItem(this.KEYS.SETTINGS, JSON.stringify(settings));
    } catch (error) {
      console.error('Failed to save setting:', error);
    }
  }

  async getSetting(key: string, defaultValue: any = null): Promise<any> {
    try {
      const settingsJson = await AsyncStorage.getItem(this.KEYS.SETTINGS);
      const settings = settingsJson ? JSON.parse(settingsJson) : {};
      
      return settings[key] !== undefined ? settings[key] : defaultValue;
    } catch (error) {
      console.error('Failed to get setting:', error);
      return defaultValue;
    }
  }

  // Nutrition Goals
  async saveNutritionGoals(goals: {
    daily_calories: number;
    protein_percent: number;
    carbs_percent: number;
    fat_percent: number;
  }): Promise<void> {
    await AsyncStorage.setItem(this.KEYS.NUTRITION_GOALS, JSON.stringify(goals));
    await this.addToSyncQueue('nutrition_goals', goals);
  }

  async getNutritionGoals(): Promise<{
    daily_calories: number;
    protein_percent: number;
    carbs_percent: number;
    fat_percent: number;
  } | null> {
    try {
      const goalsJson = await AsyncStorage.getItem(this.KEYS.NUTRITION_GOALS);
      return goalsJson ? JSON.parse(goalsJson) : null;
    } catch (error) {
      console.error('Failed to get nutrition goals:', error);
      return null;
    }
  }

  // Analytics calculations
  async calculateDailyNutrition(date?: Date): Promise<{
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    meal_count: number;
  }> {
    const targetDate = date || new Date();
    const startOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(endOfDay.getDate() + 1);

    const meals = await this.getMealsByDateRange(startOfDay, endOfDay);

    const totals = meals.reduce((acc, meal) => {
      meal.foods.forEach(food => {
        acc.calories += food.calories;
        acc.protein += food.protein;
        acc.carbs += food.carbs;
        acc.fat += food.fat;
      });
      return acc;
    }, { calories: 0, protein: 0, carbs: 0, fat: 0 });

    return {
      ...totals,
      meal_count: meals.length,
    };
  }

  // Utility methods
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // Clear all data
  async clearAllData(): Promise<void> {
    const keys = Object.values(this.KEYS);
    await AsyncStorage.multiRemove(keys);
  }

  // Export data for backup
  async exportData(): Promise<{
    meals: MealLog[];
    profile: UserProfile | null;
    goals: any;
    settings: any;
  }> {
    const [meals, profile, goals, settingsJson] = await Promise.all([
      this.getMeals(),
      this.getProfile(),
      this.getNutritionGoals(),
      AsyncStorage.getItem(this.KEYS.SETTINGS),
    ]);

    const settings = settingsJson ? JSON.parse(settingsJson) : {};

    return { meals, profile, goals, settings };
  }
}

export default new StorageService();
export type { MealLog, UserProfile };
