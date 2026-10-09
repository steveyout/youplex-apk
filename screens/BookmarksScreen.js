import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    FlatList,
    StyleSheet,
    Pressable,
    Platform,
    Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Bookmark, Film, Trash2, Clapperboard, Compass } from 'lucide-react-native';
import { useAppTheme } from '../theme/ThemeContext';
import { TopBar } from '../components/TopBar';
import { MovieCard } from '../components/MovieCard';
import { getBookmarks, removeBookmark, clearBookmarks } from '../services/bookmarksService';
import { isTV } from '../utils/device';

const { width } = Dimensions.get('window');

export const BookmarksScreen = () => {
    const { theme, isDarkMode } = useAppTheme();
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();

    const [bookmarks, setBookmarks] = useState([]);
    const [filter, setFilter] = useState('all'); // 'all', 'movie', 'tv'

    const TV_LEFT_OFFSET = 100;

    const loadData = async () => {
        const list = await getBookmarks();
        setBookmarks(list);
    };

    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', loadData);
        loadData();
        return unsubscribe;
    }, [navigation]);

    const handleRemove = async (id) => {
        const updated = await removeBookmark(id);
        setBookmarks(updated);
    };

    const handleClearAll = async () => {
        await clearBookmarks();
        setBookmarks([]);
    };

    const filtered = bookmarks.filter((item) => {
        if (filter === 'movie') return item.media_type !== 'tv';
        if (filter === 'tv') return item.media_type === 'tv';
        return true;
    });

    const numColumns = isTV ? 5 : 3;
    const safeTopMargin = isTV ? 130 : Math.max(insets.top + 92, Platform.OS === 'ios' ? 140 : 128);

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <TopBar />

            {/* Header Area placed safely beneath TopBar */}
            <View style={[styles.header, { marginTop: safeTopMargin }, isTV && styles.headerTV]}>
                <View style={styles.headerTitleRow}>
                    <View style={styles.titleAccent} />
                    <Text style={[styles.headerTitle, { color: theme.colors.onBackground }]}>
                        My List
                    </Text>
                    <View style={styles.badge}>
                        <Text style={styles.badgeText}>{bookmarks.length}</Text>
                    </View>
                </View>

                {bookmarks.length > 0 && (
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

            {/* Filter Tabs */}
            {bookmarks.length > 0 && (
                <View style={[styles.filterRow, isTV && styles.filterRowTV]}>
                    {[
                        { key: 'all', label: 'All Saved' },
                        { key: 'movie', label: 'Movies' },
                        { key: 'tv', label: 'TV Shows' },
                    ].map((tab) => {
                        const isActive = filter === tab.key;
                        return (
                            <Pressable
                                key={tab.key}
                                onPress={() => setFilter(tab.key)}
                                style={[
                                    styles.filterTab,
                                    isActive && styles.filterTabActive,
                                    { borderColor: isActive ? '#FF3030' : theme.colors.outlineVariant },
                                ]}
                            >
                                <Text
                                    style={[
                                        styles.filterTabText,
                                        isActive && styles.filterTabTextActive,
                                        { color: isActive ? '#FFFFFF' : (isDarkMode ? '#8A99A8' : '#6B7280') },
                                    ]}
                                >
                                    {tab.label}
                                </Text>
                            </Pressable>
                        );
                    })}
                </View>
            )}

            {/* Grid of Bookmarked Titles */}
            <FlatList
                data={filtered}
                keyExtractor={(item) => `bm-${item.id}`}
                key={isTV ? 'tv-bm-grid' : 'mobile-bm-grid'}
                numColumns={numColumns}
                renderItem={({ item }) => (
                    <View style={styles.cardContainer}>
                        <MovieCard item={item} isGrid={true} />
                        <Pressable
                            onPress={() => handleRemove(item.id)}
                            style={styles.deleteBadge}
                            hitSlop={8}
                        >
                            <Trash2 size={12} color="#FFFFFF" />
                        </Pressable>
                    </View>
                )}
                contentContainerStyle={[
                    styles.listContent,
                    isTV && styles.listContentTV,
                    { paddingBottom: 150 + insets.bottom },
                ]}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                    <View style={[styles.emptyContainer, isTV && { marginLeft: -TV_LEFT_OFFSET }]}>
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
                            <Bookmark size={isTV ? 64 : 44} color="#FF3030" strokeWidth={1.8} />
                        </View>
                        <Text
                            style={[
                                styles.emptyTitle,
                                { color: isDarkMode ? '#FFFFFF' : '#111827' },
                            ]}
                        >
                            Your Watchlist is Empty
                        </Text>
                        <Text style={styles.emptySubtitle}>
                            Save movies and shows you want to watch later by tapping "+ My List" on any title.
                        </Text>
                        <Pressable
                            style={styles.exploreBtn}
                            onPress={() => navigation.navigate('Home')}
                        >
                            <Compass size={18} color="#FFFFFF" />
                            <Text style={styles.exploreBtnText}>Browse Trending</Text>
                        </Pressable>
                    </View>
                }
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
        fontSize: isTV ? 32 : 24,
        fontWeight: '900',
    },
    badge: {
        backgroundColor: '#FF3030',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 10,
    },
    badgeText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '800',
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
    filterRow: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        marginBottom: 16,
        gap: 8,
    },
    filterRowTV: {
        paddingLeft: 120,
        paddingRight: 60,
    },
    filterTab: {
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderRadius: 18,
        borderWidth: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.04)',
    },
    filterTabActive: {
        backgroundColor: '#FF3030',
        borderColor: '#FF3030',
    },
    filterTabText: {
        fontSize: 12,
        fontWeight: '700',
    },
    filterTabTextActive: {
        fontWeight: '900',
    },
    listContent: {
        paddingHorizontal: 16,
    },
    listContentTV: {
        paddingLeft: 120,
        paddingRight: 60,
    },
    cardContainer: {
        position: 'relative',
    },
    deleteBadge: {
        position: 'absolute',
        top: 6,
        right: 14,
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: 'rgba(239, 68, 68, 0.9)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 80,
        paddingHorizontal: 24,
    },
    emptyIconCircle: {
        width: 88,
        height: 88,
        borderRadius: 44,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1.5,
        marginBottom: 18,
    },
    emptyTitle: {
        fontSize: 22,
        fontWeight: '900',
        marginBottom: 8,
        textAlign: 'center',
    },
    emptySubtitle: {
        color: '#8A99A8',
        fontSize: 14,
        textAlign: 'center',
        lineHeight: 20,
        maxWidth: 320,
        marginBottom: 24,
    },
    exploreBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FF3030',
        paddingHorizontal: 22,
        paddingVertical: 12,
        borderRadius: 24,
        gap: 8,
    },
    exploreBtnText: {
        color: '#FFFFFF',
        fontWeight: '800',
        fontSize: 14,
    },
    tvFocusBorder: {
        borderWidth: 2,
        borderColor: '#FF3030',
        transform: [{ scale: 1.05 }],
    },
});
