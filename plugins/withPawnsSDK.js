const { withAndroidManifest, withAppBuildGradle, withProjectBuildGradle } = require('@expo/config-plugins');

module.exports = function withPawnsSDK(config) {
    config = withAndroidManifest(config, (config) => {
        const manifest = config.modResults.manifest;

        // 1. Add the REQUIRED Android 14 Permission
        if (!manifest['uses-permission']) manifest['uses-permission'] = [];
        manifest['uses-permission'].push({
            $: { 'android:name': 'android.permission.FOREGROUND_SERVICE_DATA_SYNC' }
        });

        const mainApplication = manifest.application[0];
        if (!mainApplication.service) mainApplication.service = [];

        // 2. Clear and Re-add Service with Correct Type
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

    // Maven Repo and Implementation (Keep as before)
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