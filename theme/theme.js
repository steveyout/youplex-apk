import { MD3LightTheme, MD3DarkTheme } from 'react-native-paper';

export const CustomLightTheme = {
    ...MD3LightTheme,
    colors: {
        ...MD3LightTheme.colors,
        primary: '#E91E63', // Youplex Pink
        secondary: '#9C27B0', // Youplex Purple
        background: '#F8F9FA',
        surface: '#FFFFFF',
        outlineVariant: 'rgba(0,0,0,0.05)', // Subtle borders
    },
};

export const CustomDarkTheme = {
    ...MD3DarkTheme,
    colors: {
        ...MD3DarkTheme.colors,
        primary: '#E91E63',
        secondary: '#9C27B0',
        background: '#0F0F0F', // Deep cinematic black
        surface: '#1A1A1A',
        outlineVariant: 'rgba(255,255,255,0.1)',
    },
};