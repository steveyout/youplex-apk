import React, { createContext, useContext, useState, useMemo } from 'react';
import { CustomLightTheme, CustomDarkTheme } from './theme';

const ThemeContext = createContext(undefined);

export const AppThemeProvider = ({ children }) => {
    const [isDarkMode, setIsDarkMode] = useState(true); // Default to Dark Mode

    const toggleTheme = () => setIsDarkMode((prev) => !prev);

    // useMemo prevents unnecessary re-renders of the entire app
    const theme = useMemo(() =>
            isDarkMode ? CustomDarkTheme : CustomLightTheme,
        [isDarkMode]);

    const value = {
        theme,
        isDarkMode,
        toggleTheme,
    };

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    );
};

// Custom hook for easy access in components
export const useAppTheme = () => {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useAppTheme must be used within an AppThemeProvider');
    }
    return context;
};