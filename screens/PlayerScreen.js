import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    StyleSheet,
    View,
    Text,
    Platform,
    ActivityIndicator,
    Pressable,
    Dimensions,
} from 'react-native';
import * as ScreenOrientation from 'expo-screen-orientation';
import * as NavigationBar from 'expo-navigation-bar';
import { StatusBar } from 'expo-status-bar';
import { useFocusEffect } from '@react-navigation/native';
import { RefreshCw, ArrowLeft } from 'lucide-react-native';

import { MaterialNativePlayer } from '../components/player/MaterialNativePlayer';
import {
    scrapeMediaWithAutoSwitch,
    PSTREAM_SOURCES,
    DEFAULT_PROVIDER_ID,
    getProviderFriendlyName,
} from '../services/providerService';
import { getSeasonDetails } from '../services/api';
import { saveToHistory } from '../services/historyService';
import { isTV } from '../utils/device';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export const PlayerScreen = ({ route, navigation }) => {
    const { id, type = 'movie', item = {}, season: initSeason = 1, episode: initEpisode = 1 } = route.params;

    const [season, setSeason] = useState(Number(initSeason) || 1);
    const [episode, setEpisode] = useState(Number(initEpisode) || 1);
    const [episodesList, setEpisodesList] = useState([]);

    // Providers / Sources from @p-stream/providers
    const [activeProvider, setActiveProvider] = useState(DEFAULT_PROVIDER_ID);
    const [activeProviderLabel, setActiveProviderLabel] = useState(getProviderFriendlyName(DEFAULT_PROVIDER_ID));
    const [triedProviders, setTriedProviders] = useState([]);

    // Scraped Stream Source
    const [streamSource, setStreamSource] = useState(null);
    const [subtitles, setSubtitles] = useState([]);
    const [isScraping, setIsScraping] = useState(true);
    const [scrapeStatus, setScrapeStatus] = useState('Resolving stream from @p-stream providers...');
    const [autoSwitchNotice, setAutoSwitchNotice] = useState(null);
    const [lastKnownPosition, setLastKnownPosition] = useState(
        Number(route.params?.item?.position) || Number(route.params?.position) || 0
    );

    const title = item?.title || item?.name || 'Now Playing';
    const releaseYear = (item?.release_date || item?.first_air_date || '').split('-')[0] || null;

    useEffect(() => {
        if (type === 'tv' && id) {
            const fetchEpisodes = async () => {
                try {
                    const data = await getSeasonDetails(id, season);
                    if (data?.episodes) {
                        setEpisodesList(data.episodes);
                    }
                } catch (e) {
                    console.warn('Failed to load season episodes:', e);
                }
            };
            fetchEpisodes();
        }
    }, [id, type, season]);

    const runScraper = useCallback(
        async (targetProvider = activeProvider, existingTried = []) => {
            setIsScraping(true);
            setScrapeStatus(`Searching stream on ${getProviderFriendlyName(targetProvider)}...`);

            try {
                const result = await scrapeMediaWithAutoSwitch({
                    id,
                    type,
                    title,
                    releaseYear,
                    season,
                    episode,
                    preferredProvider: targetProvider,
                    triedProviders: existingTried,
                    onProgress: (evt) => {
                        if (evt.message) setScrapeStatus(evt.message);
                    },
                });

                if (result.success && result.sources?.length > 0) {
                    const primary = result.sources[0];
                    setStreamSource({
                        url: primary.url,
                        isM3U8: primary.isM3U8,
                        type: primary.type,
                        headers: primary.headers || {},
                    });
                    setSubtitles(result.subtitles || []);
                    setActiveProvider(result.provider);
                    setActiveProviderLabel(result.providerLabel || getProviderFriendlyName(result.provider));
                    setTriedProviders(result.triedProviders || [result.provider]);
                } else {
                    setScrapeStatus('No active stream found on providers.');
                }
            } catch (err) {
                console.warn('Scraping error:', err);
                setScrapeStatus('Stream resolution failed.');
            } finally {
                setIsScraping(false);
            }
        },
        [id, type, title, releaseYear, season, episode, activeProvider]
    );

    useEffect(() => {
        setTriedProviders([]);
        runScraper(activeProvider, []);
    }, [season, episode]);

    // Handle manual provider selection from the Server Modal
    const handleSelectProvider = (provId) => {
        setActiveProvider(provId);
        setActiveProviderLabel(getProviderFriendlyName(provId));
        setTriedProviders([]);
        runScraper(provId, []);
    };

    // Auto-switch to next provider when a stream breaks or fails
    const handleAutoSwitchNext = useCallback(() => {
        const nextTried = [...triedProviders, activeProvider];
        const nextAvailable = PSTREAM_SOURCES.find((p) => !nextTried.includes(p.id)) || PSTREAM_SOURCES[0];

        setAutoSwitchNotice(`Stream issue detected. Auto-switching to ${nextAvailable.label}...`);
        setTimeout(() => setAutoSwitchNotice(null), 4000);

        setActiveProvider(nextAvailable.id);
        setActiveProviderLabel(nextAvailable.label);
        setTriedProviders(nextTried);
        runScraper(nextAvailable.id, nextTried);
    }, [triedProviders, activeProvider, runScraper]);

    useFocusEffect(
        useCallback(() => {
            const enterImmersive = async () => {
                if (Platform.OS === 'android') {
                    try {
                        await NavigationBar.setVisibilityAsync('hidden');
                        await NavigationBar.setBehaviorAsync('sticky-immersive');
                    } catch (e) {}
                }
                try {
                    await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
                } catch (e) {}
            };
            enterImmersive();

            return () => {
                if (Platform.OS !== 'web' && !isTV) {
                    ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP).catch(() => {});
                }
                if (Platform.OS === 'android') {
                    NavigationBar.setVisibilityAsync('visible').catch(() => {});
                }
            };
        }, [])
    );

    const handleProgressUpdate = useCallback(
        ({ position, duration }) => {
            setLastKnownPosition(position);
            if (position > 5) {
                saveToHistory({
                    id,
                    type,
                    title,
                    poster_path: item?.poster_path,
                    backdrop_path: item?.backdrop_path,
                    season,
                    episode,
                    position,
                    duration,
                });
            }
        },
        [id, type, title, item, season, episode]
    );

    const handleSelectEpisode = (ep) => {
        setEpisode(ep.episode_number);
    };

    const handleNextEpisode = () => {
        const nextEpNum = Number(episode) + 1;
        const exists = episodesList.some((ep) => ep.episode_number === nextEpNum);
        if (exists) {
            setEpisode(nextEpNum);
        }
    };

    const subtitleString = type === 'tv' ? `Season ${season} \u2022 Episode ${episode}` : releaseYear;

    return (
        <View style={styles.container}>
            <StatusBar hidden={true} />

            {/* --- LOADING / AUTO-SWITCHING OVERLAY --- */}
            {isScraping && (
                <View style={styles.loadingScreen}>
                    <ActivityIndicator size={isTV ? 64 : 48} color="#FF3030" />
                    <Text style={styles.loadingTitle}>Connecting to {activeProviderLabel}...</Text>
                    <Text style={styles.loadingStatus}>{scrapeStatus}</Text>

                    <View style={styles.actionRow}>
                        <Pressable
                            style={styles.cancelBtn}
                            onPress={() => navigation.goBack()}
                        >
                            <ArrowLeft color="#FFFFFF" size={16} />
                            <Text style={styles.cancelBtnText}>Back</Text>
                        </Pressable>

                        <Pressable
                            style={styles.retryBtn}
                            onPress={handleAutoSwitchNext}
                        >
                            <RefreshCw color="#FFFFFF" size={16} />
                            <Text style={styles.retryBtnText}>Skip to Next Provider</Text>
                        </Pressable>
                    </View>
                </View>
            )}

            {/* --- AUTO-SWITCH TOAST NOTICE --- */}
            {Boolean(autoSwitchNotice) && (
                <View style={styles.toastNotice} pointerEvents="none">
                    <Text style={styles.toastText}>{autoSwitchNotice}</Text>
                </View>
            )}

            {/* --- NATIVE MATERIAL VIDEO PLAYER --- */}
            {!isScraping && streamSource && (
                <MaterialNativePlayer
                    streamUrl={streamSource.url}
                    streamHeaders={streamSource.headers}
                    subtitles={subtitles}
                    activeProvider={activeProvider}
                    activeProviderLabel={activeProviderLabel}
                    availableProviders={PSTREAM_SOURCES}
                    onSelectProvider={handleSelectProvider}
                    onAutoSwitchNext={handleAutoSwitchNext}
                    onReloadSource={() => runScraper(activeProvider, [])}
                    title={title}
                    subtitle={subtitleString}
                    type={type}
                    season={season}
                    episode={episode}
                    episodes={episodesList}
                    onSelectEpisode={handleSelectEpisode}
                    onNextEpisode={
                        episodesList.some((ep) => ep.episode_number === Number(episode) + 1)
                            ? handleNextEpisode
                            : null
                    }
                    onClose={() => navigation.goBack()}
                    onProgressUpdate={handleProgressUpdate}
                    initialPosition={lastKnownPosition}
                />
            )}

            {/* --- ALL PROVIDERS FAILED SCREEN --- */}
            {!isScraping && !streamSource && (
                <View style={styles.errorScreen}>
                    <Text style={styles.errorTitle}>Stream Resolution Failed</Text>
                    <Text style={styles.errorSubtitle}>
                        None of the @p-stream providers returned an active direct stream for this media.
                    </Text>
                    <Pressable
                        style={styles.retryMainBtn}
                        onPress={() => runScraper(DEFAULT_PROVIDER_ID, [])}
                    >
                        <RefreshCw color="#FFFFFF" size={18} />
                        <Text style={styles.retryMainBtnText}>Retry from Provider 1</Text>
                    </Pressable>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000000',
    },
    loadingScreen: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: '#050505',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
        zIndex: 50,
    },
    loadingTitle: {
        color: '#FFFFFF',
        fontSize: isTV ? 24 : 18,
        fontWeight: 'bold',
        marginTop: 20,
        textAlign: 'center',
    },
    loadingStatus: {
        color: '#8A99A8',
        fontSize: isTV ? 16 : 13,
        marginTop: 8,
        textAlign: 'center',
    },
    actionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        marginTop: 28,
    },
    cancelBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 24,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        gap: 8,
    },
    cancelBtnText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '700',
    },
    retryBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 24,
        backgroundColor: 'rgba(255, 48, 48, 0.25)',
        borderWidth: 1,
        borderColor: '#FF3030',
        gap: 8,
    },
    retryBtnText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '700',
    },
    toastNotice: {
        position: 'absolute',
        top: 24,
        alignSelf: 'center',
        backgroundColor: 'rgba(20, 26, 33, 0.92)',
        borderWidth: 1.2,
        borderColor: '#FF3030',
        paddingHorizontal: 22,
        paddingVertical: 12,
        borderRadius: 24,
        zIndex: 100,
        shadowColor: '#FF3030',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.6,
        shadowRadius: 10,
    },
    toastText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '800',
    },
    errorScreen: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: '#0A0E14',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 30,
        zIndex: 40,
    },
    errorTitle: {
        color: '#FF3030',
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    errorSubtitle: {
        color: '#8A99A8',
        fontSize: 14,
        textAlign: 'center',
        maxWidth: 420,
        marginBottom: 24,
        lineHeight: 20,
    },
    retryMainBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FF3030',
        paddingHorizontal: 24,
        paddingVertical: 14,
        borderRadius: 24,
        gap: 8,
    },
    retryMainBtnText: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '700',
    },
});
