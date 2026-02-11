const { withAppBuildGradle, withProjectBuildGradle } = require('@expo/config-plugins');

module.exports = function withPawnsSDK(config) {
    // Add Maven Repo
    config = withProjectBuildGradle(config, (config) => {
        if (!config.modResults.contents.includes('https://maven.pawns.app')) {
            config.modResults.contents = config.modResults.contents.replace(
                /allprojects\s*\{\s*repositories\s*\{/,
                `allprojects { repositories { \n        maven { url "https://maven.pawns.app" }`
            );
        }
        return config;
    });

    // Add implementation
    return withAppBuildGradle(config, (config) => {
        const pawnsDep = `dependencies { \n    implementation "app.pawns:android-pawns-sdk:1.7.0"`;
        if (!config.modResults.contents.includes('android-pawns-sdk')) {
            config.modResults.contents = config.modResults.contents.replace(/dependencies\s*\{/, pawnsDep);
        }
        return config;
    });
};