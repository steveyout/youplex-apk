import React, { useState, useEffect, useCallback } from 'react';
import {
    StyleSheet,
    View,
    FlatList,
    ActivityIndicator,
    Keyboard,
    TouchableWithoutFeedback
} from 'react-native';
import { Searchbar, Text, Surface } from 'react-native-paper';
import { useAppTheme } from '../theme/ThemeContext';
import { MovieCard } from '../components/MovieCard';
import { searchMulti, IMAGE_PATH } from '../services/api';
import { Search as SearchIcon, Film } from 'lucide-react-native';

export const SearchScreen = () => {
    const { theme } = useAppTheme();
    const [searchQuery, setSearchQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);

    // Debounce logic: Wait for user to stop typing for 600ms
    useEffect(() => {
        if (!searchQuery.trim()) {
            setResults([]);
            setLoading(false);
            return;
        }

        const delayDebounceFn = setTimeout(async () => {
            setLoading(true);
            const data = await searchMulti(searchQuery);

            if (data && data.results) {
                // Filter out people (TMDB multi-search includes actors)
                // and format data for our MovieCard
                const filteredResults = data.results
                    .filter(item => item.media_type === 'movie' || item.media_type === 'tv')
                    .map(item => ({
                        id: item.id,
                        title: item.title || item.name,
                        image: item.poster_path ? `${IMAGE_PATH}${item.poster_path}` : null,
                        rating: item.vote_average?.toFixed(1) || 'N/A',
                        media_type: item.media_type // Critical for detail screen routing
                    }));

                setResults(filteredResults);
            }
            setLoading(false);
        }, 600);

        return () => clearTimeout(delayDebounceFn);
    }, [searchQuery]);

    const renderEmptyState = () => (
        <View style={styles.emptyContainer}>
            {loading ? (
                <ActivityIndicator size="large" color={theme.colors.primary} />
            ) : (
                <>
                    <Film size={64} color={theme.colors.outline} strokeWidth={1} />
                    <Text style={[styles.emptyText, { color: theme.colors.outline }]}>
                        {searchQuery.length > 0 ? `No results for "${searchQuery}"` : "Search for movies or TV shows"}
                    </Text>
                </>
            )}
        </View>
    );

    return (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
                <Surface style={[styles.searchHeader, { backgroundColor: theme.colors.background }]} elevation={2}>
                    <Searchbar
                        placeholder="Movies, shows and more..."
                        onChangeText={setSearchQuery}
                        value={searchQuery}
                        style={[styles.searchBar, { backgroundColor: theme.colors.elevation.level3 }]}
                        iconColor={theme.colors.primary}
                        placeholderTextColor={theme.colors.outline}
                        inputStyle={{ color: theme.colors.onSurface }}
                    />
                </Surface>

                <FlatList
                    data={results}
                    keyExtractor={(item) => `${item.media_type}-${item.id}`}
                    numColumns={3}
                    contentContainerStyle={styles.scrollContent}
                    columnWrapperStyle={styles.columnWrapper}
                    renderItem={({ item }) => (
                        <View style={styles.cardWrapper}>
                            <MovieCard item={item} isGrid={true} />
                        </View>
                    )}
                    ListEmptyComponent={renderEmptyState}
                    showsVerticalScrollIndicator={false}
                />
            </View>
        </TouchableWithoutFeedback>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    searchHeader: {
        paddingTop: 60,
        paddingHorizontal: 15,
        paddingBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)',
    },
    searchBar: {
        borderRadius: 12,
        height: 50,
    },
    scrollContent: {
        paddingHorizontal: 10,
        paddingTop: 20,
        paddingBottom: 100,
        flexGrow: 1,
    },
    columnWrapper: {
        justifyContent: 'flex-start',
    },
    cardWrapper: {
        width: '33.33%',
        padding: 5,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 100,
    },
    emptyText: {
        marginTop: 15,
        fontSize: 16,
        fontWeight: '500',
        textAlign: 'center',
        paddingHorizontal: 40,
    },
});