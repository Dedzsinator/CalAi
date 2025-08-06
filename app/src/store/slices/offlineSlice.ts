import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-netinfo/netinfo';

export interface QueuedAction {
  id: string;
  type: string;
  payload: any;
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  retryCount: number;
  maxRetries: number;
  createdAt: Date;
  scheduledFor?: Date;
  priority: number;
}

export interface OfflineState {
  isOnline: boolean;
  queue: QueuedAction[];
  processing: boolean;
  lastSyncAt?: Date;
  syncInProgress: boolean;
  syncErrors: string[];
  failedActions: QueuedAction[];
}

const initialState: OfflineState = {
  isOnline: true,
  queue: [],
  processing: false,
  lastSyncAt: undefined,
  syncInProgress: false,
  syncErrors: [],
  failedActions: [],
};

// Async thunks
export const initializeOfflineQueue = createAsyncThunk(
  'offline/initialize',
  async () => {
    try {
      // Load queued actions from storage
      const storedQueue = await AsyncStorage.getItem('offline_queue');
      const storedFailedActions = await AsyncStorage.getItem('offline_failed_actions');
      const lastSyncAt = await AsyncStorage.getItem('last_sync_at');
      
      return {
        queue: storedQueue ? JSON.parse(storedQueue) : [],
        failedActions: storedFailedActions ? JSON.parse(storedFailedActions) : [],
        lastSyncAt: lastSyncAt ? new Date(lastSyncAt) : undefined,
      };
    } catch (error) {
      console.error('Failed to initialize offline queue:', error);
      return {
        queue: [],
        failedActions: [],
        lastSyncAt: undefined
      };
    }
  }
);

export const checkConnectivity = createAsyncThunk(
  'offline/checkConnectivity',
  async () => {
    const netInfo = await NetInfo.fetch();
    return netInfo.isConnected || false;
  }
);

export const processOfflineQueue = createAsyncThunk(
  'offline/processQueue',
  async (_, { getState, dispatch }) => {
    const state = getState() as { offline: OfflineState };
    const { queue } = state.offline;
    
    if (queue.length === 0) {
      return { processedCount: 0, failedCount: 0 };
    }

    let processedCount = 0;
    let failedCount = 0;
    const failedActions: QueuedAction[] = [];
    const remainingQueue: QueuedAction[] = [];

    // Sort queue by priority and creation time
    const sortedQueue = [...queue].sort((a, b) => {
      if (a.priority !== b.priority) {
        return a.priority - b.priority; // Lower number = higher priority
      }
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });

    for (const action of sortedQueue) {
      try {
        // Check if action should be processed now
        if (action.scheduledFor && new Date(action.scheduledFor) > new Date()) {
          remainingQueue.push(action);
          continue;
        }

        // Execute the queued action
        await executeQueuedAction(action);
        processedCount++;
      } catch (error) {
        console.error('Failed to process queued action:', error);
        
        if (action.retryCount < action.maxRetries) {
          // Increment retry count and re-queue
          remainingQueue.push({
            ...action,
            retryCount: action.retryCount + 1,
            scheduledFor: new Date(Date.now() + Math.pow(2, action.retryCount) * 1000) // Exponential backoff
          });
        } else {
          // Max retries reached, move to failed actions
          failedActions.push(action);
          failedCount++;
        }
      }
    }

    // Update storage
    await AsyncStorage.setItem('offline_queue', JSON.stringify(remainingQueue));
    if (failedActions.length > 0) {
      const existingFailedActions = await AsyncStorage.getItem('offline_failed_actions');
      const allFailedActions = existingFailedActions 
        ? [...JSON.parse(existingFailedActions), ...failedActions]
        : failedActions;
      await AsyncStorage.setItem('offline_failed_actions', JSON.stringify(allFailedActions));
    }
    
    if (processedCount > 0) {
      await AsyncStorage.setItem('last_sync_at', new Date().toISOString());
    }

    return { 
      processedCount, 
      failedCount, 
      remainingQueue, 
      failedActions,
      lastSyncAt: processedCount > 0 ? new Date() : undefined
    };
  }
);

export const addToOfflineQueue = createAsyncThunk(
  'offline/addToQueue',
  async (action: Omit<QueuedAction, 'id' | 'createdAt' | 'retryCount'>) => {
    const queuedAction: QueuedAction = {
      ...action,
      id: `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      retryCount: 0,
      maxRetries: action.maxRetries || 3,
      priority: action.priority || 5,
    };

    // Save to storage
    const existingQueue = await AsyncStorage.getItem('offline_queue');
    const queue = existingQueue ? JSON.parse(existingQueue) : [];
    queue.push(queuedAction);
    await AsyncStorage.setItem('offline_queue', JSON.stringify(queue));

    return queuedAction;
  }
);

export const clearFailedActions = createAsyncThunk(
  'offline/clearFailedActions',
  async () => {
    await AsyncStorage.removeItem('offline_failed_actions');
    return [];
  }
);

export const retryFailedActions = createAsyncThunk(
  'offline/retryFailedActions',
  async (_, { getState, dispatch }) => {
    const state = getState() as { offline: OfflineState };
    const { failedActions } = state.offline;

    if (failedActions.length === 0) {
      return;
    }

    // Reset failed actions and add them back to queue
    const retriedActions = failedActions.map(action => ({
      ...action,
      retryCount: 0,
      scheduledFor: undefined,
    }));

    // Add to queue
    const existingQueue = await AsyncStorage.getItem('offline_queue');
    const queue = existingQueue ? JSON.parse(existingQueue) : [];
    const newQueue = [...queue, ...retriedActions];
    await AsyncStorage.setItem('offline_queue', JSON.stringify(newQueue));

    // Clear failed actions
    await AsyncStorage.removeItem('offline_failed_actions');

    return retriedActions;
  }
);

// Helper function to execute queued actions
async function executeQueuedAction(action: QueuedAction): Promise<void> {
  const { apiClient } = await import('../services/api/config');
  
  switch (action.method) {
    case 'GET':
      await apiClient.get(action.endpoint);
      break;
    case 'POST':
      await apiClient.post(action.endpoint, action.payload);
      break;
    case 'PUT':
      await apiClient.put(action.endpoint, action.payload);
      break;
    case 'PATCH':
      await apiClient.patch(action.endpoint, action.payload);
      break;
    case 'DELETE':
      await apiClient.delete(action.endpoint);
      break;
    default:
      throw new Error(`Unsupported HTTP method: ${action.method}`);
  }
}

const offlineSlice = createSlice({
  name: 'offline',
  initialState,
  reducers: {
    setOnlineStatus: (state, action: PayloadAction<boolean>) => {
      const wasOffline = !state.isOnline;
      state.isOnline = action.payload;
      
      // If we just came back online and have queued actions, start processing
      if (wasOffline && action.payload && state.queue.length > 0) {
        state.processing = true;
      }
    },
    removeFromQueue: (state, action: PayloadAction<string>) => {
      state.queue = state.queue.filter(item => item.id !== action.payload);
    },
    updateQueueItem: (state, action: PayloadAction<{ id: string; updates: Partial<QueuedAction> }>) => {
      const index = state.queue.findIndex(item => item.id === action.payload.id);
      if (index !== -1) {
        state.queue[index] = { ...state.queue[index], ...action.payload.updates };
      }
    },
    clearSyncErrors: (state) => {
      state.syncErrors = [];
    },
    addSyncError: (state, action: PayloadAction<string>) => {
      state.syncErrors.push(action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(initializeOfflineQueue.fulfilled, (state, action) => {
        state.queue = action.payload.queue;
        state.failedActions = action.payload.failedActions;
        state.lastSyncAt = action.payload.lastSyncAt;
      })
      .addCase(checkConnectivity.fulfilled, (state, action) => {
        const wasOffline = !state.isOnline;
        state.isOnline = action.payload;
        
        // If we just came back online, start processing queue
        if (wasOffline && action.payload && state.queue.length > 0) {
          state.processing = true;
        }
      })
      .addCase(processOfflineQueue.pending, (state) => {
        state.syncInProgress = true;
        state.processing = true;
        state.syncErrors = [];
      })
      .addCase(processOfflineQueue.fulfilled, (state, action) => {
        state.syncInProgress = false;
        state.processing = false;
        state.queue = action.payload.remainingQueue;
        state.failedActions = [...state.failedActions, ...action.payload.failedActions];
        if (action.payload.lastSyncAt) {
          state.lastSyncAt = action.payload.lastSyncAt;
        }
      })
      .addCase(processOfflineQueue.rejected, (state, action) => {
        state.syncInProgress = false;
        state.processing = false;
        state.syncErrors.push(action.error.message || 'Unknown sync error');
      })
      .addCase(addToOfflineQueue.fulfilled, (state, action) => {
        state.queue.push(action.payload);
      })
      .addCase(clearFailedActions.fulfilled, (state, action) => {
        state.failedActions = action.payload;
      })
      .addCase(retryFailedActions.fulfilled, (state, action) => {
        if (action.payload) {
          state.queue.push(...action.payload);
          state.failedActions = [];
        }
      });
  },
});

export const {
  setOnlineStatus,
  removeFromQueue,
  updateQueueItem,
  clearSyncErrors,
  addSyncError,
} = offlineSlice.actions;

export default offlineSlice.reducer;
