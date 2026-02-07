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
    Pressable
} from 'react-native';
import { Text, Button, IconButton } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useAppTheme } from '../theme/ThemeContext';
import { MovieCard } from '../components/MovieCard';
import {
    getAiringTodayTV,
    getPopularTV,
    getTopRatedTV,
    IMAGE_PATH
} from '../services/api';
import { Play, Plus, Info } from 'lucide-react-native';
import { TopBar } from "../components/TopBar";
import { isTV } from '../utils/device';

const { width } = Dimensions.get('window');

export const TVScreen = () => {
    const { theme } = useAppTheme();
    const navigation = useNavigation();
    const [sections, setSections] = useState({
        airingToday: [],
        popular: [],
        topRated: [],
    });
    const [loading, setLoading] = useState(true);

    // SideMenu Offset Logic (100px for TV)
    const TV_LEFT_OFFSET = 100;
    const CONTENT_WIDTH = isTV ? width - TV_LEFT_OFFSET : width;

    useEffect(() => {
        const loadTVShows = async () => {
            try {
                const [airing, popular, top] = await Promise.all([
                    getAiringTodayTV(),
                    getPopularTV(),
                    getTopRatedTV()
                ]);

                const format = (data) => data?.map(m => ({
                    id: m.id,
                    title: m.name,
                    image: `${IMAGE_PATH}${m.poster_path}`,
                    backdrop: `${IMAGE_PATH}${m.backdrop_path}`,
                    rating: m.vote_average?.toFixed(1),
                    media_type: 'tv'
                })) || [];

                setSections({
                    airingToday: format(airing),
                    popular: format(popular),
                    topRated: format(top),
                });
            } catch (error) {
                console.error("Failed to load TV shows:", error);
            } finally {
                setLoading(false);
            }
        };
        loadTVShows();
    }, []);

    const renderRow = (title, data) => (
        <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.onBackground }]}>{title}</Text>
            <FlatList
                horizontal
                showsHorizontalScrollIndicator={false}
                data={data}
                keyExtractor={(item) => `tv-${item.id}`}
                renderItem={({ item }) => <MovieCard item={item} />}
                contentContainerStyle={{ paddingLeft: 20 }}
                removeClippedSubviews={Platform.OS === 'android'}
            />
        </View>
    );

    if (loading) return (
        <View style={[styles.centered, { backgroundColor: theme.colors.background }]}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
    );

    const heroShow = sections.popular[0];

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <TopBar />

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={[
                    styles.scrollContent,
                    isTV && { paddingLeft: TV_LEFT_OFFSET }
                ]}
            >
                {/* Hero Feature */}
                <ImageBackground
                    source={{ uri: heroShow?.backdrop }}
                    style={[styles.hero, { width: CONTENT_WIDTH }, isTV && styles.heroTV]}
                >
                    <LinearGradient
                        colors={['rgba(0,0,0,0.1)', 'rgba(0,0,0,0.4)', theme.colors.background]}
                        style={styles.heroGradient}
                    >
                        <View style={[styles.heroContent, isTV && styles.heroContentTV]}>
                            <Text style={[styles.heroTitle, isTV && styles.heroTitleTV]} numberOfLines={2}>
                                {heroShow?.title?.toUpperCase()}
                            </Text>

                            <View style={styles.heroButtons}>
                                <Pressable
                                    style={({ focused }) => [
                                        styles.sideBtn,
                                        focused && styles.tvFocusScale
                                    ]}
                                >
                                    <IconButton
                                        icon={() => <Plus color="white" size={isTV ? 36 : 22} />}
                                        style={isTV && { margin: 0 }}
                                    />
                                    <Text style={[styles.sideBtnText, isTV && { fontSize: 16 }]}>My List</Text>
                                </Pressable>

                                <Pressable
                                    hasTVPreferredFocus={true}
                                    style={({ focused }) => [
                                        styles.playBtnContainer,
                                        focused && styles.tvFocusScale
                                    ]}
                                    onPress={() => navigation.navigate('MovieDetail', { id: heroShow.id, type: 'tv' })}
                                >
                                    <Button
                                        mode="contained"
                                        icon={() => <Play size={isTV ? 28 : 18} color="black" fill="black" />}
                                        style={[styles.playBtn, isTV && { height: 70, width: 220 }]}
                                        labelStyle={[styles.playBtnLabel, isTV && { fontSize: 22 }]}
                                    >
                                        WATCH
                                    </Button>
                                </Pressable>

                                <Pressable
                                    style={({ focused }) => [
                                        styles.sideBtn,
                                        focused && styles.tvFocusScale
                                    ]}
                                    onPress={() => navigation.navigate('MovieDetail', { id: heroShow.id, type: 'tv' })}
                                >
                                    <IconButton
                                        icon={() => <Info color="white" size={isTV ? 36 : 22} />}
                                        style={isTV && { margin: 0 }}
                                    />
                                    <Text style={[styles.sideBtnText, isTV && { fontSize: 16 }]}>Info</Text>
                                </Pressable>
                            </View>
                        </View>
                    </LinearGradient>
                </ImageBackground>

                {/* TV Rows */}
                <View style={[styles.rowsContainer, isTV && styles.rowsContainerTV]}>
                    {renderRow('Popular Series', sections.popular.slice(1))}
                    {renderRow('Airing Today', sections.airingToday)}
                    {renderRow('Top Rated Shows', sections.topRated)}
                </View>

                <View style={{ height: 100 }} />
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    scrollContent: { paddingBottom: 120 },
    hero: { height: 550 },
    heroTV: { height: 750 },
    heroGradient: { flex: 1, justifyContent: 'flex-end' },
    heroContent: { alignItems: 'center', paddingBottom: 40 },
    heroContentTV: { paddingBottom: 100 },
    heroTitle: {
        fontSize: 34,
        fontWeight: '900',
        color: 'white',
        textAlign: 'center',
        marginBottom: 20,
        paddingHorizontal: 25,
        textShadowColor: 'rgba(0, 0, 0, 0.8)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 10
    },
    heroTitleTV: { fontSize: 72, marginBottom: 40, width: '85%', lineHeight: 80 },
    heroButtons: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: isTV ? 50 : 20 },
    playBtnContainer: { borderRadius: 8, overflow: 'hidden' },
    playBtn: {
        backgroundColor: 'white',
        borderRadius: 8,
        width: 140,
        height: 48,
        justifyContent: 'center'
    },
    playBtnLabel: { color: 'black', fontWeight: '900', fontSize: 14 },
    sideBtn: { alignItems: 'center', borderRadius: 12, padding: 5 },
    sideBtnText: { color: 'white', fontSize: 10, marginTop: -4, fontWeight: 'bold' },
    tvFocusScale: {
        transform: [{ scale: 1.15 }],
        backgroundColor: 'rgba(233, 30, 99, 0.3)',
        zIndex: 10
    },
    rowsContainer: { marginTop: -20 },
    rowsContainerTV: { marginTop: -40 },
    section: { marginTop: 35 },
    sectionTitle: { fontSize: isTV ? 30 : 19, fontWeight: '900', marginLeft: 20, marginBottom: 15 }
});