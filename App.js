import React, { useEffect, useState } from 'react';
import { Platform} from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppThemeProvider } from './theme/ThemeContext';
import RootNavigator from './navigation/RootNavigator';
import ForceUpdateModal from './components/ForceUpdateModal';
import { StatusBar } from 'expo-status-bar';
import * as NavigationBar from 'expo-navigation-bar';

// Your Service Imports
import { logScreenView } from './services/analytics';
import { checkForUpdates } from './services/updateService';
import {isTV} from "./utils/device"; // The wrapper service


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


        /////orientation
        const lockOrientation = async () => {
            // Only attempt to lock orientation on Native (Android/iOS)
            // Browsers have strict security restrictions for this API
            if (Platform.OS !== 'web') {
                try {
                    if (isTV) {
                        await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
                    } else {
                        await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
                    }
                } catch (error) {
                    console.warn("Orientation lock not supported:", error);
                }
            }
        };
        lockOrientation();
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