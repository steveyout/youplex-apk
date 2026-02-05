import React, { useEffect, useState } from 'react';
import { StyleSheet, View, ScrollView, ActivityIndicator, FlatList, ImageBackground, TouchableOpacity, Image } from 'react-native';
import { Text, Button, IconButton } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { TopBar } from '../components/TopBar';
import { BottomNav } from '../components/BottomNav';
import { useAppTheme } from '../theme/ThemeContext';
import { MovieCard } from '../components/MovieCard';
import { getTrendingMovies, getTrendingTV, IMAGE_PATH } from '../services/api';
import { getHistory } from '../services/historyService'; // Import History Service
import { useIsFocused, useNavigation } from '@react-navigation/native'; // For auto-refresh

export const HomeScreen = () => {
    const { theme } = useAppTheme();
    const navigation = useNavigation();
    const isFocused = useIsFocused();

    const [trendingMovies, setTrendingMovies] = useState([]);
    const [trendingTV, setTrendingTV] = useState([]);
    const [continueWatching, setContinueWatching] = useState([]);
    const [loading, setLoading] = useState(true);

    // Load Trending Data
    useEffect(() => {
        const loadData = async () => {
            const [movies, tv] = await Promise.all([getTrendingMovies(), getTrendingTV()]);

            const format = (data, type) => data?.map(m => ({
                ...m, // Keep original TMDB object for the player
                id: m.id,
                title: m.title || m.name,
                image: `${IMAGE_PATH}${m.poster_path}`,
                backdrop: `${IMAGE_PATH}${m.backdrop_path}`,
                rating: m.vote_average?.toFixed(1),
                media_type: type
            })) || [];

            setTrendingMovies(format(movies, 'movie'));
            setTrendingTV(format(tv, 'tv'));
            setLoading(false);
        };
        loadData();
    }, []);

    // Refresh Continue Watching every time screen is focused
    useEffect(() => {
        if (isFocused) {
            const loadHistory = async () => {
                const history = await getHistory();
                setContinueWatching(history.slice(0, 10)); // Show last 10 items
            };
            loadHistory();
        }
    }, [isFocused]);

    const renderContinueWatching = () => {
        if (continueWatching.length === 0) return null;

        return (
            <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: theme.colors.onBackground }]}>Continue Watching</Text>
                <FlatList
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    data={continueWatching}
                    keyExtractor={(item, index) => `history-${item.id}-${index}`}
                    contentContainerStyle={{ paddingLeft: 20 }}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            style={styles.continueCard}
                            onPress={() => navigation.navigate('Player', {
                                id: item.id,
                                type: item.type,
                                season: item.season || 1,
                                episode: item.episode || 1,
                                item: item
                            })}
                        >
                            <Image
                                source={{ uri: item.backdrop || `${IMAGE_PATH}${item.backdrop_path}` }}
                                style={styles.continueImage}
                            />
                            <LinearGradient
                                colors={['transparent', 'rgba(0,0,0,0.8)']}
                                style={styles.continueGradient}
                            >
                                <Text style={styles.continueTitle} numberOfLines={1}>
                                    {item.title || item.name}
                                </Text>
                                {item.type === 'tv' && (
                                    <Text style={styles.continueSubtitle}>S{item.season} E{item.episode}</Text>
                                )}
                            </LinearGradient>
                        </TouchableOpacity>
                    )}
                />
            </View>
        );
    };

    const renderSection = (title, data) => (
        <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.onBackground }]}>{title}</Text>
            <FlatList
                horizontal
                showsHorizontalScrollIndicator={false}
                data={data}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => <MovieCard item={item} />}
                contentContainerStyle={{ paddingLeft: 20 }}
            />
        </View>
    );

    if (loading) return (
        <View style={[styles.container, { backgroundColor: theme.colors.background, justifyContent: 'center' }]}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
    );

    const hero = trendingMovies[0];

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <TopBar />
            <ScrollView showsVerticalScrollIndicator={false}>
                <ImageBackground source={{ uri: hero?.backdrop }} style={styles.hero}>
                    <LinearGradient colors={['transparent', 'rgba(15,15,15,0.5)', '#0F0F0F']} style={styles.heroGradient}>
                        <Text style={styles.heroTitle}>{hero?.title?.toUpperCase()}</Text>
                        <View style={styles.heroButtons}>
                            <Button
                                mode="contained"
                                icon="play"
                                style={styles.playButton}
                                onPress={() => navigation.navigate('Player', {
                                    id: hero.id,
                                    type: 'movie',
                                    item: hero
                                })}
                            >
                                Play
                            </Button>
                            <IconButton icon="plus" mode="outlined" iconColor="white" />
                        </View>
                    </LinearGradient>
                </ImageBackground>

                {/* INSERTED: Continue Watching Row */}
                {renderContinueWatching()}

                {renderSection('Trending Movies', trendingMovies)}
                {renderSection('Trending TV Shows', trendingTV)}

                <View style={{ height: 120 }} />
            </ScrollView>
            <BottomNav />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    hero: { width: '100%', height: 450, justifyContent: 'flex-end' },
    heroGradient: { height: '60%', justifyContent: 'flex-end', padding: 20 },
    heroTitle: { fontSize: 28, fontWeight: '900', color: 'white', textAlign: 'center', marginBottom: 15 },
    heroButtons: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
    playButton: { flex: 0.6, borderRadius: 8 },
    section: { marginTop: 25 },
    sectionTitle: { fontSize: 20, fontWeight: '900', marginLeft: 20, marginBottom: 15 },
    // Styles for Continue Watching
    continueCard: { width: 220, height: 125, marginRight: 15, borderRadius: 10, overflow: 'hidden', backgroundColor: '#1a1a1a' },
    continueImage: { width: '100%', height: '100%' },
    continueGradient: { ...StyleSheet.absoluteFillObject, justifyContent: 'flex-end', padding: 10 },
    continueTitle: { color: 'white', fontWeight: 'bold', fontSize: 14 },
    continueSubtitle: { color: '#E91E63', fontSize: 11, fontWeight: 'bold' }
});