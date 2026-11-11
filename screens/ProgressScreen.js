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
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Play, Clock, Film, Trash2 } from 'lucide-react-native';
import { getHistory, clearHistory } from '../services/historyService';
import { useAppTheme } from '../theme/ThemeContext';
import { TopBar } from '../components/TopBar';
import { isTV } from '../utils/device';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

function formatTimeRemaining(position, duration) {
    if (!duration || duration <= 0 || !position) return '';
    const remaining = Math.max(0, duration - position);
    const mins = Math.floor(remaining / 60);
    const hrs = Math.floor(mins / 60);
    const remMins = mins % 60;
    if (hrs > 0) return `${hrs}h ${remMins}m left`;
    return `${mins}m left`;
}

export const ProgressScreen = () => {
    const { theme } = useAppTheme();
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();

    const [activeTab, setActiveTab] = useState('progress');
    const [allHistory, setAllHistory] = useState([]);
    const [progressItems, setProgressItems] = useState([]);

    const loadData = async () => {
        const history = await getHistory();
        setAllHistory(history || []);

        const inProgress = (history || []).filter((item) => {
            if (!item.position || item.position <= 10) return false;
            if (item.duration && item.duration > 0) {
                return item.position < item.duration * 0.95;
            }
            return true;
        });
        setProgressItems(inProgress);
    };

    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', loadData);
        loadData();
        return unsubscribe;
    }, [navigation]);

    const handleResume = (item) => {
        navigation.navigate('Player', {
            id: item.id,
            type: item.type || 'movie',
            season: item.season,
            episode: item.episode,
            item,
            position: item.position,
        });
    };

    const handleDismissProgress = async (id, season, episode) => {
        const filtered = allHistory.filter((item) => {
            const isMatch =
                String(item.id) === String(id) &&
                String(item.season || 0) === String(season || 0) &&
                String(item.episode || 0) === String(episode || 0);
            return !isMatch;
        });
        await AsyncStorage.setItem('@user_watch_history', JSON.stringify(filtered));
        setAllHistory(filtered);
        setProgressItems(
            progressItems.filter(
                (i) =>
                    !(
                        String(i.id) === String(id) &&
                        String(i.season || 0) === String(season || 0) &&
                        String(i.episode || 0) === String(episode || 0)
                    )
            )
        );
    };

    const handleClearAll = async () => {
        await clearHistory();
        setAllHistory([]);
        setProgressItems([]);
    };

    const safeTopMargin = isTV ? 110 : Math.max(insets.top + 76, Platform.OS === 'ios' ? 120 : 100);

    const currentData = activeTab === 'progress' ? progressItems : allHistory;

    const renderItem = ({ item }) => {
        const duration = item.duration || 1;
        const position = item.position || 0;
        const percent = Math.min(100, Math.max(5, Math.round((position / duration) * 100)));
        const timeLeft = formatTimeRemaining(position, duration);
        const isShow = item.type === 'tv' || Boolean(item.season);

        return (
            <Pressable
                enablesNextFocusAppearance={true}
                style={styles.card}
                onPress={() => handleResume(item)}
            >
                {/* Poster with Progress Bar Overlay */}
                <View style={styles.posterContainer}>
                    <Image
                        source={{
                            uri: item.poster_path
                                ? `https://image.tmdb.org/t/p/w300${item.poster_path}`
                                : item.backdrop_path
                                ? `https://image.tmdb.org/t/p/w300${item.backdrop_path}`
                                : 'https://via.placeholder.com/300x450',
                        }}
                        style={styles.poster}
                    />

                    {activeTab === 'progress' && (
                        <View style={styles.thumbnailProgressBg}>
                            <View style={[styles.thumbnailProgressFill, { width: `${percent}%` }]} />
                        </View>
                    )}

                    <View style={styles.resumeOverlay}>
                        <View style={styles.playBadgeCircle}>
                            <Play color="#FFFFFF" size={14} fill="#FFFFFF" style={{ marginLeft: 2 }} />
                        </View>
                    </View>
                </View>

                {/* Details */}
                <View style={styles.info}>
                    <Text style={styles.title} numberOfLines={1}>
                        {item.title || item.name}
                    </Text>

                    {isShow && (
                        <View style={styles.episodeTag}>
                            <Text style={styles.episodeTagText} numberOfLines={1}>
                                Season {item.season} • Ep {item.episode}
                            </Text>
                        </View>
                    )}

                    {activeTab === 'progress' ? (
                        <>
                            <View style={styles.progressRow}>
                                <View style={styles.progressBarBg}>
                                    <LinearGradient
                                        colors={['#FF3B56', '#FF1E3C', '#B3001E']}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 0 }}
                                        style={[styles.progressBarFill, { width: `${percent}%` }]}
                                    />
                                </View>
                                <Text style={styles.percentText}>{percent}%</Text>
                            </View>

                            {Boolean(timeLeft) && (
                                <View style={styles.timeLeftRow}>
                                    <Clock size={12} color="#98A2B3" />
                                    <Text style={styles.timeLeftText}>{timeLeft}</Text>
                                </View>
                            )}
                        </>
                    ) : (
                        <View style={styles.timeLeftRow}>
                            <Clock size={12} color="#98A2B3" />
                            <Text style={styles.timeLeftText}>
                                {item.watchedAt ? new Date(item.watchedAt).toLocaleDateString() : 'Recently'}
                            </Text>
                        </View>
                    )}
                </View>

                {/* Dismiss */}
                <Pressable
                    style={styles.dismissBtn}
                    onPress={() => handleDismissProgress(item.id, item.season, item.episode)}
                    hitSlop={8}
                >
                    <Trash2 size={13} color="#98A2B3" />
                </Pressable>
            </Pressable>
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: '#08090C' }]}>
            <TopBar />

            {/* Header Title */}
            <View style={[styles.header, { marginTop: safeTopMargin }, isTV && styles.headerTV]}>
                <View style={styles.headerTitleRow}>
                    <View style={styles.titleAccent} />
                    <Text style={styles.headerTitle}>Playback Progress</Text>
                </View>

                {currentData.length > 0 && (
                    <Pressable onPress={handleClearAll} style={styles.clearBtnWrapper}>
                        <Trash2 size={14} color="#FF2442" />
                        <Text style={styles.clearBtnText}>Clear All</Text>
                    </Pressable>
                )}
            </View>

            {/* Filter Tabs */}
            <View style={[styles.tabBar, isTV && styles.tabBarTV]}>
                <Pressable
                    style={[styles.tabItem, activeTab === 'progress' && styles.tabItemActive]}
                    onPress={() => setActiveTab('progress')}
                >
                    <Text
                        style={[
                            styles.tabItemText,
                            activeTab === 'progress' && styles.tabItemTextActive,
                        ]}
                    >
                        In Progress ({progressItems.length})
                    </Text>
                </Pressable>
                <Pressable
                    style={[styles.tabItem, activeTab === 'history' && styles.tabItemActive]}
                    onPress={() => setActiveTab('history')}
                >
                    <Text
                        style={[
                            styles.tabItemText,
                            activeTab === 'history' && styles.tabItemTextActive,
                        ]}
                    >
                        Complete History ({allHistory.length})
                    </Text>
                </Pressable>
            </View>

            {/* Progress List */}
            <FlatList
                data={currentData}
                keyExtractor={(item, index) =>
                    `${item.id}-${item.season || 0}-${item.episode || 0}-${index}`
                }
                renderItem={renderItem}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <View style={styles.emptyIconCircle}>
                            <Film size={isTV ? 48 : 36} color="#FF2442" strokeWidth={1.8} />
                        </View>
                        <Text style={styles.emptyTitle}>
                            {activeTab === 'progress' ? 'No Videos in Progress' : 'No Watch History'}
                        </Text>
                        <Text style={styles.emptySubtitle}>
                            {activeTab === 'progress'
                                ? 'When you start streaming movies or series, your playback progress will show up here.'
                                : 'Your watched movies and shows will be listed here automatically.'}
                        </Text>
                    </View>
                }
                contentContainerStyle={[
                    styles.listContent,
                    isTV && styles.listContentTV,
                    { paddingBottom: 110 + insets.bottom },
                ]}
                numColumns={isTV ? 2 : 1}
                key={isTV ? 'tv-progress-grid' : 'mobile-progress-list'}
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
        marginBottom: 14,
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
    clearBtnText: {
        color: '#FF2442',
        fontSize: 11.5,
        fontWeight: '700',
    },
    tabBar: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        marginBottom: 16,
        gap: 8,
    },
    tabBarTV: {
        paddingLeft: 120,
    },
    tabItem: {
        paddingHorizontal: 14,
        paddingVertical: 7,
        borderRadius: 14,
        backgroundColor: '#12161F',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.08)',
    },
    tabItemActive: {
        backgroundColor: 'rgba(255, 36, 66, 0.18)',
        borderColor: '#FF2442',
    },
    tabItemText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#98A2B3',
    },
    tabItemTextActive: {
        color: '#FF2442',
        fontWeight: '800',
    },
    listContent: {
        paddingHorizontal: 18,
    },
    listContentTV: {
        paddingLeft: 120,
    },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 16,
        padding: 10,
        marginBottom: 12,
        backgroundColor: '#0F1217',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.06)',
    },
    posterContainer: {
        width: 64,
        height: 88,
        borderRadius: 10,
        overflow: 'hidden',
        position: 'relative',
        backgroundColor: '#151921',
    },
    poster: {
        width: '100%',
        height: '100%',
    },
    thumbnailProgressBg: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 3,
        backgroundColor: 'rgba(0,0,0,0.6)',
    },
    thumbnailProgressFill: {
        height: 3,
        backgroundColor: '#FF2442',
    },
    resumeOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.25)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    playBadgeCircle: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: '#FF2442',
        justifyContent: 'center',
        alignItems: 'center',
    },
    info: {
        flex: 1,
        marginLeft: 14,
        marginRight: 10,
    },
    title: {
        color: '#FFFFFF',
        fontSize: 13.5,
        fontWeight: '700',
        marginBottom: 3,
    },
    episodeTag: {
        backgroundColor: 'rgba(255, 36, 66, 0.12)',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 5,
        alignSelf: 'flex-start',
        marginBottom: 6,
    },
    episodeTagText: {
        color: '#FF2442',
        fontSize: 10,
        fontWeight: '700',
    },
    progressRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 4,
    },
    progressBarBg: {
        flex: 1,
        height: 4,
        borderRadius: 2,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        overflow: 'hidden',
    },
    progressBarFill: {
        height: 4,
        borderRadius: 2,
    },
    percentText: {
        color: '#FF2442',
        fontSize: 10.5,
        fontWeight: '800',
    },
    timeLeftRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    timeLeftText: {
        color: '#98A2B3',
        fontSize: 11,
    },
    dismissBtn: {
        padding: 8,
    },
    emptyContainer: {
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
