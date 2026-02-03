import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { PaperProvider, Portal } from 'react-native-paper';
import Constants from 'expo-constants';
import { useAppTheme } from '../theme/ThemeContext';
import { AppNavigator } from './AppNavigator';
import { ForceUpdateModal } from '../components/ForceUpdateModal';

const RootNavigator = () => {
    const { theme } = useAppTheme();
    const [needsUpdate, setNeedsUpdate] = useState(false);

    useEffect(() => {
        const currentVersion = Constants.expoConfig?.version || "1.0.0";
        const remoteConfig = { minVersion: "1.0.0" }; // Change to 1.1.0 to test
        if (currentVersion < remoteConfig.minVersion) setNeedsUpdate(true);
    }, []);

    return (
        <PaperProvider theme={theme}>
            <Portal.Host>
                <NavigationContainer theme={theme}>
                    <AppNavigator />
                    <ForceUpdateModal visible={needsUpdate} />
                </NavigationContainer>
            </Portal.Host>
        </PaperProvider>
    );
};

export default RootNavigator;