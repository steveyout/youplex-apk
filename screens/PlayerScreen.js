import React, { useState, useEffect, useRef } from 'react';
import {
    StyleSheet,
    View,
    ActivityIndicator,
    Platform,
    StatusBar,
    ScrollView
} from 'react-native';
import { WebView } from 'react-native-webview';
import { IconButton, Button, Text } from 'react-native-paper';
import { X } from 'lucide-react-native';
import * as ScreenOrientation from 'expo-screen-orientation';
import * as NavigationBar from 'expo-navigation-bar';
import { useFocusEffect } from '@react-navigation/native';
import { PLAYER_CONFIG } from '../config/PlayerConfig';
import { saveToHistory } from '../services/historyService'; // Service Imported

export const PlayerScreen = ({ route, navigation }) => {
    // Route params now include the full item object for history
    const { id, type, season, episode, item } = route.params;
    const [loading, setLoading] = useState(true);
    const [showControls, setShowControls] = useState(true);
    const [activeProvider, setActiveProvider] = useState(PLAYER_CONFIG.defaultProvider);
    const timerRef = useRef(null);

    // --- UPDATED: SAVE TO HISTORY ON MOUNT ---
    useEffect(() => {
        const recordHistory = async () => {
            try {
                // Merge the specific playback params into the history item
                const historyItem = {
                    ...(item || {}), // Spread existing TMDB data
                    id: id,
                    type: type,
                    // Prioritize the specific season/episode passed in route params
                    season: type === 'tv' ? season : null,
                    episode: type === 'tv' ? episode : null,
                    // Ensure fallbacks for display
                    title: item?.title || item?.name || route.params.title || "Unknown",
                    poster_path: item?.poster_path || route.params.poster_path,
                    backdrop_path: item?.backdrop_path || route.params.backdrop_path,
                    watchedAt: new Date().toISOString()
                };

                await saveToHistory(historyItem);
                console.log(`[History] Saved: ${historyItem.title} S:${season} E:${episode}`);
            } catch (e) {
                console.error("History could not be saved", e);
            }
        };

        if (id) recordHistory();
    }, [id, season, episode]); // Added dependencies so it re-saves if user skips to next episode

    const getEmbedUrl = () => {
        const provider = PLAYER_CONFIG.providers[activeProvider];

        switch (provider.type) {
            case "letsembed-style":
                return type === 'movie'
                    ? `${provider.baseUrl}/movie/?id=${id}`
                    : `${provider.baseUrl}/tv/?id=${id}/${season}/${episode}`;

            case "multiembed-style":
                return type === 'movie'
                    ? `${provider.baseUrl}?video_id=${id}&tmdb=1`
                    : `${provider.baseUrl}?video_id=${id}&tmdb=1&s=${season}&e=${episode}`;

            case "rivestream-style":
                return type === 'movie'
                    ? `${provider.baseUrl}?type=movie&id=${id}`
                    : `${provider.baseUrl}?type=tv&id=${id}&season=${season}&episode=${episode}`;

            case "vidsrc-style":
                return type === 'movie'
                    ? `${provider.baseUrl}/movie/${id}`
                    : `${provider.baseUrl}/tv/${id}/${season}/${episode}`;

            case "tmdb-param":
                return type === 'movie'
                    ? `${provider.baseUrl}${id}&tmdb=1`
                    : `${provider.baseUrl}${id}&s=${season}&e=${episode}&tmdb=1`;

            default:
                return `${provider.baseUrl}/${id}`;
        }
    };

    const INJECTED_JAVASCRIPT = ` 
     window.open = function() { return window; };
     true; 
    `;

    const resetTimer = () => {
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => {
            setShowControls(false);
        }, 4000);
    };

    const onScreenTouch = () => {
        setShowControls(true);
        resetTimer();
    };

    useEffect(() => {
        resetTimer();
        return () => { if (timerRef.current) clearTimeout(timerRef.current); };
    }, []);

    useFocusEffect(
        React.useCallback(() => {
            async function enterImmersiveMode() {
                if (Platform.OS === 'android') {
                    await NavigationBar.setVisibilityAsync("hidden");
                    await NavigationBar.setBehaviorAsync("sticky-immersive"); // Changed to sticky
                }
                if (Platform.OS !== 'web') {
                    StatusBar.setHidden(true, 'fade');
                    await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
                }
            }
            enterImmersiveMode();
            return () => {
                async function exitImmersiveMode() {
                    if (Platform.OS === 'android') await NavigationBar.setVisibilityAsync("visible");
                    if (Platform.OS !== 'web') {
                        StatusBar.setHidden(false, 'fade');
                        await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
                    }
                }
                exitImmersiveMode();
            };
        }, [])
    );

    const handleNavigationStateChange = (request) => {
        const isWhitelisted = PLAYER_CONFIG.whitelist.some(domain => request.url.includes(domain));
        const isBlacklisted = PLAYER_CONFIG.blacklist.some(term => request.url.includes(term));
        return isWhitelisted && !isBlacklisted;
    };

    return (
        <View style={styles.container}>
            <WebView
                key={activeProvider}
                source={{ uri: getEmbedUrl() }}
                mediaPlaybackRequiresUserAction={false}
                allowsInlineMediaPlayback={true}
                style={styles.webview}
                onShouldStartLoadWithRequest={handleNavigationStateChange}
                injectedJavaScript={INJECTED_JAVASCRIPT}
                javaScriptEnabled={true}
                domStorageEnabled={true}
                allowsFullscreenVideo={true}
                setSupportMultipleWindows={false}
                onLoadStart={() => setLoading(true)}
                onLoadEnd={() => setLoading(false)}
                onTouchStart={onScreenTouch}
            />

            {loading && (
                <View style={styles.loading} pointerEvents="none">
                    <ActivityIndicator size="large" color="#E91E63" />
                    <Text style={styles.loadingText}>Connecting to {PLAYER_CONFIG.providers[activeProvider].name}...</Text>
                </View>
            )}

            <View
                style={[styles.overlay, { opacity: showControls ? 1 : 0 }]}
                pointerEvents={showControls ? "box-none" : "none"}
            >
                <View style={styles.topBar} pointerEvents="box-none">
                    <IconButton
                        icon={() => <X color="white" size={24} />}
                        style={styles.closeButton}
                        onPress={() => navigation.goBack()}
                    />

                    <View style={styles.serverWrapper} pointerEvents="box-none">
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.serverScroll}
                        >
                            {Object.keys(PLAYER_CONFIG.providers).map((key) => (
                                <Button
                                    key={key}
                                    mode="contained"
                                    onPress={() => {
                                        setActiveProvider(key);
                                        onScreenTouch();
                                    }}
                                    style={[
                                        styles.serverBtn,
                                        { backgroundColor: activeProvider === key ? '#E91E63' : 'rgba(255,255,255,0.2)' }
                                    ]}
                                    labelStyle={styles.serverBtnLabel}
                                >
                                    {PLAYER_CONFIG.providers[key].name}
                                </Button>
                            ))}
                        </ScrollView>
                    </View>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: 'black' },
    webview: { flex: 1, backgroundColor: 'black' },
    loading: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'black',
        zIndex: 5
    },
    loadingText: { color: 'white', marginTop: 10, fontSize: 12, fontWeight: 'bold' },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 10,
        backgroundColor: 'rgba(0,0,0,0.3)'
    },
    topBar: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: Platform.OS === 'ios' ? 40 : 20,
        paddingHorizontal: 15,
    },
    closeButton: {
        backgroundColor: 'rgba(0,0,0,0.6)',
        borderRadius: 25,
        marginRight: 10
    },
    serverWrapper: {
        flex: 1,
        height: 50,
        justifyContent: 'center'
    },
    serverScroll: {
        alignItems: 'center',
        gap: 8,
        paddingRight: 20
    },
    serverBtn: {
        borderRadius: 20,
        height: 32,
        justifyContent: 'center',
        minWidth: 80
    },
    serverBtnLabel: {
        fontSize: 10,
        color: 'white',
        fontWeight: 'bold',
        marginVertical: 0,
        marginHorizontal: 10
    }
});