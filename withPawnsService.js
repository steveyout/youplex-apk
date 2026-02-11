const { withAndroidManifest } = require('@expo/config-plugins');

module.exports = function withPawnsService(config) {
    return withAndroidManifest(config, async (config) => {
        const androidManifest = config.modResults.manifest;
        const mainApplication = androidManifest.application[0];

        // Add Service Declaration
        if (!mainApplication.service) mainApplication.service = [];
        mainApplication.service.push({
            '$': {
                'android:name': 'com.pawns.sdk.internal.service.PeerServiceForeground',
                'android:exported': 'false',
                'android:foregroundServiceType': 'specialUse',
            },
            'property': [{
                '$': {
                    'android:name': 'android.app.PROPERTY_SPECIAL_USE_FGS_SUBTYPE',
                    'android:value': 'Allows to share internet traffic by modifying device\'s network settings to be used as a gateway.',
                }
            }]
        });

        return config;
    });
};