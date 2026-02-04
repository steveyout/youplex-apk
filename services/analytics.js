import { Platform } from 'react-native';

/**
 * Robust check to determine if we should even try to load Firebase.
 * We skip it if:
 * 1. We are in development mode (__DEV__)
 * 2. We are on Web
 */
const shouldEnableFirebase = !__DEV__ && Platform.OS !== 'web';

/**
 * Log when a user opens a specific screen
 */
export const logScreenView = async (screenName) => {
    if (!shouldEnableFirebase) {
        console.log(`[Analytics-Mock] Screen View: ${screenName}`);
        return;
    }

    try {
        // Dynamic import: Only loads the native module if we are in production
        const { default: analytics } = await import('@react-native-firebase/analytics');
        await analytics().logScreenView({
            screen_name: screenName,
            screen_class: screenName,
        });
    } catch (e) {
        console.warn("Analytics blocked or failed:", e.message);
    }
};

/**
 * Log when a user starts watching a movie
 */
export const logMoviePlay = async (movieId, movieTitle) => {
    if (!shouldEnableFirebase) {
        console.log(`[Analytics-Mock] Movie Play: ${movieTitle} (ID: ${movieId})`);
        return;
    }

    try {
        const { default: analytics } = await import('@react-native-firebase/analytics');
        await analytics().logEvent('movie_play', {
            id: String(movieId),
            title: movieTitle,
        });
    } catch (e) {
        console.warn("Analytics Event failed:", e.message);
    }
};

/**
 * Log when a user clicks the "Update" button
 */
export const logUpdateClick = async (version) => {
    if (!shouldEnableFirebase) {
        console.log(`[Analytics-Mock] Update Clicked: ${version}`);
        return;
    }

    try {
        const { default: analytics } = await import('@react-native-firebase/analytics');
        await analytics().logEvent('app_update_click', {
            target_version: version,
        });
    } catch (e) {
        console.warn("Analytics Event failed:", e.message);
    }
};