import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    View,
    ScrollView,
    Image,
    FlatList,
    ActivityIndicator,
    TouchableOpacity,
    Platform
} from 'react-native';
import { Text, Avatar, Button, IconButton, Surface } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import RNPickerSelect from 'react-native-picker-select';
import { useAppTheme } from '../theme/ThemeContext';
import { ChevronLeft, PlayCircle, ChevronDown, ListFilter } from 'lucide-react-native';
import { getDetails, getSeasonDetails, IMAGE_PATH } from '../services/api';

export const MovieDetailScreen = ({ navigation, route }) => {
    const { theme } = useAppTheme();
    const [item, setItem] = useState(null);
    const [episodes, setEpisodes] = useState([]);
    const [selectedSeason, setSelectedSeason] = useState(1);
    const [loading, setLoading] = useState(true);
    const [epLoading, setEpLoading] = useState(false);

    const { id, type } = route.params;

    useEffect(() => {
        loadMainDetails();
    }, [id]);

    const loadMainDetails = async () => {
        const data = await getDetails(id, type);
        setItem(data);
        if (type === 'tv' && data?.seasons?.length > 0) {
            // Find first valid season number (handles shows starting at S1 or S0)
            const firstSeasonNum = data.seasons[0].season_number;
            setSelectedSeason(firstSeasonNum);
            loadSeason(firstSeasonNum);
        }
        setLoading(false);
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
                    <Image
                        source={{ uri: `${IMAGE_PATH}${item.backdrop_path || item.poster_path}` }}
                        style={styles.backdrop}
                    />
                    <LinearGradient colors={['rgba(0,0,0,0.8)', 'transparent', theme.colors.background]} style={styles.gradient} />
                    <IconButton
                        icon={() => <ChevronLeft color="white" size={28} />}
                        style={styles.backButton}
                        onPress={() => navigation.goBack()}
                    />
                </View>

                <View style={styles.content}>
                    <Text style={styles.title}>{item.title || item.name}</Text>

                    <View style={styles.metaRow}>
                        <Surface style={styles.ratingBadge} elevation={1}>
                            <Text style={styles.ratingText}>⭐ {item.vote_average?.toFixed(1)}</Text>
                        </Surface>
                        <Text style={styles.yearText}>{ (item.release_date || item.first_air_date)?.split('-')[0] }</Text>
                    </View>

                    <Text style={styles.sectionTitle}>Top Cast</Text>
                    <FlatList
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        data={item.credits?.cast?.slice(0, 10)}
                        keyExtractor={(c) => c.id.toString()}
                        renderItem={({ item: cast }) => (
                            <View style={styles.castCard}>
                                <Avatar.Image
                                    size={64}
                                    source={{ uri: cast.profile_path ? `${IMAGE_PATH}${cast.profile_path}` : 'https://i.pravatar.cc/150' }}
                                />
                                <Text numberOfLines={1} style={[styles.castName, { color: theme.colors.onSurface }]}>{cast.name}</Text>
                                <Text numberOfLines={1} style={styles.castRole}>{cast.character}</Text>
                            </View>
                        )}
                    />

                    {type === 'tv' && (
                        <View style={{ marginTop: 20 }}>
                            <View style={styles.rowBetween}>
                                <View style={styles.sectionHeader}>
                                    <ListFilter size={20} color={theme.colors.primary} style={{ marginRight: 8 }} />
                                    <Text style={styles.sectionTitleNoMargin}>Episodes</Text>
                                </View>

                                {/* THE CLICKABLE SELECTOR */}
                                <Surface style={[styles.pickerWrapper, { backgroundColor: theme.colors.elevation.level2 }]} elevation={2}>
                                    <RNPickerSelect
                                        onValueChange={(val) => {
                                            if (val !== null && val !== selectedSeason) {
                                                setSelectedSeason(val);
                                                loadSeason(val);
                                            }
                                        }}
                                        value={selectedSeason}
                                        items={item.seasons?.map(s => ({ label: s.name, value: s.season_number })) || []}
                                        useNativeAndroidPickerStyle={false}
                                        fixAndroidTouchableBug={true} // Essential for Android full-width clicks
                                        Icon={() => <ChevronDown color={theme.colors.primary} size={16} />}
                                        style={{
                                            inputIOS: {
                                                color: theme.colors.onSurface,
                                                paddingLeft: 15,
                                                paddingRight: 40,
                                                height: 45,
                                                fontSize: 13,
                                                fontWeight: '800'
                                            },
                                            inputAndroid: {
                                                color: theme.colors.onSurface,
                                                paddingLeft: 15,
                                                paddingRight: 40,
                                                height: 45,
                                                fontSize: 13,
                                                fontWeight: '800',
                                                width: 160, // Ensure this matches pickerWrapper minWidth
                                            },
                                            iconContainer: {
                                                top: 14,
                                                right: 12,
                                            },
                                            placeholder: { color: theme.colors.onSurfaceVariant }
                                        }}
                                    />
                                </Surface>
                            </View>

                            {epLoading ? (
                                <ActivityIndicator color={theme.colors.primary} style={{ marginVertical: 40 }} />
                            ) : (
                                <View style={{ marginTop: 10 }}>
                                    {episodes.map((ep) => (
                                        <Surface key={ep.id} style={styles.episodeCard} elevation={1}>
                                            <TouchableOpacity style={styles.episodeInner} activeOpacity={0.8}>
                                                <View style={styles.epImageContainer}>
                                                    <Image
                                                        source={{ uri: ep.still_path ? `${IMAGE_PATH}${ep.still_path}` : `${IMAGE_PATH}${item.poster_path}` }}
                                                        style={styles.epImage}
                                                    />
                                                    <View style={styles.epPlayOverlay}><PlayCircle color="white" size={28} /></View>
                                                </View>
                                                <View style={styles.epInfo}>
                                                    <Text style={styles.epTitle} numberOfLines={1}>{ep.episode_number}. {ep.name}</Text>
                                                    <Text style={styles.epOverview} numberOfLines={2}>{ep.overview || "No description available."}</Text>
                                                </View>
                                            </TouchableOpacity>
                                        </Surface>
                                    ))}
                                </View>
                            )}
                        </View>
                    )}

                    {type === 'movie' && (
                        <Button
                            mode="contained"
                            icon="play"
                            style={styles.moviePlayBtn}
                            onPress={() => {}}
                        >
                            WATCH NOW
                        </Button>
                    )}
                </View>
                <View style={{ height: 120 }} />
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { height: 350 },
    backdrop: { width: '100%', height: '100%', resizeMode: 'cover' },
    gradient: { ...StyleSheet.absoluteFillObject },
    backButton: { position: 'absolute', top: 50, left: 10, backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 25 },
    content: { paddingHorizontal: 20, marginTop: -60 },
    title: { fontSize: 30, fontWeight: '900', color: 'white' },
    metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
    ratingBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.1)', marginRight: 12 },
    ratingText: { fontWeight: 'bold', fontSize: 14, color: '#FFD700' },
    yearText: { color: '#aaa', fontWeight: '600' },
    sectionTitle: { fontSize: 18, fontWeight: '800', marginTop: 25, marginBottom: 15 },
    sectionTitleNoMargin: { fontSize: 18, fontWeight: '800' },
    sectionHeader: { flexDirection: 'row', alignItems: 'center' },
    castCard: { alignItems: 'center', marginRight: 18, width: 85 },
    castName: { fontSize: 11, fontWeight: 'bold', marginTop: 8, textAlign: 'center' },
    castRole: { fontSize: 10, color: '#777', textAlign: 'center' },
    rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },

    // FIXED CLICKABLE PICKER WRAPPER
    pickerWrapper: {
        borderRadius: 12,
        minWidth: 160,
        height: 45,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        overflow: 'hidden',
        justifyContent: 'center'
    },

    episodeCard: { borderRadius: 12, marginBottom: 12, overflow: 'hidden' },
    episodeInner: { flexDirection: 'row', padding: 8 },
    epImageContainer: { width: 130, height: 75, borderRadius: 8, overflow: 'hidden' },
    epImage: { width: '100%', height: '100%' },
    epPlayOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.2)', justifyContent: 'center', alignItems: 'center' },
    epInfo: { flex: 1, marginLeft: 15, justifyContent: 'center' },
    epTitle: { fontWeight: '800', fontSize: 14, marginBottom: 4 },
    epOverview: { fontSize: 11, color: '#999', lineHeight: 16 },
    moviePlayBtn: { marginTop: 30, borderRadius: 12 }
});