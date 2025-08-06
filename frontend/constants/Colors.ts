/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

const tintColorLight = '#0a7ea4';
const tintColorDark = '#fff';

export const Colors = {
  light: {
    text: '#11181C',
    background: '#fff',
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
    primary: '#0a7ea4',
    secondary: '#64b5f6',
    error: '#f44336',
    success: '#4caf50',
    warning: '#ff9800',
    border: '#e0e0e0',
    textSecondary: '#687076',
    backgroundSecondary: '#f5f5f5',
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
    primary: '#64b5f6',
    secondary: '#90caf9',
    error: '#f44336',
    success: '#4caf50',
    warning: '#ff9800',
    border: '#333333',
    textSecondary: '#9BA1A6',
    backgroundSecondary: '#1e1e1e',
  },
};
