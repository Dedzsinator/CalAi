import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import StorageService from './storage';
import ApiService from './api';

interface HabitPattern {
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  typical_time: string; // HH:mm format
  frequency: number; // 0-1, how often this pattern occurs
  last_seen: string;
}

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

class NotificationService {
  private habitsAnalyzed = false;
  private userPatterns: HabitPattern[] = [];

  async initialize() {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Notification permissions not granted');
      return;
    }

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('meal-reminders', {
        name: 'Meal Reminders',
        importance: Notifications.AndroidImportance.DEFAULT,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    // Analyze eating habits on initialization
    await this.analyzeEatingHabits();
    await this.scheduleHabitBasedReminders();

    console.log('Notification service initialized');
  }

  private async analyzeEatingHabits() {
    if (this.habitsAnalyzed) return;

    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
    
    const meals = await StorageService.getMealsByDateRange(twoWeeksAgo, new Date());
    
    if (meals.length < 5) {
      // Not enough data for analysis
      this.setDefaultReminders();
      return;
    }

    // Group meals by time of day to identify patterns
    const timeSlots = {
      breakfast: [] as Date[],
      lunch: [] as Date[],
      dinner: [] as Date[],
      snack: [] as Date[],
    };

    meals.forEach(meal => {
      const mealTime = new Date(meal.eaten_at);
      const hour = mealTime.getHours();

      if (hour >= 5 && hour < 11) {
        timeSlots.breakfast.push(mealTime);
      } else if (hour >= 11 && hour < 16) {
        timeSlots.lunch.push(mealTime);
      } else if (hour >= 16 && hour < 22) {
        timeSlots.dinner.push(mealTime);
      } else {
        timeSlots.snack.push(mealTime);
      }
    });

    // Calculate typical times and frequencies
    this.userPatterns = Object.entries(timeSlots)
      .filter(([_, times]) => times.length >= 2) // Need at least 2 occurrences
      .map(([mealType, times]) => {
        // Calculate average time
        const totalMinutes = times.reduce((sum, time) => {
          return sum + time.getHours() * 60 + time.getMinutes();
        }, 0);
        const avgMinutes = Math.round(totalMinutes / times.length);
        const avgHour = Math.floor(avgMinutes / 60);
        const avgMin = avgMinutes % 60;

        const frequency = Math.min(times.length / 14, 1); // Max frequency of 1 (daily)
        
        return {
          meal_type: mealType as HabitPattern['meal_type'],
          typical_time: `${avgHour.toString().padStart(2, '0')}:${avgMin.toString().padStart(2, '0')}`,
          frequency,
          last_seen: times[times.length - 1].toISOString(),
        };
      });

    // Save patterns to storage
    await StorageService.saveSetting('eating_patterns', this.userPatterns);
    this.habitsAnalyzed = true;

    console.log('Eating habits analyzed:', this.userPatterns);
  }

  private setDefaultReminders() {
    this.userPatterns = [
      {
        meal_type: 'breakfast',
        typical_time: '08:00',
        frequency: 0.8,
        last_seen: new Date().toISOString(),
      },
      {
        meal_type: 'lunch',
        typical_time: '12:30',
        frequency: 0.9,
        last_seen: new Date().toISOString(),
      },
      {
        meal_type: 'dinner',
        typical_time: '19:00',
        frequency: 0.9,
        last_seen: new Date().toISOString(),
      },
    ];
  }

  private async scheduleHabitBasedReminders() {
    // Cancel existing reminders
    await Notifications.cancelAllScheduledNotificationsAsync();

    const notificationsEnabled = await StorageService.getSetting('notifications_enabled', true);
    if (!notificationsEnabled) return;

    // Schedule reminders based on user patterns
    for (const pattern of this.userPatterns) {
      // Only schedule if frequency is above threshold
      if (pattern.frequency < 0.3) continue;

      const [hour, minute] = pattern.typical_time.split(':').map(Number);

      // Schedule daily notification
      await Notifications.scheduleNotificationAsync({
        identifier: `meal-reminder-${pattern.meal_type}`,
        content: {
          title: this.getReminderTitle(pattern.meal_type),
          body: this.getReminderBody(pattern.meal_type),
          categoryIdentifier: 'meal-reminder',
          data: { meal_type: pattern.meal_type },
        },
        trigger: {
          hour,
          minute,
          repeats: true,
        },
      });
    }

    console.log('Habit-based reminders scheduled');
  }

  private getReminderTitle(mealType: string): string {
    const titles = {
      breakfast: "🌅 Morning Fuel",
      lunch: "🍽️ Lunch Time",
      dinner: "🌆 Evening Meal",
      snack: "🍎 Snack Time",
    };
    return titles[mealType as keyof typeof titles] || "Meal Reminder";
  }

  private getReminderBody(mealType: string): string {
    const messages = {
      breakfast: "Ready to start your day? Time for breakfast!",
      lunch: "You usually have lunch around this time. Don't forget to fuel up!",
      dinner: "Dinner time! What's on the menu today?",
      snack: "Perfect time for a healthy snack!",
    };
    return messages[mealType as keyof typeof messages] || "Time for a meal!";
  }

  async scheduleCustomReminder(title: string, body: string, triggerDate: Date) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        categoryIdentifier: 'custom-reminder',
      },
      trigger: {
        date: triggerDate,
      },
    });
  }

  async sendInstantNotification(title: string, body: string, data?: any) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
      },
      trigger: null, // Send immediately
    });
  }

  async sendGoalAchievementNotification(achievement: string) {
    await this.sendInstantNotification(
      "🎉 Goal Achievement!",
      achievement
    );
  }

  async sendWeeklyInsight(insight: string) {
    await this.sendInstantNotification(
      "📊 Weekly Insight",
      insight
    );
  }

  // Smart reminders based on recent activity
  async checkForMissedMeals() {
    const today = await StorageService.getTodaysMeals();
    const now = new Date();
    const currentHour = now.getHours();

    for (const pattern of this.userPatterns) {
      const [patternHour, patternMinute] = pattern.typical_time.split(':').map(Number);
      const patternTime = patternHour * 60 + patternMinute;
      const currentTime = currentHour * 60 + now.getMinutes();

      // Check if we've passed the typical meal time by more than 30 minutes
      if (currentTime > patternTime + 30) {
        const hasMealInTimeWindow = today.some(meal => {
          const mealTime = new Date(meal.eaten_at);
          const mealHour = mealTime.getHours();
          
          // Check if meal is within 2 hours of typical time
          return Math.abs(mealHour - patternHour) <= 2;
        });

        if (!hasMealInTimeWindow && pattern.frequency > 0.5) {
          await this.sendInstantNotification(
            `Missed ${pattern.meal_type}?`,
            `You usually have ${pattern.meal_type} around ${pattern.typical_time}. Would you like to log it?`,
            { meal_type: pattern.meal_type }
          );
        }
      }
    }
  }

  // Motivational notifications
  async sendMotivationalReminder() {
    const motivationalMessages = [
      "Every meal is a chance to nourish your body! 💪",
      "Tracking your meals helps you reach your goals! 🎯",
      "You're doing great! Keep up the healthy habits! 🌟",
      "Consistency is key to success! 📈",
      "Your health journey matters! 💚",
    ];

    const randomMessage = motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)];
    
    await this.sendInstantNotification("Keep Going!", randomMessage);
  }

  // Update preferences
  async updateNotificationSettings(enabled: boolean) {
    await StorageService.saveSetting('notifications_enabled', enabled);
    
    if (enabled) {
      await this.scheduleHabitBasedReminders();
    } else {
      await Notifications.cancelAllScheduledNotificationsAsync();
    }
  }

  async setMealReminder(mealType: string, time: string) {
    const [hour, minute] = time.split(':').map(Number);
    
    await Notifications.scheduleNotificationAsync({
      identifier: `custom-meal-reminder-${mealType}`,
      content: {
        title: this.getReminderTitle(mealType),
        body: this.getReminderBody(mealType),
        categoryIdentifier: 'meal-reminder',
      },
      trigger: {
        hour,
        minute,
        repeats: true,
      },
    });
  }

  // Handle notification responses
  async handleNotificationResponse(response: Notifications.NotificationResponse) {
    const { actionIdentifier, notification } = response;
    const data = notification.request.content.data;

    if (data?.meal_type) {
      // Navigate to food logging screen
      // This would be handled by the navigation system
      console.log(`Navigate to food logging for ${data.meal_type}`);
    }
  }

  // Background task to update habits
  async updateHabitsInBackground() {
    try {
      this.habitsAnalyzed = false;
      await this.analyzeEatingHabits();
      await this.scheduleHabitBasedReminders();
      await this.checkForMissedMeals();
    } catch (error) {
      console.error('Failed to update habits in background:', error);
    }
  }

  async getScheduledNotifications() {
    return await Notifications.getAllScheduledNotificationsAsync();
  }
}

export default new NotificationService();
