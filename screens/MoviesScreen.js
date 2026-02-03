import React, { useEffect, useState } from 'react';
import {
    StyleSheet,
    View,
    ScrollView,
    ActivityIndicator,
    FlatList,
    ImageBackground,
    Dimensions
} from 'react-native';
import { Text, Button, IconButton } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useAppTheme } from '../theme/ThemeContext';
import { MovieCard } from '../components/MovieCard';
import {
    getNowPlayingMovies,
    getTopRatedMovies,
    getUpcomingMovies,
    IMAGE_PATH
} from '../services/api';
import { Play, Plus, Info } from 'lucide-react-native';
import {TopBar} from "../components/TopBar";

const { width } = Dimensions.get('window');

export const MoviesScreen = () => {
    const { theme } = useAppTheme();
    const navigation = useNavigation();
    const [sections, setSections] = useState({
        nowPlaying: [],
        topRated: [],
        upcoming: [],
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadMovies = async () => {
            try {
                const [now, top, upcoming] = await Promise.all([
                    getNowPlayingMovies(),
                    getTopRatedMovies(),
                    getUpcomingMovies()
                ]);

                const format = (data) => data.map(m => ({
                    id: m.id,
                    title: m.title,
                    image: `${IMAGE_PATH}${m.poster_path}`,
                    backdrop: `${IMAGE_PATH}${m.backdrop_path}`,
                    rating: m.vote_average?.toFixed(1),
                    media_type: 'movie' // Strictly movies
                }));

                setSections({
                    nowPlaying: format(now),
                    topRated: format(top),
                    upcoming: format(upcoming),
                });
            } catch (error) {
                console.error("Failed to load movies:", error);
            } finally {
                setLoading(false);
            }
        };
        loadMovies();
    }, []);

    const renderRow = (title, data) => (
        <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.onBackground }]}>{title}</Text>
            <FlatList
                horizontal
                showsHorizontalScrollIndicator={false}
                data={data}
                keyExtractor={(item) => `movie-${item.id}`}
                renderItem={({ item }) => <MovieCard item={item} />}
                contentContainerStyle={{ paddingLeft: 20 }}
            />
        </View>
    );

    if (loading) return (
        <View style={[styles.centered, { backgroundColor: theme.colors.background }]}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
    );

    const heroMovie = sections.nowPlaying[0];

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <TopBar />
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
                {/* Hero Feature */}
                <ImageBackground source={{ uri: heroMovie?.backdrop }} style={styles.hero}>
                    <LinearGradient
                        colors={['rgba(0,0,0,0.2)', 'transparent', theme.colors.background]}
                        style={styles.heroGradient}
                    >
                        <View style={styles.heroContent}>
                            <Text style={styles.heroTitle}>{heroMovie?.title?.toUpperCase()}</Text>
                            <View style={styles.heroButtons}>
                                <View style={styles.sideBtn}>
                                    <IconButton icon={() => <Plus color="white" size={22} />} onPress={() => {}} />
                                    <Text style={styles.sideBtnText}>My List</Text>
                                </View>

                                <Button
                                    mode="contained"
                                    icon={() => <Play size={18} color="black" fill="black" />}
                                    style={styles.playBtn}
                                    labelStyle={styles.playBtnLabel}
                                    onPress={() => navigation.navigate('MovieDetail', { id: heroMovie.id, type: 'movie' })}
                                >
                                    PLAY
                                </Button>

                                <View style={styles.sideBtn}>
                                    <IconButton
                                        icon={() => <Info color="white" size={22} />}
                                        onPress={() => navigation.navigate('MovieDetail', { id: heroMovie.id, type: 'movie' })}
                                    />
                                    <Text style={styles.sideBtnText}>Info</Text>
                                </View>
                            </View>
                        </View>
                    </LinearGradient>
                </ImageBackground>

                {/* Movie Rows */}
                <View style={styles.rowsContainer}>
                    {renderRow('Now Playing', sections.nowPlaying.slice(1))}
                    {renderRow('Top Rated Movies', sections.topRated)}
                    {renderRow('Coming Soon', sections.upcoming)}
                </View>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    hero: { width: width, height: 550 },
    heroGradient: { flex: 1, justifyContent: 'flex-end' },
    heroContent: { alignItems: 'center', paddingBottom: 40 },
    heroTitle: {
        fontSize: 36,
        fontWeight: '900',
        color: 'white',
        textAlign: 'center',
        marginBottom: 20,
        paddingHorizontal: 20,
        textShadowColor: 'rgba(0, 0, 0, 0.75)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 10
    },
    heroButtons: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 20 },
    playBtn: { backgroundColor: 'white', borderRadius: 4, width: 120, height: 45, justifyContent: 'center' },
    playBtnLabel: { color: 'black', fontWeight: '900', fontSize: 14 },
    sideBtn: { alignItems: 'center' },
    sideBtnText: { color: 'white', fontSize: 10, marginTop: -8, fontWeight: 'bold' },
    rowsContainer: { marginTop: -20 },
    section: { marginTop: 25 },
    sectionTitle: { fontSize: 19, fontWeight: '900', marginLeft: 20, marginBottom: 12 }
});