import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    FlatList,
    Image,
    Pressable,
    StyleSheet,
    Platform,
    Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getHistory, clearHistory } from '../services/historyService';
import { useNavigation } from '@react-navigation/native';
import { useAppTheme } from '../theme/ThemeContext';
import { Trash2, Clock, Play } from 'lucide-react-native';
import { TopBar } from '../components/TopBar';
import { isTV } from '../utils/device';

const { width } = Dimensions.get('window');

export const HistoryScreen = () => {
    const { theme } = useAppTheme();
    const insets = useSafeAreaInsets();
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

    const safeTopMargin = isTV ? 110 : Math.max(insets.top + 76, Platform.OS === 'ios' ? 120 : 100);

    const renderItem = ({ item }) => {
        const isShow = item.type === 'tv' || item.season;

        return (
            <Pressable
                enablesNextFocusAppearance={true}
                style={styles.card}
                onPress={() =>
                    navigation.navigate('Player', {
                        id: item.id,
                        type: item.type,
                        season: item.season,
                        episode: item.episode,
                        item,
                        position: item.position,
                    })
                }
            >
                <Image
                    source={{
                        uri: item.poster_path
                            ? `https://image.tmdb.org/t/p/w300${item.poster_path}`
                            : item.image || 'https://via.placeholder.com/300x450',
                    }}
                    style={styles.poster}
                />
                <View style={styles.info}>
                    <Text style={styles.title} numberOfLines={1}>
                        {item.title || item.name}
                    </Text>

                    {isShow && (
                        <View style={styles.episodeBadge}>
                            <Text style={styles.episodeText} numberOfLines={1}>
                                Season {item.season} • Episode {item.episode}
                            </Text>
                        </View>
                    )}

                    <View style={styles.dateRow}>
                        <Clock size={12} color="#98A2B3" />
                        <Text style={styles.date}>
                            {item.watchedAt ? new Date(item.watchedAt).toLocaleDateString() : 'Recently'}
                        </Text>
                    </View>
                </View>

                <View style={styles.playIconContainer}>
                    <Play color="#FFFFFF" size={14} fill="#FFFFFF" />
                </View>
            </Pressable>
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: '#08090C' }]}>
            <TopBar />

            <View style={[styles.header, { marginTop: safeTopMargin }, isTV && styles.headerTV]}>
                <View style={styles.headerTitleRow}>
                    <View style={styles.titleAccent} />
                    <Text style={styles.headerTitle}>Watch History</Text>
                </View>

                {history.length > 0 && (
                    <Pressable onPress={handleClear} style={styles.clearBtnWrapper}>
                        <Trash2 size={14} color="#FF2442" />
                        <Text style={styles.clearBtn}>Clear All</Text>
                    </Pressable>
                )}
            </View>

            <FlatList
                data={history}
                keyExtractor={(item, index) =>
                    item.watchedAt ? item.watchedAt.toString() : `${item.id}-${index}`
                }
                renderItem={renderItem}
                ListEmptyComponent={
                    <View style={styles.emptyWrapper}>
                        <View style={styles.emptyIconCircle}>
                            <Clock size={isTV ? 48 : 36} color="#FF2442" strokeWidth={1.8} />
                        </View>
                        <Text style={styles.emptyTitle}>No Streaming History</Text>
                        <Text style={styles.emptySubtitle}>
                            Movies and series you stream will appear here for easy resumption.
                        </Text>
                    </View>
                }
                contentContainerStyle={[
                    styles.listContent,
                    isTV && styles.listContentTV,
                    { paddingBottom: 110 + insets.bottom },
                ]}
                numColumns={isTV ? 2 : 1}
                key={isTV ? 'tv-history-grid' : 'mobile-history-list'}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginBottom: 16,
    },
    headerTV: {
        paddingLeft: 120,
    },
    headerTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    titleAccent: {
        width: 4,
        height: 18,
        borderRadius: 2,
        backgroundColor: '#FF2442',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '900',
        color: '#FFFFFF',
        letterSpacing: 0.3,
    },
    clearBtnWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 36, 66, 0.12)',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 12,
        gap: 5,
    },
    clearBtn: {
        color: '#FF2442',
        fontSize: 12,
        fontWeight: '700',
    },
    listContent: {
        paddingHorizontal: 18,
    },
    listContentTV: {
        paddingLeft: 120,
    },
    card: {
        flexDirection: 'row',
        backgroundColor: '#0F1217',
        borderRadius: 16,
        padding: 10,
        alignItems: 'center',
        marginBottom: 12,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.06)',
    },
    poster: {
        width: 60,
        height: 84,
        borderRadius: 10,
        backgroundColor: '#151921',
    },
    info: {
        flex: 1,
        marginLeft: 14,
        marginRight: 10,
    },
    title: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '700',
        marginBottom: 4,
    },
    episodeBadge: {
        backgroundColor: 'rgba(255, 36, 66, 0.12)',
        paddingHorizontal: 7,
        paddingVertical: 2,
        borderRadius: 6,
        alignSelf: 'flex-start',
        marginBottom: 6,
    },
    episodeText: {
        color: '#FF2442',
        fontSize: 10.5,
        fontWeight: '700',
    },
    dateRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
    },
    date: {
        color: '#98A2B3',
        fontSize: 11,
    },
    playIconContainer: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#FF2442',
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyWrapper: {
        paddingTop: 80,
        alignItems: 'center',
        paddingHorizontal: 30,
    },
    emptyIconCircle: {
        width: 68,
        height: 68,
        borderRadius: 34,
        backgroundColor: 'rgba(255, 36, 66, 0.12)',
        borderWidth: 1,
        borderColor: 'rgba(255, 36, 66, 0.3)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    emptyTitle: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '800',
        marginBottom: 8,
    },
    emptySubtitle: {
        color: '#98A2B3',
        fontSize: 13,
        textAlign: 'center',
        lineHeight: 18,
    },
});
