import { apiClient } from './config';
import { Reminder } from '../../store/slices/reminderSlice';

export const reminderAPI = {
  // Get all user reminders
  getReminders: async (): Promise<{ reminders: Reminder[] }> => {
    const response = await apiClient.get('/reminders');
    return response.data;
  },

  // Get today's reminders
  getTodaysReminders: async (): Promise<{ reminders: Reminder[] }> => {
    const response = await apiClient.get('/reminders/today');
    return response.data;
  },

  // Get upcoming reminders
  getUpcomingReminders: async (): Promise<{ reminders: Reminder[] }> => {
    const response = await apiClient.get('/reminders/upcoming');
    return response.data;
  },

  // Create a new reminder
  createReminder: async (reminderData: Omit<Reminder, 'id' | 'createdAt'>): Promise<{ reminder: Reminder }> => {
    const response = await apiClient.post('/reminders', {
      reminder: reminderData,
    });
    return response.data;
  },

  // Update an existing reminder
  updateReminder: async (
    reminderId: string, 
    updates: Partial<Reminder>
  ): Promise<{ reminder: Reminder }> => {
    const response = await apiClient.put(`/reminders/${reminderId}`, {
      reminder: updates,
    });
    return response.data;
  },

  // Delete a reminder
  deleteReminder: async (reminderId: string): Promise<void> => {
    await apiClient.delete(`/reminders/${reminderId}`);
  },

  // Toggle reminder on/off
  toggleReminder: async (
    reminderId: string, 
    isEnabled: boolean
  ): Promise<{ reminder: Reminder }> => {
    const response = await apiClient.put(`/reminders/${reminderId}/toggle`, {
      is_enabled: isEnabled,
    });
    return response.data;
  },

  // Mark reminder as triggered
  markTriggered: async (reminderId: string): Promise<{ reminder: Reminder }> => {
    const response = await apiClient.put(`/reminders/${reminderId}/mark_triggered`);
    return response.data;
  },

  // Batch create reminders (for meal reminders, etc.)
  createMealReminders: async (): Promise<{ reminders: Reminder[] }> => {
    const defaultMealReminders = [
      {
        type: 'meal' as const,
        title: 'Breakfast Time',
        message: 'Don\'t forget to log your breakfast!',
        time: '08:00',
        days: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const,
        isEnabled: true,
        isRepeating: true,
        sound: 'default',
        vibration: true,
        icon: 'free-breakfast',
      },
      {
        type: 'meal' as const,
        title: 'Lunch Time',
        message: 'Time to log your lunch!',
        time: '12:30',
        days: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const,
        isEnabled: true,
        isRepeating: true,
        sound: 'default',
        vibration: true,
        icon: 'lunch-dining',
      },
      {
        type: 'meal' as const,
        title: 'Dinner Time',
        message: 'Don\'t forget to log your dinner!',
        time: '19:00',
        days: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const,
        isEnabled: true,
        isRepeating: true,
        sound: 'default',
        vibration: true,
        icon: 'dinner-dining',
      },
    ];

    const response = await apiClient.post('/reminders/batch', {
      reminders: defaultMealReminders,
    });
    return response.data;
  },

  // Create water reminders
  createWaterReminders: async (): Promise<{ reminders: Reminder[] }> => {
    const waterReminders: any[] = [];
    
    // Create reminders every 2 hours from 8 AM to 8 PM
    for (let hour = 8; hour <= 20; hour += 2) {
      waterReminders.push({
        type: 'water' as const,
        title: 'Hydration Time',
        message: 'Time to drink some water! Stay hydrated.',
        time: `${hour.toString().padStart(2, '0')}:00`,
        days: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const,
        isEnabled: false, // Disabled by default
        isRepeating: true,
        sound: 'water_drop',
        vibration: false,
        icon: 'water-drop',
      });
    }

    const response = await apiClient.post('/reminders/batch', {
      reminders: waterReminders,
    });
    return response.data;
  },
};
