import { requireNativeModule } from 'expo-modules-core';
const PawnsModule = requireNativeModule('PawnsMonetization');

export default {
    start: (apiKey) => PawnsModule.start(apiKey),
    stop: () => PawnsModule.stop(),
};