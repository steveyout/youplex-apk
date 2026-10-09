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
    const { theme, isDarkMode } = useAppTheme();
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

    const safeTopMargin = isTV ? 130 : Math.max(insets.top + 92, Platform.OS === 'ios' ? 140 : 128);

    const renderItem = ({ item }) => {
        const isShow = item.type === 'tv' || item.season;

        return (
            <Pressable
                enablesNextFocusAppearance={true}
                style={({ focused }) => [
                    styles.card,
                    {
                        backgroundColor: theme.colors.cardBg,
                        borderColor: theme.colors.cardBorder,
                    },
                    focused && styles.tvFocusBorder,
                ]}
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
                            : (item.image || 'https://via.placeholder.com/300x450'),
                    }}
                    style={styles.poster}
                />
                <View style={styles.info}>
                    <Text
                        style={[
                            styles.title,
                            { color: isDarkMode ? '#FFFFFF' : '#111827' },
                        ]}
                        numberOfLines={1}
                        ellipsizeMode="tail"
                    >
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
                        <Clock size={isTV ? 16 : 12} color="#8A99A8" />
                        <Text style={styles.date}>
                            {item.watchedAt ? new Date(item.watchedAt).toLocaleDateString() : 'Recently'}
                        </Text>
                    </View>
                </View>

                <View style={styles.playIconContainer}>
                    <Play color="#FF3030" size={18} fill="#FF3030" />
                </View>
            </Pressable>
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <TopBar />

            <View style={[styles.header, { marginTop: safeTopMargin }, isTV && styles.headerTV]}>
                <View style={styles.headerTitleRow}>
                    <View style={styles.titleAccent} />
                    <Text
                        style={[
                            styles.headerTitle,
                            { color: theme.colors.onBackground },
                        ]}
                    >
                        Watch History
                    </Text>
                </View>

                {history.length > 0 && (
                    <Pressable
                        onPress={handleClear}
                        style={({ focused }) => [
                            styles.clearBtnWrapper,
                            focused && styles.clearFocus,
                        ]}
                    >
                        <Trash2 size={isTV ? 24 : 17} color="#FF5252" />
                        <Text style={[styles.clearBtn, isTV && { fontSize: 18 }]}>Clear All</Text>
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
                        <View
                            style={[
                                styles.emptyIconCircle,
                                {
                                    backgroundColor: isDarkMode
                                        ? 'rgba(255, 48, 48, 0.12)'
                                        : 'rgba(255, 48, 48, 0.08)',
                                    borderColor: isDarkMode
                                        ? 'rgba(255, 48, 48, 0.25)'
                                        : 'rgba(255, 48, 48, 0.15)',
                                },
                            ]}
                        >
                            <Clock size={isTV ? 64 : 44} color="#FF3030" strokeWidth={1.8} />
                        </View>
                        <Text
                            style={[
                                styles.emptyTitle,
                                { color: isDarkMode ? '#FFFFFF' : '#111827' },
                            ]}
                        >
                            Your history is clean
                        </Text>
                        <Text style={styles.emptySubtitle}>
                            Movies and series you stream will appear here for easy resumption.
                        </Text>
                    </View>
                }
                contentContainerStyle={[
                    styles.listContent,
                    isTV && styles.listContentTV,
                    { paddingBottom: 150 + insets.bottom },
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
        marginBottom: 20,
    },
    headerTV: {
        paddingLeft: 120,
        paddingRight: 60,
    },
    headerTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    titleAccent: {
        width: 4,
        height: 22,
        borderRadius: 2,
        backgroundColor: '#FF3030',
    },
    headerTitle: {
        fontSize: isTV ? 32 : 22,
        fontWeight: '900',
    },
    clearBtnWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 14,
        paddingVertical: 7,
        borderRadius: 18,
        backgroundColor: 'rgba(255, 82, 82, 0.14)',
        borderWidth: 1,
        borderColor: 'rgba(255, 82, 82, 0.3)',
    },
    clearBtn: {
        color: '#FF5252',
        fontWeight: '700',
        fontSize: 13,
    },
    clearFocus: {
        borderColor: '#FF5252',
        borderWidth: 2,
        transform: [{ scale: 1.05 }],
    },
    listContent: {
        paddingHorizontal: 16,
    },
    listContentTV: {
        paddingLeft: 120,
        paddingRight: 60,
    },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 16,
        padding: 12,
        marginBottom: 14,
        borderWidth: 1.2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 4,
        marginHorizontal: isTV ? 8 : 0,
        flex: isTV ? 0.5 : 1,
    },
    poster: {
        width: 58,
        height: 84,
        borderRadius: 10,
    },
    info: {
        flex: 1,
        marginLeft: 14,
        justifyContent: 'center',
    },
    title: {
        fontSize: isTV ? 18 : 15,
        fontWeight: '700',
        marginBottom: 4,
    },
    episodeBadge: {
        alignSelf: 'flex-start',
        backgroundColor: 'rgba(255, 48, 48, 0.15)',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        marginBottom: 6,
    },
    episodeText: {
        color: '#FF4D4D',
        fontSize: 11,
        fontWeight: '700',
    },
    dateRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    date: {
        color: '#8A99A8',
        fontSize: 11,
    },
    playIconContainer: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(255, 48, 48, 0.15)',
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 10,
    },
    emptyWrapper: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
        paddingHorizontal: 24,
    },
    emptyIconCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1.5,
        marginBottom: 16,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '900',
        marginBottom: 8,
        textAlign: 'center',
    },
    emptySubtitle: {
        color: '#8A99A8',
        fontSize: 13,
        textAlign: 'center',
        lineHeight: 18,
        maxWidth: 300,
    },
    tvFocusBorder: {
        borderWidth: 2,
        borderColor: '#FF3030',
        transform: [{ scale: 1.02 }],
    },
});
