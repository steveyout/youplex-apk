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
} from 'react-native';
import { WebView } from 'react-native-webview';
import { Text } from 'react-native-paper';
import { X, Server, RefreshCw } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as ScreenOrientation from 'expo-screen-orientation';
import * as NavigationBar from 'expo-navigation-bar';
import { useFocusEffect } from '@react-navigation/native';
import { PLAYER_CONFIG } from '../config/PlayerConfig';
import { saveToHistory } from '../services/historyService';
import { isTV } from '../utils/device';

export const PlayerScreen = ({ route, navigation }) => {
    const { id, type, season, episode, item } = route.params;
    const [loading, setLoading] = useState(true);
    const [showControls, setShowControls] = useState(true);
    const [activeProvider, setActiveProvider] = useState(PLAYER_CONFIG.defaultProvider);
    const [webViewKey, setWebViewKey] = useState(0);

    const timerRef = useRef(null);
    const webViewRef = useRef(null);

    const startHideTimer = () => {
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => {
            setShowControls(false);
        }, isTV ? 8000 : 4000);
    };

    useEffect(() => {
        if (showControls) startHideTimer();
        return () => { if (timerRef.current) clearTimeout(timerRef.current); };
    }, [showControls]);

    useEffect(() => {
        const recordHistory = async () => {
            try {
                await saveToHistory({
                    ...(item || {}),
                    id, type,
                    season: type === 'tv' ? season : null,
                    episode: type === 'tv' ? episode : null,
                    watchedAt: new Date().toISOString()
                });
            } catch (e) { console.error("History error", e); }
        };
        if (id) recordHistory();
    }, [id, season, episode]);

    const getEmbedUrl = () => {
        const provider = PLAYER_CONFIG.providers[activeProvider];
        const base = provider.baseUrl;
        switch (provider.type) {
            case "letsembed-style": return type === 'movie' ? `${base}/movie/?id=${id}` : `${base}/tv/?id=${id}/${season}/${episode}`;
            case "multiembed-style": return type === 'movie' ? `${base}?video_id=${id}&tmdb=1` : `${base}?video_id=${id}&tmdb=1&s=${season}&e=${episode}`;
            case "rivestream-style": return type === 'movie' ? `${base}?type=movie&id=${id}` : `${base}?type=tv&id=${id}&season=${season}&episode=${episode}`;
            case "vidsrc-style": return type === 'movie' ? `${base}/movie/${id}` : `${base}/tv/${id}/${season}/${episode}`;
            case "tmdb-param": return type === 'movie' ? `${base}${id}&tmdb=1` : `${base}${id}&s=${season}&e=${episode}&tmdb=1`;
            default: return `${base}/${id}`;
        }
    };

    const handleServerSelect = (key) => {
        if (activeProvider === key) {
            setShowControls(false);
            return;
        }
        setLoading(true);
        setActiveProvider(key);
        setShowControls(false);
    };

    const handleHardReload = () => {
        setLoading(true);
        setWebViewKey(prev => prev + 1);
    };

    const handleNavigationRequest = (request) => {
        const { url, isTopFrame } = request;
        const currentEmbedUrl = getEmbedUrl();
        if (url === currentEmbedUrl) return true;

        const getDomain = (u) => {
            const matches = u.match(/^https?:\/\/([^/?#]+)/i);
            return matches && matches[1] ? matches[1].toLowerCase().replace('www.', '') : '';
        };

        const providerBase = PLAYER_CONFIG.providers[activeProvider].baseUrl;
        const providerDomain = getDomain(providerBase);
        const requestDomain = getDomain(url);

        if (url === 'about:blank' || url.startsWith('data:') || url.startsWith('blob:')) return true;

        if (isTopFrame) {
            const isSameDomain = requestDomain.endsWith(providerDomain);
            const isWhitelisted = PLAYER_CONFIG.whitelist.some(d => url.includes(d.toLowerCase()));

            if (isSameDomain) {
                const containsId = url.includes(id);
                const hasPlayerKeywords = /embed|video|player|watch|v=|s=|e=/i.test(url);
                if (!containsId && !hasPlayerKeywords) return false;
                return true;
            }
            if (isWhitelisted) return true;
            return false;
        }
        return true;
    };

    const INJECTED_JS = `
        (function() {
            window.open = function() { return null; };
            window.alert = function() { return null; };
            window.onbeforeunload = function() { return null; };

            document.addEventListener('click', () => {
                window.ReactNativeWebView.postMessage('wake_up');
            }, true);

            const style = document.createElement('style');
            style.innerHTML = \`
                body { background-color: black !important; }
                iframe { pointer-events: auto !important; }
                .ad-layer, .pop-under, #popunder, [id*="pop"], [class*="ad-"], .overlay-ads, #disclaimer { 
                    display: none !important; 
                    pointer-events: none !important; 
                    z-index: -1 !important;
                    opacity: 0 !important;
                }
            \`;
            document.head.appendChild(style);

            const forcePlay = () => {
                const video = document.querySelector('video');
                if (video) {
                    video.muted = false;
                    video.play().catch(() => {});
                }
            };
            const pInterval = setInterval(forcePlay, 1000);
            setTimeout(() => clearInterval(pInterval), 10000);
        })();
        true;
    `;

    const onMessage = (event) => {
        if (event.nativeEvent.data === 'wake_up') setShowControls(true);
    };

    useEffect(() => {
        if (!showControls && !loading && isTV) {
            setTimeout(() => webViewRef.current?.requestFocus(), 500);
        }
    }, [showControls, loading]);

    useEffect(() => {
        const backAction = () => {
            if (!showControls) {
                setShowControls(true);
                return true;
            }
            return false;
        };
        const handler = BackHandler.addEventListener("hardwareBackPress", backAction);
        return () => handler.remove();
    }, [showControls]);

    useFocusEffect(
        React.useCallback(() => {
            const enterMode = async () => {
                if (Platform.OS === 'android') {
                    await NavigationBar.setVisibilityAsync("hidden");
                    await NavigationBar.setBehaviorAsync("sticky-immersive");
                }
                StatusBar.setHidden(true);
                await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
            };
            enterMode();
            return () => {
                ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
                StatusBar.setHidden(false);
            };
        }, [])
    );

    return (
        <View style={styles.container}>
            <View style={styles.videoWrapper}>
                <WebView
                    ref={webViewRef}
                    key={`${activeProvider}-${webViewKey}`}
                    source={{ uri: getEmbedUrl() }}
                    // TV: Only focusable when UI is hidden to prevent remote cursor hijacking
                    focusable={!showControls}
                    mediaPlaybackRequiresUserAction={false}
                    allowsInlineMediaPlayback={true}
                    javaScriptEnabled={true}
                    domStorageEnabled={true}
                    setSupportMultipleWindows={false}
                    style={styles.webview}
                    injectedJavaScript={INJECTED_JS}
                    onMessage={onMessage}
                    onShouldStartLoadWithRequest={handleNavigationRequest}
                    onLoadStart={() => setLoading(true)}
                    onLoadEnd={() => setLoading(false)}
                />
            </View>

            <View
                style={[styles.overlay, { opacity: showControls ? 1 : 0 }]}
                pointerEvents={showControls ? "box-none" : "none"}
            >
                <LinearGradient
                    colors={['rgba(0,0,0,0.9)', 'transparent']}
                    style={styles.topGradient}
                    pointerEvents="box-none"
                >
                    <View style={styles.topBar} pointerEvents="box-none">
                        <Pressable
                            focusable={true}
                            hasTVPreferredFocus={true} // Auto-focus this when UI opens
                            onPress={() => navigation.goBack()}
                            style={({ focused }) => [
                                styles.closeBtn,
                                focused && styles.tvFocusBorder
                            ]}
                        >
                            <X color="white" size={isTV ? 32 : 24} />
                        </Pressable>

                        <View style={styles.infoWrapper}>
                            <Text style={styles.movieTitle} numberOfLines={1}>{item?.title || item?.name}</Text>
                            {type === 'tv' && <Text style={styles.episodeInfo}>S{season} • E{episode}</Text>}
                        </View>

                        <View style={styles.serverSection} pointerEvents="auto">
                            <Pressable
                                focusable={true}
                                onPress={handleHardReload}
                                style={({ focused }) => [styles.reloadBtn, focused && styles.tvFocusBorder]}
                            >
                                <RefreshCw color="white" size={18} />
                            </Pressable>

                            <Server color="white" size={16} />

                            <ScrollView
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                contentContainerStyle={styles.serverList}
                            >
                                {Object.keys(PLAYER_CONFIG.providers).map((key) => (
                                    <Pressable
                                        key={key}
                                        focusable={true}
                                        onPress={() => handleServerSelect(key)}
                                        style={({ focused }) => [
                                            styles.serverBtn,
                                            activeProvider === key && styles.serverBtnActive,
                                            focused && styles.tvFocusBorder
                                        ]}
                                    >
                                        <Text style={styles.serverBtnLabel}>{PLAYER_CONFIG.providers[key].name}</Text>
                                    </Pressable>
                                ))}
                            </ScrollView>
                        </View>
                    </View>
                </LinearGradient>
            </View>

            {loading && (
                <View style={styles.loading}>
                    <ActivityIndicator size="large" color="#E91E63" />
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: 'black' },
    videoWrapper: { ...StyleSheet.absoluteFillObject, zIndex: 1 },
    webview: { flex: 1, backgroundColor: 'black' },
    overlay: { ...StyleSheet.absoluteFillObject, zIndex: 10 },
    topGradient: { paddingTop: 40, paddingBottom: 100, paddingHorizontal: 20 },
    topBar: { flexDirection: 'row', alignItems: 'center' },
    closeBtn: { padding: 10, borderRadius: 30, backgroundColor: 'rgba(255,255,255,0.2)' },
    reloadBtn: { padding: 10, marginRight: 5, borderRadius: 20 },
    infoWrapper: { flex: 1, marginLeft: 20 },
    movieTitle: { color: 'white', fontSize: 18, fontWeight: 'bold' },
    episodeInfo: { color: '#E91E63', fontSize: 12, fontWeight: 'bold' },
    serverSection: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 30, paddingLeft: 15, maxWidth: '60%' },
    serverList: { padding: 10, gap: 10 },
    serverBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 15, backgroundColor: 'rgba(255,255,255,0.1)' },
    serverBtnActive: { backgroundColor: '#E91E63' },
    serverBtnLabel: { color: 'white', fontSize: 12 },
    // Improved TV focus visibility
    tvFocusBorder: {
        borderWidth: 3,
        borderColor: '#E91E63',
        backgroundColor: 'rgba(233, 30, 99, 0.2)',
        borderRadius: 12
    },
    loading: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', backgroundColor: 'black', zIndex: 100 },
});