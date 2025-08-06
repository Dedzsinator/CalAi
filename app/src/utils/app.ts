import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

export const initializeApp = async (): Promise<void> => {
    try {
        // Check if this is the first launch
        const isFirstLaunch = await AsyncStorage.getItem('isFirstLaunch');
        if (isFirstLaunch === null) {
            await AsyncStorage.setItem('isFirstLaunch', 'false');
        }

        // Initialize any app-wide settings
        console.log('App initialized successfully');
        
        // Platform-specific initialization
        if (Platform.OS === 'android') {
            // Android-specific initialization
        } else if (Platform.OS === 'ios') {
            // iOS-specific initialization
        }

        // Preload any critical data or setup
        // This could include user preferences, cached data, etc.
        
    } catch (error) {
        console.error('Failed to initialize app:', error);
    }
};

export const formatCalories = (calories: number): string => {
    return Math.round(calories).toString();
};

export const formatMacros = (grams: number): string => {
    return `${Math.round(grams)}g`;
};

export const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
};

export const formatTime = (date: Date): string => {
    return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
    });
};
