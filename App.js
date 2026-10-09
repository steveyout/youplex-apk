import React, { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppThemeProvider } from './theme/ThemeContext';
import RootNavigator from './navigation/RootNavigator';
import ForceUpdateModal from './components/ForceUpdateModal';
import { StatusBar } from 'expo-status-bar';
import * as NavigationBar from 'expo-navigation-bar';
import * as ScreenOrientation from 'expo-screen-orientation';

// Services
import { logScreenView } from './services/analytics';
import { checkForUpdates } from './services/updateService';
import { isTV } from './utils/device';

export default function App() {
    const [isUpdateRequired, setIsUpdateRequired] = useState(false);
    const [updateInfo, setUpdateInfo] = useState(null);

    // --- HOOK 1: Status Bar & Immersive Navigation Bar ---
    useEffect(() => {
        if (Platform.OS === 'android') {
            const configureNavigation = async () => {
                try {
                    await NavigationBar.setPositionAsync('absolute');
                    await NavigationBar.setBackgroundColorAsync('#00000000');
                    await NavigationBar.setBehaviorAsync('overlay-swipe');
                    await NavigationBar.setVisibilityAsync('hidden');
                } catch (e) {
                    console.warn('NavigationBar error:', e);
                }
            };
            configureNavigation();

            let sub;
            try {
                sub = NavigationBar.addVisibilityListener(({ visibility }) => {
                    if (visibility === 'visible') {
                        setTimeout(() => {
                            NavigationBar.setVisibilityAsync('hidden').catch(() => {});
                        }, 2500);
                    }
                });
            } catch (err) {
                // Ignore if listener not supported in certain client hosts
            }

            return () => {
                if (sub && sub.remove) sub.remove();
            };
        }
    }, []);

    // --- HOOK 2: Update Check, Analytics & Orientation ---
    useEffect(() => {
        logScreenView('Main_App_Launch');

        const checkStatus = async () => {
            try {
                const result = await checkForUpdates();
                if (result && result.updateAvailable) {
                    setUpdateInfo(result);
                    setIsUpdateRequired(true);
                }
            } catch (error) {
                console.error('Update check failed:', error);
            }
        };

        const lockOrientation = async () => {
            if (Platform.OS !== 'web') {
                try {
                    if (isTV) {
                        await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
                    } else {
                        await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
                    }
                } catch (error) {
                    console.warn('Orientation lock not supported:', error);
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
                    onDismiss={() => setIsUpdateRequired(false)}
                />
            </SafeAreaProvider>
        </AppThemeProvider>
    );
}
