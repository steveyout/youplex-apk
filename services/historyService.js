import AsyncStorage from '@react-native-async-storage/async-storage';

const HISTORY_KEY = '@user_watch_history';

export const saveToHistory = async (item) => {
    try {
        if (!item || !item.id) return;
        const existingHistory = await AsyncStorage.getItem(HISTORY_KEY);
        let history = existingHistory ? JSON.parse(existingHistory) : [];

        // For movies match by id; for TV match by id + season + episode
        history = history.filter((h) => {
            if (String(h.id) !== String(item.id)) return true;
            if (item.type === 'tv' && h.type === 'tv') {
                return !(Number(h.season) === Number(item.season) && Number(h.episode) === Number(item.episode));
            }
            return false;
        });

        const newEntry = {
            ...item,
            id: String(item.id),
            position: Number(item.position) || 0,
            duration: Number(item.duration) || 0,
            watchedAt: new Date().toISOString(),
        };

        history.unshift(newEntry);

        if (history.length > 50) history = history.slice(0, 50);

        await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    } catch (e) {
        console.error('Failed to save history:', e);
    }
};

export const getHistory = async () => {
    try {
        const history = await AsyncStorage.getItem(HISTORY_KEY);
        return history ? JSON.parse(history) : [];
    } catch (e) {
        return [];
    }
};

export const getItemProgress = async (id, season = 1, episode = 1) => {
    try {
        const history = await getHistory();
        const found = history.find((h) => {
            if (String(h.id) !== String(id)) return false;
            if (h.type === 'tv') {
                return Number(h.season) === Number(season) && Number(h.episode) === Number(episode);
            }
            return true;
        });
        return found ? Number(found.position) || 0 : 0;
    } catch (e) {
        return 0;
    }
};

export const clearHistory = async () => {
    await AsyncStorage.removeItem(HISTORY_KEY);
};
