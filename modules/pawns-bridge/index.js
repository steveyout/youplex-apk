import { requireNativeModule } from 'expo-modules-core';

// This name MUST match Name("PawnsBridge") in your Kotlin file
const PawnsBridge = requireNativeModule('PawnsBridge');

/**
 * Starts the Pawns Sharing Service.
 * @param {string} apiKey - Your Pawns.app API Key.
 */
export function start(apiKey) {
    if (PawnsBridge && PawnsBridge.start) {
        return PawnsBridge.start(apiKey);
    }
    console.warn("PawnsBridge: start function not found in native module.");
}

/**
 * Stops the Pawns Sharing Service.
 */
export function stop() {
    if (PawnsBridge && PawnsBridge.stop) {
        return PawnsBridge.stop();
    }
}