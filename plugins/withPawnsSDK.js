const { withAndroidManifest, withAppBuildGradle, withProjectBuildGradle } = require('@expo/config-plugins');

module.exports = function withPawnsSDK(config) {
    config = withAndroidManifest(config, (config) => {
        const manifest = config.modResults.manifest;

        // 1. Add Essential Permissions
        if (!manifest['uses-permission']) manifest['uses-permission'] = [];

        const permissions = [
            'android.permission.INTERNET',
            'android.permission.FOREGROUND_SERVICE',
            'android.permission.FOREGROUND_SERVICE_DATA_SYNC', // CRITICAL for Android 14
            'android.permission.POST_NOTIFICATIONS'
        ];

        permissions.forEach(perm => {
            if (!manifest['uses-permission'].some(p => p.$['android:name'] === perm)) {
                manifest['uses-permission'].push({ $: { 'android:name': perm } });
            }
        });

        // 2. Configure Service
        const mainApplication = manifest.application[0];
        if (!mainApplication.service) mainApplication.service = [];

        mainApplication.service = mainApplication.service.filter(
            (s) => s.$['android:name'] !== 'app.pawns.sdk.common.service.PawnsService'
        );

        mainApplication.service.push({
            $: {
                'android:name': 'app.pawns.sdk.common.service.PawnsService',
                'android:enabled': 'true',
                'android:exported': 'false',
                'android:foregroundServiceType': 'dataSync',
            },
        });
        return config;
    });

    config = withProjectBuildGradle(config, (config) => {
        if (!config.modResults.contents.includes('https://maven.pawns.app')) {
            config.modResults.contents = config.modResults.contents.replace(
                /allprojects\s*\{\s*repositories\s*\{/,
                `allprojects { repositories { \n        maven { url "https://maven.pawns.app" }`
            );
        }
        return config;
    });

    return withAppBuildGradle(config, (config) => {
        if (!config.modResults.contents.includes('android-pawns-sdk')) {
            config.modResults.contents = config.modResults.contents.replace(
                /dependencies\s*\{/,
                `dependencies { \n    implementation "app.pawns:android-pawns-sdk:1.7.0"`
            );
        }
        return config;
    });
};