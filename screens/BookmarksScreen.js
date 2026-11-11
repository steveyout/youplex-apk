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
import { Bookmark, Trash2, Compass } from 'lucide-react-native';
import { useAppTheme } from '../theme/ThemeContext';
import { TopBar } from '../components/TopBar';
import { MovieCard } from '../components/MovieCard';
import { getBookmarks, removeBookmark, clearBookmarks } from '../services/bookmarksService';
import { isTV } from '../utils/device';

const { width } = Dimensions.get('window');

export const BookmarksScreen = () => {
    const { theme } = useAppTheme();
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();

    const [bookmarks, setBookmarks] = useState([]);
    const [filter, setFilter] = useState('all');

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
    const safeTopMargin = isTV ? 110 : Math.max(insets.top + 76, Platform.OS === 'ios' ? 120 : 100);

    return (
        <View style={[styles.container, { backgroundColor: '#08090C' }]}>
            <TopBar />

            {/* Header Area */}
            <View style={[styles.header, { marginTop: safeTopMargin }, isTV && styles.headerTV]}>
                <View style={styles.headerTitleRow}>
                    <View style={styles.titleAccent} />
                    <Text style={styles.headerTitle}>Watchlist</Text>
                    <View style={styles.badge}>
                        <Text style={styles.badgeText}>{bookmarks.length}</Text>
                    </View>
                </View>

                {bookmarks.length > 0 && (
                    <Pressable onPress={handleClearAll} style={styles.clearBtnWrapper}>
                        <Trash2 size={14} color="#FF2442" />
                        <Text style={styles.clearBtnText}>Clear All</Text>
                    </Pressable>
                )}
            </View>

            {/* Filter Tabs */}
            {bookmarks.length > 0 && (
                <View style={[styles.filterRow, isTV && styles.filterRowTV]}>
                    {[
                        { key: 'all', label: 'All Saved' },
                        { key: 'movie', label: 'Movies' },
                        { key: 'tv', label: 'TV Series' },
                    ].map((tab) => {
                        const isActive = filter === tab.key;
                        return (
                            <Pressable
                                key={tab.key}
                                onPress={() => setFilter(tab.key)}
                                style={[
                                    styles.filterTab,
                                    isActive && styles.filterTabActive,
                                ]}
                            >
                                <Text
                                    style={[
                                        styles.filterTabText,
                                        isActive && styles.filterTabTextActive,
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
                            <Trash2 size={11} color="#FFFFFF" />
                        </Pressable>
                    </View>
                )}
                contentContainerStyle={[
                    styles.listContent,
                    isTV && styles.listContentTV,
                    { paddingBottom: 110 + insets.bottom },
                ]}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                    <View style={[styles.emptyContainer, isTV && { marginLeft: -TV_LEFT_OFFSET }]}>
                        <View style={styles.emptyIconCircle}>
                            <Bookmark size={isTV ? 48 : 36} color="#FF2442" strokeWidth={1.8} />
                        </View>
                        <Text style={styles.emptyTitle}>Your Watchlist is Empty</Text>
                        <Text style={styles.emptySubtitle}>
                            Save movies and shows you want to watch later by tapping "+ Watchlist" on any title.
                        </Text>
                        <Pressable
                            style={styles.exploreBtn}
                            onPress={() => navigation.navigate('Home')}
                        >
                            <Compass size={17} color="#FFFFFF" />
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
        paddingHorizontal: 18,
        marginBottom: 12,
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
        letterSpacing: 0.3,
        color: '#FFFFFF',
    },
    badge: {
        backgroundColor: 'rgba(255, 36, 66, 0.16)',
        borderWidth: 1,
        borderColor: 'rgba(255, 36, 66, 0.35)',
        paddingHorizontal: 7,
        paddingVertical: 2,
        borderRadius: 10,
    },
    badgeText: {
        color: '#FF2442',
        fontSize: 11,
        fontWeight: '800',
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
    filterRow: {
        flexDirection: 'row',
        paddingHorizontal: 18,
        gap: 8,
        marginBottom: 14,
    },
    filterRowTV: {
        paddingLeft: 120,
    },
    filterTab: {
        paddingHorizontal: 14,
        paddingVertical: 7,
        borderRadius: 14,
        backgroundColor: '#12161F',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.08)',
    },
    filterTabActive: {
        backgroundColor: 'rgba(255, 36, 66, 0.18)',
        borderColor: '#FF2442',
    },
    filterTabText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#98A2B3',
    },
    filterTabTextActive: {
        color: '#FF2442',
        fontWeight: '800',
    },
    listContent: {
        paddingHorizontal: 16,
    },
    listContentTV: {
        paddingLeft: 120,
    },
    cardContainer: {
        position: 'relative',
    },
    deleteBadge: {
        position: 'absolute',
        top: 6,
        right: 14,
        backgroundColor: 'rgba(255, 36, 66, 0.85)',
        width: 22,
        height: 22,
        borderRadius: 11,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 5,
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
        marginBottom: 24,
    },
    exploreBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FF2442',
        paddingHorizontal: 18,
        paddingVertical: 11,
        borderRadius: 20,
        gap: 8,
    },
    exploreBtnText: {
        color: '#FFFFFF',
        fontSize: 13,
        fontWeight: '800',
    },
});
