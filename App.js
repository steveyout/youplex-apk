import React, { useState, useEffect } from 'react';
import { PaperProvider, Portal } from 'react-native-paper';
import Constants from 'expo-constants';
import { AppThemeProvider, useAppTheme } from './theme/ThemeContext';
import { HomeScreen } from './screens/HomeScreen';
import { ForceUpdateModal } from './components/ForceUpdateModal';

const MainContent = () => {
    const { theme } = useAppTheme();
    const [needsUpdate, setNeedsUpdate] = useState(false);

    useEffect(() => {
        // 1. Get current version from app.json
        const currentVersion = Constants.expoConfig?.version || "1.0.0";

        // 2. Mock Remote Check (Set minVersion to "1.1.0" to test the modal)
        const remoteConfig = { minVersion: "1.0.0" };

        if (currentVersion < remoteConfig.minVersion) {
            setNeedsUpdate(true);
        }
    }, []);

    return (
        <PaperProvider theme={theme}>
            {/* Portal.Host is required for Modals to render correctly */}
            <Portal.Host>
                <HomeScreen />
                <ForceUpdateModal visible={needsUpdate} />
            </Portal.Host>
        </PaperProvider>
    );
};

export default function App() {
    return (
        <AppThemeProvider>
            <MainContent />
        </AppThemeProvider>
    );
}