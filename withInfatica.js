const { withProjectBuildGradle, withAppBuildGradle, withAndroidManifest } = require('@expo/config-plugins');
const path = require('path');
const fs = require('fs');

module.exports = function withInfatica(config) {
    // 1. Resolve absolute path for Infatica .aar
    const rawPath = path.resolve(config._internal.projectRoot, 'modules/infatica/android/libs');
    const libsFolder = rawPath.split(path.sep).join('/');

    // 2. PROJECT GRADLE
    config = withProjectBuildGradle(config, (config) => {
        return config;
    });

    // 3. APP GRADLE (The Fix: Direct File Linking + EAS Signing)
    config = withAppBuildGradle(config, (config) => {
        const aarPath = `${libsFolder}/infatica-agent-service.aar`;

        if (!config.modResults.contents.includes('infatica-agent-service')) {
            config.modResults.contents = config.modResults.contents.replace(
                /dependencies\s?{/,
                `dependencies {
        implementation files("${aarPath}")
        implementation 'androidx.datastore:datastore-preferences:1.1.1'`
            );
        }

        // Inject EAS Signing Logic if credentials.json exists (Local Developer build)
        const credentialsPath = path.resolve(config._internal.projectRoot, 'credentials.json');
        if (fs.existsSync(credentialsPath)) {
            const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
            const ks = credentials.android.keystore;
            const absKsPath = path.resolve(config._internal.projectRoot, ks.keystorePath).split(path.sep).join('/');

            const signingBlock = `
    signingConfigs {
        release {
            storeFile file("${absKsPath}")
            storePassword "${ks.keystorePassword}"
            keyAlias "${ks.keyAlias}"
            keyPassword "${ks.keyPassword}"
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
        }
    }`;

            if (!config.modResults.contents.includes('signingConfigs')) {
                config.modResults.contents = config.modResults.contents.replace(
                    /buildTypes\s?{/,
                    signingBlock + '\n    buildTypes {'
                );
            }
        }
        return config;
    });

    // 4. ANDROID MANIFEST (Universal Mobile + TV Support)
    config = withAndroidManifest(config, (config) => {
        const manifest = config.modResults.manifest;
        const mainActivity = manifest.application[0].activity.find(a =>
                a['intent-filter'] && a['intent-filter'].some(f =>
                    f.action.some(act => act.$['android:name'] === 'android.intent.action.MAIN')
                )
        );

        // Add Leanback Launcher (TV Home Screen)
        if (mainActivity && !mainActivity['intent-filter'].some(f => f.category?.some(c => c.$['android:name'] === 'android.intent.category.LEANBACK_LAUNCHER'))) {
            mainActivity['intent-filter'].push({
                action: [{ $: { 'android:name': 'android.intent.action.MAIN' } }],
                category: [{ $: { 'android:name': 'android.intent.category.LEANBACK_LAUNCHER' } }]
            });
        }

        // Hardware features: required="false" enables both Mobile and TV installation
        if (!manifest['uses-feature']) manifest['uses-feature'] = [];
        const features = [
            { name: 'android.software.leanback', required: 'false' },
            { name: 'android.hardware.touchscreen', required: 'false' },
            { name: 'android.hardware.type.television', required: 'false' }
        ];

        features.forEach(f => {
            if (!manifest['uses-feature'].some(feat => feat.$['android:name'] === f.name)) {
                manifest['uses-feature'].push({ $: { 'android:name': f.name, 'android:required': f.required } });
            }
        });

        // Permissions
        const permissions = ['android.permission.INTERNET', 'android.permission.FOREGROUND_SERVICE', 'android.permission.POST_NOTIFICATIONS'];
        if (!manifest['uses-permission']) manifest['uses-permission'] = [];
        permissions.forEach(perm => {
            if (!manifest['uses-permission'].some(p => p.$['android:name'] === perm)) {
                manifest['uses-permission'].push({ '$': { 'android:name': perm } });
            }
        });

        return config;
    });

    return config;
};