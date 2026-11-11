import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    Share,
    StyleSheet,
    View,
    Text,
    Platform,
    ActivityIndicator,
    Pressable,
    ScrollView,
    Image,
    useWindowDimensions,
} from 'react-native';
import * as ScreenOrientation from 'expo-screen-orientation';
import * as NavigationBar from 'expo-navigation-bar';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import {
    Cast,
    Share2,
    RefreshCw,
    ArrowLeft,
    Sparkles,
    Maximize,
    Minimize,
    Check,
    Plus,
    Clock,
    Play,
    Flame,
    Film,
    Tv,
    Server,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { MaterialNativePlayer } from '../components/player/MaterialNativePlayer';
import {
    scrapeMediaWithAutoSwitch,
    ALL_PLAYBACK_SOURCES,
    DEFAULT_PROVIDER_ID,
    getProviderFriendlyName,
} from '../services/providerService';
import { getSeasonDetails, getDetails } from '../services/api';
import { saveToHistory, getHistory, getItemProgress } from '../services/historyService';
import { isBookmarked, toggleBookmark } from '../services/bookmarksService';
import { isTV } from '../utils/device';

function formatDuration(seconds) {
    if (!seconds || isNaN(seconds) || seconds < 0) return '00:00';
    const totalSecs = Math.floor(seconds);
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    const pad = (n) => (n < 10 ? `0${n}` : `${n}`);
    if (hrs > 0) return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
    return `${pad(mins)}:${pad(secs)}`;
}

export const PlayerScreen = ({ route, navigation }) => {
    const { id, type = 'movie', item = {}, season: initSeason = 1, episode: initEpisode = 1 } = route.params;

    const insets = useSafeAreaInsets();
    const { width: winWidth, height: winHeight } = useWindowDimensions();
    const isLandscape = isTV || winWidth > winHeight;

    const [season, setSeason] = useState(Number(initSeason) || 1);
    const [episode, setEpisode] = useState(Number(initEpisode) || 1);
    const [episodesList, setEpisodesList] = useState([]);
    const [seasonsList, setSeasonsList] = useState(item?.seasons || []);
    const [showCastModal, setShowCastModal] = useState(false);
    const [connectedCastDevice, setConnectedCastDevice] = useState(null);

    // Primary Vyla SDK Engine with secondary failover
    const [activeProvider, setActiveProvider] = useState(DEFAULT_PROVIDER_ID);
    const [activeProviderLabel, setActiveProviderLabel] = useState(getProviderFriendlyName(DEFAULT_PROVIDER_ID));
    const [triedProviders, setTriedProviders] = useState([]);

    // Scraped Stream Source
    const [streamSource, setStreamSource] = useState(null);
    const [subtitles, setSubtitles] = useState([]);
    const [isScraping, setIsScraping] = useState(true);
    const [scrapeStatus, setScrapeStatus] = useState('Resolving playback stream...');
    const [autoSwitchNotice, setAutoSwitchNotice] = useState(null);
    const [resumeNotice, setResumeNotice] = useState(null);

    // Continue Watching inside Player
    const [continueWatchingList, setContinueWatchingList] = useState([]);
    const [bookmarked, setBookmarked] = useState(false);

    const [lastKnownPosition, setLastKnownPosition] = useState(
        Number(route.params?.item?.position) || Number(route.params?.position) || 0
    );

    const title = item?.title || item?.name || 'Now Playing';
    const releaseYear = (item?.release_date || item?.first_air_date || '').split('-')[0] || '2025';

    // Check saved progress and watchlist status on mount
    useEffect(() => {
        getItemProgress(id, season, episode).then((savedPos) => {
            if (savedPos > 15 && (!route.params?.position || route.params.position === 0)) {
                setLastKnownPosition(savedPos);
                setResumeNotice(`Resumed from ${formatDuration(savedPos)}`);
                setTimeout(() => setResumeNotice(null), 4000);
            }
        });
        isBookmarked(id).then(setBookmarked);
    }, [id, season, episode]);

    // Load other continue watching items from history
    const loadContinueWatching = async () => {
        try {
            const hist = await getHistory();
            if (Array.isArray(hist)) {
                const other = hist.filter((h) => String(h.id) !== String(id));
                setContinueWatchingList(other.slice(0, 10));
            }
        } catch (e) {
            console.warn('Failed to load continue watching list:', e);
        }
    };

    useEffect(() => {
        loadContinueWatching();
    }, [id]);

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
            setScrapeStatus(`Connecting to ${getProviderFriendlyName(targetProvider)}...`);

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

                    if (result.isFallback) {
                        setAutoSwitchNotice(`Failover: Playing via Secondary Server (${result.providerLabel})`);
                        setTimeout(() => setAutoSwitchNotice(null), 4500);
                    } else if (result.isVylaPrimary) {
                        setAutoSwitchNotice(`Connected: Vyla SDK Primary (${result.providerLabel})`);
                        setTimeout(() => setAutoSwitchNotice(null), 3000);
                    }
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
        const nextAvailable = ALL_PLAYBACK_SOURCES.find((p) => !nextTried.includes(p.id)) || ALL_PLAYBACK_SOURCES[0];

        setAutoSwitchNotice(`Stream issue detected. Auto-switching to ${nextAvailable.label}...`);
        setTimeout(() => setAutoSwitchNotice(null), 4000);

        setActiveProvider(nextAvailable.id);
        setActiveProviderLabel(nextAvailable.label);
        setTriedProviders(nextTried);
        runScraper(nextAvailable.id, nextTried);
    }, [triedProviders, activeProvider, runScraper]);

    // Allow both portrait and landscape mode on mobile
    useFocusEffect(
        useCallback(() => {
            const configureDisplay = async () => {
                if (Platform.OS === 'android') {
                    try {
                        await NavigationBar.setVisibilityAsync('hidden');
                        await NavigationBar.setBehaviorAsync('sticky-immersive');
                    } catch (e) {}
                }
                if (isTV) {
                    try {
                        await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
                    } catch (e) {}
                } else if (Platform.OS !== 'web') {
                    // Unlock so user can rotate freely between portrait and landscape
                    try {
                        await ScreenOrientation.unlockAsync();
                    } catch (e) {}
                }
            };
            configureDisplay();

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

    // Toggle orientation manually via button
    const handleToggleOrientation = async () => {
        if (Platform.OS === 'web' || isTV) return;
        try {
            if (isLandscape) {
                await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
            } else {
                await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
            }
        } catch (e) {
            console.warn('Orientation toggle error:', e);
        }
    };

    // Save playback progress continuously and on pause
    const handleProgressUpdate = useCallback(
        ({ position, duration }) => {
            setLastKnownPosition(position);
            if (position > 5) {
                saveToHistory({
                    id,
                    type,
                    title,
                    poster_path: item?.poster_path || item?.image,
                    backdrop_path: item?.backdrop_path || item?.backdrop,
                    season,
                    episode,
                    position,
                    duration,
                });
            }
        },
        [id, type, title, item, season, episode]
    );

    // Switch playback immediately when selecting another title from continue watching
    const handleSwitchMedia = (targetItem) => {
        navigation.replace('Player', {
            id: targetItem.id,
            type: targetItem.type || 'movie',
            item: targetItem,
            season: targetItem.season || 1,
            episode: targetItem.episode || 1,
            position: targetItem.position || 0,
        });
    };

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

    const handleToggleBookmarkAction = async () => {
        const newState = await toggleBookmark({
            ...item,
            id,
            media_type: type,
        });
        setBookmarked(newState);
    };

    // Fetch full seasons array for TV shows
    useEffect(() => {
        if (type === 'tv' && id) {
            getDetails(id, 'tv')
                .then((details) => {
                    if (details?.seasons && Array.isArray(details.seasons)) {
                        const regular = details.seasons.filter((s) => s.season_number > 0);
                        setSeasonsList(regular.length > 0 ? regular : details.seasons);
                    }
                })
                .catch((e) => console.warn('Failed to fetch tv seasons:', e));
        }
    }, [id, type]);

    const handleSelectSeason = (seasonNum) => {
        setSeason(Number(seasonNum));
        setEpisode(1);
    };

    const handleShareAction = async () => {
        try {
            await Share.share({
                message: `Watching ${title} on YouPlex!`,
            });
        } catch (e) {}
    };

    const subtitleString = type === 'tv' ? `Season ${season} • Episode ${episode}` : releaseYear;

    // Portrait player takes over top half of screen
    const portraitPlayerHeight = Math.round(winHeight * 0.5);

    return (
        <View style={styles.container}>
            <StatusBar hidden={isLandscape} style="light" />

            {/* --- AUTO-SWITCH TOAST NOTICE --- */}
            {Boolean(autoSwitchNotice) && (
                <View
                    style={[
                        styles.toastNotice,
                        !isLandscape
                            ? { top: portraitPlayerHeight + 10 }
                            : { top: 72 },
                    ]}
                    pointerEvents="none"
                >
                    <Sparkles color="#FF2442" size={16} style={{ marginRight: 6 }} />
                    <Text style={styles.toastText}>{autoSwitchNotice}</Text>
                </View>
            )}

            {/* --- RESUME PLAYBACK NOTICE --- */}
            {Boolean(resumeNotice) && (
                <View
                    style={[
                        styles.toastNotice,
                        !isLandscape
                            ? { top: portraitPlayerHeight + (autoSwitchNotice ? 48 : 10) }
                            : { top: autoSwitchNotice ? 116 : 72 },
                    ]}
                    pointerEvents="none"
                >
                    <Clock color="#10B981" size={15} style={{ marginRight: 6 }} />
                    <Text style={styles.toastText}>{resumeNotice}</Text>
                </View>
            )}

            {/* --- FULLSCREEN LANDSCAPE MODE --- */}
            {isLandscape ? (
                <>
                    {/* Full screen loader if scraping */}
                    {isScraping && (
                        <View style={styles.loadingScreen}>
                            <ActivityIndicator size={isTV ? 64 : 48} color="#FF2442" />
                            <Text style={styles.loadingTitle}>Connecting to {activeProviderLabel}...</Text>
                            <Text style={styles.loadingStatus}>{scrapeStatus}</Text>

                            <View style={styles.actionRow}>
                                <Pressable style={styles.cancelBtn} onPress={() => navigation.goBack()}>
                                    <ArrowLeft color="#FFFFFF" size={16} />
                                    <Text style={styles.cancelBtnText}>Back</Text>
                                </Pressable>

                                <Pressable style={styles.retryBtn} onPress={handleAutoSwitchNext}>
                                    <RefreshCw color="#FFFFFF" size={16} />
                                    <Text style={styles.retryBtnText}>Skip to Next Provider</Text>
                                </Pressable>
                            </View>
                        </View>
                    )}

                    {/* Landscape Video Player */}
                    {!isScraping && streamSource && (
                        <View style={StyleSheet.absoluteFill}>
                            <MaterialNativePlayer
                                streamUrl={streamSource.url}
                                streamHeaders={streamSource.headers}
                                subtitles={subtitles}
                                activeProvider={activeProvider}
                                activeProviderLabel={activeProviderLabel}
                                availableProviders={ALL_PLAYBACK_SOURCES}
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
                                isLandscape={true}
                                onToggleOrientation={handleToggleOrientation}
                                continueWatching={continueWatchingList}
                                onSwitchMedia={handleSwitchMedia}
                                seasons={seasonsList}
                                onSelectSeason={handleSelectSeason}
                            />
                        </View>
                    )}

                    {/* All Providers Failed (Landscape) */}
                    {!isScraping && !streamSource && (
                        <View style={styles.errorScreen}>
                            <Text style={styles.errorTitle}>Stream Resolution Failed</Text>
                            <Text style={styles.errorSubtitle}>
                                None of the Vyla primary or failover providers returned an active direct stream.
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
                </>
            ) : (
                /* --- PORTRAIT MODE: Top half player/loader, Bottom half scrollview --- */
                <View style={styles.portraitLayout}>
                    {/* TOP HALF: Player or Half-Screen Loader */}
                    <View
                        style={[
                            styles.portraitPlayerContainer,
                            { height: portraitPlayerHeight, width: '100%' },
                        ]}
                    >
                        {isScraping ? (
                            /* Half-Screen Animated Loader */
                            <View style={styles.portraitLoaderBox}>
                                {Boolean(item?.backdrop_path || item?.poster_path) && (
                                    <Image
                                        source={{
                                            uri: item.backdrop_path
                                                ? `https://image.tmdb.org/t/p/w780${item.backdrop_path}`
                                                : `https://image.tmdb.org/t/p/w500${item.poster_path}`,
                                        }}
                                        style={StyleSheet.absoluteFillObject}
                                        resizeMode="cover"
                                    />
                                )}
                                <LinearGradient
                                    colors={['rgba(8, 9, 12, 0.7)', 'rgba(8, 9, 12, 0.95)']}
                                    style={StyleSheet.absoluteFillObject}
                                />

                                <View style={[styles.portraitLoaderTopBar, { top: (insets?.top || 14) + 6 }]}>
                                    <Pressable
                                        style={styles.portraitLoaderBackBtn}
                                        onPress={() => navigation.goBack()}
                                    >
                                        <ArrowLeft color="#FFFFFF" size={20} />
                                    </Pressable>
                                    <Text style={styles.portraitLoaderTopTitle} numberOfLines={1}>
                                        {title}
                                    </Text>
                                </View>

                                <View style={[styles.portraitLoaderCenter, { paddingTop: (insets?.top || 14) / 2 }]}>
                                    <ActivityIndicator size="large" color="#FF2442" />
                                    <Text style={styles.portraitLoaderConnecting}>
                                        Connecting to {activeProviderLabel}...
                                    </Text>
                                    <Text style={styles.portraitLoaderStatus} numberOfLines={2}>
                                        {scrapeStatus}
                                    </Text>
                                </View>

                                <Pressable
                                    style={styles.portraitLoaderSkipBtn}
                                    onPress={handleAutoSwitchNext}
                                >
                                    <RefreshCw color="#FFFFFF" size={13} />
                                    <Text style={styles.portraitLoaderSkipText}>Skip Provider</Text>
                                </Pressable>
                            </View>
                        ) : streamSource ? (
                            <MaterialNativePlayer
                                streamUrl={streamSource.url}
                                streamHeaders={streamSource.headers}
                                subtitles={subtitles}
                                activeProvider={activeProvider}
                                activeProviderLabel={activeProviderLabel}
                                availableProviders={ALL_PLAYBACK_SOURCES}
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
                                isLandscape={false}
                                onToggleOrientation={handleToggleOrientation}
                                continueWatching={continueWatchingList}
                                onSwitchMedia={handleSwitchMedia}
                                seasons={seasonsList}
                                onSelectSeason={handleSelectSeason}
                            />
                        ) : (
                            <View style={styles.portraitLoaderBox}>
                                <Text style={styles.errorTitle}>Stream Resolution Failed</Text>
                                <Text style={styles.errorSubtitle}>
                                    No active stream found on providers.
                                </Text>
                                <Pressable
                                    style={styles.retryMainBtn}
                                    onPress={() => runScraper(DEFAULT_PROVIDER_ID, [])}
                                >
                                    <RefreshCw color="#FFFFFF" size={16} />
                                    <Text style={styles.retryMainBtnText}>Retry from Provider 1</Text>
                                </Pressable>
                            </View>
                        )}
                    </View>

                    {/* BOTTOM HALF: Media Details & Episodes ScrollView */}
                    <ScrollView
                            style={styles.portraitContent}
                            contentContainerStyle={{ paddingBottom: 60 }}
                            showsVerticalScrollIndicator={false}
                        >
                            {/* Media Header */}
                            <View style={styles.portraitHeader}>
                                <Text style={styles.portraitTitle}>{title}</Text>
                                <View style={styles.portraitMetaRow}>
                                    <View style={styles.portraitMatchBadge}>
                                        <Flame color="#FF2442" size={12} />
                                        <Text style={styles.portraitMatchText}>99% Match</Text>
                                    </View>
                                    <Text style={styles.portraitYear}>{releaseYear}</Text>
                                    <View style={styles.portraitTag}>
                                        <Text style={styles.portraitTagText}>4K HDR</Text>
                                    </View>
                                    <View style={styles.portraitTag}>
                                        <Text style={styles.portraitTagText}>DOLBY ATMOS</Text>
                                    </View>
                                </View>

                                {/* Server Indicator */}
                                <View style={styles.portraitServerRow}>
                                    <Server color="#FF2442" size={13} />
                                    <Text style={styles.portraitServerText}>
                                        Playing via {activeProviderLabel}
                                    </Text>
                                </View>
                            </View>

                            {/* Quick Action Buttons Row */}
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.portraitActionsBar}>
                                <Pressable
                                    style={[styles.portraitActionBtn, Boolean(connectedCastDevice) && styles.portraitActionBtnActive]}
                                    onPress={() => setShowCastModal(true)}
                                >
                                    <Cast color={connectedCastDevice ? '#FF2442' : '#FFFFFF'} size={18} />
                                    <Text style={[styles.portraitActionText, Boolean(connectedCastDevice) && { color: '#FF2442' }]}>
                                        {connectedCastDevice ? 'Casting' : 'Cast'}
                                    </Text>
                                </Pressable>

                                <Pressable
                                    style={[styles.portraitActionBtn, bookmarked && styles.portraitActionBtnActive]}
                                    onPress={handleToggleBookmarkAction}
                                >
                                    {bookmarked ? (
                                        <Check color="#FF2442" size={18} />
                                    ) : (
                                        <Plus color="#FFFFFF" size={18} />
                                    )}
                                    <Text
                                        style={[
                                            styles.portraitActionText,
                                            bookmarked && { color: '#FF2442' },
                                        ]}
                                    >
                                        {bookmarked ? 'In List' : 'Watchlist'}
                                    </Text>
                                </Pressable>

                                <Pressable
                                    style={styles.portraitActionBtn}
                                    onPress={handleShareAction}
                                >
                                    <Share2 color="#FFFFFF" size={18} />
                                    <Text style={styles.portraitActionText}>Share</Text>
                                </Pressable>

                                <Pressable
                                    style={styles.portraitActionBtn}
                                    onPress={handleAutoSwitchNext}
                                >
                                    <Server color="#FF2442" size={18} />
                                    <Text style={styles.portraitActionText}>Server</Text>
                                </Pressable>
                            </ScrollView>

                            {/* --- IN-PLAYER CONTINUE WATCHING ROW --- */}
                            {continueWatchingList.length > 0 && (
                                <View style={styles.inPlayerSection}>
                                    <View style={styles.inPlayerSectionHeader}>
                                        <Clock color="#FF2442" size={16} />
                                        <Text style={styles.inPlayerSectionTitle}>Continue Watching</Text>
                                    </View>

                                    <ScrollView
                                        horizontal
                                        showsHorizontalScrollIndicator={false}
                                        contentContainerStyle={styles.inPlayerCWScroll}
                                    >
                                        {continueWatchingList.map((cwItem) => {
                                            const pct =
                                                cwItem.duration > 0
                                                    ? Math.min(100, (cwItem.position / cwItem.duration) * 100)
                                                    : 0;
                                            return (
                                                <Pressable
                                                    key={`inplayer-cw-${cwItem.id}-${cwItem.season}-${cwItem.episode}`}
                                                    style={styles.inPlayerCWCard}
                                                    onPress={() => handleSwitchMedia(cwItem)}
                                                >
                                                    <View style={styles.inPlayerCWThumbWrap}>
                                                        {Boolean(cwItem.backdrop_path || cwItem.poster_path) && (
                                                            <Image
                                                                source={{
                                                                    uri: cwItem.backdrop_path
                                                                        ? `https://image.tmdb.org/t/p/w300${cwItem.backdrop_path}`
                                                                        : `https://image.tmdb.org/t/p/w200${cwItem.poster_path}`,
                                                                }}
                                                                style={styles.inPlayerCWThumb}
                                                                resizeMode="cover"
                                                            />
                                                        )}
                                                        <View style={styles.inPlayerCWPlayOverlay}>
                                                            <Play color="#FFFFFF" size={16} fill="#FFFFFF" />
                                                        </View>
                                                        <View style={styles.inPlayerCWProgressTrack}>
                                                            <View
                                                                style={[
                                                                    styles.inPlayerCWProgressFill,
                                                                    { width: `${pct}%` },
                                                                ]}
                                                            />
                                                        </View>
                                                    </View>
                                                    <Text style={styles.inPlayerCWTitle} numberOfLines={1}>
                                                        {cwItem.title}
                                                    </Text>
                                                    <Text style={styles.inPlayerCWSub}>
                                                        {cwItem.type === 'tv'
                                                            ? `S${cwItem.season || 1} • E${cwItem.episode || 1}`
                                                            : 'Movie'}
                                                    </Text>
                                                </Pressable>
                                            );
                                        })}
                                    </ScrollView>
                                </View>
                            )}

                            {/* --- TV SHOW EPISODES & SEASON SELECTOR (IF TV) --- */}
                            {type === 'tv' && (
                                <View style={styles.inPlayerSection}>
                                    <View style={styles.inPlayerSectionHeader}>
                                        <Tv color="#FF2442" size={18} />
                                        <Text style={styles.inPlayerSectionTitle}>
                                            Season {season} ({episodesList.length} Episodes)
                                        </Text>
                                    </View>

                                    {/* Season Selector Pills */}
                                    {seasonsList.length > 1 && (
                                        <ScrollView
                                            horizontal
                                            showsHorizontalScrollIndicator={false}
                                            contentContainerStyle={styles.seasonScroll}
                                        >
                                            {seasonsList.map((s) => {
                                                const isActive = s.season_number === Number(season);
                                                return (
                                                    <Pressable
                                                        key={`season-tab-${s.season_number}`}
                                                        style={[
                                                            styles.seasonPill,
                                                            isActive && styles.seasonPillActive,
                                                        ]}
                                                        onPress={() => handleSelectSeason(s.season_number)}
                                                    >
                                                        <Text
                                                            style={[
                                                                styles.seasonPillText,
                                                                isActive && styles.seasonPillTextActive,
                                                            ]}
                                                        >
                                                            {s.name || `Season ${s.season_number}`}
                                                        </Text>
                                                    </Pressable>
                                                );
                                            })}
                                        </ScrollView>
                                    )}

                                    {/* Episodes List */}
                                    {episodesList.map((ep) => {
                                        const isCurrent = ep.episode_number === Number(episode);
                                        return (
                                            <Pressable
                                                key={`ep-${ep.id}`}
                                                style={[
                                                    styles.inPlayerEpItem,
                                                    isCurrent && styles.inPlayerEpItemActive,
                                                ]}
                                                onPress={() => handleSelectEpisode(ep)}
                                            >
                                                <View style={styles.inPlayerEpNumBadge}>
                                                    <Text style={styles.inPlayerEpNumText}>
                                                        {ep.episode_number}
                                                    </Text>
                                                </View>
                                                <View style={{ flex: 1 }}>
                                                    <Text
                                                        style={[
                                                            styles.inPlayerEpTitle,
                                                            isCurrent && { color: '#FF2442' },
                                                        ]}
                                                        numberOfLines={1}
                                                    >
                                                        {ep.name || `Episode ${ep.episode_number}`}
                                                    </Text>
                                                    <Text
                                                        style={styles.inPlayerEpOverview}
                                                        numberOfLines={2}
                                                    >
                                                        {ep.overview || 'No synopsis provided'}
                                                    </Text>
                                                </View>
                                                {isCurrent ? (
                                                    <Text style={styles.playingBadgeText}>PLAYING</Text>
                                                ) : (
                                                    <Play color="#98A2B3" size={16} />
                                                )}
                                            </Pressable>
                                        );
                                    })}
                                </View>
                            )}

                            {/* Overview / Storyline */}
                            {Boolean(item?.overview) && (
                                <View style={styles.inPlayerSection}>
                                    <Text style={styles.inPlayerStoryHeader}>Storyline</Text>
                                    <Text style={styles.inPlayerStoryText}>{item.overview}</Text>
                                </View>
                            )}
                        </ScrollView>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#08090C',
    },
    portraitLayout: {
        flex: 1,
        backgroundColor: '#08090C',
    },
    portraitPlayerContainer: {
        width: '100%',
        backgroundColor: '#000000',
        overflow: 'hidden',
        position: 'relative',
    },
    portraitLoaderBox: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: '#0F1217',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    portraitLoaderTopBar: {
        position: 'absolute',
        top: 14,
        left: 14,
        right: 14,
        flexDirection: 'row',
        alignItems: 'center',
        zIndex: 10,
    },
    portraitLoaderBackBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(20, 24, 33, 0.85)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    portraitLoaderTopTitle: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '800',
        flex: 1,
    },
    portraitLoaderCenter: {
        ...StyleSheet.absoluteFillObject,
        width: '100%',
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 24,
        zIndex: 5,
    },
    portraitLoaderConnecting: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '800',
        marginTop: 14,
        textAlign: 'center',
    },
    portraitLoaderStatus: {
        color: '#FF2442',
        fontSize: 12.5,
        fontWeight: '600',
        marginTop: 6,
        textAlign: 'center',
    },
    portraitLoaderSkipBtn: {
        position: 'absolute',
        bottom: 18,
        alignSelf: 'center',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: 'rgba(255, 36, 66, 0.15)',
        borderWidth: 1,
        borderColor: 'rgba(255, 36, 66, 0.4)',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 18,
        zIndex: 10,
    },
    portraitLoaderSkipText: {
        color: '#FF2442',
        fontSize: 12,
        fontWeight: '700',
    },

    portraitContent: {
        flex: 1,
        backgroundColor: '#08090C',
    },
    portraitHeader: {
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 12,
    },
    portraitTitle: {
        color: '#FFFFFF',
        fontSize: 20,
        fontWeight: '900',
        letterSpacing: 0.2,
        marginBottom: 8,
    },
    portraitMetaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 8,
    },
    portraitMatchBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: 'rgba(255, 36, 66, 0.12)',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
    },
    portraitMatchText: {
        color: '#FF2442',
        fontSize: 11,
        fontWeight: '800',
    },
    portraitYear: {
        color: '#98A2B3',
        fontSize: 12,
        fontWeight: '600',
    },
    portraitTag: {
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
        paddingHorizontal: 7,
        paddingVertical: 2.5,
        borderRadius: 5,
    },
    portraitTagText: {
        color: '#D0D5DD',
        fontSize: 10,
        fontWeight: '700',
    },
    portraitServerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 4,
    },
    portraitServerText: {
        color: '#98A2B3',
        fontSize: 12,
        fontWeight: '600',
    },
        seasonScroll: {
        flexDirection: 'row',
        paddingVertical: 8,
        gap: 8,
        marginBottom: 12,
    },
    seasonPill: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#141821',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    seasonPillActive: {
        backgroundColor: 'rgba(255, 36, 66, 0.15)',
        borderColor: '#FF2442',
    },
    seasonPillText: {
        color: '#98A2B3',
        fontSize: 13,
        fontWeight: '700',
    },
    seasonPillTextActive: {
        color: '#FF2442',
        fontWeight: '800',
    },
    portraitActionsBar: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.06)',
        gap: 12,
    },
    portraitActionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#141821',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        paddingHorizontal: 16,
        paddingVertical: 9,
        borderRadius: 20,
        gap: 6,
    },
    portraitActionBtnActive: {
        backgroundColor: 'rgba(255, 36, 66, 0.15)',
        borderColor: '#FF2442',
    },
    portraitActionText: {
        color: '#FFFFFF',
        fontSize: 12.5,
        fontWeight: '700',
    },
    inPlayerSection: {
        marginTop: 20,
        paddingHorizontal: 20,
    },
    inPlayerSectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
    },
    inPlayerSectionTitle: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '800',
    },
    inPlayerCWScroll: {
        gap: 12,
    },
    inPlayerCWCard: {
        width: 140,
    },
    inPlayerCWThumbWrap: {
        width: 140,
        height: 84,
        borderRadius: 12,
        backgroundColor: '#141821',
        overflow: 'hidden',
        position: 'relative',
        marginBottom: 6,
    },
    inPlayerCWThumb: {
        width: '100%',
        height: '100%',
    },
    inPlayerCWPlayOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.35)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    inPlayerCWProgressTrack: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 3,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
    },
    inPlayerCWProgressFill: {
        height: '100%',
        backgroundColor: '#FF2442',
    },
    inPlayerCWTitle: {
        color: '#FFFFFF',
        fontSize: 12.5,
        fontWeight: '700',
    },
    inPlayerCWSub: {
        color: '#98A2B3',
        fontSize: 11,
        marginTop: 1,
    },
    inPlayerEpItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#141821',
        borderRadius: 14,
        padding: 12,
        marginBottom: 8,
        gap: 12,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.06)',
    },
    inPlayerEpItemActive: {
        borderColor: '#FF2442',
        backgroundColor: 'rgba(255, 36, 66, 0.08)',
    },
    inPlayerEpNumBadge: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(255, 255, 255, 0.06)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    inPlayerEpNumText: {
        color: '#FF2442',
        fontSize: 13,
        fontWeight: '800',
    },
    inPlayerEpTitle: {
        color: '#FFFFFF',
        fontSize: 13,
        fontWeight: '700',
        marginBottom: 2,
    },
    inPlayerEpOverview: {
        color: '#98A2B3',
        fontSize: 11,
        lineHeight: 15,
    },
    playingBadgeText: {
        color: '#FF2442',
        fontSize: 10,
        fontWeight: '900',
        letterSpacing: 0.5,
    },
    inPlayerStoryHeader: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '800',
        marginBottom: 6,
    },
    inPlayerStoryText: {
        color: '#98A2B3',
        fontSize: 13,
        lineHeight: 19,
    },
    loadingScreen: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: '#08090C',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 30,
        zIndex: 50,
    },
    loadingTitle: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '800',
        marginTop: 20,
        letterSpacing: 0.3,
        textAlign: 'center',
    },
    loadingStatus: {
        color: '#FF2442',
        fontSize: 13,
        marginTop: 8,
        textAlign: 'center',
        fontWeight: '600',
    },
    actionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 28,
        gap: 14,
    },
    cancelBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.12)',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        gap: 6,
    },
    cancelBtnText: {
        color: '#FFFFFF',
        fontSize: 13,
        fontWeight: '700',
    },
    retryBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FF2442',
        paddingHorizontal: 18,
        paddingVertical: 10,
        borderRadius: 20,
        gap: 6,
    },
    retryBtnText: {
        color: '#FFFFFF',
        fontSize: 13,
        fontWeight: '800',
    },
    toastNotice: {
        position: 'absolute',
        top: 24,
        alignSelf: 'center',
        backgroundColor: 'rgba(15, 18, 23, 0.95)',
        borderWidth: 1,
        borderColor: '#FF2442',
        paddingHorizontal: 18,
        paddingVertical: 10,
        borderRadius: 20,
        zIndex: 100,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: '#FF2442',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 10,
        elevation: 10,
    },
    toastText: {
        color: '#FFFFFF',
        fontSize: 12.5,
        fontWeight: '700',
    },
    errorScreen: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: '#08090C',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 30,
    },
    errorTitle: {
        color: '#FFFFFF',
        fontSize: 22,
        fontWeight: '900',
        marginBottom: 10,
    },
    errorSubtitle: {
        color: '#98A2B3',
        fontSize: 14,
        textAlign: 'center',
        maxWidth: 420,
        lineHeight: 20,
        marginBottom: 24,
    },
    retryMainBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FF2442',
        paddingHorizontal: 22,
        paddingVertical: 12,
        borderRadius: 24,
        gap: 8,
    },
    retryMainBtnText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '800',
    },
});
