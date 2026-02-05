import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { getHistory, clearHistory } from '../services/historyService';
import { useNavigation } from '@react-navigation/native';

export const HistoryScreen = () => {
    const [history, setHistory] = useState([]);
    const navigation = useNavigation();

    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', async () => {
            const data = await getHistory();
            setHistory(data);
        });
        return unsubscribe;
    }, [navigation]);

    const handleClear = async () => {
        await clearHistory();
        setHistory([]);
    };

    const renderItem = ({ item }) => {
        const isTV = item.type === 'tv' || item.season;

        return (
            <TouchableOpacity
                style={styles.card}
                onPress={() => navigation.navigate('Player', {
                    id: item.id,
                    type: item.type,
                    season: item.season,
                    episode: item.episode,
                    item: item
                })}
            >
                <Image
                    source={{ uri: `https://image.tmdb.org/t/p/w200${item.poster_path}` }}
                    style={styles.poster}
                />
                <View style={styles.info}>
                    <Text style={styles.title} numberOfLines={1}>
                        {item.title || item.name}
                    </Text>

                    {isTV && (
                        <View style={styles.episodeBadge}>
                            <Text style={styles.episodeText}>
                                Season {item.season} • Episode {item.episode}
                            </Text>
                        </View>
                    )}

                    <Text style={styles.date}>
                        Watched: {new Date(item.watchedAt).toLocaleDateString()}
                    </Text>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Watch History</Text>
                {history.length > 0 && (
                    <TouchableOpacity onPress={handleClear}>
                        <Text style={styles.clearBtn}>Clear All</Text>
                    </TouchableOpacity>
                )}
            </View>

            <FlatList
                data={history}
                keyExtractor={(item) => item.watchedAt}
                renderItem={renderItem}
                ListEmptyComponent={<Text style={styles.empty}>No history yet.</Text>}
                contentContainerStyle={{ paddingBottom: 20 }}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000', padding: 15 },
    header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20, marginTop: 40 },
    headerTitle: { color: '#fff', fontSize: 22, fontWeight: 'bold' },
    clearBtn: { color: '#ff4444', fontWeight: 'bold' },
    card: { flexDirection: 'row', marginBottom: 15, backgroundColor: '#1a1a1a', borderRadius: 8, overflow: 'hidden' },
    poster: { width: 80, height: 110 },
    info: { padding: 10, justifyContent: 'center', flex: 1 },
    title: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
    date: { color: '#888', fontSize: 12, marginTop: 5 },
    empty: { color: '#888', textAlign: 'center', marginTop: 50 }
});
