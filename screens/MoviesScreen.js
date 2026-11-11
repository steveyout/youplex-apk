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
import { Play, Plus, Info, Check, Sparkles, Flame, Film } from 'lucide-react-native';
import { TopBar } from '../components/TopBar';
import { ScreenSkeleton } from '../components/SkeletonLoader';
import { isBookmarked, toggleBookmark } from '../services/bookmarksService';
import { isTV } from '../utils/device';

const { width, height } = Dimensions.get('window');

const MOVIE_GENRES = [
    'All Movies',
    'Action',
    'Sci-Fi',
    'Thriller',
    'Horror',
    'Comedy',
    'Drama',
    'Animation',
];

export const MoviesScreen = () => {
    const { theme } = useAppTheme();
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();
    const [sections, setSections] = useState({
        nowPlaying: [],
        topRated: [],
        upcoming: [],
    });
    const [selectedGenre, setSelectedGenre] = useState('All Movies');
    const [heroBookmarked, setHeroBookmarked] = useState(false);
    const [loading, setLoading] = useState(true);

    const TV_LEFT_OFFSET = 100;
    const CONTENT_WIDTH = isTV ? width - TV_LEFT_OFFSET : width;
    const HERO_HEIGHT = isTV ? height * 0.72 : Math.min(height * 0.58, 480);

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
                        overview: m.overview || '',
                        image: `${IMAGE_PATH}${m.poster_path}`,
                        backdrop: m.backdrop_path
                            ? `https://image.tmdb.org/t/p/original${m.backdrop_path}`
                            : `${IMAGE_PATH}${m.poster_path}`,
                        rating: m.vote_average?.toFixed(1) || '8.5',
                        year: (m.release_date || '').split('-')[0] || '2025',
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
                <Text style={styles.sectionTitle}>{title}</Text>
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

    if (loading) return <ScreenSkeleton />;

    const heroMovie = sections.nowPlaying[0];

    return (
        <View style={[styles.container, { backgroundColor: '#08090C' }]}>
            <TopBar />

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={[
                    styles.scrollContent,
                    isTV && { paddingLeft: TV_LEFT_OFFSET },
                    { paddingBottom: 110 + insets.bottom },
                ]}
            >
                {/* --- 1. CINEMATIC HERO BANNER --- */}
                {heroMovie && (
                    <View style={[styles.heroWrapper, { width: CONTENT_WIDTH, height: HERO_HEIGHT }]}>
                        <ImageBackground
                            source={{ uri: heroMovie.backdrop }}
                            style={styles.hero}
                            resizeMode="cover"
                        >
                            <LinearGradient
                                colors={[
                                    'rgba(8, 9, 12, 0.45)',
                                    'transparent',
                                    'rgba(8, 9, 12, 0.75)',
                                    '#08090C',
                                ]}
                                style={styles.heroGradient}
                                start={{ x: 0.5, y: 0 }}
                                end={{ x: 0.5, y: 1 }}
                            />

                            <View style={[styles.heroContent, isTV && styles.heroContentTV]}>
                                {/* Badges Row */}
                                <View style={styles.heroBadgeRow}>
                                    <View style={styles.cinemaBadge}>
                                        <Sparkles color="#FF2442" size={13} />
                                        <Text style={styles.cinemaBadgeText}>BLOCKBUSTER PREMIERE</Text>
                                    </View>
                                    <View style={styles.matchScorePill}>
                                        <Flame color="#FF2442" size={12} />
                                        <Text style={styles.matchScoreText}>99% Match</Text>
                                    </View>
                                    {heroMovie.rating && (
                                        <View style={styles.ratingBadge}>
                                            <Text style={styles.ratingBadgeText}>★ {heroMovie.rating}</Text>
                                        </View>
                                    )}
                                    <View style={styles.hdrBadge}>
                                        <Text style={styles.hdrBadgeText}>4K HDR</Text>
                                    </View>
                                </View>

                                {/* Movie Title */}
                                <Text
                                    style={[styles.heroTitle, isTV && styles.heroTitleTV]}
                                    numberOfLines={2}
                                >
                                    {heroMovie.title}
                                </Text>

                                {/* Action Buttons Row */}
                                <View style={styles.heroButtons}>
                                    {/* Primary Watch Button */}
                                    <Pressable
                                        style={styles.playBtnContainer}
                                        onPress={() =>
                                            navigation.navigate('Player', {
                                                id: heroMovie.id,
                                                type: 'movie',
                                                item: heroMovie,
                                            })
                                        }
                                    >
                                        <LinearGradient
                                            colors={['#FF3B56', '#FF1E3C', '#B3001E']}
                                            start={{ x: 0, y: 0 }}
                                            end={{ x: 1, y: 0 }}
                                            style={[styles.playBtnGradient, isTV && styles.playBtnGradientTV]}
                                        >
                                            <Play size={isTV ? 22 : 18} color="#FFFFFF" fill="#FFFFFF" />
                                            <Text style={[styles.playBtnText, isTV && { fontSize: 17 }]}>
                                                Watch Now
                                            </Text>
                                        </LinearGradient>
                                    </Pressable>

                                    {/* My List toggle */}
                                    <Pressable
                                        style={[
                                            styles.myListBtn,
                                            heroBookmarked && styles.myListBtnActive,
                                        ]}
                                        onPress={() => handleToggleHeroBookmark(heroMovie)}
                                    >
                                        {heroBookmarked ? (
                                            <Check color="#FF2442" size={18} strokeWidth={2.5} />
                                        ) : (
                                            <Plus color="#FFFFFF" size={18} strokeWidth={2.5} />
                                        )}
                                        <Text
                                            style={[
                                                styles.myListBtnText,
                                                heroBookmarked && { color: '#FF2442' },
                                            ]}
                                        >
                                            {heroBookmarked ? 'In List' : 'Watchlist'}
                                        </Text>
                                    </Pressable>

                                    {/* Info Details Button */}
                                    <Pressable
                                        style={styles.infoBtn}
                                        onPress={() =>
                                            navigation.navigate('MovieDetail', {
                                                id: heroMovie.id,
                                                type: 'movie',
                                            })
                                        }
                                    >
                                        <Info color="#FFFFFF" size={18} />
                                    </Pressable>
                                </View>
                            </View>
                        </ImageBackground>
                    </View>
                )}

                {/* --- 2. GENRE FILTER CHIPS --- */}
                <View style={styles.genreFilterSection}>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.genreFilterContent}
                    >
                        {MOVIE_GENRES.map((genre) => {
                            const isSelected = selectedGenre === genre;
                            return (
                                <Pressable
                                    key={genre}
                                    style={[
                                        styles.genreChip,
                                        isSelected && styles.genreChipActive,
                                    ]}
                                    onPress={() => setSelectedGenre(genre)}
                                >
                                    <Text
                                        style={[
                                            styles.genreChipText,
                                            isSelected && styles.genreChipTextActive,
                                        ]}
                                    >
                                        {genre}
                                    </Text>
                                </Pressable>
                            );
                        })}
                    </ScrollView>
                </View>

                {/* --- 3. MOVIE SECTION LISTS --- */}
                <View style={styles.rowsContainer}>
                    {renderRow('Now In Theaters', sections.nowPlaying)}
                    {renderRow('Critically Acclaimed & Top Rated', sections.topRated)}
                    {renderRow('Upcoming Blockbusters', sections.upcoming)}
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
        paddingTop: 0,
    },
    heroWrapper: {
        position: 'relative',
        overflow: 'hidden',
    },
    hero: {
        width: '100%',
        height: '100%',
        justifyContent: 'flex-end',
    },
    heroGradient: {
        ...StyleSheet.absoluteFillObject,
    },
    heroContent: {
        paddingHorizontal: 20,
        paddingBottom: 20,
        alignItems: 'flex-start',
    },
    heroContentTV: {
        paddingLeft: 36,
        paddingBottom: 32,
    },
    heroBadgeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 10,
    },
    cinemaBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        backgroundColor: 'rgba(255, 36, 66, 0.16)',
        borderColor: 'rgba(255, 36, 66, 0.45)',
        borderWidth: 1,
        paddingHorizontal: 9,
        paddingVertical: 3.5,
        borderRadius: 8,
    },
    cinemaBadgeText: {
        color: '#FF2442',
        fontSize: 10.5,
        fontWeight: '900',
        letterSpacing: 0.6,
    },
    matchScorePill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: 'rgba(255, 36, 66, 0.12)',
        paddingHorizontal: 8,
        paddingVertical: 3.5,
        borderRadius: 8,
    },
    matchScoreText: {
        color: '#FF2442',
        fontSize: 11,
        fontWeight: '800',
    },
    ratingBadge: {
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        paddingHorizontal: 8,
        paddingVertical: 3.5,
        borderRadius: 8,
    },
    ratingBadgeText: {
        color: '#FFC107',
        fontSize: 11,
        fontWeight: '800',
    },
    hdrBadge: {
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.15)',
        paddingHorizontal: 7,
        paddingVertical: 3,
        borderRadius: 6,
    },
    hdrBadgeText: {
        color: '#FFFFFF',
        fontSize: 10,
        fontWeight: '800',
    },
    heroTitle: {
        fontSize: 30,
        fontWeight: '900',
        marginBottom: 12,
        letterSpacing: -0.5,
        color: '#FFFFFF',
        lineHeight: 36,
        textShadowColor: 'rgba(0, 0, 0, 0.8)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 8,
    },
    heroTitleTV: {
        fontSize: 48,
        lineHeight: 56,
        marginBottom: 16,
    },
    heroButtons: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    playBtnContainer: {
        borderRadius: 22,
        overflow: 'hidden',
        shadowColor: '#FF2442',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.45,
        shadowRadius: 10,
        elevation: 8,
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
        paddingHorizontal: 30,
        paddingVertical: 14,
    },
    playBtnText: {
        color: '#FFFFFF',
        fontSize: 14.5,
        fontWeight: '800',
        letterSpacing: 0.4,
    },
    myListBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 22,
        backgroundColor: '#141821',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.12)',
        gap: 6,
    },
    myListBtnActive: {
        backgroundColor: 'rgba(255, 36, 66, 0.15)',
        borderColor: '#FF2442',
    },
    myListBtnText: {
        fontSize: 13,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    infoBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#141821',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.12)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    genreFilterSection: {
        marginTop: 6,
        marginBottom: 10,
    },
    genreFilterContent: {
        paddingHorizontal: 20,
        gap: 8,
    },
    genreChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#141821',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.08)',
    },
    genreChipActive: {
        backgroundColor: 'rgba(255, 36, 66, 0.15)',
        borderColor: '#FF2442',
    },
    genreChipText: {
        fontSize: 12.5,
        fontWeight: '700',
        color: '#98A2B3',
    },
    genreChipTextActive: {
        color: '#FF2442',
    },
    rowsContainer: {
        marginTop: 10,
    },
    section: {
        marginBottom: 24,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginBottom: 12,
    },
    sectionAccent: {
        width: 3.5,
        height: 18,
        backgroundColor: '#FF2442',
        borderRadius: 2,
        marginRight: 10,
    },
    sectionTitle: {
        fontSize: 17,
        fontWeight: '800',
        color: '#FFFFFF',
        letterSpacing: 0.2,
    },
});
