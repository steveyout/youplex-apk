import { NativeModules, Alert, Linking } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// 'InfaticaModule' is the name we'll define in our Kotlin bridge
const { InfaticaModule } = NativeModules;
const PARTNER_ID = "YouPlex";

export const startInfaticaService = async () => {
    const consent = await AsyncStorage.getItem('@infatica_consent');

    if (consent === 'accepted') {
        InfaticaModule?.startService(PARTNER_ID);
        return;
    }

    if (consent === null) {
        Alert.alert(
            "Support YouPlex",
            "\"By using this app you will become a peer on the Infatica P2B network. This means that a tiny bit of your idle Internet bandwidth resources can be shared with this network. The P2B network spreads its traffic through millions of idle peers and therefore has minimal effect on total bandwidth consumption. Please note that NONE of your personal information is accessed and NO USER DATA is collected or shared with external parties except for the IP location data. View Privacy Policy: https://infatica-sdk.io/uploads/privacy-policy.pdf\"\nSupport this app by sharing your idle internet bandwidth. This is secure and preserves your privacy.",
            [
                { text: "Privacy Policy", onPress: () => Linking.openURL('https://infatica.io/privacy-policy/') },
                {
                    text: "Not Now",
                    onPress: () => AsyncStorage.setItem('@infatica_consent', 'declined'),
                    style: "cancel"
                },
                {
                    text: "I Agree",
                    onPress: () => {
                        AsyncStorage.setItem('@infatica_consent', 'accepted');
                        InfaticaModule?.startService(PARTNER_ID);
                    }
                }
            ]
        );
    }
};