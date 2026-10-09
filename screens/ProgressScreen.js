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
import { Play, Clock, Sparkles, Film, Trash2, CheckCircle2 } from 'lucide-react-native';
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
    const { theme, isDarkMode } = useAppTheme();
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();

    const [activeTab, setActiveTab] = useState('progress'); // 'progress' | 'history'
    const [allHistory, setAllHistory] = useState([]);
    const [progressItems, setProgressItems] = useState([]);

    const loadData = async () => {
        const history = await getHistory();
        setAllHistory(history || []);

        // Filter items with active progress (> 10 seconds and < 95% finished)
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
            const isMatch = String(item.id) === String(id) &&
                String(item.season || 0) === String(season || 0) &&
                String(item.episode || 0) === String(episode || 0);
            return !isMatch;
        });
        await AsyncStorage.setItem('@user_watch_history', JSON.stringify(filtered));
        setAllHistory(filtered);
        setProgressItems(progressItems.filter((i) => !(
            String(i.id) === String(id) &&
            String(i.season || 0) === String(season || 0) &&
            String(i.episode || 0) === String(episode || 0)
        )));
    };

    const handleClearAll = async () => {
        await clearHistory();
        setAllHistory([]);
        setProgressItems([]);
    };

    const safeTopMargin = isTV ? 130 : Math.max(insets.top + 92, Platform.OS === 'ios' ? 140 : 128);

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
                style={({ focused }) => [
                    styles.card,
                    {
                        backgroundColor: theme.colors.cardBg,
                        borderColor: theme.colors.cardBorder,
                    },
                    focused && styles.tvFocusBorder,
                ]}
                onPress={() => handleResume(item)}
            >
                {/* Poster with Progress Bar Overlay */}
                <View style={styles.posterContainer}>
                    <Image
                        source={{
                            uri: item.poster_path
                                ? `https://image.tmdb.org/t/p/w300${item.poster_path}`
                                : (item.backdrop_path ? `https://image.tmdb.org/t/p/w300${item.backdrop_path}` : 'https://via.placeholder.com/300x450'),
                        }}
                        style={styles.poster}
                    />

                    {/* Progress Bar along bottom of thumbnail */}
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
                        <View style={styles.episodeTag}>
                            <Text style={styles.episodeTagText} numberOfLines={1}>
                                Season {item.season} • Ep {item.episode}
                            </Text>
                        </View>
                    )}

                    {activeTab === 'progress' ? (
                        <>
                            {/* Progress percentage & time left */}
                            <View style={styles.progressRow}>
                                <View style={styles.progressBarBg}>
                                    <LinearGradient
                                        colors={['#FF4565', '#FF3030']}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 0 }}
                                        style={[styles.progressBarFill, { width: `${percent}%` }]}
                                    />
                                </View>
                                <Text style={styles.percentText}>{percent}%</Text>
                            </View>

                            {Boolean(timeLeft) && (
                                <View style={styles.timeLeftRow}>
                                    <Clock size={12} color="#8A99A8" />
                                    <Text style={styles.timeLeftText}>{timeLeft}</Text>
                                </View>
                            )}
                        </>
                    ) : (
                        <View style={styles.timeLeftRow}>
                            <Clock size={12} color="#8A99A8" />
                            <Text style={styles.timeLeftText}>
                                {item.watchedAt ? new Date(item.watchedAt).toLocaleDateString() : 'Recently'}
                            </Text>
                        </View>
                    )}
                </View>

                {/* Resume Action & Dismiss */}
                <View style={styles.rightActions}>
                    <View style={styles.resumeBtn}>
                        <LinearGradient
                            colors={['#FF4565', '#FF3030', '#B71833']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.resumeBtnGrad}
                        >
                            <Play size={12} color="#FFFFFF" fill="#FFFFFF" />
                            <Text style={styles.resumeBtnText}>
                                {activeTab === 'progress' ? 'Resume' : 'Replay'}
                            </Text>
                        </LinearGradient>
                    </View>

                    <Pressable
                        onPress={() => handleDismissProgress(item.id, item.season, item.episode)}
                        style={styles.dismissBtn}
                        hitSlop={6}
                    >
                        <Trash2 size={14} color="#8A99A8" />
                    </Pressable>
                </View>
            </Pressable>
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <TopBar />

            {/* Header safely below TopBar */}
            <View style={[styles.header, { marginTop: safeTopMargin }, isTV && styles.headerTV]}>
                <View style={styles.headerTitleRow}>
                    <View style={styles.titleAccent} />
                    <Text style={[styles.headerTitle, { color: theme.colors.onBackground }]}>
                        Activity & Progress
                    </Text>
                </View>

                {currentData.length > 0 && (
                    <Pressable
                        onPress={handleClearAll}
                        style={({ focused }) => [
                            styles.clearBtnWrapper,
                            focused && styles.tvFocusBorder,
                        ]}
                    >
                        <Trash2 size={isTV ? 20 : 15} color="#FF5252" />
                        <Text style={[styles.clearBtnText, isTV && { fontSize: 16 }]}>Clear</Text>
                    </Pressable>
                )}
            </View>

            {/* Segmented Switch: [Continue Watching] | [Full History] */}
            <View style={[styles.tabBar, isTV && styles.tabBarTV]}>
                <Pressable
                    onPress={() => setActiveTab('progress')}
                    style={[
                        styles.tabItem,
                        activeTab === 'progress' && styles.tabItemActive,
                    ]}
                >
                    <Text
                        style={[
                            styles.tabItemText,
                            activeTab === 'progress' && styles.tabItemTextActive,
                            { color: activeTab === 'progress' ? '#FFFFFF' : (isDarkMode ? '#8A99A8' : '#6B7280') }
                        ]}
                    >
                        Continue Watching ({progressItems.length})
                    </Text>
                </Pressable>

                <Pressable
                    onPress={() => setActiveTab('history')}
                    style={[
                        styles.tabItem,
                        activeTab === 'history' && styles.tabItemActive,
                    ]}
                >
                    <Text
                        style={[
                            styles.tabItemText,
                            activeTab === 'history' && styles.tabItemTextActive,
                            { color: activeTab === 'history' ? '#FFFFFF' : (isDarkMode ? '#8A99A8' : '#6B7280') }
                        ]}
                    >
                        Watch History ({allHistory.length})
                    </Text>
                </Pressable>
            </View>

            <FlatList
                data={currentData}
                keyExtractor={(item, index) => `${item.id}-${item.season || 0}-${item.episode || 0}-${index}`}
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
                                        ? 'rgba(255, 48, 48, 0.3)'
                                        : 'rgba(255, 48, 48, 0.2)',
                                },
                            ]}
                        >
                            <Film size={isTV ? 56 : 42} color="#FF3030" strokeWidth={1.8} />
                        </View>
                        <Text style={[styles.emptyTitle, { color: isDarkMode ? '#FFFFFF' : '#111827' }]}>
                            {activeTab === 'progress' ? 'No Videos in Progress' : 'No Watch History'}
                        </Text>
                        <Text style={styles.emptySubtitle}>
                            {activeTab === 'progress'
                                ? 'When you start streaming movies or series, your playback progress will show up here so you can pick up where you left off.'
                                : 'Your watched movies and shows will be listed here automatically.'}
                        </Text>
                    </View>
                }
                contentContainerStyle={[
                    styles.listContent,
                    isTV && styles.listContentTV,
                    { paddingBottom: 150 + insets.bottom },
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
        paddingRight: 60,
    },
    headerTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    titleAccent: {
        width: 4,
        height: 24,
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
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        backgroundColor: 'rgba(255, 82, 82, 0.12)',
        borderWidth: 1,
        borderColor: 'rgba(255, 82, 82, 0.3)',
    },
    clearBtnText: {
        color: '#FF5252',
        fontWeight: '700',
        fontSize: 12,
    },
    tabBar: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        marginBottom: 16,
        gap: 8,
    },
    tabBarTV: {
        paddingLeft: 120,
        paddingRight: 60,
    },
    tabItem: {
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        backgroundColor: 'rgba(255, 255, 255, 0.04)',
    },
    tabItemActive: {
        backgroundColor: '#FF3030',
        borderColor: '#FF3030',
    },
    tabItemText: {
        fontSize: 12,
        fontWeight: '700',
    },
    tabItemTextActive: {
        fontWeight: '900',
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
        borderRadius: 18,
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
    posterContainer: {
        width: 64,
        height: 92,
        borderRadius: 12,
        overflow: 'hidden',
        position: 'relative',
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
        height: 4,
        backgroundColor: 'rgba(0,0,0,0.6)',
    },
    thumbnailProgressFill: {
        height: '100%',
        backgroundColor: '#FF3030',
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
        backgroundColor: 'rgba(255, 48, 48, 0.9)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    info: {
        flex: 1,
        marginLeft: 14,
        justifyContent: 'center',
    },
    title: {
        fontSize: isTV ? 18 : 15,
        fontWeight: '800',
        marginBottom: 4,
    },
    episodeTag: {
        alignSelf: 'flex-start',
        backgroundColor: 'rgba(255, 48, 48, 0.16)',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
        marginBottom: 6,
    },
    episodeTagText: {
        color: '#FF4D4D',
        fontSize: 11,
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
        height: 5,
        borderRadius: 3,
        backgroundColor: 'rgba(255, 255, 255, 0.12)',
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        borderRadius: 3,
    },
    percentText: {
        color: '#8A99A8',
        fontSize: 11,
        fontWeight: '700',
        width: 32,
    },
    timeLeftRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    timeLeftText: {
        color: '#8A99A8',
        fontSize: 11,
        fontWeight: '600',
    },
    rightActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginLeft: 10,
    },
    resumeBtn: {
        borderRadius: 16,
        overflow: 'hidden',
    },
    resumeBtnGrad: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 16,
        gap: 4,
    },
    resumeBtnText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '800',
    },
    dismissBtn: {
        padding: 6,
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
        maxWidth: 320,
    },
    tvFocusBorder: {
        borderWidth: 2,
        borderColor: '#FF3030',
        transform: [{ scale: 1.02 }],
    },
});
