import React, { useEffect, useState } from 'react';
import {PermissionsAndroid, Platform} from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppThemeProvider } from './theme/ThemeContext';
import RootNavigator from './navigation/RootNavigator';
import ForceUpdateModal from './components/ForceUpdateModal';
import { StatusBar } from 'expo-status-bar';
import * as NavigationBar from 'expo-navigation-bar';
import * as PawnsBridge from './modules/pawns-bridge';

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

    useEffect(() => {
        const initPawns = async () => {
            // 1. Check/Request Notification Permission (Android 13+)
            if (Platform.OS === 'android' && Platform.Version >= 33) {
                const granted = await PermissionsAndroid.request(
                    PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
                );
                if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
                    console.warn("Notification permission denied. Pawns cannot start.");
                    return;
                }
            }

            // 2. Start Pawns with a small delay to ensure native side is ready
            setTimeout(() => {
                try {
                    const apiKey = process.env.EXPO_PUBLIC_PAWNS_API_KEY;
                    if (apiKey) {
                        PawnsBridge.start(apiKey);
                        console.log("PawnsBridge: Start signal sent");
                    }
                } catch (error) {
                    console.error("PawnsBridge Error:", error);
                }
            }, 2000);
        };

        initPawns();
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