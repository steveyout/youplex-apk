import analytics from '@react-native-firebase/analytics';

/**
 * Log when a user opens a specific screen
 */
export const logScreenView = async (screenName) => {
    try {
        await analytics().logScreenView({
            screen_name: screenName,
            screen_class: screenName,
        });
    } catch (e) {
        console.error("Analytics Error:", e);
    }
};

/**
 * Log when a user starts watching a movie
 */
export const logMoviePlay = async (movieId, movieTitle) => {
    try {
        await analytics().logEvent('movie_play', {
            id: movieId,
            title: movieTitle,
        });
    } catch (e) {
        console.error("Analytics Error:", e);
    }
};

/**
 * Log when a user clicks the "Update" button in your Force Update Modal
 */
export const logUpdateClick = async (version) => {
    try {
        await analytics().logEvent('app_update_click', {
            target_version: version,
        });
    } catch (e) {
        console.error("Analytics Error:", e);
    }
};