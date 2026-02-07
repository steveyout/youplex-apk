import React, { useState, useEffect, useRef } from 'react';
import {
    StyleSheet,
    View,
    ActivityIndicator,
    Platform,
    StatusBar,
    ScrollView,
    Pressable,
    BackHandler,
    Dimensions
} from 'react-native';
import { WebView } from 'react-native-webview';
import { IconButton, Text } from 'react-native-paper';
import { X, Server } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as ScreenOrientation from 'expo-screen-orientation';
import * as NavigationBar from 'expo-navigation-bar';
import { useFocusEffect } from '@react-navigation/native';
import { PLAYER_CONFIG } from '../config/PlayerConfig';
import { saveToHistory } from '../services/historyService';
import { isTV } from '../utils/device';

const { width, height } = Dimensions.get('window');

export const PlayerScreen = ({ route, navigation }) => {
    const { id, type, season, episode, item } = route.params;
    const [loading, setLoading] = useState(true);
    const [showControls, setShowControls] = useState(true);
    const [activeProvider, setActiveProvider] = useState(PLAYER_CONFIG.defaultProvider);

    const timerRef = useRef(null);
    const webViewRef = useRef(null);

    // Save to History on Mount
    useEffect(() => {
        const recordHistory = async () => {
            try {
                const historyItem = {
                    ...(item || {}),
                    id: id,
                    type: type,
                    season: type === 'tv' ? season : null,
                    episode: type === 'tv' ? episode : null,
                    title: item?.title || item?.name || route.params.title || "Unknown",
                    poster_path: item?.poster_path || route.params.poster_path,
                    backdrop_path: item?.backdrop_path || route.params.backdrop_path,
                    watchedAt: new Date().toISOString()
                };
                await saveToHistory(historyItem);
            } catch (e) {
                console.error("History error", e);
            }
        };
        if (id) recordHistory();
    }, [id, season, episode]);

    const getEmbedUrl = () => {
        const provider = PLAYER_CONFIG.providers[activeProvider];
        switch (provider.type) {
            case "letsembed-style": return type === 'movie' ? `${provider.baseUrl}/movie/?id=${id}` : `${provider.baseUrl}/tv/?id=${id}/${season}/${episode}`;
            case "multiembed-style": return type === 'movie' ? `${provider.baseUrl}?video_id=${id}&tmdb=1` : `${provider.baseUrl}?video_id=${id}&tmdb=1&s=${season}&e=${episode}`;
            case "rivestream-style": return type === 'movie' ? `${provider.baseUrl}?type=movie&id=${id}` : `${provider.baseUrl}?type=tv&id=${id}&season=${season}&episode=${episode}`;
            case "vidsrc-style": return type === 'movie' ? `${provider.baseUrl}/movie/${id}` : `${provider.baseUrl}/tv/${id}/${season}/${episode}`;
            case "tmdb-param": return type === 'movie' ? `${provider.baseUrl}${id}&tmdb=1` : `${provider.baseUrl}${id}&s=${season}&e=${episode}&tmdb=1`;
            default: return `${provider.baseUrl}/${id}`;
        }
    };

    const INJECTED_JAVASCRIPT = ` 
     window.open = function() { return window; };
     document.body.style.backgroundColor = 'black';
     // Prevent frame escaping
     if (window.top !== window.self) { window.top.location = window.self.location; }
     true; 
    `;

    const resetTimer = () => {
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => {
            setShowControls(false);
        }, isTV ? 8000 : 4000);
    };

    const toggleControls = () => {
        setShowControls(prev => !prev);
        if (!showControls) resetTimer();
    };

    // TV Hardware Back Handling
    useEffect(() => {
        const backAction = () => {
            if (!showControls) {
                setShowControls(true);
                resetTimer();
                return true;
            }
            // If controls are visible, let it go back to Details
            return false;
        };
        const backHandler = BackHandler.addEventListener("hardwareBackPress", backAction);
        return () => backHandler.remove();
    }, [showControls]);

    useFocusEffect(
        React.useCallback(() => {
            async function enterImmersiveMode() {
                if (Platform.OS === 'android') {
                    await NavigationBar.setVisibilityAsync("hidden");
                    await NavigationBar.setBehaviorAsync("sticky-immersive");
                }
                StatusBar.setHidden(true, 'fade');
                await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
            }
            enterImmersiveMode();
            return () => {
                async function exitImmersiveMode() {
                    if (Platform.OS === 'android') await NavigationBar.setVisibilityAsync("visible");
                    StatusBar.setHidden(false, 'fade');
                    await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
                }
                exitImmersiveMode();
            };
        }, [])
    );

    return (
        <View style={styles.container}>
            {/* The actual video content */}
            <View style={styles.videoWrapper}>
                <WebView
                    ref={webViewRef}
                    key={activeProvider}
                    source={{ uri: getEmbedUrl() }}
                    mediaPlaybackRequiresUserAction={false}
                    allowsInlineMediaPlayback={true}
                    style={styles.webview}
                    injectedJavaScript={INJECTED_JAVASCRIPT}
                    onLoadStart={() => setLoading(true)}
                    onLoadEnd={() => setLoading(false)}
                />
            </View>

            {/* Loading Indicator */}
            {loading && (
                <View style={styles.loading}>
                    <ActivityIndicator size="large" color="#E91E63" />
                    <Text style={styles.loadingText}>Connecting to {PLAYER_CONFIG.providers[activeProvider].name}...</Text>
                </View>
            )}

            {/* Invisible interaction layer for TV to wake up controls */}
            {!showControls && (
                <Pressable
                    onPress={toggleControls}
                    style={styles.touchLayer}
                />
            )}

            {/* Controls Overlay */}
            {showControls && (
                <View style={styles.overlay}>
                    <LinearGradient
                        colors={['rgba(0,0,0,0.9)', 'rgba(0,0,0,0.5)', 'transparent']}
                        style={styles.topGradient}
                    >
                        <View style={styles.topBar}>
                            <Pressable
                                hasTVPreferredFocus={true}
                                onPress={() => navigation.goBack()}
                                style={({ focused }) => [
                                    styles.closeBtn,
                                    focused && styles.tvFocusBorder
                                ]}
                            >
                                <X color="white" size={isTV ? 32 : 24} />
                            </Pressable>

                            <View style={styles.infoWrapper}>
                                <Text style={styles.movieTitle} numberOfLines={1}>
                                    {item?.title || item?.name}
                                </Text>
                                {type === 'tv' && (
                                    <Text style={styles.episodeInfo}>
                                        Season {season} • Episode {episode}
                                    </Text>
                                )}
                            </View>

                            <View style={styles.serverSection}>
                                <Server color="rgba(255,255,255,0.6)" size={isTV ? 20 : 16} />
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.serverList}>
                                    {Object.keys(PLAYER_CONFIG.providers).map((key) => (
                                        <Pressable
                                            key={key}
                                            onPress={() => {
                                                setActiveProvider(key);
                                                resetTimer();
                                            }}
                                            style={({ focused }) => [
                                                styles.serverBtn,
                                                activeProvider === key && styles.serverBtnActive,
                                                focused && styles.tvFocusBorder
                                            ]}
                                        >
                                            <Text style={styles.serverBtnLabel}>
                                                {PLAYER_CONFIG.providers[key].name}
                                            </Text>
                                        </Pressable>
                                    ))}
                                </ScrollView>
                            </View>
                        </View>
                    </LinearGradient>

                    {isTV && (
                        <View style={styles.tvHint}>
                            <Text style={styles.hintText}>
                                D-Pad to Switch Servers • BACK to hide menu
                            </Text>
                        </View>
                    )}
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: 'black' },
    videoWrapper: { flex: 1, zIndex: 1 },
    webview: { flex: 1, backgroundColor: 'black' },
    touchLayer: { ...StyleSheet.absoluteFillObject, zIndex: 2 },
    loading: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'black',
        zIndex: 5
    },
    loadingText: { color: 'white', marginTop: 15, fontSize: 16, fontWeight: 'bold' },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 10,
    },
    topGradient: {
        paddingTop: isTV ? 30 : 20,
        paddingBottom: 60,
        paddingHorizontal: 25,
    },
    topBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between'
    },
    closeBtn: {
        padding: 10,
        borderRadius: 30,
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    infoWrapper: { flex: 1, marginLeft: 20 },
    movieTitle: { color: 'white', fontSize: isTV ? 24 : 18, fontWeight: '900' },
    episodeInfo: { color: '#E91E63', fontSize: isTV ? 16 : 12, fontWeight: 'bold', marginTop: 4 },
    serverSection: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
        paddingHorizontal: 15,
        borderRadius: 30,
        maxWidth: isTV ? '50%' : '40%'
    },
    serverList: { paddingVertical: 10, paddingLeft: 10, gap: 10 },
    serverBtn: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.1)',
        minWidth: isTV ? 100 : 70,
    },
    serverBtnActive: { backgroundColor: '#E91E63' },
    serverBtnLabel: { color: 'white', fontSize: isTV ? 14 : 11, fontWeight: 'bold', textAlign: 'center' },
    tvFocusBorder: {
        borderWidth: 3,
        borderColor: '#E91E63',
        transform: [{ scale: 1.1 }],
        backgroundColor: 'rgba(233, 30, 99, 0.2)'
    },
    tvHint: {
        position: 'absolute',
        bottom: 40,
        alignSelf: 'center',
        backgroundColor: 'rgba(0,0,0,0.6)',
        paddingHorizontal: 20,
        paddingVertical: 8,
        borderRadius: 20
    },
    hintText: { color: 'rgba(255,255,255,0.5)', fontSize: 14, fontWeight: 'bold' }
});