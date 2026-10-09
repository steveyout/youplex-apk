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
} from 'react-native';
import { Searchbar, Text } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../theme/ThemeContext';
import { MovieCard } from '../components/MovieCard';
import { searchMulti, IMAGE_PATH } from '../services/api';
import { Film } from 'lucide-react-native';
import { isTV } from '../utils/device';

const { width } = Dimensions.get('window');

export const SearchScreen = () => {
    const { theme, isDarkMode } = useAppTheme();
    const insets = useSafeAreaInsets();
    const [searchQuery, setSearchQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const searchBarRef = useRef(null);

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
                        .filter((item) => item.media_type === 'movie' || item.media_type === 'tv')
                        .map((item) => ({
                            id: item.id,
                            title: item.title || item.name,
                            image: item.poster_path ? `${IMAGE_PATH}${item.poster_path}` : null,
                            rating: item.vote_average?.toFixed(1) || 'N/A',
                            media_type: item.media_type,
                        }));
                    setResults(filteredResults);
                }
            } catch (error) {
                console.error('Search Error:', error);
            } finally {
                setLoading(false);
            }
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [searchQuery]);

    const renderEmptyState = () => (
        <View style={[styles.emptyContainer, isTV && { marginLeft: -TV_LEFT_OFFSET }]}>
            {loading ? (
                <ActivityIndicator size="large" color="#FF3030" />
            ) : (
                <>
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
                        <Film size={isTV ? 64 : 44} color="#FF3030" strokeWidth={1.8} />
                    </View>
                    <Text
                        style={[
                            styles.emptyTitle,
                            { color: isDarkMode ? '#FFFFFF' : '#111827' },
                        ]}
                    >
                        {searchQuery.length > 0
                            ? `No results found for "${searchQuery}"`
                            : 'Discover Movies & Series'}
                    </Text>
                    <Text style={styles.emptySubtitle}>
                        Search across millions of movies, TV shows, and trending titles.
                    </Text>
                </>
            )}
        </View>
    );

    const numColumns = isTV ? 5 : 3;

    return (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
                <View
                    style={[
                        styles.searchHeader,
                        { paddingTop: Math.max(insets.top + 8, Platform.OS === 'ios' ? 56 : 38) },
                        isTV && styles.searchHeaderTV,
                    ]}
                >
                    <Searchbar
                        ref={searchBarRef}
                        placeholder="Search movies, TV shows, actors..."
                        onChangeText={setSearchQuery}
                        value={searchQuery}
                        autoFocus={isTV}
                        style={[
                            styles.searchBar,
                            {
                                backgroundColor: theme.colors.glassBg,
                                borderColor: isDarkMode
                                    ? 'rgba(255, 255, 255, 0.12)'
                                    : 'rgba(0, 0, 0, 0.1)',
                            },
                            isTV && styles.searchBarTV,
                        ]}
                        iconColor="#FF3030"
                        placeholderTextColor={isDarkMode ? '#637381' : '#9CA3AF'}
                        inputStyle={{
                            color: isDarkMode ? '#FFFFFF' : '#111827',
                            fontSize: isTV ? 22 : 16,
                            height: isTV ? 68 : 50,
                        }}
                    />
                </View>

                <FlatList
                    key={isTV ? 'tv-grid' : 'mobile-grid'}
                    data={results}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={({ item }) => <MovieCard item={item} isGrid={true} />}
                    numColumns={numColumns}
                    ListEmptyComponent={renderEmptyState}
                    contentContainerStyle={[
                        styles.listContent,
                        isTV && styles.listContentTV,
                        { paddingBottom: 150 + insets.bottom },
                    ]}
                    showsVerticalScrollIndicator={false}
                />
            </View>
        </TouchableWithoutFeedback>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    searchHeader: {
        paddingHorizontal: 16,
        paddingBottom: 16,
    },
    searchHeaderTV: {
        paddingTop: 36,
        paddingLeft: 120,
        paddingRight: 60,
        paddingBottom: 24,
    },
    searchBar: {
        borderRadius: 24,
        borderWidth: 1.2,
        height: 52,
        elevation: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
    },
    searchBarTV: {
        height: 72,
        borderRadius: 36,
        borderWidth: 2,
    },
    listContent: {
        paddingHorizontal: 12,
        flexGrow: 1,
    },
    listContentTV: {
        paddingLeft: 120,
        paddingRight: 60,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 36,
        marginTop: 100,
    },
    emptyIconCircle: {
        width: isTV ? 110 : 88,
        height: isTV ? 110 : 88,
        borderRadius: isTV ? 55 : 44,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
        borderWidth: 1.5,
    },
    emptyTitle: {
        fontSize: isTV ? 26 : 20,
        fontWeight: '800',
        textAlign: 'center',
        marginBottom: 8,
    },
    emptySubtitle: {
        fontSize: isTV ? 16 : 14,
        color: '#8A99A8',
        textAlign: 'center',
        lineHeight: 20,
        maxWidth: 360,
    },
});
