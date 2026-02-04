import React, {useEffect, useState} from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Application from 'expo-application';
import { AppThemeProvider } from './theme/ThemeContext';
import RootNavigator from './navigation/RootNavigator';
import { ForceUpdateModal } from './components/ForceUpdateModal';

export default function App() {
    const [updateVisible, setUpdateVisible] = useState(false);
    const [downloadUrl, setDownloadUrl] = useState(null);

    useEffect(() => {
        const checkUpdate = async () => {
            try {
                // 1. Fetch latest release from your GitHub
                const response = await fetch('https://api.github.com/repos/steveyout/youplex-apk/releases/latest');
                const data = await response.json();

                // 2. Get current app version (from app.json)
                const currentVersion = Application.nativeApplicationVersion;
                // Note: Ensure your GitHub release "tag_name" (e.g., 1.0.1)
                // matches your app.json version exactly.
                const latestVersion = data.tag_name;

                if (latestVersion !== currentVersion) {
                    // 3. Find our specific APK asset
                    const apk = data.assets.find(a => a.name === 'youplex-latest.apk');
                    if (apk) {
                        setDownloadUrl(apk.browser_download_url);
                        setUpdateVisible(true);
                    }
                }
            } catch (e) {
                console.log("Update check failed", e);
            }
        };

        checkUpdate();
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