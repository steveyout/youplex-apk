import React, {useEffect, useState} from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Application from 'expo-application';
import { AppThemeProvider } from './theme/ThemeContext';
import RootNavigator from './navigation/RootNavigator';
import { ForceUpdateModal } from './components/ForceUpdateModal';
import {checkForUpdates} from "./services/updateService";

export default function App() {
    const [updateVisible, setUpdateVisible] = useState(false);
    const [releaseId, setReleaseId] = useState(null);
    const[downloadUrl,setDownloadUrl]=useState(null);

    useEffect(() => {
        const check = async () => {
            const result = await checkForUpdates();
            if (result.updateAvailable) {
                setReleaseId(result.newReleaseId);
                setUpdateVisible(true);
                setDownloadUrl(result.downloadUrl)
            }
        };
        check();
    }, []);
    return (
        <AppThemeProvider>
            <SafeAreaProvider>
                <RootNavigator />
                <ForceUpdateModal visible={updateVisible} downloadUrl={downloadUrl} />
            </SafeAreaProvider>
        </AppThemeProvider>
    );
}