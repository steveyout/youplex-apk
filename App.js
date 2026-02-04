import React, {useEffect, useState} from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppThemeProvider } from './theme/ThemeContext';
import RootNavigator from './navigation/RootNavigator';
import ForceUpdateModal from './components/ForceUpdateModal'; // Adjust path accordingly
import { checkForUpdates } from './services/updateService';
import * as Application from 'expo-application';

console.log("INTERNAL BUILD NUMBER:", Application.nativeBuildVersion);
export default function App() {
    const [isUpdateRequired, setIsUpdateRequired] = useState(false);
    const [updateInfo, setUpdateInfo] = useState(null);

    useEffect(() => {
        const checkStatus = async () => {
            const result = await checkForUpdates();
            if (result.updateAvailable) {
                setUpdateInfo(result);
                setIsUpdateRequired(true);
            }
        };

        checkStatus();
    }, []);
    return (
        <AppThemeProvider>
            <SafeAreaProvider>
                <RootNavigator />
                <ForceUpdateModal
                    visible={isUpdateRequired}
                    updateData={updateInfo}
                />
            </SafeAreaProvider>
        </AppThemeProvider>
    );
}