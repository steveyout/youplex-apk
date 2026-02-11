const { withAndroidManifest, withAppBuildGradle, withProjectBuildGradle } = require('@expo/config-plugins');

module.exports = function withPawnsSDK(config) {
    // 1. Inject the Service into AndroidManifest.xml
    config = withAndroidManifest(config, (config) => {
        const mainApplication = config.modResults.manifest.application[0];

        // We must manually add the service tag that the Pawns SDK uses
        if (!mainApplication.service) mainApplication.service = [];

        // Check if the service is already there to avoid duplicates
        const hasService = mainApplication.service.some(
            (s) => s.$['android:name'] === 'app.pawns.sdk.common.service.PawnsService'
        );

        if (!hasService) {
            mainApplication.service.push({
                $: {
                    'android:name': 'app.pawns.sdk.common.service.PawnsService',
                    'android:enabled': 'true',
                    'android:exported': 'false',
                    'android:foregroundServiceType': 'dataSync', // CRITICAL FOR ANDROID 14
                },
            });
        }
        return config;
    });

    // 2. Add Maven Repo to Project build.gradle
    config = withProjectBuildGradle(config, (config) => {
        if (!config.modResults.contents.includes('https://maven.pawns.app')) {
            config.modResults.contents = config.modResults.contents.replace(
                /allprojects\s*\{\s*repositories\s*\{/,
                `allprojects { repositories { \n        maven { url "https://maven.pawns.app" }`
            );
        }
        return config;
    });

    // 3. Add Implementation to App build.gradle
    return withAppBuildGradle(config, (config) => {
        const pawnsDep = `dependencies { \n    implementation "app.pawns:android-pawns-sdk:1.7.0"`;
        if (!config.modResults.contents.includes('android-pawns-sdk')) {
            config.modResults.contents = config.modResults.contents.replace(/dependencies\s*\{/, pawnsDep);
        }
        return config;
    });
};