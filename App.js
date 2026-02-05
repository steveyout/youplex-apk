import React, { useEffect, useState } from 'react';
import { Platform } from 'react-native'; // Added missing import
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppThemeProvider } from './theme/ThemeContext';
import RootNavigator from './navigation/RootNavigator';
import ForceUpdateModal from './components/ForceUpdateModal';
import { checkForUpdates } from './services/updateService';
import { StatusBar } from 'expo-status-bar';
import * as Application from 'expo-application';
import * as NavigationBar from 'expo-navigation-bar'; // Added missing import

// Your Service Imports
import { logScreenView } from './services/analytics';

console.log("INTERNAL BUILD NUMBER:", Application.nativeBuildVersion);

export default function App() {
    const [isUpdateRequired, setIsUpdateRequired] = useState(false);
    const [updateInfo, setUpdateInfo] = useState(null);

    // --- HOOK 1: Status Bar & Navigation Bar ---
    useEffect(() => {
        if (Platform.OS === 'android') {
            const configureNavigation = async () => {
                try {
                    // Set behavior to 'sticky-immersive'
                    await NavigationBar.setBehaviorAsync('sticky-immersive');
                    // Hide the bar
                    await NavigationBar.setVisibilityAsync('hidden');
                } catch (e) {
                    console.warn("NavigationBar error:", e);
                }
            };
            configureNavigation();
        }
    }, []);

    // --- HOOK 2: Update Check, Analytics & Monetization ---
    useEffect(() => {
        // 1. Run Analytics & Monetization
        logScreenView('Main_App_Launch');

        // 2. Run Update Checker
        const checkStatus = async () => {
            try {
                const result = await checkForUpdates();
                if (result && result.updateAvailable) {
                    setUpdateInfo(result);
                    setIsUpdateRequired(true);
                }
            } catch (error) {
                console.error("Update check failed:", error);
            }
        };

        checkStatus();
    }, []);

    return (
        <AppThemeProvider>
            <SafeAreaProvider>
                <StatusBar hidden={true} />
                <RootNavigator />
                <ForceUpdateModal
                    visible={isUpdateRequired}
                    updateData={updateInfo}
                />
            </SafeAreaProvider>
        </AppThemeProvider>
    );
}