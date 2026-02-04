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


export const PlayerScreen = ({ route, navigation }) => {
    const { id, type, season, episode } = route.params;
    const [loading, setLoading] = useState(true);
    const [showControls, setShowControls] = useState(true);
    const [activeProvider, setActiveProvider] = useState(PLAYER_CONFIG.defaultProvider);
    const timerRef = useRef(null);

    const getEmbedUrl = () => {
        const provider = PLAYER_CONFIG.providers[activeProvider];
        switch (provider.type) {
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

    const INJECTED_JAVASCRIPT =` (function() {
        const style = document.createElement('style');
        style.innerHTML = \`
      /* Hide standard HTML5 controls */
      video::-webkit-media-controls { display:none !important; }
      video::-webkit-media-controls-panel { display:none !important; }
      video::-webkit-media-controls-enclosure { display:none !important; }
      
      /* Hide common custom player controls (Video.js, Plyr, etc.) */
      .vjs-control-bar, .plyr__controls, .jw-controls, .vjs-big-play-button {
        display: none !important;
        opacity: 0 !important;
        visibility: hidden !important;
      }
    \`;
    document.head.appendChild(style);

    // Target the video element directly
    const hideNative = () => {
      const vids = document.querySelectorAll('video');
      vids.forEach(v => {
        v.controls = false;
        // Optional: Force playsinline to keep it from jumping to full screen
        v.setAttribute('playsinline', 'true');
        v.setAttribute('webkit-playsinline', 'true');
      });
    };

    // Run immediately and again when video starts playing
    hideNative();
    document.addEventListener('play', hideNative, true);
  })();
  true; // Required for injectedJavaScript to work
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
                    await NavigationBar.setBehaviorAsync("overlay-swipe");
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
                style={styles.webview}
                // HIGHLIGHT: Enable these for inspection
                webviewDebuggingEnabled={true}
                scrollEnabled={true}
                // Allows you to see the context menu on long-press
                menuEnabled={true}
                onShouldStartLoadWithRequest={handleNavigationStateChange}
                injectedJavaScript={INJECTED_JAVASCRIPT}
                javaScriptEnabled={true}
                domStorageEnabled={true}
                allowsFullscreenVideo={true}
                allowsInlineMediaPlayback={true}
                setSupportMultipleWindows={false}
                userAgent={PLAYER_CONFIG.userAgent}
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

            {/* Control Overlay at the top */}
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