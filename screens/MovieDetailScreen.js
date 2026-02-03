import React, { useState, useEffect, useRef } from 'react';
import {
    StyleSheet,
    View,
    ScrollView,
    Image,
    ActivityIndicator,
    TouchableOpacity,
    FlatList,
    Pressable
} from 'react-native';
import { Text, Button, IconButton, Surface, Chip } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import RNPickerSelect from 'react-native-picker-select';
import { useAppTheme } from '../theme/ThemeContext';
import { ChevronLeft, PlayCircle, ListFilter, Users, ChevronDown } from 'lucide-react-native';
import { getDetails, getSeasonDetails, getCredits, IMAGE_PATH } from '../services/api';

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
            <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.header}>
                    <Image source={{ uri: `${IMAGE_PATH}${item.backdrop_path || item.poster_path}` }} style={styles.backdrop} />
                    <LinearGradient colors={['rgba(0,0,0,0.7)', 'transparent', theme.colors.background]} style={styles.gradient} />
                    <IconButton icon={() => <ChevronLeft color="white" size={28} />} style={styles.backButton} onPress={() => navigation.goBack()} />
                </View>

                <View style={styles.content}>
                    <Text style={styles.title}>{item.title || item.name}</Text>

                    <View style={styles.tagContainer}>
                        {item.genres?.map((genre) => (
                            <Chip
                                key={genre.id}
                                style={[styles.tag, { backgroundColor: theme.colors.elevation.level3 }]}
                                textStyle={{ fontSize: 10, color: theme.colors.primary, fontWeight: 'bold' }}
                            >
                                {genre.name}
                            </Chip>
                        ))}
                    </View>

                    <Text style={[styles.overview, { color: theme.colors.onSurfaceVariant }]}>{item.overview}</Text>

                    {/* Cast */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Users size={18} color={theme.colors.primary} style={{ marginRight: 8 }} />
                            <Text style={styles.sectionTitle}>Top Cast</Text>
                        </View>
                        <FlatList
                            horizontal
                            data={cast}
                            keyExtractor={(item) => item.id.toString()}
                            showsHorizontalScrollIndicator={false}
                            renderItem={({ item }) => (
                                <View style={styles.castCard}>
                                    <Image
                                        source={{
                                            uri: item.profile_path
                                                ? `${IMAGE_PATH}${item.profile_path}`
                                                : `https://ui-avatars.com/api/?name=${encodeURIComponent(item.name)}&background=random`
                                        }}
                                        style={styles.castImage}
                                    />
                                    <Text numberOfLines={1} style={styles.castName}>{item.name}</Text>
                                    <Text numberOfLines={1} style={styles.castRole}>{item.character}</Text>
                                </View>
                            )}
                        />
                    </View>

                    {type === 'movie' && (
                        <Button
                            mode="contained" icon="play"
                            style={styles.mainPlayBtn}
                            contentStyle={{ height: 48 }}
                            onPress={() => navigation.navigate('Player', { id, type: 'movie' })}
                        >
                            WATCH NOW
                        </Button>
                    )}

                    {type === 'tv' && (
                        <View style={styles.section}>
                            <View style={styles.rowBetween}>
                                <View style={styles.sectionHeader}>
                                    <ListFilter size={18} color={theme.colors.primary} style={{ marginRight: 8 }} />
                                    <Text style={styles.sectionTitle}>Episodes</Text>
                                </View>

                                {/* Fixed Season Selector */}
                                <Surface style={[styles.pickerWrapper, { backgroundColor: theme.colors.elevation.level2 }]} elevation={1}>
                                    <Pressable
                                        style={styles.pickerPressable}
                                        onPress={() => pickerRef.current?.togglePicker(true)}
                                    >
                                        <View style={styles.pickerVisualContent}>
                                            <Text style={[styles.pickerText, { color: theme.colors.onSurface }]}>
                                                {item.seasons?.find(s => s.season_number === selectedSeason)?.name || `Season ${selectedSeason}`}
                                            </Text>
                                            <ChevronDown size={16} color={theme.colors.onSurface} />
                                        </View>

                                        <View style={styles.hiddenPickerContainer}>
                                            <RNPickerSelect
                                                ref={pickerRef}
                                                onValueChange={(val) => { if (val !== null) { setSelectedSeason(val); loadSeason(val); } }}
                                                items={item.seasons?.map(s => ({ label: s.name, value: s.season_number })) || []}
                                                value={selectedSeason}
                                                useNativeAndroidPickerStyle={false}
                                                placeholder={{}}
                                                style={{
                                                    inputIOS: { height: 42, width: 140 },
                                                    inputAndroid: { height: 42, width: 140 },
                                                }}
                                            />
                                        </View>
                                    </Pressable>
                                </Surface>
                            </View>

                            {epLoading ? (
                                <ActivityIndicator color={theme.colors.primary} style={{ marginVertical: 30 }} />
                            ) : (
                                episodes.map((ep) => (
                                    <Surface key={ep.id} style={styles.episodeCard} elevation={1}>
                                        <TouchableOpacity
                                            style={styles.episodeInner}
                                            onPress={() => navigation.navigate('Player', { id, type: 'tv', season: selectedSeason, episode: ep.episode_number })}
                                        >
                                            <View style={styles.epImageContainer}>
                                                <Image source={{ uri: ep.still_path ? `${IMAGE_PATH}${ep.still_path}` : `${IMAGE_PATH}${item.poster_path}` }} style={styles.epImage} />
                                                <View style={styles.epPlayOverlay}><PlayCircle color="white" size={24} /></View>
                                            </View>
                                            <View style={styles.epInfo}>
                                                <Text style={styles.epTitle} numberOfLines={1}>{ep.episode_number}. {ep.name}</Text>
                                                <Text style={styles.epOverview} numberOfLines={2}>{ep.overview || "No description provided."}</Text>
                                            </View>
                                        </TouchableOpacity>
                                    </Surface>
                                ))
                            )}
                        </View>
                    )}
                </View>
                <View style={{ height: 110 }} />
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { height: 320 },
    backdrop: { width: '100%', height: '100%', resizeMode: 'cover' },
    gradient: { ...StyleSheet.absoluteFillObject },
    backButton: { position: 'absolute', top: 50, left: 10, backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 25 },
    content: { paddingHorizontal: 20, marginTop: -60 },
    title: { fontSize: 28, fontWeight: '900', color: 'white', marginBottom: 12 },
    tagContainer: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 15, gap: 6 },
    tag: { borderRadius: 6, height: 28 },
    overview: { fontSize: 14, lineHeight: 22, marginBottom: 25 },
    section: { marginBottom: 25 },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
    sectionTitle: { fontSize: 18, fontWeight: '800' },
    castCard: { width: 85, marginRight: 15, alignItems: 'center' },
    castImage: { width: 65, height: 65, borderRadius: 32.5, marginBottom: 8, backgroundColor: '#111' },
    castName: { fontSize: 11, fontWeight: 'bold', textAlign: 'center' },
    castRole: { fontSize: 9, color: '#aaa', textAlign: 'center' },
    mainPlayBtn: { borderRadius: 12, marginBottom: 10 },
    rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },

    pickerWrapper: {
        borderRadius: 8,
        minWidth: 140,
        height: 42,
        overflow: 'hidden'
    },
    pickerPressable: {
        width: '100%',
        height: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
    },
    pickerVisualContent: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    pickerText: {
        fontSize: 12,
        fontWeight: 'bold',
    },
    hiddenPickerContainer: {
        ...StyleSheet.absoluteFillObject,
        opacity: 0,
    },

    episodeCard: { borderRadius: 12, marginBottom: 12, overflow: 'hidden' },
    episodeInner: { flexDirection: 'row', padding: 10 },
    epImageContainer: { width: 120, height: 70, borderRadius: 8, overflow: 'hidden' },
    epImage: { width: '100%', height: '100%' },
    epPlayOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' },
    epInfo: { flex: 1, marginLeft: 15, justifyContent: 'center' },
    epTitle: { fontWeight: 'bold', fontSize: 14 },
    epOverview: { fontSize: 11, color: '#999', marginTop: 4 }
});