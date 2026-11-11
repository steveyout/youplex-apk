import React, { useState, useEffect, useRef } from 'react';
import {
    StyleSheet,
    View,
    FlatList,
    ActivityIndicator,
    Keyboard,
    TouchableWithoutFeedback,
    Platform,
    Dimensions,
    TextInput,
    Pressable,
    ScrollView,
} from 'react-native';
import { Text } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../theme/ThemeContext';
import { MovieCard } from '../components/MovieCard';
import { searchMulti, getTrendingMovies, IMAGE_PATH } from '../services/api';
import { Search, Sparkles, X, Flame } from 'lucide-react-native';
import { isTV } from '../utils/device';

const { width } = Dimensions.get('window');

const EXPLORE_TAGS = [
    'Sci-Fi',
    'Action',
    'Cyberpunk',
    'Psychological',
    'Anime',
    'Marvel',
    'Crime Noir',
    'Comedy',
    'Horror',
];

export const SearchScreen = () => {
    const { theme } = useAppTheme();
    const insets = useSafeAreaInsets();
    const [searchQuery, setSearchQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [activeTag, setActiveTag] = useState(null);
    const searchInputRef = useRef(null);

    const TV_LEFT_OFFSET = 100;

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
                    const filteredResults = data.results
                        .filter(
                            (item) =>
                                (item.media_type === 'movie' || item.media_type === 'tv') &&
                                item.poster_path
                        )
                        .map((item) => ({
                            id: item.id,
                            title: item.title || item.name,
                            image: `${IMAGE_PATH}${item.poster_path}`,
                            rating: item.vote_average?.toFixed(1) || 'N/A',
                            year: (item.release_date || item.first_air_date || '').split('-')[0],
                            media_type: item.media_type,
                        }));
                    setResults(filteredResults);
                }
            } catch (error) {
                console.error('Search Error:', error);
            } finally {
                setLoading(false);
            }
        }, 400);

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

    const renderEmptyState = () => (
        <View style={styles.emptyContainer}>
            {loading ? (
                <View style={styles.loadingBox}>
                    <ActivityIndicator size="large" color="#FF2442" />
                    <Text style={styles.loadingText}>Searching cinematic catalogue...</Text>
                </View>
            ) : (
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

                    {/* Explore Quick Tags */}
                    <View style={styles.tagsContainer}>
                        {EXPLORE_TAGS.map((tag) => (
                            <Pressable
                                key={tag}
                                onPress={() => handleSelectTag(tag)}
                                style={styles.tagPill}
                            >
                                <Text style={styles.tagPillText}>{tag}</Text>
                            </Pressable>
                        ))}
                    </View>
                </View>
            )}
        </View>
    );

    const numColumns = isTV ? 5 : 3;

    return (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.container}>
                {/* Search Bar Header */}
                <View
                    style={[
                        styles.headerContainer,
                        { paddingTop: Math.max(insets.top + 10, Platform.OS === 'ios' ? 52 : 38) },
                        isTV && { paddingLeft: TV_LEFT_OFFSET + 20 },
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
                            onChangeText={setSearchQuery}
                            returnKeyType="search"
                        />
                        {Boolean(searchQuery) && (
                            <Pressable onPress={handleClear} style={styles.clearBtn}>
                                <X color="#98A2B3" size={16} />
                            </Pressable>
                        )}
                    </View>
                </View>

                {/* Results Grid */}
                <FlatList
                    data={results}
                    keyExtractor={(item) => `search-${item.id}`}
                    numColumns={numColumns}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={[
                        styles.listContent,
                        { paddingBottom: 110 + insets.bottom },
                        isTV && { paddingLeft: TV_LEFT_OFFSET + 20 },
                    ]}
                    ListEmptyComponent={renderEmptyState}
                    renderItem={({ item }) => (
                        <MovieCard item={item} isGrid={true} showMatch={true} />
                    )}
                />
            </View>
        </TouchableWithoutFeedback>
    );
};

const styles = StyleSheet.create({
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
        padding: 4,
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
    loadingBox: {
        alignItems: 'center',
    },
    loadingText: {
        color: '#98A2B3',
        fontSize: 13,
        marginTop: 12,
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
