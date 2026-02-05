import AsyncStorage from '@react-native-async-storage/async-storage';

const HISTORY_KEY = '@user_watch_history';

export const saveToHistory = async (item) => {
    try {
        const existingHistory = await AsyncStorage.getItem(HISTORY_KEY);
        let history = existingHistory ? JSON.parse(existingHistory) : [];

        // Remove the item if it already exists (to move it to the top)
        history = history.filter(h => h.id !== item.id);

        // Add new entry with timestamp
        const newEntry = {
            ...item,
            watchedAt: new Date().toISOString(),
        };

        history.unshift(newEntry); // Add to beginning

        // Keep only the last 50 items
        if (history.length > 50) history = history.slice(0, 50);

        await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    } catch (e) {
        console.error("Failed to save history:", e);
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

export const clearHistory = async () => {
    await AsyncStorage.removeItem(HISTORY_KEY);
};