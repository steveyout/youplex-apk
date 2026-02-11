import React, { useEffect, useState } from 'react';
import {AppState, PermissionsAndroid, Platform} from 'react-native';
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

    const appState = useRef(AppState.currentState);

    const startPawnsSafe = () => {
        // InteractionManager ensures we don't lag the splash screen animation
        InteractionManager.runAfterInteractions(() => {
            console.log('Preparing to start Pawns SDK...');

            // 5-second delay to bypass the Transsion SmartPanel 'heavy start' check
            setTimeout(() => {
                try {
                    const apiKey = process.env.EXPO_PUBLIC_PAWNS_API_KEY;
                    if (apiKey) {
                        PawnsMonetization.start(apiKey);
                        console.log('Pawns SDK start command sent.');
                    } else {
                        console.warn('Pawns API Key is missing in environment variables');
                    }
                } catch (e) {
                    console.error("Pawns start failed:", e);
                }
            }, 5000);
        });
    };

    useEffect(() => {
        // 1. Initial Start (For Cold Boots/First Open)
        startPawnsSafe();

        // 2. Listener for Background/Foreground transitions
        const subscription = AppState.addEventListener('change', nextAppState => {
            if (
                appState.current.match(/inactive|background/) &&
                nextAppState === 'active'
            ) {
                console.log('App returned to foreground, restarting Pawns check...');
                startPawnsSafe();
            }
            appState.current = nextAppState;
        });

        return () => {
            subscription.remove();
        };
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