import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    FlatList,
    Image,
    Pressable,
    StyleSheet,
    Platform,
    Dimensions
} from 'react-native';
import { getHistory, clearHistory } from '../services/historyService';
import { useNavigation } from '@react-navigation/native';
import { useAppTheme } from '../theme/ThemeContext';
import { Trash2, Clock } from 'lucide-react-native';
import { TopBar } from '../components/TopBar'; // Added TopBar
import { isTV } from '../utils/device';

const { width } = Dimensions.get('window');

export const HistoryScreen = () => {
    const { theme } = useAppTheme();
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
        const isShow = item.type === 'tv' || item.season;

        return (
            <Pressable
                // TV Navigation: ensures focus can move to the SideMenu
                enablesNextFocusAppearance={true}
                style={({ focused }) => [
                    styles.card,
                    { backgroundColor: theme.colors.elevation.level2 },
                    focused && styles.tvFocusBorder
                ]}
                onPress={() => navigation.navigate('Player', {
                    id: item.id,
                    type: item.type,
                    season: item.season,
                    episode: item.episode,
                    item: item
                })}
            >
                <Image
                    source={{ uri: `https://image.tmdb.org/t/p/w300${item.poster_path}` }}
                    style={styles.poster}
                />
                <View style={styles.info}>
                    <Text style={[styles.title, { color: theme.colors.onSurface }]} numberOfLines={1}>
                        {item.title || item.name}
                    </Text>

                    {isShow && (
                        <View style={styles.episodeBadge}>
                            <Text style={styles.episodeText}>
                                S{item.season} • E{item.episode}
                            </Text>
                        </View>
                    )}

                    <View style={styles.dateRow}>
                        <Clock size={isTV ? 16 : 12} color={theme.colors.outline} />
                        <Text style={[styles.date, { color: theme.colors.outline }]}>
                            {new Date(item.watchedAt).toLocaleDateString()}
                        </Text>
                    </View>
                </View>
            </Pressable>
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            {/* Added TopBar to keep UI consistent */}
            <TopBar />

            <View style={[styles.header, isTV && styles.headerTV]}>
                <Text style={[styles.headerTitle, { color: theme.colors.onBackground }]}>
                    Watch History
                </Text>

                {history.length > 0 && (
                    <Pressable
                        onPress={handleClear}
                        style={({ focused }) => [
                            styles.clearBtnWrapper,
                            focused && styles.clearFocus
                        ]}
                    >
                        <Trash2 size={isTV ? 28 : 18} color="#ff4444" />
                        <Text style={[styles.clearBtn, isTV && { fontSize: 20 }]}>Clear All</Text>
                    </Pressable>
                )}
            </View>

            <FlatList
                data={history}
                keyExtractor={(item) => item.watchedAt.toString()}
                renderItem={renderItem}
                ListEmptyComponent={
                    <View style={styles.emptyWrapper}>
                        <Clock size={isTV ? 100 : 64} color={theme.colors.outline} strokeWidth={1} />
                        <Text style={[styles.empty, { color: theme.colors.outline }]}>
                            Your watch history is empty.
                        </Text>
                    </View>
                }
                contentContainerStyle={[
                    styles.listContent,
                    isTV && styles.listContentTV
                ]}
                numColumns={isTV ? 2 : 1}
                key={isTV ? 'tv-history-grid' : 'mobile-history-list'}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        // Increased top margin to account for floating TopBar
        marginTop: isTV ? 130 : (Platform.OS === 'ios' ? 100 : 80),
        marginBottom: 25
    },
    headerTV: {
        paddingLeft: 120, // Offset for SideMenu (100) + extra breathing room (20)
        paddingRight: 60
    },
    headerTitle: { fontSize: isTV ? 32 : 24, fontWeight: '900' },
    clearBtnWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        gap: 8,
        borderRadius: 8
    },
    clearFocus: {
        backgroundColor: 'rgba(255, 68, 68, 0.15)',
        transform: [{ scale: 1.1 }]
    },
    clearBtn: { color: '#ff4444', fontWeight: 'bold', fontSize: 14 },
    listContent: { paddingHorizontal: 15, paddingBottom: 100 },
    listContentTV: {
        paddingLeft: 110, // Match SideMenu offset
        paddingRight: 40
    },
    card: {
        flexDirection: 'row',
        marginBottom: 20,
        borderRadius: 12,
        overflow: 'hidden',
        flex: 1,
        marginHorizontal: isTV ? 10 : 0,
        elevation: 3
    },
    tvFocusBorder: {
        borderWidth: 3,
        borderColor: '#E91E63',
        transform: [{ scale: 1.03 }],
        zIndex: 10
    },
    poster: {
        width: isTV ? 120 : 80,
        height: isTV ? 180 : 110,
        resizeMode: 'cover'
    },
    info: { padding: 15, justifyContent: 'center', flex: 1 },
    title: { fontSize: isTV ? 22 : 16, fontWeight: 'bold' },
    episodeBadge: {
        backgroundColor: 'rgba(233, 30, 99, 0.15)',
        alignSelf: 'flex-start',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 6,
        marginTop: 10
    },
    episodeText: { color: '#E91E63', fontSize: 14, fontWeight: 'bold' },
    dateRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12 },
    date: { fontSize: isTV ? 14 : 12 },
    emptyWrapper: { flex: 1, alignItems: 'center', marginTop: 150 },
    empty: { textAlign: 'center', marginTop: 20, fontSize: isTV ? 22 : 16 }
});
