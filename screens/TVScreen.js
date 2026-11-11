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
    getAiringTodayTV,
    getPopularTV,
    getTopRatedTV,
    IMAGE_PATH,
} from '../services/api';
import { Play, Plus, Info, Tv, Sparkles, Check, Flame } from 'lucide-react-native';
import { isBookmarked, toggleBookmark } from '../services/bookmarksService';
import { TopBar } from '../components/TopBar';
import { ScreenSkeleton } from '../components/SkeletonLoader';
import { isTV } from '../utils/device';

const { width, height } = Dimensions.get('window');

export const TVScreen = () => {
    const { theme } = useAppTheme();
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();
    const [sections, setSections] = useState({
        airingToday: [],
        popular: [],
        topRated: [],
    });
    const [loading, setLoading] = useState(true);
    const [heroBookmarked, setHeroBookmarked] = useState(false);

    const TV_LEFT_OFFSET = 100;
    const CONTENT_WIDTH = isTV ? width - TV_LEFT_OFFSET : width;
    const HERO_HEIGHT = isTV ? height * 0.72 : Math.min(height * 0.58, 480);

    useEffect(() => {
        const loadTVShows = async () => {
            try {
                const [airing, popular, top] = await Promise.all([
                    getAiringTodayTV(),
                    getPopularTV(),
                    getTopRatedTV(),
                ]);

                const format = (data) =>
                    data?.map((m) => ({
                        id: m.id,
                        title: m.name,
                        image: `${IMAGE_PATH}${m.poster_path}`,
                        backdrop: m.backdrop_path
                            ? `https://image.tmdb.org/t/p/original${m.backdrop_path}`
                            : `${IMAGE_PATH}${m.poster_path}`,
                        rating: m.vote_average?.toFixed(1),
                        year: (m.first_air_date || '').split('-')[0],
                        media_type: 'tv',
                    })) || [];

                const formattedPopular = format(popular);
                setSections({
                    airingToday: format(airing),
                    popular: formattedPopular,
                    topRated: format(top),
                });
                if (formattedPopular.length > 0) {
                    isBookmarked(formattedPopular[0].id).then(setHeroBookmarked);
                }
            } catch (error) {
                console.error('Failed to load TV shows:', error);
            } finally {
                setLoading(false);
            }
        };
        loadTVShows();
    }, []);

    const handleToggleHeroBookmark = async (hero) => {
        if (!hero) return;
        const newState = await toggleBookmark({
            ...hero,
            media_type: 'tv',
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
                keyExtractor={(item) => `tv-${item.id}`}
                renderItem={({ item }) => <MovieCard item={item} />}
                contentContainerStyle={{ paddingLeft: 18 }}
                removeClippedSubviews={Platform.OS === 'android'}
            />
        </View>
    );

    if (loading) return <ScreenSkeleton />;

    const heroShow = sections.popular[0];

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
                {heroShow && (
                    <View style={[styles.heroWrapper, { width: CONTENT_WIDTH, height: HERO_HEIGHT }]}>
                        <ImageBackground
                            source={{ uri: heroShow.backdrop }}
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
                                        <Text style={styles.cinemaBadgeText}>FEATURED SERIES</Text>
                                    </View>
                                    <View style={styles.matchScorePill}>
                                        <Flame color="#FF2442" size={12} />
                                        <Text style={styles.matchScoreText}>99% Match</Text>
                                    </View>
                                    {heroShow.rating && (
                                        <View style={styles.ratingBadge}>
                                            <Text style={styles.ratingBadgeText}>★ {heroShow.rating}</Text>
                                        </View>
                                    )}
                                    <View style={styles.hdrBadge}>
                                        <Text style={styles.hdrBadgeText}>4K HDR</Text>
                                    </View>
                                </View>

                                {/* TV Show Title */}
                                <Text
                                    style={[styles.heroTitle, isTV && styles.heroTitleTV]}
                                    numberOfLines={2}
                                >
                                    {heroShow.title}
                                </Text>

                                {/* Action Buttons Row */}
                                <View style={styles.heroButtons}>
                                    <Pressable
                                        style={styles.playBtnContainer}
                                        onPress={() =>
                                            navigation.navigate('Player', {
                                                id: heroShow.id,
                                                type: 'tv',
                                                item: heroShow,
                                                season: 1,
                                                episode: 1,
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

                                    {/* Watchlist Toggle */}
                                    <Pressable
                                        style={[
                                            styles.myListBtn,
                                            heroBookmarked && styles.myListBtnActive,
                                        ]}
                                        onPress={() => handleToggleHeroBookmark(heroShow)}
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
                                                id: heroShow.id,
                                                type: 'tv',
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

                {/* Series Rows */}
                <View style={styles.rowsContainer}>
                    {renderRow('Popular TV Shows', sections.popular.slice(1))}
                    {renderRow('Airing Today', sections.airingToday)}
                    {renderRow('Critically Acclaimed TV', sections.topRated)}
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
    playBtnContainer: {
        borderRadius: 22,
        overflow: 'hidden',
    },
    playBtnGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 22,
        gap: 8,
    },
    playBtnGradientTV: {
        paddingHorizontal: 28,
        paddingVertical: 14,
    },
    playBtnText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    infoBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#141821',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    rowsContainer: {
        marginTop: 14,
    },
    section: {
        marginBottom: 24,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 18,
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
