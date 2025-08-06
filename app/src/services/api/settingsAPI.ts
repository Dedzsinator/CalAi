import { apiClient, ApiResponse } from './config';

export interface UserSettings {
  id: string;
  userId: string;
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
  createdAt: Date;
  updatedAt: Date;
}

export interface UpdateSettingsRequest {
  units?: 'metric' | 'imperial';
  theme?: 'light' | 'dark' | 'auto';
  notifications?: Partial<UserSettings['notifications']>;
  privacy?: Partial<UserSettings['privacy']>;
  diet?: Partial<UserSettings['diet']>;
}

export interface NotificationSettings {
  mealReminders: boolean;
  habitInsights: boolean;
  weeklyReports: boolean;
  pushNotifications: boolean;
}

export interface PrivacySettings {
  shareData: boolean;
  analyticsOptOut: boolean;
}

export interface DietSettings {
  restrictions: string[];
  allergies: string[];
  cuisinePreferences: string[];
}

class SettingsAPI {
  private baseUrl = '/settings';

  async getSettings(): Promise<ApiResponse<UserSettings>> {
    const response = await apiClient.get<ApiResponse<UserSettings>>(
      this.baseUrl
    );
    
    return response.data;
  }

  async updateSettings(settings: UpdateSettingsRequest): Promise<ApiResponse<UserSettings>> {
    const response = await apiClient.put<ApiResponse<UserSettings>>(
      this.baseUrl,
      settings
    );
    
    return response.data;
  }

  async updateNotifications(notifications: Partial<NotificationSettings>): Promise<ApiResponse<NotificationSettings>> {
    const response = await apiClient.put<ApiResponse<NotificationSettings>>(
      `${this.baseUrl}/notifications`,
      { notifications }
    );
    
    return response.data;
  }

  async updatePrivacy(privacy: Partial<PrivacySettings>): Promise<ApiResponse<PrivacySettings>> {
    const response = await apiClient.put<ApiResponse<PrivacySettings>>(
      `${this.baseUrl}/privacy`,
      { privacy }
    );
    
    return response.data;
  }

  async updateDiet(diet: Partial<DietSettings>): Promise<ApiResponse<DietSettings>> {
    const response = await apiClient.put<ApiResponse<DietSettings>>(
      `${this.baseUrl}/diet`,
      { diet }
    );
    
    return response.data;
  }

  async resetSettings(): Promise<ApiResponse<UserSettings>> {
    const response = await apiClient.post<ApiResponse<UserSettings>>(
      `${this.baseUrl}/reset`
    );
    
    return response.data;
  }

  async exportData(): Promise<ApiResponse<{ jobId: string; status: string; message: string }>> {
    const response = await apiClient.post<ApiResponse<{ jobId: string; status: string; message: string }>>(
      `${this.baseUrl}/export`
    );
    
    return response.data;
  }

  async deleteAccount(confirmation: string = 'DELETE'): Promise<ApiResponse<{ jobId: string; message: string }>> {
    const response = await apiClient.post<ApiResponse<{ jobId: string; message: string }>>(
      `${this.baseUrl}/delete-account`,
      { confirmation }
    );
    
    return response.data;
  }

  // Convenience methods for common settings updates
  async toggleNotification(type: keyof NotificationSettings, enabled: boolean): Promise<ApiResponse<NotificationSettings>> {
    return this.updateNotifications({ [type]: enabled });
  }

  async setUnits(units: 'metric' | 'imperial'): Promise<ApiResponse<UserSettings>> {
    return this.updateSettings({ units });
  }

  async setTheme(theme: 'light' | 'dark' | 'auto'): Promise<ApiResponse<UserSettings>> {
    return this.updateSettings({ theme });
  }

  async addDietRestriction(restriction: string): Promise<ApiResponse<DietSettings>> {
    const currentSettings = await this.getSettings();
    const currentRestrictions = currentSettings.data?.diet.restrictions || [];
    
    if (!currentRestrictions.includes(restriction)) {
      return this.updateDiet({
        restrictions: [...currentRestrictions, restriction]
      });
    }
    
    return {
      data: currentSettings.data!.diet,
      status: 200,
      statusText: 'OK',
      headers: {}
    };
  }

  async removeDietRestriction(restriction: string): Promise<ApiResponse<DietSettings>> {
    const currentSettings = await this.getSettings();
    const currentRestrictions = currentSettings.data?.diet.restrictions || [];
    
    return this.updateDiet({
      restrictions: currentRestrictions.filter(r => r !== restriction)
    });
  }

  async addAllergy(allergy: string): Promise<ApiResponse<DietSettings>> {
    const currentSettings = await this.getSettings();
    const currentAllergies = currentSettings.data?.diet.allergies || [];
    
    if (!currentAllergies.includes(allergy)) {
      return this.updateDiet({
        allergies: [...currentAllergies, allergy]
      });
    }
    
    return {
      data: currentSettings.data!.diet,
      status: 200,
      statusText: 'OK',
      headers: {}
    };
  }

  async removeAllergy(allergy: string): Promise<ApiResponse<DietSettings>> {
    const currentSettings = await this.getSettings();
    const currentAllergies = currentSettings.data?.diet.allergies || [];
    
    return this.updateDiet({
      allergies: currentAllergies.filter(a => a !== allergy)
    });
  }

  async setCuisinePreferences(preferences: string[]): Promise<ApiResponse<DietSettings>> {
    return this.updateDiet({
      cuisinePreferences: preferences
    });
  }

  // Bulk settings update for onboarding
  async initializeSettings(settings: {
    units?: 'metric' | 'imperial';
    theme?: 'light' | 'dark' | 'auto';
    dietRestrictions?: string[];
    allergies?: string[];
    cuisinePreferences?: string[];
    notifications?: Partial<NotificationSettings>;
    privacy?: Partial<PrivacySettings>;
  }): Promise<ApiResponse<UserSettings>> {
    const settingsData: UpdateSettingsRequest = {};
    
    if (settings.units) settingsData.units = settings.units;
    if (settings.theme) settingsData.theme = settings.theme;
    
    if (settings.dietRestrictions || settings.allergies || settings.cuisinePreferences) {
      settingsData.diet = {
        restrictions: settings.dietRestrictions || [],
        allergies: settings.allergies || [],
        cuisinePreferences: settings.cuisinePreferences || []
      };
    }
    
    if (settings.notifications) {
      settingsData.notifications = settings.notifications;
    }
    
    if (settings.privacy) {
      settingsData.privacy = settings.privacy;
    }
    
    return this.updateSettings(settingsData);
  }
}

export const settingsAPI = new SettingsAPI();
export default settingsAPI;
