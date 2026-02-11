import React, { useEffect, useState } from 'react';
import {PermissionsAndroid, Platform} from 'react-native';
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
import PawnsMonetization from './modules/pawns-monetization';


export default function App() {
    const [isUpdateRequired, setIsUpdateRequired] = useState(false);
    const [updateInfo, setUpdateInfo] = useState(null);

    useEffect(() => {
        // We define the function inside useEffect to ensure it has access to the component lifecycle
        const initializeMonetization = async () => {
            if (Platform.OS !== 'android') return;

            try {
                // 1. Check/Request Notification Permission (Required for Android 13+)
                // Without this, starting a foreground service is an instant FATAL CRASH
                if (Platform.Version >= 33) {
                    const granted = await PermissionsAndroid.request(
                        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
                        {
                            title: "Allow Notifications",
                            message: "Allow notifications to keep app Updates upto date.",
                            buttonNeutral: "Ask Me Later",
                            buttonNegative: "Cancel",
                            buttonPositive: "OK"
                        }
                    );

                    if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
                        console.log("Pawns: Notification permission denied.");
                        return;
                    }
                }

                // 2. Start the SDK
                const apiKey = process.env.EXPO_PUBLIC_PAWNS_API_KEY;

                if (!apiKey) {
                    console.error("Pawns: API Key missing from .env");
                    return;
                }

                console.log("Pawns: Initializing with key...");
                PawnsMonetization.start(apiKey);

            } catch (err) {
                console.error("Pawns: Startup error", err);
            }
        };

        // Small delay to ensure the native bridge is 100% ready
        const timer = setTimeout(() => {
            initializeMonetization();
        }, 1000);

        return () => clearTimeout(timer);
    }, []);

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