import AsyncStorage from '@react-native-async-storage/async-storage';

const BOOKMARKS_KEY = '@user_bookmarks';

/**
 * Retrieve all bookmarked items
 */
export const getBookmarks = async () => {
    try {
        const json = await AsyncStorage.getItem(BOOKMARKS_KEY);
        return json ? JSON.parse(json) : [];
    } catch (e) {
        console.error('Failed to get bookmarks:', e);
        return [];
    }
};

/**
 * Check if a movie or TV show is in bookmarks
 */
export const isBookmarked = async (id) => {
    try {
        const list = await getBookmarks();
        return list.some((item) => String(item.id) === String(id));
    } catch (e) {
        return false;
    }
};

/**
 * Add an item to bookmarks (My List)
 */
export const addBookmark = async (item) => {
    try {
        const list = await getBookmarks();
        const exists = list.some((i) => String(i.id) === String(item.id));
        if (exists) return list;

        const newEntry = {
            id: item.id,
            title: item.title || item.name,
            name: item.name || item.title,
            image: item.image || item.poster || (item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : null),
            poster_path: item.poster_path,
            backdrop: item.backdrop || item.backdrop_path,
            rating: item.rating || (item.vote_average ? item.vote_average.toFixed(1) : null),
            year: item.year || (item.release_date || item.first_air_date || '').split('-')[0],
            media_type: item.media_type || (item.first_air_date ? 'tv' : 'movie'),
            addedAt: Date.now(),
        };

        const updated = [newEntry, ...list];
        await AsyncStorage.setItem(BOOKMARKS_KEY, JSON.stringify(updated));
        return updated;
    } catch (e) {
        console.error('Failed to add bookmark:', e);
        return [];
    }
};

/**
 * Remove an item from bookmarks
 */
export const removeBookmark = async (id) => {
    try {
        const list = await getBookmarks();
        const updated = list.filter((item) => String(item.id) !== String(id));
        await AsyncStorage.setItem(BOOKMARKS_KEY, JSON.stringify(updated));
        return updated;
    } catch (e) {
        console.error('Failed to remove bookmark:', e);
        return [];
    }
};

/**
 * Toggle bookmark status
 */
export const toggleBookmark = async (item) => {
    try {
        const currentlySaved = await isBookmarked(item.id);
        if (currentlySaved) {
            await removeBookmark(item.id);
            return false;
        } else {
            await addBookmark(item);
            return true;
        }
    } catch (e) {
        console.error('Failed to toggle bookmark:', e);
        return false;
    }
};

/**
 * Clear all bookmarks
 */
export const clearBookmarks = async () => {
    try {
        await AsyncStorage.removeItem(BOOKMARKS_KEY);
    } catch (e) {
        console.error('Failed to clear bookmarks:', e);
    }
};
