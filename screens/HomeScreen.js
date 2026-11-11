import React, { useEffect, useState } from 'react';
import {
    StyleSheet,
    View,
    ScrollView,
    ActivityIndicator,
    FlatList,
    ImageBackground,
    Pressable,
    Image,
    Platform,
    Dimensions,
} from 'react-native';
import { Text } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import {
    Play,
    Plus,
    Flame,
    Clock,
    Check,
    Sparkles,
    ChevronRight,
    TrendingUp,
    Film,
    Tv,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TopBar } from '../components/TopBar';
import { ScreenSkeleton } from '../components/SkeletonLoader';
import { useAppTheme } from '../theme/ThemeContext';
import { MovieCard } from '../components/MovieCard';
import { AIAssistantModal } from '../components/AIAssistantModal';
import { getTrendingMovies, getTrendingTV, IMAGE_PATH } from '../services/api';
import { getHistory } from '../services/historyService';
import { isBookmarked, toggleBookmark } from '../services/bookmarksService';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import { isTV } from '../utils/device';

const { width, height } = Dimensions.get('window');

const GENRES = [
    { id: 0, name: 'All' },
    { id: 28, name: 'Action' },
    { id: 878, name: 'Sci-Fi' },
    { id: 53, name: 'Thriller' },
    { id: 35, name: 'Comedy' },
    { id: 18, name: 'Drama' },
    { id: 27, name: 'Horror' },
    { id: 16, name: 'Animation' },
];

export const HomeScreen = () => {
    const { theme } = useAppTheme();
    const navigation = useNavigation();
    const isFocused = useIsFocused();
    const insets = useSafeAreaInsets();

    const [trendingMovies, setTrendingMovies] = useState([]);
    const [trendingTV, setTrendingTV] = useState([]);
    const [continueWatching, setContinueWatching] = useState([]);
    const [selectedGenre, setSelectedGenre] = useState(0);
    const [heroBookmarked, setHeroBookmarked] = useState(false);
    const [loading, setLoading] = useState(true);
    const [aiModalVisible, setAiModalVisible] = useState(false);

    const TV_LEFT_OFFSET = 100;
    const HERO_WIDTH = isTV ? width - TV_LEFT_OFFSET : width;
    const HERO_HEIGHT = isTV ? height * 0.72 : Math.min(height * 0.58, 480);

    useEffect(() => {
        const loadData = async () => {
            const [movies, tv] = await Promise.all([getTrendingMovies(), getTrendingTV()]);
            const format = (data, type) =>
                data?.map((m) => ({
                    ...m,
                    id: m.id,
                    title: m.title || m.name,
                    image: `${IMAGE_PATH}${m.poster_path}`,
                    backdrop: m.backdrop_path
                        ? `https://image.tmdb.org/t/p/original${m.backdrop_path}`
                        : `${IMAGE_PATH}${m.poster_path}`,
                    rating: m.vote_average ? m.vote_average.toFixed(1) : null,
                    year: (m.release_date || m.first_air_date || '').split('-')[0],
                    media_type: type,
                    genre_ids: m.genre_ids || [],
                })) || [];

            const formattedMovies = format(movies, 'movie');
            const formattedTV = format(tv, 'tv');

            setTrendingMovies(formattedMovies);
            setTrendingTV(formattedTV);

            if (formattedMovies.length > 0) {
                isBookmarked(formattedMovies[0].id).then(setHeroBookmarked);
            }

            setLoading(false);
        };
        loadData();
    }, []);

    useEffect(() => {
        if (isFocused) {
            getHistory().then((hist) => {
                if (hist && Array.isArray(hist)) {
                    setContinueWatching(hist.slice(0, 10));
                }
            });
            if (trendingMovies.length > 0) {
                isBookmarked(trendingMovies[0].id).then(setHeroBookmarked);
            }
        }
    }, [isFocused]);

    const handleToggleHeroBookmark = async (hero) => {
        if (!hero) return;
        const newState = await toggleBookmark({
            ...hero,
            media_type: 'movie',
        });
        setHeroBookmarked(newState);
    };

    const heroMovie = trendingMovies[0];

    const filteredMovies =
        selectedGenre === 0
            ? trendingMovies
            : trendingMovies.filter((m) => m.genre_ids?.includes(selectedGenre));

    if (loading) {
        return <ScreenSkeleton />;
    }

    return (
        <View style={styles.mainContainer}>
            <TopBar />

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={[
                    styles.scrollContent,
                    { paddingBottom: 110 + insets.bottom },
                    isTV && { paddingLeft: TV_LEFT_OFFSET },
                ]}
            >
                {/* --- 1. CINEMATIC HERO BANNER --- */}
                {heroMovie && (
                    <View style={[styles.heroContainer, { height: HERO_HEIGHT, width: HERO_WIDTH }]}>
                        <ImageBackground
                            source={{ uri: heroMovie.backdrop }}
                            style={styles.heroImage}
                            resizeMode="cover"
                        >
                            {/* Multi-Stop Dark Fade */}
                            <LinearGradient
                                colors={[
                                    'rgba(8, 9, 12, 0.4)',
                                    'transparent',
                                    'rgba(8, 9, 12, 0.75)',
                                    '#08090C',
                                ]}
                                style={styles.heroGradient}
                                start={{ x: 0.5, y: 0 }}
                                end={{ x: 0.5, y: 1 }}
                            />

                            {/* Hero Content */}
                            <View style={styles.heroContent}>
                                {/* AI Match Pill */}
                                <View style={styles.aiPickBadge}>
                                    <Sparkles color="#FF2442" size={13} />
                                    <Text style={styles.aiPickText}>TOP PICK • #1 STREAMING</Text>
                                </View>

                                {/* Title */}
                                <Text
                                    style={[
                                        styles.heroTitle,
                                        isTV && { fontSize: 44, lineHeight: 52 },
                                    ]}
                                    numberOfLines={2}
                                >
                                    {heroMovie.title}
                                </Text>

                                {/* Metadata Row */}
                                <View style={styles.heroMetaRow}>
                                    <View style={styles.matchScorePill}>
                                        <Flame color="#FF2442" size={12} />
                                        <Text style={styles.matchScoreText}>99% Match</Text>
                                    </View>
                                    <Text style={styles.heroYear}>{heroMovie.year}</Text>
                                    <View style={styles.ratingBadge}>
                                        <Text style={styles.ratingBadgeText}>★ {heroMovie.rating}</Text>
                                    </View>
                                    <View style={styles.hdrBadge}>
                                        <Text style={styles.hdrBadgeText}>4K HDR</Text>
                                    </View>
                                </View>

                                {/* Action Buttons */}
                                <View style={styles.heroActionsRow}>
                                    {/* Primary Play Button */}
                                    <Pressable
                                        onPress={() =>
                                            navigation.navigate('Player', {
                                                id: heroMovie.id,
                                                type: 'movie',
                                                item: heroMovie,
                                            })
                                        }
                                        style={styles.heroPlayBtn}
                                    >
                                        <LinearGradient
                                            colors={['#FF3B56', '#FF1E3C', '#B3001E']}
                                            style={styles.heroPlayGradient}
                                            start={{ x: 0, y: 0 }}
                                            end={{ x: 1, y: 0 }}
                                        >
                                            <Play color="#FFFFFF" size={18} fill="#FFFFFF" />
                                            <Text style={styles.heroPlayText}>Watch Now</Text>
                                        </LinearGradient>
                                    </Pressable>

                                    {/* Watchlist Toggle */}
                                    <Pressable
                                        onPress={() => handleToggleHeroBookmark(heroMovie)}
                                        style={styles.heroListBtn}
                                    >
                                        {heroBookmarked ? (
                                            <Check color="#FF2442" size={18} />
                                        ) : (
                                            <Plus color="#FFFFFF" size={18} />
                                        )}
                                        <Text
                                            style={[
                                                styles.heroListText,
                                                heroBookmarked && { color: '#FF2442' },
                                            ]}
                                        >
                                            {heroBookmarked ? 'In List' : 'Watchlist'}
                                        </Text>
                                    </Pressable>

                                    {/* Info Button */}
                                    <Pressable
                                        onPress={() =>
                                            navigation.navigate('MovieDetail', {
                                                id: heroMovie.id,
                                                type: 'movie',
                                            })
                                        }
                                        style={styles.heroInfoBtn}
                                    >
                                        <ChevronRight color="#98A2B3" size={18} />
                                    </Pressable>
                                </View>
                            </View>
                        </ImageBackground>
                    </View>
                )}

                {/* --- 2. AI MOVIE ASSISTANT PROMPT BAR --- */}
                <View style={styles.aiPromptSection}>
                    <Pressable
                        onPress={() => setAiModalVisible(true)}
                        style={styles.aiPromptCard}
                    >
                        <LinearGradient
                            colors={['rgba(255, 36, 66, 0.16)', 'rgba(15, 18, 23, 0.95)']}
                            style={styles.aiPromptGradient}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                        >
                            <View style={styles.aiPromptLeft}>
                                <View style={styles.aiSparkleBox}>
                                    <Sparkles color="#FF2442" size={20} />
                                </View>
                                <View style={styles.aiPromptTextBox}>
                                    <Text style={styles.aiPromptHeadline}>Personalized Discover</Text>
                                    <Text style={styles.aiPromptSub}>
                                        Discover movies tailored to your watch history & mood
                                    </Text>
                                </View>
                            </View>
                            <View style={styles.aiPromptArrow}>
                                <ChevronRight color="#FF2442" size={18} />
                            </View>
                        </LinearGradient>
                    </Pressable>
                </View>

                {/* --- 3. GENRE FILTER CHIPS --- */}
                <View style={styles.genreRowContainer}>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.genreScroll}
                    >
                        {GENRES.map((g) => {
                            const isSelected = selectedGenre === g.id;
                            return (
                                <Pressable
                                    key={g.id}
                                    onPress={() => setSelectedGenre(g.id)}
                                    style={[
                                        styles.genrePill,
                                        isSelected && styles.genrePillActive,
                                    ]}
                                >
                                    {isSelected ? (
                                        <LinearGradient
                                            colors={['#FF3B56', '#FF1E3C', '#B3001E']}
                                            style={styles.genreGradient}
                                        >
                                            <Text style={styles.genreTextActive}>{g.name}</Text>
                                        </LinearGradient>
                                    ) : (
                                        <Text style={styles.genreText}>{g.name}</Text>
                                    )}
                                </Pressable>
                            );
                        })}
                    </ScrollView>
                </View>

                {/* --- 4. CONTINUE WATCHING (IF ANY) --- */}
                {continueWatching && continueWatching.length > 0 && (
                    <View style={styles.sectionContainer}>
                        <View style={styles.sectionHeader}>
                            <View style={styles.sectionTitleRow}>
                                <Clock color="#FF2442" size={17} />
                                <Text style={styles.sectionTitle}>Continue Watching</Text>
                            </View>
                            <Pressable onPress={() => navigation.navigate('History')}>
                                <Text style={styles.seeAllText}>See All</Text>
                            </Pressable>
                        </View>
                        <FlatList
                            data={continueWatching}
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            keyExtractor={(item, idx) => `cw-${item.id}-${idx}`}
                            contentContainerStyle={styles.horizontalList}
                            renderItem={({ item }) => {
                                const progress =
                                    item.duration > 0
                                        ? Math.min(1, Math.max(0, item.position / item.duration))
                                        : 0.4;
                                const isTvMedia = item.type === 'tv';
                                const sub = isTvMedia
                                    ? `S${item.season || 1}:E${item.episode || 1}`
                                    : `${Math.round((item.position || 0) / 60)}m left`;

                                return (
                                    <Pressable
                                        onPress={() =>
                                            navigation.navigate('Player', {
                                                id: item.id,
                                                type: item.type || 'movie',
                                                season: item.season || 1,
                                                episode: item.episode || 1,
                                                position: item.position || 0,
                                            })
                                        }
                                        style={styles.cwCard}
                                    >
                                        <View style={styles.cwImageContainer}>
                                            <Image
                                                source={{
                                                    uri:
                                                        item.backdrop_path
                                                            ? `https://image.tmdb.org/t/p/w500${item.backdrop_path}`
                                                            : item.poster_path
                                                            ? `https://image.tmdb.org/t/p/w500${item.poster_path}`
                                                            : 'https://via.placeholder.com/300x170',
                                                }}
                                                style={styles.cwImage}
                                            />
                                            <View style={styles.cwPlayOverlay}>
                                                <View style={styles.cwPlayCircle}>
                                                    <Play color="#FFFFFF" size={14} fill="#FFFFFF" />
                                                </View>
                                            </View>
                                            {/* Red Progress Track */}
                                            <View style={styles.cwProgressTrack}>
                                                <View
                                                    style={[
                                                        styles.cwProgressBar,
                                                        { width: `${progress * 100}%` },
                                                    ]}
                                                />
                                            </View>
                                        </View>
                                        <Text style={styles.cwTitle} numberOfLines={1}>
                                            {item.title}
                                        </Text>
                                        <Text style={styles.cwSub}>{sub}</Text>
                                    </Pressable>
                                );
                            }}
                        />
                    </View>
                )}

                {/* --- 5. TOP 10 TODAY (RANKED CAROUSEL) --- */}
                <View style={styles.sectionContainer}>
                    <View style={styles.sectionHeader}>
                        <View style={styles.sectionTitleRow}>
                            <TrendingUp color="#FF2442" size={17} />
                            <Text style={styles.sectionTitle}>Top 10 Today</Text>
                        </View>
                        <View style={styles.trendingBadge}>
                            <Text style={styles.trendingBadgeText}>LIVE RANKING</Text>
                        </View>
                    </View>
                    <FlatList
                        data={trendingMovies.slice(0, 10)}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        keyExtractor={(item) => `top10-${item.id}`}
                        contentContainerStyle={styles.horizontalList}
                        renderItem={({ item, index }) => (
                            <MovieCard item={item} rank={index + 1} showMatch={true} />
                        )}
                    />
                </View>

                {/* --- 6. AI PICKS FOR YOU --- */}
                <View style={styles.sectionContainer}>
                    <View style={styles.sectionHeader}>
                        <View style={styles.sectionTitleRow}>
                            <Sparkles color="#FF2442" size={17} />
                            <Text style={styles.sectionTitle}>{continueWatching && continueWatching.length > 0 ? 'Because You Watched ' + continueWatching[0].title : 'Curated For You'}</Text>
                        </View>
                        <Text style={styles.seeAllText}>Based on taste</Text>
                    </View>
                    <FlatList
                        data={filteredMovies.slice(3, 14)}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        keyExtractor={(item) => `ai-${item.id}`}
                        contentContainerStyle={styles.horizontalList}
                        renderItem={({ item }) => <MovieCard item={item} showMatch={true} />}
                    />
                </View>

                {/* --- 7. TRENDING TV SERIES --- */}
                <View style={styles.sectionContainer}>
                    <View style={styles.sectionHeader}>
                        <View style={styles.sectionTitleRow}>
                            <Tv color="#FF2442" size={17} />
                            <Text style={styles.sectionTitle}>Popular TV Series</Text>
                        </View>
                        <Pressable onPress={() => navigation.navigate('Tv')}>
                            <Text style={styles.seeAllText}>Explore</Text>
                        </Pressable>
                    </View>
                    <FlatList
                        data={trendingTV}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        keyExtractor={(item) => `tv-${item.id}`}
                        contentContainerStyle={styles.horizontalList}
                        renderItem={({ item }) => <MovieCard item={item} />}
                    />
                </View>

                {/* --- 8. BLOCKBUSTER MOVIES --- */}
                <View style={styles.sectionContainer}>
                    <View style={styles.sectionHeader}>
                        <View style={styles.sectionTitleRow}>
                            <Film color="#FF2442" size={17} />
                            <Text style={styles.sectionTitle}>Trending Movies</Text>
                        </View>
                        <Pressable onPress={() => navigation.navigate('Movies')}>
                            <Text style={styles.seeAllText}>More</Text>
                        </Pressable>
                    </View>
                    <FlatList
                        data={trendingMovies.slice(10)}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        keyExtractor={(item) => `movie-${item.id}`}
                        contentContainerStyle={styles.horizontalList}
                        renderItem={({ item }) => <MovieCard item={item} />}
                    />
                </View>
            </ScrollView>

            {/* AI Assistant Interactive Modal */}
            <AIAssistantModal
                visible={aiModalVisible}
                onClose={() => setAiModalVisible(false)}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    mainContainer: {
        flex: 1,
        backgroundColor: '#08090C',
    },
    loadingScreen: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        color: '#98A2B3',
        fontSize: 13,
        marginTop: 14,
        fontWeight: '600',
    },
    scrollContent: {
        paddingTop: 0,
    },
    heroContainer: {
        position: 'relative',
        overflow: 'hidden',
    },
    heroImage: {
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
    },
    aiPickBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 36, 66, 0.16)',
        borderWidth: 1,
        borderColor: 'rgba(255, 36, 66, 0.4)',
        paddingHorizontal: 9,
        paddingVertical: 4,
        borderRadius: 8,
        alignSelf: 'flex-start',
        gap: 6,
        marginBottom: 8,
    },
    aiPickText: {
        color: '#FF2442',
        fontSize: 10.5,
        fontWeight: '800',
        letterSpacing: 0.6,
    },
    heroTitle: {
        color: '#FFFFFF',
        fontSize: 28,
        fontWeight: '900',
        lineHeight: 34,
        letterSpacing: 0.3,
        marginBottom: 8,
    },
    heroMetaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 16,
    },
    matchScorePill: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 36, 66, 0.18)',
        paddingHorizontal: 7,
        paddingVertical: 2.5,
        borderRadius: 6,
        gap: 4,
    },
    matchScoreText: {
        color: '#FF2442',
        fontSize: 11,
        fontWeight: '800',
    },
    heroYear: {
        color: '#D0D5DD',
        fontSize: 12,
        fontWeight: '600',
    },
    ratingBadge: {
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 6,
    },
    ratingBadgeText: {
        color: '#FFC107',
        fontSize: 11,
        fontWeight: '700',
    },
    hdrBadge: {
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.25)',
        paddingHorizontal: 5,
        paddingVertical: 1.5,
        borderRadius: 4,
    },
    hdrBadgeText: {
        color: '#EAECF0',
        fontSize: 9.5,
        fontWeight: '800',
    },
    heroActionsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    heroPlayBtn: {
        borderRadius: 22,
        overflow: 'hidden',
        flex: 1,
        maxWidth: 160,
    },
    heroPlayGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        gap: 8,
    },
    heroPlayText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '800',
        letterSpacing: 0.3,
    },
    heroListBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.15)',
        borderRadius: 22,
        paddingVertical: 11,
        paddingHorizontal: 16,
        gap: 6,
    },
    heroListText: {
        color: '#FFFFFF',
        fontSize: 13,
        fontWeight: '700',
    },
    heroInfoBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.12)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    aiPromptSection: {
        paddingHorizontal: 18,
        marginTop: 10,
        marginBottom: 16,
    },
    aiPromptCard: {
        borderRadius: 20,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255, 36, 66, 0.3)',
    },
    aiPromptGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 14,
    },
    aiPromptLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    aiSparkleBox: {
        width: 38,
        height: 38,
        borderRadius: 12,
        backgroundColor: 'rgba(255, 36, 66, 0.15)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    aiPromptTextBox: {
        flex: 1,
    },
    aiPromptHeadline: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '800',
        letterSpacing: 0.3,
    },
    aiPromptSub: {
        color: '#98A2B3',
        fontSize: 11,
        marginTop: 2,
    },
    aiPromptArrow: {
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: 'rgba(255, 36, 66, 0.12)',
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 10,
    },
    genreRowContainer: {
        marginBottom: 20,
    },
    genreScroll: {
        paddingHorizontal: 18,
        gap: 8,
    },
    genrePill: {
        borderRadius: 18,
        backgroundColor: 'rgba(255, 255, 255, 0.06)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.08)',
        overflow: 'hidden',
    },
    genrePillActive: {
        borderColor: '#FF2442',
    },
    genreGradient: {
        paddingHorizontal: 16,
        paddingVertical: 7,
    },
    genreText: {
        color: '#98A2B3',
        fontSize: 12.5,
        fontWeight: '600',
        paddingHorizontal: 16,
        paddingVertical: 7,
    },
    genreTextActive: {
        color: '#FFFFFF',
        fontSize: 12.5,
        fontWeight: '800',
    },
    sectionContainer: {
        marginBottom: 26,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 18,
        marginBottom: 12,
    },
    sectionTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 7,
    },
    sectionTitle: {
        color: '#FFFFFF',
        fontSize: 17,
        fontWeight: '800',
        letterSpacing: 0.2,
    },
    seeAllText: {
        color: '#FF2442',
        fontSize: 12,
        fontWeight: '700',
    },
    trendingBadge: {
        backgroundColor: 'rgba(255, 36, 66, 0.15)',
        paddingHorizontal: 7,
        paddingVertical: 2,
        borderRadius: 6,
    },
    trendingBadgeText: {
        color: '#FF2442',
        fontSize: 9.5,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    horizontalList: {
        paddingHorizontal: 18,
    },
    cwCard: {
        width: 170,
        marginRight: 14,
    },
    cwImageContainer: {
        width: 170,
        height: 100,
        borderRadius: 14,
        overflow: 'hidden',
        position: 'relative',
        backgroundColor: '#12161F',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.08)',
    },
    cwImage: {
        width: '100%',
        height: '100%',
    },
    cwPlayOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.3)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    cwPlayCircle: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#FF2442',
        justifyContent: 'center',
        alignItems: 'center',
    },
    cwProgressTrack: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 4,
        backgroundColor: 'rgba(255,255,255,0.2)',
    },
    cwProgressBar: {
        height: 4,
        backgroundColor: '#FF2442',
    },
    cwTitle: {
        color: '#FFFFFF',
        fontSize: 12.5,
        fontWeight: '700',
        marginTop: 6,
    },
    cwSub: {
        color: '#FF2442',
        fontSize: 11,
        fontWeight: '600',
        marginTop: 1,
    },
});
