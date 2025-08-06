import {configureStore} from '@reduxjs/toolkit';
import {persistStore, persistReducer} from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {combineReducers} from '@reduxjs/toolkit';

// Slices
import authSlice from './slices/authSlice';
import mealSlice from './slices/mealSlice';
import foodsSlice from './slices/foodsSlice';
import analyticsSlice from './slices/analyticsSlice';
import settingsSlice from './slices/settingsSlice';
import aiSlice from './slices/aiSlice';
import userSlice from './slices/userSlice';
import reminderSlice from './slices/reminderSlice';
import offlineSlice from './slices/offlineSlice';

const persistConfig = {
  key: 'root',
  storage: AsyncStorage,
  whitelist: ['auth', 'settings', 'offline'], // Only persist these reducers
};

const rootReducer = combineReducers({
  auth: authSlice,
  meals: mealSlice,
  foods: foodsSlice,
  analytics: analyticsSlice,
  settings: settingsSlice,
  ai: aiSlice,
  user: userSlice,
  reminders: reminderSlice,
  offline: offlineSlice,
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
  devTools: true, // Enable Redux DevTools
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
