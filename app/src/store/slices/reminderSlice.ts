import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

export interface Reminder {
  id: string;
  type: 'meal' | 'water' | 'medication' | 'custom';
  title: string;
  message: string;
  time: string; // HH:MM format
  days: ('mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun')[];
  isEnabled: boolean;
  isRepeating: boolean;
  sound: string;
  vibration: boolean;
  icon?: string;
  createdAt: string;
  lastTriggered?: string;
}

export interface ReminderState {
  reminders: Reminder[];
  todaysReminders: Reminder[];
  upcomingReminders: Reminder[];
  isLoading: boolean;
  error: string | null;
  notificationPermission: 'granted' | 'denied' | 'not-determined';
}

const initialState: ReminderState = {
  reminders: [],
  todaysReminders: [],
  upcomingReminders: [],
  isLoading: false,
  error: null,
  notificationPermission: 'not-determined',
};

// Async thunks
export const fetchReminders = createAsyncThunk(
  'reminders/fetch',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/v1/reminders');
      if (!response.ok) throw new Error('Failed to fetch reminders');
      const data = await response.json();
      return data.reminders;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch reminders');
    }
  }
);

export const createReminder = createAsyncThunk(
  'reminders/create',
  async (reminderData: Omit<Reminder, 'id' | 'createdAt'>, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/v1/reminders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reminderData),
      });
      if (!response.ok) throw new Error('Failed to create reminder');
      const data = await response.json();
      return data.reminder;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to create reminder');
    }
  }
);

export const updateReminder = createAsyncThunk(
  'reminders/update',
  async ({ id, ...updates }: Partial<Reminder> & { id: string }, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/v1/reminders/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!response.ok) throw new Error('Failed to update reminder');
      const data = await response.json();
      return data.reminder;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to update reminder');
    }
  }
);

export const deleteReminder = createAsyncThunk(
  'reminders/delete',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/v1/reminders/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete reminder');
      return id;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to delete reminder');
    }
  }
);

export const toggleReminder = createAsyncThunk(
  'reminders/toggle',
  async ({ id, isEnabled }: { id: string; isEnabled: boolean }, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/v1/reminders/${id}/toggle`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isEnabled }),
      });
      if (!response.ok) throw new Error('Failed to toggle reminder');
      const data = await response.json();
      return data.reminder;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to toggle reminder');
    }
  }
);

export const requestNotificationPermission = createAsyncThunk(
  'reminders/requestPermission',
  async (_, { rejectWithValue }) => {
    try {
      // This would use react-native-permissions or similar
      // For now, we'll simulate the permission request
      return 'granted' as const;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Permission request failed');
    }
  }
);

const reminderSlice = createSlice({
  name: 'reminders',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setNotificationPermission: (state, action: PayloadAction<'granted' | 'denied' | 'not-determined'>) => {
      state.notificationPermission = action.payload;
    },
    updateTodaysReminders: (state) => {
      const today = new Date();
      const todayDay = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][today.getDay()];
      
      state.todaysReminders = state.reminders.filter(reminder => 
        reminder.isEnabled && reminder.days.includes(todayDay as any)
      );
    },
    updateUpcomingReminders: (state) => {
      const now = new Date();
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      
      state.upcomingReminders = state.todaysReminders
        .filter(reminder => reminder.time > currentTime)
        .sort((a, b) => a.time.localeCompare(b.time))
        .slice(0, 5); // Next 5 reminders
    },
    markReminderTriggered: (state, action: PayloadAction<string>) => {
      const reminder = state.reminders.find(r => r.id === action.payload);
      if (reminder) {
        reminder.lastTriggered = new Date().toISOString();
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Reminders
      .addCase(fetchReminders.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchReminders.fulfilled, (state, action) => {
        state.isLoading = false;
        state.reminders = action.payload;
      })
      .addCase(fetchReminders.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Create Reminder
      .addCase(createReminder.fulfilled, (state, action) => {
        state.reminders.push(action.payload);
      })
      .addCase(createReminder.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      // Update Reminder
      .addCase(updateReminder.fulfilled, (state, action) => {
        const index = state.reminders.findIndex(r => r.id === action.payload.id);
        if (index !== -1) {
          state.reminders[index] = action.payload;
        }
      })
      .addCase(updateReminder.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      // Delete Reminder
      .addCase(deleteReminder.fulfilled, (state, action) => {
        state.reminders = state.reminders.filter(r => r.id !== action.payload);
      })
      .addCase(deleteReminder.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      // Toggle Reminder
      .addCase(toggleReminder.fulfilled, (state, action) => {
        const index = state.reminders.findIndex(r => r.id === action.payload.id);
        if (index !== -1) {
          state.reminders[index] = action.payload;
        }
      })
      .addCase(toggleReminder.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      // Request Permission
      .addCase(requestNotificationPermission.fulfilled, (state, action) => {
        state.notificationPermission = action.payload;
      })
      .addCase(requestNotificationPermission.rejected, (state, action) => {
        state.error = action.payload as string;
      });
  },
});

export const {
  clearError,
  setNotificationPermission,
  updateTodaysReminders,
  updateUpcomingReminders,
  markReminderTriggered,
} = reminderSlice.actions;

export default reminderSlice.reducer;
