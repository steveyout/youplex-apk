import React, { useState, useEffect, useRef } from 'react';
import {
    StyleSheet,
    View,
    FlatList,
    ActivityIndicator,
    Keyboard,
    TouchableWithoutFeedback,
    Platform,
    Dimensions
} from 'react-native';
import { Searchbar, Text, Surface } from 'react-native-paper';
import { useAppTheme } from '../theme/ThemeContext';
import { MovieCard } from '../components/MovieCard';
import { searchMulti, IMAGE_PATH } from '../services/api';
import { Film } from 'lucide-react-native';
import { isTV } from '../utils/device';

const { width } = Dimensions.get('window');

export const SearchScreen = () => {
    const { theme } = useAppTheme();
    const [searchQuery, setSearchQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const searchBarRef = useRef(null);

    // TV Offset logic
    const TV_LEFT_OFFSET = 100;

    // Debounce logic
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
                        .filter(item => item.media_type === 'movie' || item.media_type === 'tv')
                        .map(item => ({
                            id: item.id,
                            title: item.title || item.name,
                            image: item.poster_path ? `${IMAGE_PATH}${item.poster_path}` : null,
                            rating: item.vote_average?.toFixed(1) || 'N/A',
                            media_type: item.media_type
                        }));
                    setResults(filteredResults);
                }
            } catch (error) {
                console.error("Search Error:", error);
            } finally {
                setLoading(false);
            }
        }, 600);

        return () => clearTimeout(delayDebounceFn);
    }, [searchQuery]);

    const renderEmptyState = () => (
        <View style={[styles.emptyContainer, isTV && { marginLeft: -TV_LEFT_OFFSET }]}>
            {loading ? (
                <ActivityIndicator size="large" color={theme.colors.primary} />
            ) : (
                <>
                    <Film size={isTV ? 120 : 64} color={theme.colors.outline} strokeWidth={1} />
                    <Text style={[styles.emptyText, { color: theme.colors.outline }]}>
                        {searchQuery.length > 0 ? `No results for "${searchQuery}"` : "Search for movies or TV shows"}
                    </Text>
                </>
            )}
        </View>
    );

    // Grid Math: On TV we want a generous 5-column grid
    const numColumns = isTV ? 5 : 3;
    const availableWidth = isTV ? width - TV_LEFT_OFFSET - 100 : width - 20;
    const cardWidth = availableWidth / numColumns;

    return (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
                <Surface
                    style={[
                        styles.searchHeader,
                        { backgroundColor: theme.colors.background },
                        isTV && styles.searchHeaderTV
                    ]}
                    elevation={0}
                >
                    <Searchbar
                        ref={searchBarRef}
                        placeholder="Search movies, shows..."
                        onChangeText={setSearchQuery}
                        value={searchQuery}
                        autoFocus={isTV}
                        style={[
                            styles.searchBar,
                            { backgroundColor: theme.colors.elevation.level3 },
                            isTV && styles.searchBarTV
                        ]}
                        iconColor={theme.colors.primary}
                        placeholderTextColor={theme.colors.outline}
                        inputStyle={{
                            color: theme.colors.onSurface,
                            fontSize: isTV ? 24 : 16,
                            height: isTV ? 70 : 50
                        }}
                    />
                </Surface>

                <FlatList
                    key={isTV ? 'tv-grid' : 'mobile-grid'}
                    data={results}
                    keyExtractor={(item) => `${item.media_type}-${item.id}`}
                    numColumns={numColumns}
                    contentContainerStyle={[
                        styles.scrollContent,
                        isTV && styles.scrollContentTV
                    ]}
                    columnWrapperStyle={styles.columnWrapper}
                    renderItem={({ item }) => (
                        <View style={{ width: cardWidth, padding: isTV ? 10 : 5 }}>
                            <MovieCard item={item} isGrid={true} />
                        </View>
                    )}
                    ListEmptyComponent={renderEmptyState}
                    showsVerticalScrollIndicator={false}
                    // Optimize large search results
                    removeClippedSubviews={true}
                    maxToRenderPerBatch={10}
                />
            </View>
        </TouchableWithoutFeedback>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    searchHeader: {
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
        paddingHorizontal: 15,
        paddingBottom: 20,
    },
    searchHeaderTV: {
        paddingTop: 40,
        paddingLeft: 120, // SideMenu(100) + 20
        paddingRight: 60,
        paddingBottom: 40,
    },
    searchBar: {
        borderRadius: 12,
        height: 50,
        elevation: 0,
    },
    searchBarTV: {
        height: 80,
        borderRadius: 12,
        elevation: 10,
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.1)'
    },
    scrollContent: {
        paddingHorizontal: 10,
        paddingBottom: 100,
        flexGrow: 1,
    },
    scrollContentTV: {
        paddingLeft: 110, // Match SideMenu offset
        paddingRight: 40,
    },
    columnWrapper: {
        justifyContent: 'flex-start',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 100,
    },
    emptyText: {
        marginTop: 20,
        fontSize: isTV ? 24 : 16,
        fontWeight: '500',
        textAlign: 'center',
        paddingHorizontal: 40,
        opacity: 0.8
    },
});