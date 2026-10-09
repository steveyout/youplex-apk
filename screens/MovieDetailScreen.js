import React, { useState, useEffect, useRef } from 'react';
import {
    StyleSheet, View, ScrollView, Image, ActivityIndicator,
    Pressable, FlatList, Platform, Dimensions
} from 'react-native';
import { Text, Button, Surface, Chip } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import RNPickerSelect from 'react-native-picker-select';
import { useAppTheme } from '../theme/ThemeContext';
import { ChevronLeft, PlayCircle, ListFilter, Users, ChevronDown, Plus, Check, Play, Share2 } from 'lucide-react-native';
import { getDetails, getSeasonDetails, getCredits, IMAGE_PATH } from '../services/api';
import { isBookmarked, toggleBookmark } from '../services/bookmarksService';
import { isTV } from '../utils/device';

const { width, height } = Dimensions.get('window');

export const MovieDetailScreen = ({ navigation, route }) => {
    const { theme, isDarkMode } = useAppTheme();
    const insets = useSafeAreaInsets();
    const [item, setItem] = useState(null);
    const [cast, setCast] = useState([]);
    const [episodes, setEpisodes] = useState([]);
    const [selectedSeason, setSelectedSeason] = useState(1);
    const [loading, setLoading] = useState(true);
    const [epLoading, setEpLoading] = useState(false);
    const [bookmarked, setBookmarked] = useState(false);

    const pickerRef = useRef(null);
    const { id, type = 'movie' } = route.params;

    useEffect(() => {
        loadData();
        isBookmarked(id).then(setBookmarked);
    }, [id]);

    const loadData = async () => {
        try {
            const [details, creditsData] = await Promise.all([
                getDetails(id, type),
                getCredits(id, type)
            ]);
            setItem(details);
            setCast(creditsData?.cast?.slice(0, 15) || []);
            if (type === 'tv' && details?.seasons?.length > 0) {
                const firstSeasonNum = details.seasons[0].season_number || 1;
                setSelectedSeason(firstSeasonNum);
                loadSeason(firstSeasonNum);
            }
        } catch (error) {
            console.error("Fetch Error:", error);
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

    const handleToggleBookmark = async () => {
        if (!item) return;
        const newState = await toggleBookmark({
            ...item,
            media_type: type,
        });
        setBookmarked(newState);
    };

    if (loading) return (
        <View style={[styles.centered, { backgroundColor: theme.colors.background }]}>
            <ActivityIndicator size="large" color="#FF3030" />
        </View>
    );

    if (!item) return (
        <View style={[styles.centered, { backgroundColor: theme.colors.background }]}>
            <Text style={{ color: theme.colors.onBackground }}>Content not found.</Text>
        </View>
    );

    const backdropUri = item.backdrop_path
        ? `${IMAGE_PATH}${item.backdrop_path}`
        : item.poster_path
        ? `${IMAGE_PATH}${item.poster_path}`
        : 'https://via.placeholder.com/1280x720';

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={[
                    isTV && styles.tvScrollContent,
                    { paddingBottom: 100 + insets.bottom }
                ]}
            >
                {/* BACKDROP HEADER */}
                <View style={[styles.header, isTV && styles.headerTV]}>
                    <Image
                        source={{ uri: backdropUri }}
                        style={styles.backdrop}
                    />
                    <LinearGradient
                        colors={isTV
                            ? ['rgba(0,0,0,0.85)', 'rgba(0,0,0,0.4)', theme.colors.background]
                            : ['rgba(0,0,0,0.7)', 'transparent', theme.colors.background]
                        }
                        style={styles.gradient}
                        start={isTV ? { x: 0, y: 0.5 } : { x: 0.5, y: 0 }}
                        end={isTV ? { x: 1, y: 0.5 } : { x: 0.5, y: 1 }}
                    />

                    {/* Back Button with notch safe area */}
                    <Pressable
                        style={({ focused }) => [
                            styles.backButton,
                            { top: isTV ? 40 : Math.max(insets.top + 10, 36) },
                            focused && styles.tvFocusBorder,
                        ]}
                        onPress={() => navigation.goBack()}
                    >
                        <ChevronLeft color="white" size={isTV ? 32 : 24} />
                    </Pressable>
                </View>

                {/* MAIN CONTENT AREA */}
                <View style={[styles.content, isTV && styles.contentTV]}>

                    {/* LEFT COLUMN: Metadata & Actions */}
                    <View style={isTV ? styles.tvMainColumn : null}>
                        <Text style={[styles.title, isTV && styles.titleTV, { color: isDarkMode ? '#FFFFFF' : '#111827' }]}>
                            {item.title || item.name}
                        </Text>

                        {/* Meta Tags: Rating, Year, Duration */}
                        <View style={styles.metaRow}>
                            {item.vote_average ? (
                                <View style={styles.ratingBadge}>
                                    <Text style={styles.ratingBadgeText}>★ {item.vote_average.toFixed(1)}</Text>
                                </View>
                            ) : null}
                            <Text style={styles.metaText}>
                                {(item.release_date || item.first_air_date || '').split('-')[0]}
                            </Text>
                            {item.runtime ? (
                                <Text style={styles.metaText}>{Math.floor(item.runtime / 60)}h {item.runtime % 60}m</Text>
                            ) : null}
                            <View style={styles.hdPill}>
                                <Text style={styles.hdPillText}>4K ULTRA HD</Text>
                            </View>
                        </View>

                        {/* Genres */}
                        <View style={styles.tagContainer}>
                            {item.genres?.map((genre) => (
                                <View
                                    key={genre.id}
                                    style={[styles.tag, { backgroundColor: isDarkMode ? 'rgba(255, 48, 48, 0.14)' : 'rgba(255, 48, 48, 0.08)', borderColor: 'rgba(255, 48, 48, 0.25)' }]}
                                >
                                    <Text style={styles.tagText}>{genre.name}</Text>
                                </View>
                            ))}
                        </View>

                        {/* Overview */}
                        <Text style={[styles.overview, isTV && styles.overviewTV, { color: isDarkMode ? '#C4CDD5' : '#4B5563' }]}>
                            {item.overview}
                        </Text>

                        {/* ACTION ROW: Watch Now & Netflix My List Button */}
                        <View style={styles.actionRow}>
                            {type === 'movie' && (
                                <Pressable
                                    hasTVPreferredFocus={true}
                                    style={({ focused }) => [
                                        styles.mainPlayBtn,
                                        focused && styles.tvFocusScale
                                    ]}
                                    onPress={() => navigation.navigate('Player', {
                                        id: item.id, type: 'movie', item: item
                                    })}
                                >
                                    <LinearGradient
                                        colors={['#FF4565', '#FF3030', '#B71833']}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 0 }}
                                        style={styles.playBtnGradient}
                                    >
                                        <Play color="#FFFFFF" size={20} fill="#FFFFFF" />
                                        <Text style={styles.playBtnText}>WATCH NOW</Text>
                                    </LinearGradient>
                                </Pressable>
                            )}

                            {/* Netflix-Style "My List" Toggle Button */}
                            <Pressable
                                style={({ focused }) => [
                                    styles.myListBtn,
                                    bookmarked && styles.myListBtnActive,
                                    focused && styles.tvFocusScale,
                                ]}
                                onPress={handleToggleBookmark}
                            >
                                {bookmarked ? (
                                    <Check color="#10B981" size={isTV ? 24 : 18} strokeWidth={2.5} />
                                ) : (
                                    <Plus color="#FFFFFF" size={isTV ? 24 : 18} strokeWidth={2.5} />
                                )}
                                <Text
                                    style={[
                                        styles.myListBtnText,
                                        bookmarked && { color: '#10B981' }
                                    ]}
                                >
                                    {bookmarked ? 'In My List' : 'My List'}
                                </Text>
                            </Pressable>
                        </View>

                        {/* CAST SECTION */}
                        <View style={styles.section}>
                            <View style={styles.sectionHeader}>
                                <Users size={isTV ? 28 : 18} color="#FF3030" style={{ marginRight: 8 }} />
                                <Text style={[styles.sectionTitle, isTV && styles.sectionTitleTV, { color: theme.colors.onBackground }]}>
                                    Top Cast
                                </Text>
                            </View>
                            <FlatList
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                data={cast}
                                keyExtractor={(actor) => actor.id.toString()}
                                renderItem={({ item: actor }) => (
                                    <View style={styles.castCard}>
                                        <Image
                                            source={{ uri: actor.profile_path ? `${IMAGE_PATH}${actor.profile_path}` : 'https://via.placeholder.com/150' }}
                                            style={styles.castImage}
                                        />
                                        <Text style={[styles.castName, { color: isDarkMode ? '#FFFFFF' : '#111827' }]} numberOfLines={1}>
                                            {actor.name}
                                        </Text>
                                    </View>
                                )}
                            />
                        </View>
                    </View>

                    {/* RIGHT COLUMN: Episodes (TV Shows) */}
                    {type === 'tv' && (
                        <View style={[styles.section, isTV && styles.tvSideColumn]}>
                            <View style={styles.rowBetween}>
                                <View style={styles.sectionHeader}>
                                    <ListFilter size={isTV ? 28 : 18} color="#FF3030" style={{ marginRight: 8 }} />
                                    <Text style={[styles.sectionTitle, isTV && styles.sectionTitleTV, { color: theme.colors.onBackground }]}>
                                        Episodes
                                    </Text>
                                </View>

                                {item.seasons?.length > 0 && (
                                    <View style={[styles.pickerWrapper, isTV && styles.pickerWrapperTV]}>
                                        <Pressable
                                            onPress={() => pickerRef.current?.togglePicker()}
                                            style={styles.pickerPressable}
                                        >
                                            <View style={styles.pickerVisualContent}>
                                                <Text style={[styles.pickerText, { color: '#FF3030' }]}>
                                                    Season {selectedSeason}
                                                </Text>
                                                <ChevronDown size={18} color="#FF3030" />
                                            </View>
                                        </Pressable>

                                        <View style={styles.hiddenPickerContainer}>
                                            <RNPickerSelect
                                                ref={pickerRef}
                                                value={selectedSeason}
                                                onValueChange={(val) => {
                                                    if (val) {
                                                        setSelectedSeason(val);
                                                        loadSeason(val);
                                                    }
                                                }}
                                                items={item.seasons.map(s => ({
                                                    label: s.name || `Season ${s.season_number}`,
                                                    value: s.season_number
                                                }))}
                                            />
                                        </View>
                                    </View>
                                )}
                            </View>

                            {epLoading ? (
                                <ActivityIndicator color="#FF3030" style={{ marginTop: 20 }} />
                            ) : (
                                <FlatList
                                    data={episodes}
                                    keyExtractor={(ep) => ep.id.toString()}
                                    scrollEnabled={false}
                                    renderItem={({ item: ep }) => (
                                        <Pressable
                                            enablesNextFocusAppearance={true}
                                            style={({ focused }) => [
                                                styles.episodeCard,
                                                focused && styles.tvFocusBorder
                                            ]}
                                            onPress={() => navigation.navigate('Player', {
                                                id: item.id,
                                                type: 'tv',
                                                season: selectedSeason,
                                                episode: ep.episode_number,
                                                item: item
                                            })}
                                        >
                                            <Surface style={[styles.episodeInner, { backgroundColor: theme.colors.cardBg, borderColor: theme.colors.cardBorder }]} elevation={1}>
                                                <View style={styles.epImageContainer}>
                                                    <Image
                                                        source={{
                                                            uri: ep.still_path
                                                                ? `${IMAGE_PATH}${ep.still_path}`
                                                                : (item.backdrop_path ? `${IMAGE_PATH}${item.backdrop_path}` : 'https://via.placeholder.com/300x170')
                                                        }}
                                                        style={styles.epImage}
                                                    />
                                                    <View style={styles.epPlayOverlay}>
                                                        <PlayCircle size={28} color="#FF3030" />
                                                    </View>
                                                </View>
                                                <View style={styles.epInfo}>
                                                    <Text style={[styles.epTitle, { color: isDarkMode ? '#FFFFFF' : '#111827' }]} numberOfLines={1}>
                                                        {ep.episode_number}. {ep.name}
                                                    </Text>
                                                    <Text style={[styles.epOverview, { color: '#8A99A8' }]} numberOfLines={2}>
                                                        {ep.overview || "No description available."}
                                                    </Text>
                                                </View>
                                            </Surface>
                                        </Pressable>
                                    )}
                                />
                            )}
                        </View>
                    )}
                </View>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    tvScrollContent: { paddingLeft: 100 },
    header: { height: 350 },
    headerTV: { height: height * 0.7, width: '100%', position: 'absolute' },
    backdrop: { width: '100%', height: '100%', resizeMode: 'cover' },
    gradient: { ...StyleSheet.absoluteFillObject },
    backButton: {
        position: 'absolute',
        left: isTV ? 40 : 16,
        width: isTV ? 52 : 42,
        height: isTV ? 52 : 42,
        borderRadius: 26,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
        zIndex: 50,
    },
    content: { padding: 16, marginTop: -40 },
    contentTV: { flexDirection: 'row', marginTop: height * 0.4, paddingHorizontal: 50, gap: 40 },
    tvMainColumn: { flex: 1.2 },
    tvSideColumn: { flex: 0.8 },
    title: { fontSize: 24, fontWeight: '900', marginBottom: 8 },
    titleTV: { fontSize: 44, marginBottom: 12 },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 12,
    },
    ratingBadge: {
        backgroundColor: '#10B981',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
    },
    ratingBadgeText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '900',
    },
    metaText: {
        color: '#8A99A8',
        fontSize: 13,
        fontWeight: '600',
    },
    hdPill: {
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    hdPillText: {
        color: '#FFFFFF',
        fontSize: 10,
        fontWeight: '800',
    },
    tagContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 16 },
    tag: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
        borderWidth: 1,
    },
    tagText: {
        color: '#FF4D4D',
        fontSize: 11,
        fontWeight: '700',
    },
    overview: { fontSize: 14, lineHeight: 22, marginBottom: 20 },
    overviewTV: { fontSize: 18, lineHeight: 28 },
    actionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 24,
    },
    mainPlayBtn: {
        borderRadius: 24,
        overflow: 'hidden',
    },
    playBtnGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 22,
        paddingVertical: 12,
        borderRadius: 24,
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
        gap: 6,
        paddingHorizontal: 18,
        paddingVertical: 12,
        borderRadius: 24,
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
        borderWidth: 1.2,
        borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    myListBtnActive: {
        backgroundColor: 'rgba(16, 185, 129, 0.12)',
        borderColor: 'rgba(16, 185, 129, 0.4)',
    },
    myListBtnText: {
        color: '#FFFFFF',
        fontSize: 13,
        fontWeight: '800',
    },
    section: { marginTop: 12, marginBottom: 16 },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    sectionTitle: { fontSize: 18, fontWeight: '800' },
    sectionTitleTV: { fontSize: 24 },
    castCard: { marginRight: 14, alignItems: 'center', width: 70 },
    castImage: { width: 64, height: 64, borderRadius: 32, marginBottom: 6 },
    castName: { fontSize: 11, textAlign: 'center' },
    rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    pickerWrapper: {
        backgroundColor: 'rgba(255, 48, 48, 0.1)',
        borderRadius: 14,
        borderWidth: 1,
        borderColor: 'rgba(255, 48, 48, 0.3)',
        overflow: 'hidden',
    },
    pickerWrapperTV: { minWidth: 150 },
    pickerPressable: { paddingHorizontal: 12, paddingVertical: 6 },
    pickerVisualContent: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    pickerText: { fontWeight: '800', fontSize: 13 },
    hiddenPickerContainer: { position: 'absolute', opacity: 0, width: '100%', height: '100%' },
    episodeCard: { marginBottom: 10, borderRadius: 12 },
    episodeInner: {
        flexDirection: 'row',
        padding: 8,
        borderRadius: 12,
        borderWidth: 1,
        overflow: 'hidden',
    },
    epImageContainer: {
        width: 100,
        height: 60,
        borderRadius: 8,
        overflow: 'hidden',
        position: 'relative',
    },
    epImage: { width: '100%', height: '100%' },
    epPlayOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.3)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    epInfo: { flex: 1, marginLeft: 12, justifyContent: 'center' },
    epTitle: { fontSize: 14, fontWeight: '700', marginBottom: 4 },
    epOverview: { fontSize: 12 },
    tvFocusBorder: { borderWidth: 2, borderColor: '#FF3030' },
    tvFocusScale: { transform: [{ scale: 1.05 }] },
});
