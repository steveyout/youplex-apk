import React, { useState, useEffect, useRef } from 'react';
import {
    StyleSheet,
    View,
    FlatList,
    Keyboard,
    TouchableWithoutFeedback,
    Platform,
    TextInput,
    Pressable,
} from 'react-native';
import { Text } from 'react-native-paper';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MovieCard } from '../components/MovieCard';
import { SearchGridSkeleton } from '../components/SkeletonLoader';
import { searchMulti, getTrendingMovies, IMAGE_PATH } from '../services/api';
import { Search, Sparkles, X, Delete, Flame } from 'lucide-react-native';
import { isTV } from '../utils/device';

const EXPLORE_TAGS = [
    'Sci-Fi',
    'Action',
    'Thriller',
    'Anime',
    'Marvel',
    'Comedy',
    'Horror',
];

const KEYBOARD_KEYS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'.split('');

function formatItems(list) {
    return (list || [])
        .filter(
            (item) =>
                (item.media_type === 'movie' || item.media_type === 'tv' || !item.media_type) &&
                item.poster_path
        )
        .map((item) => ({
            id: item.id,
            title: item.title || item.name,
            image: `${IMAGE_PATH}${item.poster_path}`,
            rating: item.vote_average ? item.vote_average.toFixed(1) : 'N/A',
            year: (item.release_date || item.first_air_date || '').split('-')[0],
            media_type: item.media_type || (item.first_air_date ? 'tv' : 'movie'),
        }));
}

export const SearchScreen = () => {
    const insets = useSafeAreaInsets();
    const [searchQuery, setSearchQuery] = useState('');
    const [results, setResults] = useState([]);
    const [defaultMovies, setDefaultMovies] = useState([]);
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [activeTag, setActiveTag] = useState(null);
    const searchInputRef = useRef(null);

    useEffect(() => {
        let mounted = true;
        getTrendingMovies()
            .then((movies) => {
                if (mounted) {
                    setDefaultMovies(formatItems(movies));
                }
            })
            .catch(() => {})
            .finally(() => {
                if (mounted) setInitialLoading(false);
            });
        return () => {
            mounted = false;
        };
    }, []);

    useEffect(() => {
        if (!searchQuery.trim()) {
            setResults([]);
            setLoading(false);
            return;
        }

        const delayDebounceFn = setTimeout(async () => {
            setLoading(true);
            try {
                const data = await searchMulti(searchQuery);
                if (data && data.results) {
                    setResults(formatItems(data.results));
                }
            } catch (error) {
                console.error('Search Error:', error);
            } finally {
                setLoading(false);
            }
        }, 380);

        return () => clearTimeout(delayDebounceFn);
    }, [searchQuery]);

    const handleSelectTag = (tag) => {
        setActiveTag(tag);
        setSearchQuery(tag);
    };

    const handleClear = () => {
        setSearchQuery('');
        setActiveTag(null);
        setResults([]);
    };

    const handleKeyPress = (char) => {
        setActiveTag(null);
        setSearchQuery((prev) => prev + char.toLowerCase());
    };

    const handleBackspace = () => {
        setActiveTag(null);
        setSearchQuery((prev) => prev.slice(0, -1));
    };

    const displayedData = searchQuery.trim() ? results : defaultMovies;
    const isShowingLoading = loading || (!searchQuery.trim() && initialLoading);

    const renderMobileEmptyState = () => {
        if (isShowingLoading) {
            return <SearchGridSkeleton />;
        }

        return (
            <View style={styles.emptyContainer}>
                <View style={styles.emptyContent}>
                    <View style={styles.emptyIconCircle}>
                        <Sparkles size={36} color="#FF2442" />
                    </View>
                    <Text style={styles.emptyTitle}>
                        {searchQuery.length > 0
                            ? `No results found for "${searchQuery}"`
                            : 'AI Cinematic Discovery'}
                    </Text>
                    <Text style={styles.emptySubtitle}>
                        Search across millions of movies, TV shows, actors, or explore tags below.
                    </Text>

                    <View style={styles.tagsContainer}>
                        {EXPLORE_TAGS.map((tag) => (
                            <Pressable
                                key={tag}
                                focusable={true}
                                onPress={() => handleSelectTag(tag)}
                                style={({ focused }) => [
                                    styles.tagPill,
                                    activeTag === tag && styles.tagPillActive,
                                    focused && styles.tagPillFocused,
                                ]}
                            >
                                <Text style={styles.tagPillText}>{tag}</Text>
                            </Pressable>
                        ))}
                    </View>
                </View>
            </View>
        );
    };

    if (isTV) {
        return (
            <View style={styles.tvContainer}>
                {/* LEFT COLUMN: Glassmorphic On-Screen TV Keyboard & Quick Tags */}
                <View style={styles.tvLeftCol}>
                    <View style={styles.keyboardGlassPanel}>
                        <BlurView intensity={42} tint="dark" style={styles.keyboardBlur}>
                            {/* Top Action Row */}
                            <View style={styles.kbActionRow}>
                                <Pressable
                                    focusable={true}
                                    onPress={() => handleKeyPress(' ')}
                                    style={({ focused }) => [
                                        styles.kbActionBtn,
                                        { flex: 1.2 },
                                        focused && styles.kbKeyFocused,
                                    ]}
                                >
                                    <Text style={styles.kbActionText}>SPACE</Text>
                                </Pressable>

                                <Pressable
                                    focusable={true}
                                    onPress={handleBackspace}
                                    style={({ focused }) => [
                                        styles.kbActionBtn,
                                        focused && styles.kbKeyFocused,
                                    ]}
                                >
                                    <Delete color="#FFFFFF" size={14} />
                                    <Text style={styles.kbActionText}>DEL</Text>
                                </Pressable>

                                <Pressable
                                    focusable={true}
                                    onPress={handleClear}
                                    style={({ focused }) => [
                                        styles.kbActionBtn,
                                        styles.kbClearBtn,
                                        focused && styles.kbKeyFocused,
                                    ]}
                                >
                                    <Text style={[styles.kbActionText, { color: '#FF2442' }]}>
                                        CLEAR
                                    </Text>
                                </Pressable>
                            </View>

                            {/* 6-Column Alphanumeric Key Grid */}
                            <View style={styles.kbGrid}>
                                {KEYBOARD_KEYS.map((char) => (
                                    <Pressable
                                        key={`kb-${char}`}
                                        focusable={true}
                                        hasTVPreferredFocus={char === 'A'}
                                        onPress={() => handleKeyPress(char)}
                                        style={({ focused }) => [
                                            styles.kbKey,
                                            focused && styles.kbKeyFocused,
                                        ]}
                                    >
                                        {({ focused }) => (
                                            <Text
                                                style={[
                                                    styles.kbKeyText,
                                                    focused && { color: '#FFFFFF', fontWeight: '900' },
                                                ]}
                                            >
                                                {char}
                                            </Text>
                                        )}
                                    </Pressable>
                                ))}
                            </View>

                            {/* Quick Explore Glass Genre Tags */}
                            <Text style={styles.kbTagsLabel}>QUICK GENRES</Text>
                            <View style={styles.kbTagsWrap}>
                                {EXPLORE_TAGS.map((tag) => {
                                    const isActive = activeTag === tag;
                                    return (
                                        <Pressable
                                            key={`tv-tag-${tag}`}
                                            focusable={true}
                                            onPress={() => handleSelectTag(tag)}
                                            style={({ focused }) => [
                                                styles.kbTagPill,
                                                isActive && styles.tagPillActive,
                                                focused && styles.tagPillFocused,
                                            ]}
                                        >
                                            <Text
                                                style={[
                                                    styles.kbTagText,
                                                    isActive && { color: '#FFFFFF', fontWeight: '800' },
                                                ]}
                                            >
                                                {tag}
                                            </Text>
                                        </Pressable>
                                    );
                                })}
                            </View>
                        </BlurView>
                    </View>
                </View>

                {/* RIGHT COLUMN: Glass Search Input Bar + 4-Column Results Grid */}
                <View style={styles.tvRightCol}>
                    {/* Frosted Glass Search Pill */}
                    <View style={styles.tvSearchBarOuter}>
                        <BlurView intensity={48} tint="dark" style={styles.tvSearchBarBlur}>
                            <Search color="rgba(255,255,255,0.85)" size={18} style={styles.searchIcon} />
                            <TextInput
                                ref={searchInputRef}
                                style={styles.searchInput}
                                placeholder="Type with remote keyboard or hardware keyboard..."
                                placeholderTextColor="rgba(255, 255, 255, 0.55)"
                                value={searchQuery}
                                onChangeText={(txt) => {
                                    setActiveTag(null);
                                    setSearchQuery(txt);
                                }}
                                returnKeyType="search"
                            />
                            {Boolean(searchQuery) && (
                                <Pressable
                                    focusable={true}
                                    onPress={handleClear}
                                    style={({ focused }) => [
                                        styles.clearBtn,
                                        focused && styles.btnFocused,
                                    ]}
                                >
                                    <X color="#FFFFFF" size={16} />
                                </Pressable>
                            )}
                        </BlurView>
                    </View>

                    {/* Section Header */}
                    <View style={styles.tvSectionHeader}>
                        <View style={styles.tvSectionTitleRow}>
                            {searchQuery.trim() ? (
                                <Sparkles color="#FF2442" size={16} />
                            ) : (
                                <Flame color="#FF2442" size={16} />
                            )}
                            <Text style={styles.tvSectionTitle}>
                                {searchQuery.trim()
                                    ? `Search Results for "${searchQuery}"`
                                    : 'Trending & Popular Searches'}
                            </Text>
                        </View>
                        {!isShowingLoading && (
                            <View style={styles.countBadge}>
                                <Text style={styles.countBadgeText}>{displayedData.length} titles</Text>
                            </View>
                        )}
                    </View>

                    {/* Results / Skeleton / Empty */}
                    {isShowingLoading ? (
                        <SearchGridSkeleton />
                    ) : displayedData.length === 0 ? (
                        <View style={styles.tvEmptyBox}>
                            <Sparkles size={32} color="#FF2442" />
                            <Text style={styles.emptyTitle}>
                                No results found for "{searchQuery}"
                            </Text>
                            <Text style={styles.emptySubtitle}>
                                Try another title or pick a quick genre tag on the left.
                            </Text>
                        </View>
                    ) : (
                        <FlatList
                            data={displayedData}
                            key="tv-search-4col"
                            keyExtractor={(item, idx) => `search-${item.id}-${idx}`}
                            numColumns={4}
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={styles.tvGridContent}
                            renderItem={({ item }) => (
                                <MovieCard
                                    item={item}
                                    isGrid={true}
                                    showMatch={true}
                                    customWidth={122}
                                />
                            )}
                        />
                    )}
                </View>
            </View>
        );
    }

    return (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.container}>
                {/* Search Bar Header */}
                <View
                    style={[
                        styles.headerContainer,
                        { paddingTop: Math.max(insets.top + 10, Platform.OS === 'ios' ? 52 : 38) },
                    ]}
                >
                    <View style={styles.searchBarWrapper}>
                        <Search color="#98A2B3" size={18} style={styles.searchIcon} />
                        <TextInput
                            ref={searchInputRef}
                            style={styles.searchInput}
                            placeholder="Search titles, actors, genres..."
                            placeholderTextColor="#667085"
                            value={searchQuery}
                            onChangeText={(txt) => {
                                setActiveTag(null);
                                setSearchQuery(txt);
                            }}
                            returnKeyType="search"
                        />
                        {Boolean(searchQuery) && (
                            <Pressable
                                focusable={true}
                                onPress={handleClear}
                                style={({ focused }) => [styles.clearBtn, focused && styles.btnFocused]}
                            >
                                <X color="#98A2B3" size={16} />
                            </Pressable>
                        )}
                    </View>
                </View>

                {/* Results Grid */}
                {isShowingLoading ? (
                    <View style={{ paddingHorizontal: 16 }}>
                        <SearchGridSkeleton />
                    </View>
                ) : (
                    <FlatList
                        data={displayedData}
                        key="mobile-search-3col"
                        keyExtractor={(item, idx) => `search-${item.id}-${idx}`}
                        numColumns={3}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={[
                            styles.listContent,
                            { paddingBottom: 110 + insets.bottom },
                        ]}
                        ListEmptyComponent={renderMobileEmptyState}
                        renderItem={({ item }) => (
                            <MovieCard item={item} isGrid={true} showMatch={true} />
                        )}
                    />
                )}
            </View>
        </TouchableWithoutFeedback>
    );
};

const styles = StyleSheet.create({
    tvContainer: {
        flex: 1,
        backgroundColor: '#08090C',
        paddingLeft: 88,
        paddingTop: 24,
        paddingRight: 28,
        flexDirection: 'row',
        gap: 24,
    },
    tvLeftCol: {
        width: 268,
    },
    keyboardGlassPanel: {
        borderRadius: 22,
        overflow: 'hidden',
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.16)',
    },
    keyboardBlur: {
        padding: 14,
    },
    kbActionRow: {
        flexDirection: 'row',
        gap: 6,
        marginBottom: 10,
    },
    kbActionBtn: {
        flex: 1,
        height: 32,
        borderRadius: 10,
        backgroundColor: 'rgba(255, 255, 255, 0.10)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.16)',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
    },
    kbClearBtn: {
        backgroundColor: 'rgba(255, 36, 66, 0.16)',
        borderColor: 'rgba(255, 36, 66, 0.4)',
    },
    kbActionText: {
        color: '#FFFFFF',
        fontSize: 10.5,
        fontWeight: '800',
        letterSpacing: 0.4,
    },
    kbGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
    },
    kbKey: {
        width: 34,
        height: 30,
        borderRadius: 8,
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.14)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    kbKeyFocused: {
        backgroundColor: '#FF2442',
        borderColor: '#FFFFFF',
        borderWidth: 1.8,
        transform: [{ scale: 1.1 }],
        shadowColor: '#FF2442',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.85,
        shadowRadius: 8,
        elevation: 6,
    },
    kbKeyText: {
        color: '#EAECF0',
        fontSize: 12.5,
        fontWeight: '700',
    },
    kbTagsLabel: {
        color: 'rgba(255, 255, 255, 0.55)',
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 0.8,
        marginTop: 12,
        marginBottom: 8,
    },
    kbTagsWrap: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
    },
    kbTagPill: {
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.14)',
    },
    kbTagText: {
        color: '#D0D5DD',
        fontSize: 11,
        fontWeight: '600',
    },
    tvRightCol: {
        flex: 1,
    },
    tvSearchBarOuter: {
        height: 46,
        borderRadius: 23,
        overflow: 'hidden',
        backgroundColor: 'rgba(255, 255, 255, 0.10)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.22)',
        marginBottom: 16,
    },
    tvSearchBarBlur: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
    },
    tvSectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    tvSectionTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    tvSectionTitle: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '800',
        letterSpacing: 0.2,
    },
    countBadge: {
        backgroundColor: 'rgba(255, 36, 66, 0.18)',
        borderWidth: 1,
        borderColor: 'rgba(255, 36, 66, 0.4)',
        paddingHorizontal: 10,
        paddingVertical: 3,
        borderRadius: 12,
    },
    countBadgeText: {
        color: '#FF2442',
        fontSize: 11,
        fontWeight: '800',
    },
    tvGridContent: {
        paddingBottom: 40,
        paddingTop: 4,
    },
    tvEmptyBox: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingBottom: 60,
        gap: 10,
    },
    tagPillActive: {
        backgroundColor: 'rgba(255, 36, 66, 0.35)',
        borderColor: '#FF2442',
    },
    tagPillFocused: {
        borderColor: '#FFFFFF',
        borderWidth: 1.5,
        backgroundColor: '#FF2442',
        transform: [{ scale: 1.06 }],
    },
    btnFocused: {
        borderColor: '#FFFFFF',
        borderWidth: 1.5,
        backgroundColor: '#FF2442',
        borderRadius: 14,
    },
    container: {
        flex: 1,
        backgroundColor: '#08090C',
    },
    headerContainer: {
        paddingHorizontal: 18,
        paddingBottom: 14,
        backgroundColor: '#08090C',
    },
    searchBarWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#12161F',
        borderRadius: 18,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.08)',
        paddingHorizontal: 14,
        paddingVertical: Platform.OS === 'ios' ? 12 : 8,
    },
    searchIcon: {
        marginRight: 10,
    },
    searchInput: {
        flex: 1,
        color: '#FFFFFF',
        fontSize: 14.5,
        fontWeight: '500',
    },
    clearBtn: {
        padding: 6,
    },
    listContent: {
        paddingHorizontal: 16,
        paddingTop: 10,
        flexGrow: 1,
    },
    emptyContainer: {
        flex: 1,
        paddingTop: 60,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 24,
    },
    emptyContent: {
        alignItems: 'center',
    },
    emptyIconCircle: {
        width: 64,
        height: 64,
        borderRadius: 32,
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
        textAlign: 'center',
        marginBottom: 8,
    },
    emptySubtitle: {
        color: '#98A2B3',
        fontSize: 13,
        textAlign: 'center',
        lineHeight: 18,
        marginBottom: 24,
    },
    tagsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: 8,
    },
    tagPill: {
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 16,
        backgroundColor: '#141821',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.08)',
    },
    tagPillText: {
        color: '#D0D5DD',
        fontSize: 12,
        fontWeight: '600',
    },
});
