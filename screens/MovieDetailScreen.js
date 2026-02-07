import React, { useState, useEffect, useRef } from 'react';
import {
    StyleSheet, View, ScrollView, Image, ActivityIndicator,
    Pressable, FlatList, Platform, Dimensions
} from 'react-native';
import { Text, Button, IconButton, Surface, Chip } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import RNPickerSelect from 'react-native-picker-select';
import { useAppTheme } from '../theme/ThemeContext';
import { ChevronLeft, PlayCircle, ListFilter, Users, ChevronDown } from 'lucide-react-native';
import { getDetails, getSeasonDetails, getCredits, IMAGE_PATH } from '../services/api';
import { isTV } from '../utils/device';

const { width, height } = Dimensions.get('window');

export const MovieDetailScreen = ({ navigation, route }) => {
    const { theme } = useAppTheme();
    const [item, setItem] = useState(null);
    const [cast, setCast] = useState([]);
    const [episodes, setEpisodes] = useState([]);
    const [selectedSeason, setSelectedSeason] = useState(1);
    const [loading, setLoading] = useState(true);
    const [epLoading, setEpLoading] = useState(false);

    const pickerRef = useRef(null);
    const { id, type } = route.params;

    useEffect(() => {
        loadData();
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
                const firstSeasonNum = details.seasons[0].season_number;
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

    if (loading) return <View style={styles.centered}><ActivityIndicator color={theme.colors.primary} /></View>;

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={[isTV && styles.tvScrollContent]}
            >
                {/* BACKDROP SECTION */}
                <View style={[styles.header, isTV && styles.headerTV]}>
                    <Image
                        source={{ uri: `${IMAGE_PATH}${item.backdrop_path || item.poster_path}` }}
                        style={styles.backdrop}
                    />
                    <LinearGradient
                        colors={isTV
                            ? ['rgba(0,0,0,0.8)', 'rgba(0,0,0,0.4)', theme.colors.background]
                            : ['rgba(0,0,0,0.7)', 'transparent', theme.colors.background]
                        }
                        style={styles.gradient}
                        start={isTV ? { x: 0, y: 0.5 } : { x: 0.5, y: 0 }}
                        end={isTV ? { x: 1, y: 0.5 } : { x: 0.5, y: 1 }}
                    />

                    <IconButton
                        icon={() => <ChevronLeft color="white" size={isTV ? 32 : 28} />}
                        style={styles.backButton}
                        onPress={() => navigation.goBack()}
                    />
                </View>

                {/* MAIN CONTENT AREA */}
                <View style={[styles.content, isTV && styles.contentTV]}>

                    {/* LEFT COLUMN: Metadata & Actions */}
                    <View style={isTV ? styles.tvMainColumn : null}>
                        <Text style={[styles.title, isTV && styles.titleTV]}>
                            {item.title || item.name}
                        </Text>

                        <View style={styles.tagContainer}>
                            {item.genres?.map((genre) => (
                                <Chip
                                    key={genre.id}
                                    style={[styles.tag, { backgroundColor: theme.colors.elevation.level3 }]}
                                    textStyle={{ fontSize: isTV ? 16 : 10, color: theme.colors.primary, fontWeight: 'bold' }}
                                >
                                    {genre.name}
                                </Chip>
                            ))}
                        </View>

                        <Text style={[styles.overview, isTV && styles.overviewTV, { color: theme.colors.onSurfaceVariant }]}>
                            {item.overview}
                        </Text>

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
                                    <Button
                                        mode="contained"
                                        icon="play"
                                        contentStyle={{ height: isTV ? 70 : 48, width: isTV ? 240 : 'auto' }}
                                        labelStyle={isTV && { fontSize: 20 }}
                                    >
                                        WATCH NOW
                                    </Button>
                                </Pressable>
                            )}
                            <IconButton
                                icon="plus-circle"
                                mode="outlined"
                                iconColor="white"
                                size={isTV ? 40 : 24}
                                style={isTV && { marginLeft: 20 }}
                            />
                        </View>

                        {/* CAST SECTION (Moved to main column on TV if width permits, or left here) */}
                        <View style={styles.section}>
                            <View style={styles.sectionHeader}>
                                <Users size={isTV ? 28 : 18} color={theme.colors.primary} style={{ marginRight: 8 }} />
                                <Text style={[styles.sectionTitle, isTV && styles.sectionTitleTV]}>Top Cast</Text>
                            </View>
                            <FlatList
                                horizontal
                                data={cast}
                                keyExtractor={(item) => item.id.toString()}
                                showsHorizontalScrollIndicator={false}
                                renderItem={({ item }) => (
                                    <Pressable style={({ focused }) => [styles.castCard, focused && { transform: [{ scale: 1.2 }], zIndex: 10 }]}>
                                        <Image
                                            source={{ uri: item.profile_path ? `${IMAGE_PATH}${item.profile_path}` : `https://ui-avatars.com/api/?name=${item.name}` }}
                                            style={styles.castImage}
                                        />
                                        <Text numberOfLines={1} style={[styles.castName, isTV && { fontSize: 14 }]}>{item.name}</Text>
                                    </Pressable>
                                )}
                            />
                        </View>
                    </View>

                    {/* RIGHT COLUMN: Episodes (TV Only) */}
                    {type === 'tv' && (
                        <View style={isTV ? styles.tvSideColumn : null}>
                            <View style={styles.rowBetween}>
                                <View style={styles.sectionHeader}>
                                    <ListFilter size={isTV ? 28 : 18} color={theme.colors.primary} style={{ marginRight: 8 }} />
                                    <Text style={[styles.sectionTitle, isTV && styles.sectionTitleTV]}>Episodes</Text>
                                </View>

                                <Surface style={[styles.pickerWrapper, isTV && styles.pickerWrapperTV]} elevation={1}>
                                    <Pressable
                                        style={({ focused }) => [styles.pickerPressable, focused && styles.tvFocusBorder]}
                                        onPress={() => pickerRef.current?.togglePicker(true)}
                                    >
                                        <View style={styles.pickerVisualContent}>
                                            <Text style={[styles.pickerText, { color: theme.colors.onSurface }, isTV && { fontSize: 18 }]}>
                                                {item.seasons?.find(s => s.season_number === selectedSeason)?.name || `Season ${selectedSeason}`}
                                            </Text>
                                            <ChevronDown size={20} color={theme.colors.onSurface} />
                                        </View>
                                        <View style={styles.hiddenPickerContainer}>
                                            <RNPickerSelect
                                                ref={pickerRef}
                                                onValueChange={(val) => { if (val !== null) { setSelectedSeason(val); loadSeason(val); } }}
                                                items={item.seasons?.map(s => ({ label: s.name, value: s.season_number })) || []}
                                                value={selectedSeason}
                                                useNativeAndroidPickerStyle={false}
                                                placeholder={{}}
                                            />
                                        </View>
                                    </Pressable>
                                </Surface>
                            </View>

                            {epLoading ? (
                                <ActivityIndicator color={theme.colors.primary} style={{ marginVertical: 30 }} />
                            ) : (
                                <View style={isTV && styles.episodeGrid}>
                                    {episodes.map((ep) => (
                                        <Pressable
                                            key={ep.id}
                                            style={({ focused }) => [
                                                styles.episodeCard,
                                                focused && styles.tvFocusBorder
                                            ]}
                                            onPress={() => navigation.navigate('Player', {
                                                id: id, type: 'tv', season: selectedSeason, episode: ep.episode_number, item: item
                                            })}
                                        >
                                            <Surface style={styles.episodeInner} elevation={1}>
                                                <View style={styles.epImageContainer}>
                                                    <Image source={{ uri: ep.still_path ? `${IMAGE_PATH}${ep.still_path}` : `${IMAGE_PATH}${item.poster_path}` }} style={styles.epImage} />
                                                    <View style={styles.epPlayOverlay}><PlayCircle color="white" size={32} /></View>
                                                </View>
                                                <View style={styles.epInfo}>
                                                    <Text style={[styles.epTitle, isTV && { fontSize: 18 }]} numberOfLines={1}>
                                                        {ep.episode_number}. {ep.name}
                                                    </Text>
                                                    <Text style={styles.epOverview} numberOfLines={2}>
                                                        {ep.overview || "No description provided."}
                                                    </Text>
                                                </View>
                                            </Surface>
                                        </Pressable>
                                    ))}
                                </View>
                            )}
                        </View>
                    )}
                </View>
                <View style={{ height: 150 }} />
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    tvScrollContent: { paddingLeft: 100 }, // Leave room for SideMenu if active
    header: { height: 350 },
    headerTV: { height: height * 0.7, width: '100%', position: 'absolute' },
    backdrop: { width: '100%', height: '100%', resizeMode: 'cover' },
    gradient: { ...StyleSheet.absoluteFillObject },
    backButton: { position: 'absolute', top: isTV ? 40 : 50, left: isTV ? 40 : 10, backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 30 },
    content: { paddingHorizontal: 20, marginTop: -60 },
    contentTV: { marginTop: height * 0.35, flexDirection: 'row', paddingHorizontal: 40 },
    tvMainColumn: { flex: 0.5, paddingRight: 60 },
    tvSideColumn: { flex: 0.5 },
    title: { fontSize: 32, fontWeight: '900', color: 'white', marginBottom: 15 },
    titleTV: { fontSize: 64, lineHeight: 72, marginBottom: 25 },
    tagContainer: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 20, gap: 10 },
    tag: { borderRadius: 8, height: isTV ? 45 : 30, justifyContent: 'center' },
    overview: { fontSize: 16, lineHeight: 24, marginBottom: 30 },
    overviewTV: { fontSize: 22, lineHeight: 34 },
    actionRow: { flexDirection: 'row', alignItems: 'center', gap: 15, marginBottom: 40 },
    mainPlayBtn: { borderRadius: 12, overflow: 'hidden' },
    tvFocusScale: { transform: [{ scale: 1.1 }], zIndex: 20 },
    tvFocusBorder: { borderWidth: 4, borderColor: '#E91E63', borderRadius: 12, transform: [{ scale: 1.05 }], zIndex: 10 },
    section: { marginBottom: 35 },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
    sectionTitle: { fontSize: 20, fontWeight: '800' },
    sectionTitleTV: { fontSize: 30 },
    castCard: { width: isTV ? 130 : 85, marginRight: 20, alignItems: 'center' },
    castImage: { width: isTV ? 110 : 65, height: isTV ? 110 : 65, borderRadius: 55, marginBottom: 10, backgroundColor: '#222' },
    castName: { fontSize: 12, fontWeight: 'bold', textAlign: 'center', color: '#ccc' },
    rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    episodeCard: { marginBottom: 15, borderRadius: 12 },
    episodeInner: { flexDirection: 'row', padding: 12, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.05)' },
    epImageContainer: { width: isTV ? 200 : 120, height: isTV ? 112 : 70, borderRadius: 8, overflow: 'hidden' },
    epImage: { width: '100%', height: '100%' },
    epPlayOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
    epInfo: { flex: 1, marginLeft: 20, justifyContent: 'center' },
    epTitle: { fontWeight: 'bold', fontSize: 16, color: 'white' },
    epOverview: { fontSize: 13, color: '#aaa', marginTop: 6, lineHeight: 18 },
    pickerWrapper: { borderRadius: 8, minWidth: 150, height: 45, overflow: 'hidden', backgroundColor: '#333' },
    pickerWrapperTV: { height: 60, minWidth: 220 },
    pickerPressable: { width: '100%', height: '100%', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15 },
    pickerVisualContent: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    pickerText: { fontSize: 16, fontWeight: 'bold' },
    hiddenPickerContainer: { ...StyleSheet.absoluteFillObject, opacity: 0 }
});