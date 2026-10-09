import React, { useEffect, useState } from 'react';
import {
    StyleSheet,
    View,
    ScrollView,
    ActivityIndicator,
    FlatList,
    ImageBackground,
    Dimensions,
    Platform,
    Pressable,
} from 'react-native';
import { Text } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../theme/ThemeContext';
import { MovieCard } from '../components/MovieCard';
import {
    getNowPlayingMovies,
    getTopRatedMovies,
    getUpcomingMovies,
    IMAGE_PATH,
} from '../services/api';
import { Play, Plus, Info, Film, Check } from 'lucide-react-native';
import { TopBar } from '../components/TopBar';
import { isBookmarked, toggleBookmark } from '../services/bookmarksService';
import { isTV } from '../utils/device';

const { width } = Dimensions.get('window');

export const MoviesScreen = () => {
    const { theme, isDarkMode } = useAppTheme();
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();
    const [sections, setSections] = useState({
        nowPlaying: [],
        topRated: [],
        upcoming: [],
    });
    const [heroBookmarked, setHeroBookmarked] = useState(false);
    const [loading, setLoading] = useState(true);

    const TV_LEFT_OFFSET = 100;
    const CONTENT_WIDTH = isTV ? width - TV_LEFT_OFFSET : width;

    useEffect(() => {
        const loadMovies = async () => {
            try {
                const [now, top, upcoming] = await Promise.all([
                    getNowPlayingMovies(),
                    getTopRatedMovies(),
                    getUpcomingMovies(),
                ]);

                const format = (data) =>
                    data?.map((m) => ({
                        id: m.id,
                        title: m.title,
                        image: `${IMAGE_PATH}${m.poster_path}`,
                        backdrop: m.backdrop_path
                            ? `https://image.tmdb.org/t/p/original${m.backdrop_path}`
                            : `${IMAGE_PATH}${m.poster_path}`,
                        rating: m.vote_average?.toFixed(1),
                        year: (m.release_date || '').split('-')[0],
                        media_type: 'movie',
                    })) || [];

                const formattedNow = format(now);
                setSections({
                    nowPlaying: formattedNow,
                    topRated: format(top),
                    upcoming: format(upcoming),
                });

                if (formattedNow.length > 0) {
                    isBookmarked(formattedNow[0].id).then(setHeroBookmarked);
                }
            } catch (error) {
                console.error('Failed to load movies:', error);
            } finally {
                setLoading(false);
            }
        };
        loadMovies();
    }, []);

    const handleToggleHeroBookmark = async (hero) => {
        if (!hero) return;
        const newState = await toggleBookmark({
            ...hero,
            media_type: 'movie',
        });
        setHeroBookmarked(newState);
    };

    const renderRow = (title, data) => (
        <View style={styles.section}>
            <View style={styles.sectionHeader}>
                <View style={styles.sectionAccent} />
                <Text style={[styles.sectionTitle, { color: theme.colors.onBackground }]}>
                    {title}
                </Text>
            </View>
            <FlatList
                horizontal
                showsHorizontalScrollIndicator={false}
                data={data}
                keyExtractor={(item) => `movie-${item.id}`}
                renderItem={({ item }) => <MovieCard item={item} />}
                contentContainerStyle={{ paddingLeft: 20 }}
                removeClippedSubviews={Platform.OS === 'android'}
            />
        </View>
    );

    if (loading)
        return (
            <View style={[styles.centered, { backgroundColor: theme.colors.background }]}>
                <ActivityIndicator size="large" color="#FF3030" />
            </View>
        );

    const heroMovie = sections.nowPlaying[0];

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <TopBar />

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={[
                    styles.scrollContent,
                    isTV && { paddingLeft: TV_LEFT_OFFSET },
                    { paddingBottom: 150 + insets.bottom },
                ]}
            >
                {/* Hero Feature */}
                <ImageBackground
                    source={{ uri: heroMovie?.backdrop }}
                    style={[styles.hero, { width: CONTENT_WIDTH }, isTV && styles.heroTV]}
                >
                    <LinearGradient
                        colors={
                            isDarkMode
                                ? ['transparent', 'rgba(5,5,5,0.3)', 'rgba(5,5,5,0.85)', '#050505']
                                : ['transparent', 'rgba(244,246,248,0.3)', 'rgba(244,246,248,0.85)', '#F4F6F8']
                        }
                        style={styles.heroGradient}
                    >
                        <View style={[styles.heroContent, isTV && styles.heroContentTV]}>
                            {/* Badges */}
                            <View style={styles.heroBadgeRow}>
                                <View style={styles.cinemaBadge}>
                                    <Film color="#FF3030" size={13} />
                                    <Text style={styles.cinemaBadgeText}>FEATURED MOVIE</Text>
                                </View>
                                {heroMovie?.rating && (
                                    <View style={styles.ratingBadge}>
                                        <Text style={styles.ratingBadgeText}>★ {heroMovie.rating}</Text>
                                    </View>
                                )}
                            </View>

                            <Text
                                style={[
                                    styles.heroTitle,
                                    isTV && styles.heroTitleTV,
                                    { color: isDarkMode ? '#FFFFFF' : '#111827' },
                                ]}
                                numberOfLines={2}
                            >
                                {heroMovie?.title?.toUpperCase()}
                            </Text>

                            <View style={styles.heroButtons}>
                                <Pressable
                                    hasTVPreferredFocus={true}
                                    style={({ focused }) => [
                                        styles.playBtnContainer,
                                        focused && styles.tvFocusScale,
                                    ]}
                                    onPress={() =>
                                        navigation.navigate('Player', {
                                            id: heroMovie.id,
                                            type: 'movie',
                                            item: heroMovie,
                                        })
                                    }
                                >
                                    <LinearGradient
                                        colors={['#FF4565', '#FF3030', '#B71833']}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 0 }}
                                        style={[styles.playBtnGradient, isTV && styles.playBtnGradientTV]}
                                    >
                                        <Play size={isTV ? 26 : 20} color="#FFFFFF" fill="#FFFFFF" />
                                        <Text style={[styles.playBtnText, isTV && { fontSize: 20 }]}>
                                            Watch Now
                                        </Text>
                                    </LinearGradient>
                                </Pressable>

                                {/* My List toggle */}
                                <Pressable
                                    style={({ focused }) => [
                                        styles.myListBtn,
                                        heroBookmarked && styles.myListBtnActive,
                                        isTV && styles.infoBtnTV,
                                        focused && styles.tvFocusScale,
                                    ]}
                                    onPress={() => handleToggleHeroBookmark(heroMovie)}
                                >
                                    {heroBookmarked ? (
                                        <Check color="#10B981" size={isTV ? 24 : 18} strokeWidth={2.5} />
                                    ) : (
                                        <Plus color={isDarkMode ? '#FFFFFF' : '#111827'} size={isTV ? 24 : 18} strokeWidth={2.5} />
                                    )}
                                    <Text
                                        style={[
                                            styles.myListBtnText,
                                            { color: heroBookmarked ? '#10B981' : (isDarkMode ? '#FFFFFF' : '#111827') },
                                            isTV && { fontSize: 18 },
                                        ]}
                                    >
                                        {heroBookmarked ? 'In List' : 'My List'}
                                    </Text>
                                </Pressable>

                                <Pressable
                                    style={({ focused }) => [
                                        styles.infoBtn,
                                        {
                                            backgroundColor: isDarkMode ? 'rgba(20, 26, 33, 0.85)' : 'rgba(255, 255, 255, 0.85)',
                                            borderColor: theme.colors.outlineVariant,
                                        },
                                        isTV && styles.infoBtnTV,
                                        focused && styles.tvFocusScale,
                                    ]}
                                    onPress={() =>
                                        navigation.navigate('MovieDetail', {
                                            id: heroMovie.id,
                                            type: 'movie',
                                        })
                                    }
                                >
                                    <Info color={isDarkMode ? '#FFFFFF' : '#111827'} size={isTV ? 24 : 18} />
                                    <Text
                                        style={[
                                            styles.infoBtnText,
                                            { color: isDarkMode ? '#FFFFFF' : '#111827' },
                                            isTV && { fontSize: 18 },
                                        ]}
                                    >
                                        Details
                                    </Text>
                                </Pressable>
                            </View>
                        </View>
                    </LinearGradient>
                </ImageBackground>

                {/* Movie Rows */}
                <View style={styles.rowsContainer}>
                    {renderRow('Now In Theaters', sections.nowPlaying.slice(1))}
                    {renderRow('Top Rated Blockbusters', sections.topRated)}
                    {renderRow('Upcoming Releases', sections.upcoming)}
                </View>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollContent: {
        // dynamic paddingBottom is applied inline
    },
    hero: {
        height: 480,
        justifyContent: 'flex-end',
    },
    heroTV: {
        height: 640,
    },
    heroGradient: {
        height: '85%',
        justifyContent: 'flex-end',
        paddingHorizontal: 20,
        paddingBottom: 24,
    },
    heroContent: {
        alignItems: 'center',
    },
    heroContentTV: {
        alignItems: 'flex-start',
        paddingLeft: 24,
        paddingBottom: 24,
    },
    heroBadgeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 8,
    },
    cinemaBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        backgroundColor: 'rgba(255, 48, 48, 0.18)',
        borderColor: 'rgba(255, 48, 48, 0.35)',
        borderWidth: 1,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
    },
    cinemaBadgeText: {
        color: '#FF4D4D',
        fontSize: 10,
        fontWeight: '900',
        letterSpacing: 0.5,
    },
    ratingBadge: {
        backgroundColor: '#10B981',
        paddingHorizontal: 7,
        paddingVertical: 2,
        borderRadius: 5,
    },
    ratingBadgeText: {
        color: '#FFFFFF',
        fontSize: 11,
        fontWeight: '900',
    },
    heroTitle: {
        fontSize: 26,
        fontWeight: '900',
        marginBottom: 16,
        textAlign: 'center',
        letterSpacing: -0.5,
    },
    heroTitleTV: {
        fontSize: 48,
        textAlign: 'left',
        marginBottom: 24,
    },
    heroButtons: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    playBtnContainer: {
        borderRadius: 22,
        overflow: 'hidden',
    },
    playBtnGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 22,
        paddingVertical: 12,
        borderRadius: 22,
        gap: 8,
    },
    playBtnGradientTV: {
        paddingHorizontal: 32,
        paddingVertical: 16,
    },
    playBtnText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '900',
        letterSpacing: 0.5,
    },
    myListBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 22,
        backgroundColor: 'rgba(20, 26, 33, 0.85)',
        borderWidth: 1.2,
        borderColor: 'rgba(255, 255, 255, 0.15)',
        gap: 6,
    },
    myListBtnActive: {
        backgroundColor: 'rgba(16, 185, 129, 0.14)',
        borderColor: 'rgba(16, 185, 129, 0.4)',
    },
    myListBtnText: {
        fontSize: 13,
        fontWeight: '800',
    },
    infoBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 22,
        borderWidth: 1.2,
        gap: 6,
    },
    infoBtnTV: {
        paddingHorizontal: 24,
        paddingVertical: 16,
    },
    infoBtnText: {
        fontSize: 13,
        fontWeight: '800',
    },
    rowsContainer: {
        marginTop: isTV ? -30 : -10,
    },
    section: {
        marginTop: 22,
        marginBottom: 6,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginBottom: 12,
        gap: 8,
    },
    sectionAccent: {
        width: 4,
        height: 18,
        borderRadius: 2,
        backgroundColor: '#FF3030',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '900',
    },
    tvFocusScale: {
        borderWidth: 3,
        borderColor: '#FF3030',
        transform: [{ scale: 1.05 }],
    },
});
