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
import { Play, Plus, Flame, Clock, Check, Info, Sparkles, TrendingUp, ChevronRight } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TopBar } from '../components/TopBar';
import { useAppTheme } from '../theme/ThemeContext';
import { MovieCard } from '../components/MovieCard';
import { getTrendingMovies, getTrendingTV, IMAGE_PATH } from '../services/api';
import { getHistory } from '../services/historyService';
import { isBookmarked, toggleBookmark } from '../services/bookmarksService';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import { isTV } from '../utils/device';

const { width } = Dimensions.get('window');

const GENRES = [
    { id: 0, name: 'All' },
    { id: 28, name: 'Action' },
    { id: 35, name: 'Comedy' },
    { id: 878, name: 'Sci-Fi' },
    { id: 18, name: 'Drama' },
    { id: 27, name: 'Horror' },
    { id: 16, name: 'Animation' },
    { id: 53, name: 'Thriller' },
];

export const HomeScreen = () => {
    const { theme, isDarkMode } = useAppTheme();
    const navigation = useNavigation();
    const isFocused = useIsFocused();
    const insets = useSafeAreaInsets();

    const [trendingMovies, setTrendingMovies] = useState([]);
    const [trendingTV, setTrendingTV] = useState([]);
    const [continueWatching, setContinueWatching] = useState([]);
    const [selectedGenre, setSelectedGenre] = useState(0);
    const [heroBookmarked, setHeroBookmarked] = useState(false);
    const [loading, setLoading] = useState(true);

    const TV_LEFT_OFFSET = 100;
    const HERO_WIDTH = isTV ? width - TV_LEFT_OFFSET : width;

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

    const renderContinueWatching = () => {
        if (!continueWatching || continueWatching.length === 0) {
            return (
                <View style={styles.section}>
                    <View style={styles.sectionHeaderBetween}>
                        <View style={styles.sectionHeaderTitleRow}>
                            <Clock color="#FF3030" size={18} />
                            <Text style={[styles.sectionTitle, { color: theme.colors.onBackground }]}>
                                Continue Watching
                            </Text>
                        </View>
                    </View>
                    <Pressable
                        style={[
                            styles.emptyProgressCard,
                            {
                                backgroundColor: theme.colors.cardBg,
                                borderColor: theme.colors.cardBorder,
                            },
                            isTV && styles.emptyProgressCardTV,
                        ]}
                        onPress={() => navigation.navigate('Movies')}
                    >
                        <View style={styles.emptyProgressIconCircle}>
                            <Clock color="#FF3030" size={20} />
                        </View>
                        <View style={styles.emptyProgressTextWrapper}>
                            <Text style={[styles.emptyProgressTitle, { color: theme.colors.onBackground }]}>
                                No Media in Progress
                            </Text>
                            <Text style={styles.emptyProgressSubtitle} numberOfLines={1} ellipsizeMode="tail">
                                Start streaming movies or series to resume here anytime.
                            </Text>
                        </View>
                        <ChevronRight size={18} color="#8A99A8" />
                    </Pressable>
                </View>
            );
        }

        return (
            <View style={styles.section}>
                <View style={styles.sectionHeaderBetween}>
                    <View style={styles.sectionHeaderTitleRow}>
                        <Clock color="#FF3030" size={18} />
                        <Text style={[styles.sectionTitle, { color: theme.colors.onBackground }]}>
                            Continue Watching
                        </Text>
                    </View>
                    <Pressable
                        style={styles.seeAllBtn}
                        onPress={() => navigation.navigate('Progress')}
                    >
                        <Text style={styles.seeAllText}>View All</Text>
                        <ChevronRight size={14} color="#FF3030" />
                    </Pressable>
                </View>
                <FlatList
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    data={continueWatching}
                    keyExtractor={(item) => `hist-${item.id}-${item.season || 0}-${item.episode || 0}`}
                    contentContainerStyle={{ paddingLeft: 20 }}
                    renderItem={({ item }) => {
                        const progress =
                            item.duration && item.duration > 0
                                ? Math.min(100, Math.max(8, Math.round((item.position / item.duration) * 100)))
                                : 25;

                        const isShow = item.type === 'tv' || Boolean(item.season);

                        return (
                            <Pressable
                                style={({ focused }) => [
                                    styles.continueCard,
                                    {
                                        backgroundColor: theme.colors.cardBg,
                                        borderColor: theme.colors.cardBorder,
                                    },
                                    isTV && styles.continueCardTV,
                                    focused && styles.tvFocusBorder,
                                ]}
                                onPress={() =>
                                    navigation.navigate('Player', {
                                        id: item.id,
                                        type: item.type,
                                        season: item.season,
                                        episode: item.episode,
                                        item,
                                        position: item.position,
                                    })
                                }
                            >
                                <Image
                                    source={{
                                        uri:
                                            item.backdrop ||
                                            (item.backdrop_path ? `${IMAGE_PATH}${item.backdrop_path}` : `${IMAGE_PATH}${item.poster_path}`),
                                    }}
                                    style={styles.continueImage}
                                />

                                {/* Play Overlay Center Badge */}
                                <View style={styles.continuePlayOverlay} pointerEvents="none">
                                    <View style={styles.continuePlayCircle}>
                                        <Play color="#FFFFFF" size={16} fill="#FFFFFF" style={{ marginLeft: 2 }} />
                                    </View>
                                </View>

                                {/* Top Badge for Progress % or Season */}
                                <View style={styles.continueTopRow} pointerEvents="none">
                                    {isShow ? (
                                        <View style={styles.continueTagPill}>
                                            <Text style={styles.continueTagText}>
                                                S{item.season}:E{item.episode}
                                            </Text>
                                        </View>
                                    ) : (
                                        <View style={styles.continueTagPill}>
                                            <Text style={styles.continueTagText}>{progress}%</Text>
                                        </View>
                                    )}
                                </View>

                                <LinearGradient
                                    colors={['transparent', 'rgba(5, 5, 5, 0.94)']}
                                    style={styles.continueGradient}
                                >
                                    <Text style={styles.continueTitle} numberOfLines={1} ellipsizeMode="tail">
                                        {item.title || item.name}
                                    </Text>
                                    {isShow && (
                                        <Text style={styles.continueSubtitle} numberOfLines={1}>
                                            Season {item.season} • Episode {item.episode}
                                        </Text>
                                    )}
                                </LinearGradient>

                                {/* Glowing Red Progress Bar */}
                                <View style={styles.progressBarTrack}>
                                    <LinearGradient
                                        colors={['#FF4565', '#FF3030']}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 0 }}
                                        style={[styles.progressBarFill, { width: `${progress}%` }]}
                                    />
                                </View>
                            </Pressable>
                        );
                    }}
                />
            </View>
        );
    };

    // Netflix-Style Top 10 Row with Giant Bold Numbers
    const renderTop10Section = (data) => {
        const top10 = data.slice(0, 10);
        return (
            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <TrendingUp color="#FF3030" size={18} />
                    <Text style={[styles.sectionTitle, { color: theme.colors.onBackground }]}>
                        Top 10 Today on YouPlex
                    </Text>
                </View>
                <FlatList
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    data={top10}
                    keyExtractor={(item) => `top10-${item.id}`}
                    contentContainerStyle={{ paddingLeft: 20 }}
                    renderItem={({ item, index }) => (
                        <View style={styles.topTenItemContainer}>
                            <Text style={styles.topTenRankNumber}>{index + 1}</Text>
                            <View style={styles.topTenCardOffset}>
                                <MovieCard item={item} />
                            </View>
                        </View>
                    )}
                />
            </View>
        );
    };

    const renderSection = (title, data) => {
        const filteredData = selectedGenre === 0
            ? data
            : data.filter((item) => item.genre_ids?.includes(selectedGenre));

        if (filteredData.length === 0) return null;

        return (
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
                    data={filteredData}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={({ item }) => <MovieCard item={item} />}
                    contentContainerStyle={{ paddingLeft: 20 }}
                />
            </View>
        );
    };

    if (loading)
        return (
            <View style={[styles.centered, { backgroundColor: theme.colors.background }]}>
                <ActivityIndicator size="large" color="#FF3030" />
            </View>
        );

    const hero = trendingMovies[0];

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <TopBar />

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={[
                    isTV && { paddingLeft: TV_LEFT_OFFSET },
                    { paddingBottom: 150 + insets.bottom }
                ]}
            >
                {/* HERO FEATURE BANNER */}
                <ImageBackground
                    source={{ uri: hero?.backdrop }}
                    style={[styles.hero, { width: HERO_WIDTH }, isTV && styles.heroTV]}
                >
                    <LinearGradient
                        colors={
                            isDarkMode
                                ? ['transparent', 'rgba(5,5,5,0.4)', 'rgba(5,5,5,0.85)', '#050505']
                                : ['transparent', 'rgba(244,246,248,0.3)', 'rgba(244,246,248,0.85)', '#F4F6F8']
                        }
                        style={[styles.heroGradient, isTV && { paddingLeft: 44, paddingBottom: 50 }]}
                    >
                        {/* Hero Meta Badges */}
                        <View style={styles.heroMetaRow}>
                            <View style={styles.trendingBadge}>
                                <Flame color="#FF3030" size={14} />
                                <Text style={styles.trendingBadgeText}>#1 TRENDING TODAY</Text>
                            </View>
                            {hero?.rating && (
                                <View style={styles.ratingBadge}>
                                    <Text style={styles.ratingBadgeText}>★ {hero.rating}</Text>
                                </View>
                            )}
                            {hero?.year && (
                                <Text style={styles.yearText}>{hero.year}</Text>
                            )}
                            <View style={styles.hdTag}>
                                <Text style={styles.hdTagText}>4K ULTRA HD</Text>
                            </View>
                        </View>

                        <Text
                            style={[
                                styles.heroTitle,
                                isTV && styles.heroTitleTV,
                                { color: isDarkMode ? '#FFFFFF' : '#111827' },
                            ]}
                            numberOfLines={2}
                        >
                            {hero?.title?.toUpperCase()}
                        </Text>

                        {/* Netflix-Style Hero Action Buttons */}
                        <View style={styles.heroButtons}>
                            <Pressable
                                hasTVPreferredFocus={true}
                                style={({ focused }) => [
                                    styles.playActionWrapper,
                                    focused && styles.tvFocusBorder,
                                ]}
                                onPress={() =>
                                    navigation.navigate('Player', {
                                        id: hero.id,
                                        type: 'movie',
                                        item: hero,
                                    })
                                }
                            >
                                <LinearGradient
                                    colors={['#FF4565', '#FF3030', '#B71833']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={[styles.playButtonGradient, isTV && styles.playButtonGradientTV]}
                                >
                                    <Play color="#FFFFFF" size={isTV ? 26 : 20} fill="#FFFFFF" />
                                    <Text style={[styles.playButtonText, isTV && { fontSize: 20 }]}>
                                        Play Now
                                    </Text>
                                </LinearGradient>
                            </Pressable>

                            {/* + My List Button directly on Hero */}
                            <Pressable
                                style={({ focused }) => [
                                    styles.myListBtn,
                                    heroBookmarked && styles.myListBtnActive,
                                    isTV && styles.detailsButtonTV,
                                    focused && styles.tvFocusBorder,
                                ]}
                                onPress={() => handleToggleHeroBookmark(hero)}
                            >
                                {heroBookmarked ? (
                                    <Check color="#10B981" size={isTV ? 24 : 18} strokeWidth={2.5} />
                                ) : (
                                    <Plus color={isDarkMode ? '#FFFFFF' : '#111827'} size={isTV ? 24 : 18} strokeWidth={2.5} />
                                )}
                                <Text
                                    style={[
                                        styles.detailsButtonText,
                                        { color: heroBookmarked ? '#10B981' : (isDarkMode ? '#FFFFFF' : '#111827') },
                                        isTV && { fontSize: 18 },
                                    ]}
                                >
                                    {heroBookmarked ? 'In List' : 'My List'}
                                </Text>
                            </Pressable>

                            {/* More Info */}
                            <Pressable
                                style={({ focused }) => [
                                    styles.detailsButton,
                                    {
                                        backgroundColor: isDarkMode ? 'rgba(20, 26, 33, 0.85)' : 'rgba(255, 255, 255, 0.85)',
                                        borderColor: theme.colors.outlineVariant,
                                    },
                                    isTV && styles.detailsButtonTV,
                                    focused && styles.tvFocusBorder,
                                ]}
                                onPress={() =>
                                    navigation.navigate('MovieDetail', {
                                        id: hero.id,
                                        type: 'movie',
                                    })
                                }
                            >
                                <Info color={isDarkMode ? '#FFFFFF' : '#111827'} size={isTV ? 24 : 18} />
                                <Text
                                    style={[
                                        styles.detailsButtonText,
                                        { color: isDarkMode ? '#FFFFFF' : '#111827' },
                                        isTV && { fontSize: 18 },
                                    ]}
                                >
                                    Info
                                </Text>
                            </Pressable>
                        </View>
                    </LinearGradient>
                </ImageBackground>

                {/* Genre Filter Pills */}
                <View style={[styles.genreRow, isTV && { paddingLeft: 44 }]}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}>
                        {GENRES.map((g) => {
                            const isSelected = selectedGenre === g.id;
                            return (
                                <Pressable
                                    key={g.id}
                                    onPress={() => setSelectedGenre(g.id)}
                                    style={[
                                        styles.genrePill,
                                        isSelected && styles.genrePillSelected,
                                        { borderColor: isSelected ? '#FF3030' : theme.colors.outlineVariant }
                                    ]}
                                >
                                    <Text
                                        style={[
                                            styles.genrePillText,
                                            isSelected && styles.genrePillTextSelected,
                                            { color: isSelected ? '#FFFFFF' : (isDarkMode ? '#8A99A8' : '#6B7280') }
                                        ]}
                                    >
                                        {g.name}
                                    </Text>
                                </Pressable>
                            );
                        })}
                    </ScrollView>
                </View>

                {/* Content Rows */}
                <View style={styles.contentWrapper}>
                    {renderContinueWatching()}
                    {renderTop10Section(trendingMovies)}
                    {renderSection('Trending Movies', trendingMovies)}
                    {renderSection('Trending TV Shows', trendingTV)}
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
    contentWrapper: {
        marginTop: isTV ? -30 : -10,
    },
    hero: {
        height: 480,
        justifyContent: 'flex-end',
    },
    heroTV: {
        height: 640,
    },
    heroGradient: {
        height: '80%',
        justifyContent: 'flex-end',
        paddingHorizontal: 20,
        paddingBottom: 24,
    },
    heroMetaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 8,
    },
    trendingBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: 'rgba(255, 48, 48, 0.2)',
        borderColor: 'rgba(255, 48, 48, 0.4)',
        borderWidth: 1,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
    },
    trendingBadgeText: {
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
    yearText: {
        color: '#8A99A8',
        fontSize: 12,
        fontWeight: '600',
    },
    hdTag: {
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)',
        paddingHorizontal: 5,
        paddingVertical: 1,
        borderRadius: 4,
    },
    hdTagText: {
        color: '#FFFFFF',
        fontSize: 9,
        fontWeight: '800',
    },
    heroTitle: {
        fontSize: 26,
        fontWeight: '900',
        marginBottom: 16,
        letterSpacing: -0.5,
    },
    heroTitleTV: {
        fontSize: 48,
        marginBottom: 24,
    },
    heroButtons: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    playActionWrapper: {
        borderRadius: 22,
        overflow: 'hidden',
    },
    playButtonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 22,
        gap: 8,
    },
    playButtonGradientTV: {
        paddingHorizontal: 30,
        paddingVertical: 16,
    },
    playButtonText: {
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
    detailsButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 22,
        borderWidth: 1.2,
        gap: 6,
    },
    detailsButtonTV: {
        paddingHorizontal: 24,
        paddingVertical: 16,
    },
    detailsButtonText: {
        fontSize: 13,
        fontWeight: '800',
    },
    genreRow: {
        marginVertical: 14,
    },
    genrePill: {
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderRadius: 16,
        borderWidth: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.04)',
    },
    genrePillSelected: {
        backgroundColor: '#FF3030',
    },
    genrePillText: {
        fontSize: 12,
        fontWeight: '700',
    },
    genrePillTextSelected: {
        fontWeight: '900',
    },
    section: {
        marginTop: 20,
        marginBottom: 8,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginBottom: 12,
        gap: 8,
    },
    sectionHeaderBetween: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        marginBottom: 12,
    },
    sectionHeaderTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    seeAllBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
        paddingVertical: 4,
        paddingHorizontal: 8,
    },
    seeAllText: {
        color: '#FF3030',
        fontSize: 12,
        fontWeight: '800',
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
    topTenItemContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 6,
        position: 'relative',
    },
    topTenRankNumber: {
        fontSize: 90,
        fontWeight: '900',
        color: '#FF3030',
        opacity: 0.85,
        marginRight: -22,
        zIndex: 1,
        fontStyle: 'italic',
        textShadowColor: 'rgba(0, 0, 0, 0.9)',
        textShadowOffset: { width: 3, height: 3 },
        textShadowRadius: 6,
    },
    topTenCardOffset: {
        zIndex: 2,
    },
    continueCard: {
        width: 230,
        height: 135,
        borderRadius: 14,
        overflow: 'hidden',
        marginRight: 14,
        borderWidth: 1.2,
        position: 'relative',
    },
    continueCardTV: {
        width: 320,
        height: 180,
    },
    continueImage: {
        width: '100%',
        height: '100%',
    },
    continuePlayOverlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 3,
    },
    continuePlayCircle: {
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: 'rgba(255, 48, 48, 0.88)',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.4,
        shadowRadius: 4,
    },
    continueTopRow: {
        position: 'absolute',
        top: 8,
        right: 8,
        zIndex: 4,
    },
    continueTagPill: {
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        paddingHorizontal: 7,
        paddingVertical: 2,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    continueTagText: {
        color: '#FFFFFF',
        fontSize: 10,
        fontWeight: '800',
    },
    continueGradient: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '65%',
        justifyContent: 'flex-end',
        padding: 10,
        zIndex: 2,
    },
    continueTitle: {
        color: '#FFFFFF',
        fontSize: 13,
        fontWeight: '800',
    },
    continueSubtitle: {
        color: '#FF4D4D',
        fontSize: 11,
        fontWeight: '700',
        marginTop: 2,
    },
    progressBarTrack: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 4,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        zIndex: 5,
    },
    progressBarFill: {
        height: '100%',
    },
    emptyProgressCard: {
        marginHorizontal: 20,
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 16,
        borderWidth: 1.2,
        gap: 12,
    },
    emptyProgressCardTV: {
        marginRight: 60,
    },
    emptyProgressIconCircle: {
        width: 42,
        height: 42,
        borderRadius: 21,
        backgroundColor: 'rgba(255, 48, 48, 0.12)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 48, 48, 0.3)',
    },
    emptyProgressTextWrapper: {
        flex: 1,
    },
    emptyProgressTitle: {
        fontSize: 14,
        fontWeight: '800',
        marginBottom: 2,
    },
    emptyProgressSubtitle: {
        color: '#8A99A8',
        fontSize: 12,
    },
    tvFocusBorder: {
        borderWidth: 3,
        borderColor: '#FF3030',
        shadowColor: '#FF3030',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 16,
        elevation: 10,
        transform: [{ scale: 1.05 }],
    },
});
