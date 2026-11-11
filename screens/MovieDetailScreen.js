import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    View,
    ScrollView,
    Image,
    ActivityIndicator,
    Pressable,
    FlatList,
    Dimensions,
    Share,
} from 'react-native';
import { Text } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
    ChevronLeft,
    Play,
    Plus,
    Check,
    Share2,
    Star,
    Flame,
    Clock,
    Server,
    DownloadCloud,
} from 'lucide-react-native';
import { useAppTheme } from '../theme/ThemeContext';
import { DetailSkeleton } from '../components/SkeletonLoader';
import { getDetails, getSeasonDetails, getCredits, IMAGE_PATH } from '../services/api';
import { isBookmarked, toggleBookmark } from '../services/bookmarksService';
import { isTV } from '../utils/device';

const { width, height } = Dimensions.get('window');

export const MovieDetailScreen = ({ navigation, route }) => {
    const { theme } = useAppTheme();
    const insets = useSafeAreaInsets();
    const { id, type = 'movie' } = route.params;

    const [item, setItem] = useState(null);
    const [cast, setCast] = useState([]);
    const [episodes, setEpisodes] = useState([]);
    const [selectedSeason, setSelectedSeason] = useState(1);
    const [loading, setLoading] = useState(true);
    const [epLoading, setEpLoading] = useState(false);
    const [bookmarked, setBookmarked] = useState(false);
    const [readMore, setReadMore] = useState(false);

    useEffect(() => {
        loadData();
        isBookmarked(id).then(setBookmarked);
    }, [id]);

    const loadData = async () => {
        try {
            const [details, creditsData] = await Promise.all([
                getDetails(id, type),
                getCredits(id, type),
            ]);
            setItem(details);
            setCast(creditsData?.cast?.slice(0, 15) || []);

            if (type === 'tv' && details?.seasons?.length > 0) {
                // Filter out season 0 (specials) if regular seasons exist
                const validSeasons = details.seasons.filter((s) => s.season_number > 0);
                const firstSeasonNum = validSeasons[0]?.season_number || details.seasons[0].season_number || 1;
                setSelectedSeason(firstSeasonNum);
                loadSeason(firstSeasonNum);
            }
        } catch (error) {
            console.error('Fetch Error:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadSeason = async (num) => {
        setEpLoading(true);
        const data = await getSeasonDetails(id, num);
        setEpisodes(data?.episodes || []);
        setEpLoading(false);
    };

    const handleSelectSeason = (seasonNum) => {
        setSelectedSeason(seasonNum);
        loadSeason(seasonNum);
    };

    const handleToggleBookmark = async () => {
        if (!item) return;
        const newState = await toggleBookmark({
            ...item,
            media_type: type,
        });
        setBookmarked(newState);
    };

    const handleShare = async () => {
        if (!item) return;
        try {
            await Share.share({
                message: `Check out ${item.title || item.name} on YouPlex!`,
            });
        } catch (e) {}
    };

    if (loading) {
        return <DetailSkeleton />;
    }

    if (!item) {
        return (
            <View style={[styles.centered, { backgroundColor: '#08090C' }]}>
                <Text style={{ color: '#FFFFFF' }}>Content not found.</Text>
            </View>
        );
    }

    const backdropUri = item.backdrop_path
        ? `https://image.tmdb.org/t/p/original${item.backdrop_path}`
        : item.poster_path
        ? `${IMAGE_PATH}${item.poster_path}`
        : 'https://via.placeholder.com/1280x720';

    const displayTitle = item.title || item.name || '';
    const releaseYear = (item.release_date || item.first_air_date || '').split('-')[0] || '';
    const ratingVal = item.vote_average ? item.vote_average.toFixed(1) : '8.2';
    const runtimeStr = item.runtime
        ? `${Math.floor(item.runtime / 60)}h ${item.runtime % 60}m`
        : item.episode_run_time?.[0]
        ? `${item.episode_run_time[0]}m/ep`
        : '120m';

    const genresList = item.genres?.map((g) => g.name).slice(0, 3).join(' • ') || 'Feature';
    const seasons = (item.seasons || []).filter((s) => s.season_number > 0);

    return (
        <View style={styles.container}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 60 + insets.bottom }}
            >
                {/* --- 1. HERO BACKDROP BANNER --- */}
                <View style={styles.backdropContainer}>
                    <Image source={{ uri: backdropUri }} style={styles.backdropImage} />

                    {/* Multi-step gradient fade */}
                    <LinearGradient
                        colors={[
                            'rgba(8, 9, 12, 0.45)',
                            'transparent',
                            'rgba(8, 9, 12, 0.7)',
                            '#08090C',
                        ]}
                        style={styles.backdropGradient}
                    />

                    {/* Floating Controls Header */}
                    <View
                        style={[
                            styles.topNavRow,
                            { top: Math.max(insets.top + 8, 38) },
                        ]}
                    >
                        <Pressable onPress={() => navigation.goBack()} style={styles.navCircleBtn}>
                            <ChevronLeft color="#FFFFFF" size={22} />
                        </Pressable>

                        <View style={styles.topRightActions}>
                            <Pressable onPress={handleShare} style={styles.navCircleBtn}>
                                <Share2 color="#FFFFFF" size={18} />
                            </Pressable>
                            <Pressable onPress={handleToggleBookmark} style={styles.navCircleBtn}>
                                {bookmarked ? (
                                    <Check color="#FF2442" size={20} />
                                ) : (
                                    <Plus color="#FFFFFF" size={20} />
                                )}
                            </Pressable>
                        </View>
                    </View>

                    {/* Hero Title & Primary Tag */}
                    <View style={styles.heroInfoOverlay}>
                        <View style={styles.matchBadgeRow}>
                            <View style={styles.matchBadge}>
                                <Flame color="#FF2442" size={13} />
                                <Text style={styles.matchText}>99% Match by AI</Text>
                            </View>
                            <View style={styles.qualityTag}>
                                <Text style={styles.qualityText}>4K ULTRA HD</Text>
                            </View>
                        </View>

                        <Text style={styles.detailTitle}>{displayTitle}</Text>

                        {/* Metadata Row */}
                        <View style={styles.metaRow}>
                            <Text style={styles.metaItem}>{releaseYear}</Text>
                            <Text style={styles.metaDot}>•</Text>
                            <View style={styles.ratingBox}>
                                <Star color="#FFC107" size={13} fill="#FFC107" />
                                <Text style={styles.ratingText}>{ratingVal}</Text>
                            </View>
                            <Text style={styles.metaDot}>•</Text>
                            <Text style={styles.metaItem}>{runtimeStr}</Text>
                            <Text style={styles.metaDot}>•</Text>
                            <View style={styles.pgBadge}>
                                <Text style={styles.pgBadgeText}>
                                    {type === 'tv' ? 'TV-MA' : 'PG-13'}
                                </Text>
                            </View>
                        </View>

                        <Text style={styles.genresText}>{genresList}</Text>
                    </View>
                </View>

                {/* --- 2. ACTION BUTTONS --- */}
                <View style={styles.actionsContainer}>
                    {/* Primary Watch Now Button */}
                    <Pressable
                        onPress={() =>
                            navigation.navigate('Player', {
                                id,
                                type,
                                item,
                                season: selectedSeason,
                                episode: 1,
                            })
                        }
                        style={styles.mainPlayBtn}
                    >
                        <LinearGradient
                            colors={['#FF3B56', '#FF1E3C', '#B3001E']}
                            style={styles.mainPlayGradient}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                        >
                            <Play color="#FFFFFF" size={20} fill="#FFFFFF" />
                            <Text style={styles.mainPlayText}>
                                {type === 'tv'
                                    ? `Watch Season ${selectedSeason} • Episode 1`
                                    : 'Watch Movie Now'}
                            </Text>
                        </LinearGradient>
                    </Pressable>

                    {/* Secondary Watchlist & Server Indicator */}
                    <View style={styles.secondaryActionsRow}>
                        <Pressable
                            onPress={handleToggleBookmark}
                            style={[styles.secondaryActionBtn, bookmarked && styles.bookmarkedActive]}
                        >
                            {bookmarked ? (
                                <Check color="#FF2442" size={18} />
                            ) : (
                                <Plus color="#D0D5DD" size={18} />
                            )}
                            <Text
                                style={[
                                    styles.secondaryActionText,
                                    bookmarked && { color: '#FF2442' },
                                ]}
                            >
                                {bookmarked ? 'In Watchlist' : 'Add to Watchlist'}
                            </Text>
                        </Pressable>

                        <View style={styles.serverInfoPill}>
                            <Server color="#FF2442" size={15} />
                            <Text style={styles.serverInfoText}>Vyla SDK Primary • Auto-Failover</Text>
                        </View>
                    </View>
                </View>

                {/* --- 3. STORYLINE SYNOPSIS --- */}
                <View style={styles.section}>
                    <Text style={styles.sectionHeader}>Storyline</Text>
                    <Text
                        style={styles.overviewText}
                        numberOfLines={readMore ? undefined : 4}
                    >
                        {item.overview || 'No synopsis provided for this title.'}
                    </Text>
                    {item.overview && item.overview.length > 180 && (
                        <Pressable onPress={() => setReadMore(!readMore)}>
                            <Text style={styles.readMoreBtn}>
                                {readMore ? 'Show Less' : 'Read More'}
                            </Text>
                        </Pressable>
                    )}
                </View>

                {/* --- 4. TV SEASONS & EPISODES (IF TV SHOW) --- */}
                {type === 'tv' && (
                    <View style={styles.section}>
                        <Text style={styles.sectionHeader}>Episodes</Text>

                        {/* Season selector horizontal chips */}
                        {seasons.length > 0 && (
                            <ScrollView
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                contentContainerStyle={styles.seasonsScroll}
                            >
                                {seasons.map((s) => {
                                    const isSelected = selectedSeason === s.season_number;
                                    return (
                                        <Pressable
                                            key={s.id}
                                            onPress={() => handleSelectSeason(s.season_number)}
                                            style={[
                                                styles.seasonPill,
                                                isSelected && styles.seasonPillActive,
                                            ]}
                                        >
                                            <Text
                                                style={[
                                                    styles.seasonPillText,
                                                    isSelected && styles.seasonPillTextActive,
                                                ]}
                                            >
                                                Season {s.season_number}
                                            </Text>
                                        </Pressable>
                                    );
                                })}
                            </ScrollView>
                        )}

                        {/* Episodes List */}
                        {epLoading ? (
                            <ActivityIndicator size="small" color="#FF2442" style={{ marginVertical: 20 }} />
                        ) : (
                            <View style={styles.episodesList}>
                                {episodes.map((ep) => (
                                    <Pressable
                                        key={ep.id}
                                        style={styles.episodeCard}
                                        onPress={() =>
                                            navigation.navigate('Player', {
                                                id,
                                                type: 'tv',
                                                item,
                                                season: selectedSeason,
                                                episode: ep.episode_number,
                                            })
                                        }
                                    >
                                        <View style={styles.episodeThumbWrapper}>
                                            <Image
                                                source={{
                                                    uri: ep.still_path
                                                        ? `https://image.tmdb.org/t/p/w300${ep.still_path}`
                                                        : backdropUri,
                                                }}
                                                style={styles.episodeThumb}
                                            />
                                            <View style={styles.epPlayOverlay}>
                                                <View style={styles.epPlayIconCircle}>
                                                    <Play color="#FFFFFF" size={13} fill="#FFFFFF" />
                                                </View>
                                            </View>
                                        </View>
                                        <View style={styles.episodeInfo}>
                                            <View style={styles.episodeTitleRow}>
                                                <Text style={styles.episodeNumber}>
                                                    EP {ep.episode_number}
                                                </Text>
                                                <Text style={styles.episodeRuntime}>
                                                    {ep.runtime ? `${ep.runtime}m` : '45m'}
                                                </Text>
                                            </View>
                                            <Text style={styles.episodeTitle} numberOfLines={1}>
                                                {ep.name || `Episode ${ep.episode_number}`}
                                            </Text>
                                            <Text style={styles.episodeOverview} numberOfLines={2}>
                                                {ep.overview || 'No episode description available.'}
                                            </Text>
                                        </View>
                                    </Pressable>
                                ))}
                            </View>
                        )}
                    </View>
                )}

                {/* --- 5. CAST & CREW --- */}
                {cast && cast.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionHeader}>Top Cast</Text>
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.castScroll}
                        >
                            {cast.map((actor) => (
                                <View key={actor.id} style={styles.castCard}>
                                    <Image
                                        source={{
                                            uri: actor.profile_path
                                                ? `https://image.tmdb.org/t/p/w185${actor.profile_path}`
                                                : 'https://via.placeholder.com/150',
                                        }}
                                        style={styles.castAvatar}
                                    />
                                    <Text style={styles.castName} numberOfLines={1}>
                                        {actor.name}
                                    </Text>
                                    <Text style={styles.castRole} numberOfLines={1}>
                                        {actor.character || 'Cast'}
                                    </Text>
                                </View>
                            ))}
                        </ScrollView>
                    </View>
                )}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#08090C',
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        color: '#98A2B3',
        fontSize: 13,
        marginTop: 12,
    },
    backdropContainer: {
        width: '100%',
        height: height * 0.52,
        position: 'relative',
        justifyContent: 'flex-end',
    },
    backdropImage: {
        width: '100%',
        height: '100%',
        position: 'absolute',
    },
    backdropGradient: {
        ...StyleSheet.absoluteFillObject,
    },
    topNavRow: {
        position: 'absolute',
        left: 18,
        right: 18,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        zIndex: 10,
    },
    topRightActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    navCircleBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(15, 18, 23, 0.75)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.12)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    heroInfoOverlay: {
        paddingHorizontal: 20,
        paddingBottom: 16,
    },
    matchBadgeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 8,
    },
    matchBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 36, 66, 0.16)',
        borderWidth: 1,
        borderColor: 'rgba(255, 36, 66, 0.35)',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
        gap: 4,
    },
    matchText: {
        color: '#FF2442',
        fontSize: 11,
        fontWeight: '800',
    },
    qualityTag: {
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        paddingHorizontal: 7,
        paddingVertical: 3,
        borderRadius: 6,
    },
    qualityText: {
        color: '#EAECF0',
        fontSize: 9.5,
        fontWeight: '800',
    },
    detailTitle: {
        color: '#FFFFFF',
        fontSize: 26,
        fontWeight: '900',
        lineHeight: 32,
        marginBottom: 8,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 7,
        marginBottom: 6,
    },
    metaItem: {
        color: '#D0D5DD',
        fontSize: 12.5,
        fontWeight: '600',
    },
    metaDot: {
        color: '#667085',
        fontSize: 12,
    },
    ratingBox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    ratingText: {
        color: '#FFC107',
        fontSize: 12.5,
        fontWeight: '800',
    },
    pgBadge: {
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)',
        paddingHorizontal: 5,
        paddingVertical: 1,
        borderRadius: 4,
    },
    pgBadgeText: {
        color: '#D0D5DD',
        fontSize: 10,
        fontWeight: '700',
    },
    genresText: {
        color: '#98A2B3',
        fontSize: 12,
        fontWeight: '500',
    },
    actionsContainer: {
        paddingHorizontal: 20,
        marginTop: 10,
        marginBottom: 24,
    },
    mainPlayBtn: {
        borderRadius: 20,
        overflow: 'hidden',
        marginBottom: 12,
        shadowColor: '#FF2442',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
        elevation: 8,
    },
    mainPlayGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 15,
        gap: 9,
    },
    mainPlayText: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '800',
        letterSpacing: 0.3,
    },
    secondaryActionsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    secondaryActionBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#141821',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.08)',
        borderRadius: 16,
        paddingVertical: 11,
        gap: 6,
    },
    bookmarkedActive: {
        borderColor: 'rgba(255, 36, 66, 0.4)',
        backgroundColor: 'rgba(255, 36, 66, 0.1)',
    },
    secondaryActionText: {
        color: '#D0D5DD',
        fontSize: 12.5,
        fontWeight: '700',
    },
    serverInfoPill: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#141821',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.08)',
        borderRadius: 16,
        paddingHorizontal: 12,
        paddingVertical: 11,
        gap: 6,
    },
    serverInfoText: {
        color: '#98A2B3',
        fontSize: 11,
        fontWeight: '600',
    },
    section: {
        paddingHorizontal: 20,
        marginBottom: 24,
    },
    sectionHeader: {
        color: '#FFFFFF',
        fontSize: 17,
        fontWeight: '800',
        marginBottom: 10,
        letterSpacing: 0.2,
    },
    overviewText: {
        color: '#D0D5DD',
        fontSize: 13.5,
        lineHeight: 21,
    },
    readMoreBtn: {
        color: '#FF2442',
        fontSize: 13,
        fontWeight: '700',
        marginTop: 6,
    },
    seasonsScroll: {
        gap: 8,
        marginBottom: 16,
    },
    seasonPill: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 14,
        backgroundColor: '#141821',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.08)',
    },
    seasonPillActive: {
        backgroundColor: 'rgba(255, 36, 66, 0.18)',
        borderColor: '#FF2442',
    },
    seasonPillText: {
        color: '#98A2B3',
        fontSize: 12.5,
        fontWeight: '600',
    },
    seasonPillTextActive: {
        color: '#FF2442',
        fontWeight: '800',
    },
    episodesList: {
        gap: 12,
    },
    episodeCard: {
        flexDirection: 'row',
        backgroundColor: '#0F1217',
        borderRadius: 16,
        padding: 10,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.06)',
        alignItems: 'center',
    },
    episodeThumbWrapper: {
        width: 90,
        height: 60,
        borderRadius: 10,
        overflow: 'hidden',
        position: 'relative',
        backgroundColor: '#1A202C',
    },
    episodeThumb: {
        width: '100%',
        height: '100%',
    },
    epPlayOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.35)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    epPlayIconCircle: {
        width: 26,
        height: 26,
        borderRadius: 13,
        backgroundColor: '#FF2442',
        justifyContent: 'center',
        alignItems: 'center',
    },
    episodeInfo: {
        flex: 1,
        marginLeft: 12,
    },
    episodeTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 3,
    },
    episodeNumber: {
        color: '#FF2442',
        fontSize: 11,
        fontWeight: '800',
    },
    episodeRuntime: {
        color: '#667085',
        fontSize: 11,
    },
    episodeTitle: {
        color: '#FFFFFF',
        fontSize: 13,
        fontWeight: '700',
        marginBottom: 3,
    },
    episodeOverview: {
        color: '#98A2B3',
        fontSize: 11,
        lineHeight: 15,
    },
    castScroll: {
        gap: 14,
    },
    castCard: {
        width: 76,
        alignItems: 'center',
    },
    castAvatar: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#1E2533',
        marginBottom: 6,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.08)',
    },
    castName: {
        color: '#FFFFFF',
        fontSize: 11,
        fontWeight: '700',
        textAlign: 'center',
    },
    castRole: {
        color: '#98A2B3',
        fontSize: 10,
        textAlign: 'center',
        marginTop: 1,
    },
});

