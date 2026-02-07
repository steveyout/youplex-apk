import React, { useEffect, useState } from 'react';
import {
    StyleSheet, View, ScrollView, ActivityIndicator, FlatList,
    ImageBackground, Pressable, Image, Platform, Dimensions
} from 'react-native';
import { Text, Button, IconButton } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { TopBar } from '../components/TopBar';
import { useAppTheme } from '../theme/ThemeContext';
import { MovieCard } from '../components/MovieCard';
import { getTrendingMovies, getTrendingTV, IMAGE_PATH } from '../services/api';
import { getHistory } from '../services/historyService';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import { isTV } from '../utils/device';

const { width } = Dimensions.get('window');

export const HomeScreen = () => {
    const { theme } = useAppTheme();
    const navigation = useNavigation();
    const isFocused = useIsFocused();

    const [trendingMovies, setTrendingMovies] = useState([]);
    const [trendingTV, setTrendingTV] = useState([]);
    const [continueWatching, setContinueWatching] = useState([]);
    const [loading, setLoading] = useState(true);

    // SideMenu is 100px on TV
    const TV_LEFT_OFFSET = 100;
    const HERO_WIDTH = isTV ? width - TV_LEFT_OFFSET : width;

    useEffect(() => {
        const loadData = async () => {
            const [movies, tv] = await Promise.all([getTrendingMovies(), getTrendingTV()]);
            const format = (data, type) => data?.map(m => ({
                ...m,
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

    useEffect(() => {
        if (isFocused) {
            const loadHistory = async () => {
                const history = await getHistory();
                setContinueWatching(history.slice(0, 10));
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
                        <Pressable
                            enablesNextFocusAppearance={true}
                            style={({ focused }) => [
                                styles.continueCard,
                                focused && styles.tvFocusBorder
                            ]}
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
                                colors={['transparent', 'rgba(0,0,0,0.9)']}
                                style={styles.continueGradient}
                            >
                                <Text style={styles.continueTitle} numberOfLines={1}>
                                    {item.title || item.name}
                                </Text>
                                {item.type === 'tv' && (
                                    <Text style={styles.continueSubtitle}>S{item.season} E{item.episode}</Text>
                                )}
                            </LinearGradient>
                        </Pressable>
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
            {/* TopBar is always present but offset via its own internal logic for TV */}
            <TopBar />

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={[
                    isTV && { paddingLeft: TV_LEFT_OFFSET }
                ]}
            >
                <ImageBackground
                    source={{ uri: hero?.backdrop }}
                    style={[styles.hero, { width: HERO_WIDTH }, isTV && styles.heroTV]}
                >
                    <LinearGradient
                        colors={['transparent', 'rgba(15,15,15,0.4)', '#0F0F0F']}
                        style={[styles.heroGradient, isTV && { paddingLeft: 40 }]}
                    >
                        <Text style={[styles.heroTitle, isTV && styles.heroTitleTV]}>
                            {hero?.title?.toUpperCase()}
                        </Text>
                        <View style={styles.heroButtons}>
                            <Pressable
                                hasTVPreferredFocus={true}
                                style={({ focused }) => [
                                    styles.playButtonAction,
                                    focused && { transform: [{ scale: 1.1 }], zIndex: 10 }
                                ]}
                                onPress={() => navigation.navigate('Player', {
                                    id: hero.id,
                                    type: 'movie',
                                    item: hero
                                })}
                            >
                                <Button
                                    mode="contained"
                                    icon="play"
                                    contentStyle={isTV && { height: 60, width: 160 }}
                                    labelStyle={isTV && { fontSize: 20 }}
                                >
                                    Play
                                </Button>
                            </Pressable>

                            <IconButton
                                icon="plus"
                                mode="outlined"
                                iconColor="white"
                                style={[styles.heroIconBtn, isTV && { transform: [{ scale: 1.4 }], marginLeft: 30 }]}
                            />
                        </View>
                    </LinearGradient>
                </ImageBackground>

                <View style={styles.contentWrapper}>
                    {renderContinueWatching()}
                    {renderSection('Trending Movies', trendingMovies)}
                    {renderSection('Trending TV Shows', trendingTV)}
                </View>

                <View style={{ height: 120 }} />
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    contentWrapper: { marginTop: isTV ? -40 : 0 }, // Pull content slightly into hero gradient on TV
    hero: { height: 450, justifyContent: 'flex-end' },
    heroTV: { height: 650 },
    heroGradient: { height: '80%', justifyContent: 'flex-end', padding: 20 },
    heroTitle: { fontSize: 28, fontWeight: '900', color: 'white', textAlign: 'center', marginBottom: 15 },
    heroTitleTV: { fontSize: 64, textAlign: 'left', marginBottom: 30, width: '70%', lineHeight: 70 },
    heroButtons: { flexDirection: 'row', justifyContent: isTV ? 'flex-start' : 'center', alignItems: 'center', marginBottom: 20 },
    playButtonAction: { borderRadius: 8, overflow: 'visible' },
    heroIconBtn: { borderColor: 'white', borderWidth: 1 },
    section: { marginTop: 30 },
    sectionTitle: { fontSize: 20, fontWeight: '900', marginLeft: 20, marginBottom: 15 },
    tvFocusBorder: {
        borderWidth: 4,
        borderColor: '#E91E63',
        transform: [{ scale: 1.1 }],
        zIndex: 10,
    },
    continueCard: {
        width: isTV ? 350 : 220,
        height: isTV ? 200 : 125,
        marginRight: 20,
        borderRadius: 12,
        overflow: 'hidden',
        backgroundColor: '#1a1a1a'
    },
    continueImage: { width: '100%', height: '100%', resizeMode: 'cover' },
    continueGradient: { ...StyleSheet.absoluteFillObject, justifyContent: 'flex-end', padding: 15 },
    continueTitle: { color: 'white', fontWeight: 'bold', fontSize: isTV ? 20 : 14 },
    continueSubtitle: { color: '#E91E63', fontSize: isTV ? 14 : 11, fontWeight: 'bold', marginTop: 4 }
});