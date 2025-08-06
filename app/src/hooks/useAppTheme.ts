import { useSelector } from 'react-redux';
import { RootState } from '../store';

interface AppTheme {
    colors: {
        primary: string;
        secondary: string;
        background: string;
        surface: string;
        text: string;
        textSecondary: string;
        border: string;
        error: string;
        success: string;
        warning: string;
    };
}

export const useAppTheme = (): AppTheme => {
    const { settings } = useSelector((state: RootState) => state.settings);
    const theme = settings?.preferences?.theme || 'auto';

    // For now, return light theme colors
    // In a full implementation, this would switch based on theme preference
    return {
        colors: {
            primary: '#007AFF',
            secondary: '#5856D6',
            background: '#F8F9FA',
            surface: '#FFFFFF',
            text: '#1A1A1A',
            textSecondary: '#666666',
            border: '#E0E0E0',
            error: '#FF3B30',
            success: '#34C759',
            warning: '#FF9500',
        },
    };
};
