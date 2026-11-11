import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
    StyleSheet,
    View,
    Text,
    Pressable,
    Dimensions,
    ActivityIndicator,
    Modal,
    ScrollView,
    Platform,
    PanResponder,
    Image,
} from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import {
    Cast,
    Play,
    Pause,
    RotateCcw,
    RotateCw,
    ChevronLeft,
    Server,
    Subtitles as SubtitlesIcon,
    Gauge,
    ListVideo,
    Maximize,
    Minimize,
    Check,
    X,
    SkipForward,
    RefreshCw,
    AlertCircle,
    Zap,
    Lock,
    Unlock,
    Clock,
    Sparkles,
} from 'lucide-react-native';
import { fetchAndParseVtt } from '../../services/providerService';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { isTV } from '../../utils/device';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const SPEEDS = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0];

function formatTime(seconds) {
    if (!seconds || isNaN(seconds) || seconds < 0) return '00:00';
    const totalSecs = Math.floor(seconds);
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;

    const pad = (n) => (n < 10 ? `0${n}` : `${n}`);
    if (hrs > 0) {
        return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
    }
    return `${pad(mins)}:${pad(secs)}`;
}

export const MaterialNativePlayer = ({
    streamUrl,
    streamHeaders = {},
    subtitles = [],
    activeProvider = '',
    activeProviderLabel = 'Provider',
    availableProviders = [],
    onSelectProvider,
    onAutoSwitchNext,
    onReloadSource,
    title = '',
    subtitle = '',
    type = 'movie',
    season = 1,
    episode = 1,
    episodes = [],
    onSelectEpisode,
    onNextEpisode,
    onClose,
    onProgressUpdate,
    initialPosition = 0,
    isLandscape = true,
    onToggleOrientation,
    continueWatching = [],
    onSwitchMedia,
    seasons = [],
    onSelectSeason,
}) => {
    const insets = useSafeAreaInsets();

    // Controls Visibility State
    const [controlsVisible, setControlsVisible] = useState(true);
    const hideTimeoutRef = useRef(null);

    // Netflix Screen Lock state
    const [isScreenLocked, setIsScreenLocked] = useState(false);

    // Playback state
    const [isPlaying, setIsPlaying] = useState(true);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [isBuffering, setIsBuffering] = useState(true);
    const [hasPlaybackError, setHasPlaybackError] = useState(false);
    const [currentSpeed, setCurrentSpeed] = useState(1.0);
    const [contentFit, setContentFit] = useState(isLandscape ? 'contain' : 'cover');

    useEffect(() => {
        setContentFit(isLandscape ? 'contain' : 'cover');
    }, [isLandscape]);

    // Double-tap seeking state
    const lastTapRef = useRef({ time: 0, x: 0 });
    const [doubleTapFeedback, setDoubleTapFeedback] = useState(null); // { type: 'rewind'|'forward', delta: 10 }

    // Modals
    const [showProviderModal, setShowProviderModal] = useState(false);
    const [showSubtitleModal, setShowSubtitleModal] = useState(false);
    const [showSpeedModal, setShowSpeedModal] = useState(false);
    const [showEpisodesModal, setShowEpisodesModal] = useState(false);
    const [showContinueWatchingModal, setShowContinueWatchingModal] = useState(false);
    const [showCastModal, setShowCastModal] = useState(false);
    const [connectedCastDevice, setConnectedCastDevice] = useState(null);

    // Subtitles
    const [selectedSubtitleId, setSelectedSubtitleId] = useState(null);
    const [parsedCues, setParsedCues] = useState([]);
    const [activeCueText, setActiveCueText] = useState('');

    // Scrubber Dragging
    const [isScrubbing, setIsScrubbing] = useState(false);
    const [scrubPosition, setScrubPosition] = useState(0);
    const progressBarWidth = useRef(0);

    // Auto-switch countdown timer
    const autoSwitchTimeoutRef = useRef(null);
    const bufferWatchdogRef = useRef(null);

    // --- VIDEO PLAYER INSTANCE ---
    const videoSource = useMemo(() => {
        if (!streamUrl) return null;
        const isProxy = streamUrl.includes('youplex.site') || streamUrl.includes('/proxy');
        if (isProxy) {
            return {
                uri: streamUrl,
                headers: {
                    'User-Agent': 'ExoPlayer',
                    Origin: 'https://youplex.site',
                    Referer: 'https://youplex.site/',
                },
            };
        }
        return {
            uri: streamUrl,
            headers: {
                'User-Agent': 'ExoPlayer',
                ...(streamHeaders || {}),
            },
        };
    }, [streamUrl, streamHeaders]);

    const player = useVideoPlayer(videoSource, (p) => {
        p.loop = false;
        p.timeUpdateEventInterval = 0.5;
        p.preservesPitch = true;
        if (initialPosition > 0) {
            p.currentTime = initialPosition;
        }
        p.play();
    });

    // Auto-hide controls timer
    const resetControlsTimer = useCallback(() => {
        if (isScreenLocked) return;
        setControlsVisible(true);
        if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
        hideTimeoutRef.current = setTimeout(() => {
            setControlsVisible(false);
        }, 4000);
    }, [isScreenLocked]);

    const toggleControls = useCallback(() => {
        if (isScreenLocked) return;
        if (controlsVisible) {
            setControlsVisible(false);
            if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
        } else {
            resetControlsTimer();
        }
    }, [controlsVisible, resetControlsTimer, isScreenLocked]);

    // Screen Touch Handler with Double-Tap to Seek (Netflix Style)
    const handleScreenTouch = (evt) => {
        if (isScreenLocked) return;
        const now = Date.now();
        const touchX = evt.nativeEvent.locationX;
        const screenW = progressBarWidth.current || SCREEN_WIDTH;

        if (now - lastTapRef.current.time < 320) {
            if (touchX < screenW * 0.38) {
                // Double-tap Left: Rewind 10s
                handleSeekBy(-10);
                setDoubleTapFeedback({ type: 'rewind', delta: 10 });
                setTimeout(() => setDoubleTapFeedback(null), 850);
                return;
            } else if (touchX > screenW * 0.62) {
                // Double-tap Right: Fast Forward 10s
                handleSeekBy(10);
                setDoubleTapFeedback({ type: 'forward', delta: 10 });
                setTimeout(() => setDoubleTapFeedback(null), 850);
                return;
            }
        }

        lastTapRef.current = { time: now, x: touchX };
        toggleControls();
    };

    // Active polling interval to guarantee accurate timer and buffer dismissal on Android
    useEffect(() => {
        if (!player) return;

        const interval = setInterval(() => {
            try {
                const cur = player.currentTime || 0;
                const dur = player.duration || 0;
                const playing = player.playing;

                if (!isScrubbing && cur > 0) {
                    setCurrentTime(cur);
                }
                if (dur > 0 && dur !== duration) {
                    setDuration(dur);
                }
                if (playing || cur > 0) {
                    setIsBuffering(false);
                    setHasPlaybackError(false);
                }
                if (cur > 0) {
                    onProgressUpdate?.({ position: cur, duration: dur });
                }
            } catch (e) {
                // Ignore player access exceptions during unmount
            }
        }, 500);

        return () => clearInterval(interval);
    }, [player, isScrubbing, duration, onProgressUpdate]);

    // Reset state & failover watchdog on streamUrl change
    useEffect(() => {
        setHasPlaybackError(false);
        setIsBuffering(true);
        if (autoSwitchTimeoutRef.current) clearTimeout(autoSwitchTimeoutRef.current);
        if (bufferWatchdogRef.current) clearTimeout(bufferWatchdogRef.current);

        bufferWatchdogRef.current = setTimeout(() => {
            if (isBuffering && !hasPlaybackError) {
                console.warn('Stream stall detected (>8s), failover triggered');
                setHasPlaybackError(true);
                onAutoSwitchNext?.();
            }
        }, 8000);

        return () => {
            if (bufferWatchdogRef.current) clearTimeout(bufferWatchdogRef.current);
        };
    }, [streamUrl]);

    // Handle Player Events & Progress Reporting
    useEffect(() => {
        if (!player) return;

        const timeSub = player.addListener('timeUpdate', (event) => {
            const time = event.currentTime || 0;
            if (!isScrubbing) {
                setCurrentTime(time);
            }
            const dur = player.duration || 0;
            if (dur > 0 && dur !== duration) {
                setDuration(dur);
            }
            if (time > 0) {
                setIsBuffering(false);
                setHasPlaybackError(false);
            }
            onProgressUpdate?.({ position: time, duration: dur });
        });

        const statusSub = player.addListener('statusChange', (payload) => {
            const rawStatus = typeof payload === 'string' ? payload : payload?.status || player?.status;
            const playerErr = payload?.error || player?.error;

            if (rawStatus === 'loading') {
                setIsBuffering(true);
            } else if (rawStatus === 'readyToPlay') {
                setIsBuffering(false);
                setHasPlaybackError(false);
                if (autoSwitchTimeoutRef.current) clearTimeout(autoSwitchTimeoutRef.current);
                if (bufferWatchdogRef.current) clearTimeout(bufferWatchdogRef.current);
            } else if (rawStatus === 'error' || Boolean(playerErr)) {
                setIsBuffering(false);
                setHasPlaybackError(true);
                if (bufferWatchdogRef.current) clearTimeout(bufferWatchdogRef.current);
                if (autoSwitchTimeoutRef.current) clearTimeout(autoSwitchTimeoutRef.current);
                autoSwitchTimeoutRef.current = setTimeout(() => {
                    onAutoSwitchNext?.();
                }, 1500);
            }
        });

        const playingSub = player.addListener('playingChange', (payload) => {
            const isPlayingNow = typeof payload === 'boolean' ? payload : Boolean(payload?.isPlaying);
            setIsPlaying(isPlayingNow);
            if (isPlayingNow) {
                setIsBuffering(false);
                setHasPlaybackError(false);
                if (autoSwitchTimeoutRef.current) clearTimeout(autoSwitchTimeoutRef.current);
                if (bufferWatchdogRef.current) clearTimeout(bufferWatchdogRef.current);
            }
        });

        return () => {
            timeSub?.remove?.();
            statusSub?.remove?.();
            playingSub?.remove?.();
            if (autoSwitchTimeoutRef.current) clearTimeout(autoSwitchTimeoutRef.current);
        };
    }, [player, isScrubbing, duration, onProgressUpdate, onAutoSwitchNext]);

    // Track Subtitles based on currentTime
    useEffect(() => {
        if (!parsedCues || parsedCues.length === 0) {
            setActiveCueText('');
            return;
        }
        const activeCue = parsedCues.find(
            (c) => currentTime >= c.start && currentTime <= c.end
        );
        setActiveCueText(activeCue ? activeCue.text : '');
    }, [currentTime, parsedCues]);

    // Load Subtitle VTT when track is selected
    const handleSelectSubtitle = async (sub) => {
        if (!sub) {
            setSelectedSubtitleId(null);
            setParsedCues([]);
            setActiveCueText('');
            setShowSubtitleModal(false);
            return;
        }
        setSelectedSubtitleId(sub.id);
        setShowSubtitleModal(false);
        try {
            const cues = await fetchAndParseVtt(sub.url);
            setParsedCues(cues);
        } catch (e) {
            console.warn('Failed to parse subtitle cues:', e);
        }
    };

    // Auto-select English subtitles if available on first load
    useEffect(() => {
        if (subtitles && subtitles.length > 0 && selectedSubtitleId === null) {
            const englishSub = subtitles.find(
                (s) =>
                    s.language === 'en' ||
                    s.language === 'eng' ||
                    s.label?.toLowerCase().includes('english')
            );
            if (englishSub) {
                handleSelectSubtitle(englishSub);
            }
        }
    }, [subtitles]);

    // Play / Pause Action
    const handlePlayPause = () => {
        resetControlsTimer();
        if (!player) return;
        if (isPlaying) {
            player.pause();
        } else {
            player.play();
        }
    };

    // Seek Action (+10s / -10s)
    const handleSeekBy = (deltaSeconds) => {
        resetControlsTimer();
        if (!player) return;
        const target = Math.max(0, Math.min(duration, currentTime + deltaSeconds));
        player.currentTime = target;
        setCurrentTime(target);
    };

    // Speed Selector Action
    const handleSpeedChange = (spd) => {
        setCurrentSpeed(spd);
        if (player) {
            player.playbackRate = spd;
        }
        setShowSpeedModal(false);
        resetControlsTimer();
    };

    // Aspect Ratio Fit Toggle
    const handleFitToggle = () => {
        setContentFit((prev) => (prev === 'contain' ? 'cover' : 'contain'));
        resetControlsTimer();
    };

    // Scrubber PanResponder
    const panResponder = useMemo(
        () =>
            PanResponder.create({
                onStartShouldSetPanResponder: () => true,
                onMoveShouldSetPanResponder: () => true,
                onPanResponderGrant: (evt) => {
                    setIsScrubbing(true);
                    if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
                    const touchX = evt.nativeEvent.locationX;
                    const width = progressBarWidth.current || SCREEN_WIDTH;
                    const ratio = Math.max(0, Math.min(1, touchX / width));
                    setScrubPosition(ratio * duration);
                },
                onPanResponderMove: (evt) => {
                    const touchX = evt.nativeEvent.locationX;
                    const width = progressBarWidth.current || SCREEN_WIDTH;
                    const ratio = Math.max(0, Math.min(1, touchX / width));
                    setScrubPosition(ratio * duration);
                },
                onPanResponderRelease: () => {
                    if (player && duration > 0) {
                        player.currentTime = scrubPosition;
                        setCurrentTime(scrubPosition);
                    }
                    setIsScrubbing(false);
                    resetControlsTimer();
                },
            }),
        [duration, player, scrubPosition, resetControlsTimer]
    );

    const displayTime = isScrubbing ? scrubPosition : currentTime;
    const remainingTime = Math.max(0, duration - displayTime);
    const progressPercent = duration > 0 ? (displayTime / duration) * 100 : 0;

    return (
        <View style={styles.container}>
            {/* Native Video View */}
            {player ? (
                <VideoView
                    player={player}
                    style={styles.video}
                    contentFit={contentFit}
                    nativeControls={false}
                    
                />
            ) : (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#FF2442" />
                </View>
            )}

            {/* Screen Touch responder (transparent overlay) */}
            <Pressable
                style={StyleSheet.absoluteFill}
                onPress={handleScreenTouch}
                focusable={false}
            />

            {/* Subtitles Overlay */}
            {Boolean(activeCueText) && (
                <View style={[styles.subtitleWrapper, !isLandscape && { bottom: 30 }]} pointerEvents="none">
                    <Text style={styles.subtitleText}>{activeCueText}</Text>
                </View>
            )}

            {/* Double Tap Seek Feedback Animation */}
            {Boolean(doubleTapFeedback) && (
                <View
                    style={[
                        styles.doubleTapOverlay,
                        doubleTapFeedback.type === 'rewind' ? styles.doubleTapLeft : styles.doubleTapRight,
                    ]}
                    pointerEvents="none"
                >
                    <View style={styles.doubleTapBubble}>
                        {doubleTapFeedback.type === 'rewind' ? (
                            <>
                                <RotateCcw color="#FFFFFF" size={28} />
                                <Text style={styles.doubleTapText}>-10s</Text>
                            </>
                        ) : (
                            <>
                                <RotateCw color="#FFFFFF" size={28} />
                                <Text style={styles.doubleTapText}>+10s</Text>
                            </>
                        )}
                    </View>
                </View>
            )}

            {/* Buffering Indicator */}
            {isBuffering && !hasPlaybackError && currentTime < 0.5 && (
                <View style={styles.bufferOverlay} pointerEvents="none">
                    <View style={styles.bufferSpinnerBubble}>
                        <ActivityIndicator size={isTV ? 48 : 32} color="#FF2442" />
                    </View>
                </View>
            )}

            {/* Playback Error & Auto-Switch Banner */}
            {hasPlaybackError && (
                <View style={styles.errorOverlay} pointerEvents="box-none">
                    <BlurView intensity={85} tint="dark" style={styles.errorCard}>
                        <AlertCircle color="#FF2442" size={32} />
                        <Text style={styles.errorTitle}>Stream Interrupted</Text>
                        <Text style={styles.errorSubtitle}>
                            Auto-switching to the next verified source in 2 seconds...
                        </Text>
                        <Pressable
                            focusable={true}
                            onPress={() => {
                                if (autoSwitchTimeoutRef.current) clearTimeout(autoSwitchTimeoutRef.current);
                                onAutoSwitchNext?.();
                            }}
                            style={styles.switchNextBtn}
                        >
                            <LinearGradient
                                colors={['#FF3B56', '#FF1E3C', '#B3001E']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.switchNextBtnGrad}
                            >
                                <RefreshCw color="#FFFFFF" size={18} />
                                <Text style={styles.switchNextBtnText}>Switch to Next Server Now</Text>
                            </LinearGradient>
                        </Pressable>
                    </BlurView>
                </View>
            )}

            {/* --- NETFLIX SCREEN LOCK FLOATING PILL --- */}
            {isScreenLocked && (
                <View style={styles.lockedContainer} pointerEvents="box-none">
                    <Pressable
                        style={styles.unlockPill}
                        onPress={() => {
                            setIsScreenLocked(false);
                            resetControlsTimer();
                        }}
                    >
                        <Unlock color="#FF2442" size={16} />
                        <Text style={styles.unlockPillText}>Screen Locked • Tap to Unlock</Text>
                    </Pressable>
                </View>
            )}

            {/* --- CONTROLS OVERLAY --- */}
            {!isScreenLocked && (
                <View
                    style={[
                        styles.controlsOverlay,
                        { opacity: controlsVisible ? 1 : 0 },
                    ]}
                    pointerEvents={controlsVisible ? 'box-none' : 'none'}
                >
                    {/* TOP BAR */}
                    <LinearGradient
                        colors={['rgba(8, 9, 12, 0.95)', 'rgba(8, 9, 12, 0.4)', 'transparent']}
                        style={[
                        styles.topGradient,
                        isLandscape
                            ? { paddingHorizontal: isTV ? 48 : 36, paddingTop: Platform.OS === 'ios' ? 36 : 18 }
                            : { paddingTop: (insets?.top ? insets.top + 6 : 14), paddingBottom: 8, paddingHorizontal: 12 },
                    ]}
                        pointerEvents="box-none"
                    >
                        <View style={styles.topBar}>
                            <Pressable
                                focusable={true}
                                hasTVPreferredFocus={true}
                                onPress={onClose}
                                style={({ focused }) => [
                                    styles.iconButton,
                                    focused && styles.tvFocusBorder,
                                ]}
                            >
                                <ChevronLeft color="#FFFFFF" size={isTV ? 30 : 22} />
                            </Pressable>

                            <View style={styles.titleWrapper}>
                                <Text style={styles.mainTitle} numberOfLines={1}>
                                    {title}
                                </Text>
                                {Boolean(subtitle) && (
                                    <Text style={styles.subTitle}>{subtitle}</Text>
                                )}
                            </View>

                            {/* Top Action Buttons */}
                            <View style={styles.topActions}>
                                {/* Screen Lock Toggle */}
                                <Pressable
                                    focusable={true}
                                    onPress={() => {
                                        setIsScreenLocked(true);
                                        setControlsVisible(false);
                                    }}
                                    style={({ focused }) => [
                                        styles.iconButtonSmall,
                                        focused && styles.tvFocusBorder,
                                    ]}
                                >
                                    <Lock color="#FFFFFF" size={16} />
                                </Pressable>

                                {/* Google Cast Button */}
                                <Pressable
                                    focusable={true}
                                    onPress={() => {
                                        setShowCastModal(true);
                                        if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
                                    }}
                                    style={({ focused }) => [
                                        styles.iconButtonSmall,
                                        Boolean(connectedCastDevice) && styles.iconButtonSmallActive,
                                        focused && styles.tvFocusBorder,
                                    ]}
                                >
                                    <Cast color={connectedCastDevice ? '#FF2442' : '#FFFFFF'} size={17} />
                                </Pressable>

                                {/* Server / Provider Badge */}
                                <Pressable
                                    focusable={true}
                                    onPress={() => {
                                        setShowProviderModal(true);
                                        if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
                                    }}
                                    style={({ focused }) => [
                                        styles.providerBadge,
                                        focused && styles.tvFocusBorder,
                                    ]}
                                >
                                    <Server color="#FF2442" size={13} />
                                    <Text style={styles.providerBadgeText} numberOfLines={1}>
                                        {activeProviderLabel.split(' ')[0]}
                                    </Text>
                                </Pressable>
                            </View>
                        </View>
                    </LinearGradient>

                    {/* CENTER PLAYBACK CONTROLS */}
                    <View style={[styles.centerControls, { gap: isLandscape ? (isTV ? 84 : 68) : 36 }]} pointerEvents="box-none">
                        {/* Skip -10s */}
                        <Pressable
                            focusable={true}
                            onPress={() => handleSeekBy(-10)}
                            style={({ focused }) => [
                                styles.seekButton,
                                !isLandscape && { width: 44, height: 44, borderRadius: 22 },
                                focused && styles.tvFocusBorder,
                            ]}
                        >
                            <RotateCcw color="#FFFFFF" size={isTV ? 32 : !isLandscape ? 22 : 24} />
                            <Text style={styles.seekBadge}>10</Text>
                        </Pressable>

                        {/* Big Play / Pause FAB */}
                        <Pressable
                            focusable={true}
                            onPress={handlePlayPause}
                            style={({ focused }) => [
                                styles.playPauseWrapper,
                                !isLandscape && { borderRadius: 29 },
                                focused && styles.tvFocusBorder,
                            ]}
                        >
                            <LinearGradient
                                colors={['#FF3B56', '#FF1E3C', '#B3001E']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={[
                                    styles.playPauseFAB,
                                    !isLandscape && { width: 58, height: 58, borderRadius: 29 },
                                ]}
                            >
                                {isPlaying ? (
                                    <Pause
                                        color="#FFFFFF"
                                        size={isTV ? 40 : !isLandscape ? 26 : 30}
                                        fill="#FFFFFF"
                                    />
                                ) : (
                                    <Play
                                        color="#FFFFFF"
                                        size={isTV ? 40 : !isLandscape ? 26 : 30}
                                        fill="#FFFFFF"
                                        style={{ marginLeft: 3 }}
                                    />
                                )}
                            </LinearGradient>
                        </Pressable>

                        {/* Skip +10s */}
                        <Pressable
                            focusable={true}
                            onPress={() => handleSeekBy(10)}
                            style={({ focused }) => [
                                styles.seekButton,
                                !isLandscape && { width: 44, height: 44, borderRadius: 22 },
                                focused && styles.tvFocusBorder,
                            ]}
                        >
                            <RotateCw color="#FFFFFF" size={isTV ? 32 : !isLandscape ? 22 : 24} />
                            <Text style={styles.seekBadge}>10</Text>
                        </Pressable>
                    </View>

                    {/* BOTTOM BAR: Scrubber, Timestamps & Extras */}
                    <LinearGradient
                        colors={['transparent', 'rgba(8, 9, 12, 0.7)', 'rgba(8, 9, 12, 0.98)']}
                        style={[
                        styles.bottomGradient,
                        isLandscape
                            ? { paddingHorizontal: isTV ? 48 : 36, paddingBottom: Platform.OS === 'ios' ? 28 : 18 }
                            : { paddingTop: 6, paddingBottom: 10, paddingHorizontal: 12 },
                    ]}
                        pointerEvents="box-none"
                    >
                        {/* Netflix-style Scrub Bar */}
                        <View
                            style={styles.progressContainer}
                            {...panResponder.panHandlers}
                            onLayout={(e) => {
                                progressBarWidth.current = e.nativeEvent.layout.width;
                            }}
                        >
                            <View style={styles.progressBarTrack}>
                                <LinearGradient
                                    colors={['#FF3B56', '#FF1E3C', '#B3001E']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={[styles.progressBarFill, { width: `${progressPercent}%` }]}
                                />
                                {progressPercent > 0 && (
                                    <View
                                        style={[
                                            styles.progressThumb,
                                            { left: `${progressPercent}%` },
                                        ]}
                                    />
                                )}
                            </View>
                        </View>

                        {/* Meta & Extras */}
                        <View style={styles.bottomRow}>
                            <Text style={styles.timeText}>
                                {formatTime(displayTime)}{' '}
                                <Text style={styles.durationText}>
                                    {remainingTime > 0 ? `(-${formatTime(remainingTime)})` : `/ ${formatTime(duration)}`}
                                </Text>
                            </Text>

                            {/* Action Buttons */}
                            <View style={styles.bottomActions}>
                                {/* CC Subtitles Button */}
                                <Pressable
                                    focusable={true}
                                    onPress={() => {
                                        setShowSubtitleModal(true);
                                        if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
                                    }}
                                    style={({ focused }) => [
                                        styles.bottomBtn,
                                        Boolean(selectedSubtitleId) && styles.bottomBtnActive,
                                        focused && styles.tvFocusBorder,
                                    ]}
                                >
                                    <SubtitlesIcon
                                        color={selectedSubtitleId ? '#FF2442' : '#FFFFFF'}
                                        size={isTV ? 20 : 16}
                                    />
                                    <Text
                                        style={[
                                            styles.bottomBtnText,
                                            Boolean(selectedSubtitleId) && styles.bottomBtnTextActive,
                                        ]}
                                    >
                                        Audio & Subs
                                    </Text>
                                </Pressable>

                                {/* Speed Selector */}
                                <Pressable
                                    focusable={true}
                                    onPress={() => {
                                        setShowSpeedModal(true);
                                        if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
                                    }}
                                    style={({ focused }) => [
                                        styles.bottomBtn,
                                        focused && styles.tvFocusBorder,
                                    ]}
                                >
                                    <Gauge color="#FFFFFF" size={isTV ? 20 : 16} />
                                    <Text style={styles.bottomBtnText}>{currentSpeed}x</Text>
                                </Pressable>

                                {/* Continue Watching Quick Drawer Button (in Landscape) */}
                                {isLandscape && continueWatching?.length > 0 && (
                                    <Pressable
                                        focusable={true}
                                        onPress={() => {
                                            setShowContinueWatchingModal(true);
                                            if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
                                        }}
                                        style={({ focused }) => [
                                            styles.bottomBtn,
                                            focused && styles.tvFocusBorder,
                                        ]}
                                    >
                                        <Clock color="#FFFFFF" size={isTV ? 20 : 16} />
                                        <Text style={styles.bottomBtnText}>Continue</Text>
                                    </Pressable>
                                )}

                                {/* Episodes Drawer (TV Series) */}
                                {isLandscape && type === 'tv' && episodes?.length > 0 && (
                                    <Pressable
                                        focusable={true}
                                        onPress={() => {
                                            setShowEpisodesModal(true);
                                            if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
                                        }}
                                        style={({ focused }) => [
                                            styles.bottomBtn,
                                            focused && styles.tvFocusBorder,
                                        ]}
                                    >
                                        <ListVideo color="#FFFFFF" size={isTV ? 20 : 16} />
                                        <Text style={styles.bottomBtnText}>Episodes</Text>
                                    </Pressable>
                                )}

                                {/* Next Episode Button */}
                                {isLandscape && type === 'tv' && Boolean(onNextEpisode) && (
                                    <Pressable
                                        focusable={true}
                                        onPress={onNextEpisode}
                                        style={({ focused }) => [
                                            styles.nextEpisodeWrapper,
                                            focused && styles.tvFocusBorder,
                                        ]}
                                    >
                                        <LinearGradient
                                            colors={['#FF3B56', '#FF1E3C', '#B3001E']}
                                            start={{ x: 0, y: 0 }}
                                            end={{ x: 1, y: 0 }}
                                            style={styles.nextEpisodeGradient}
                                        >
                                            <SkipForward color="#FFFFFF" size={isTV ? 18 : 15} />
                                            <Text style={styles.nextEpisodeBtnText}>Next Ep</Text>
                                        </LinearGradient>
                                    </Pressable>
                                )}

                                {/* Single Fullscreen Toggle Button at Bottom Right */}
                                {Boolean(onToggleOrientation) && !isTV && (
                                    <Pressable
                                        focusable={true}
                                        onPress={onToggleOrientation}
                                        style={({ focused }) => [
                                            styles.bottomBtn,
                                            focused && styles.tvFocusBorder,
                                        ]}
                                    >
                                        {isLandscape ? (
                                            <Minimize color="#FFFFFF" size={isTV ? 20 : 16} />
                                        ) : (
                                            <Maximize color="#FFFFFF" size={isTV ? 20 : 16} />
                                        )}
                                    </Pressable>
                                )}
                            </View>
                        </View>
                    </LinearGradient>
                </View>
            )}

            {/* --- PROVIDERS MODAL --- */}
            <Modal
                transparent
                visible={showProviderModal}
                animationType="fade"
                onRequestClose={() => setShowProviderModal(false)}
            >
                <Pressable
                    style={styles.modalBackdrop}
                    onPress={() => setShowProviderModal(false)}
                >
                    <Pressable style={styles.sheetContainer} onPress={(e) => e.stopPropagation()}>
                        <View style={styles.sheetHeader}>
                            <View style={styles.sheetTitleRow}>
                                <Server color="#FF2442" size={20} />
                                <Text style={styles.sheetTitle}>Stream Sources</Text>
                            </View>
                            <Pressable
                                onPress={() => setShowProviderModal(false)}
                                style={styles.sheetCloseBtn}
                            >
                                <X color="#8A99A8" size={20} />
                            </Pressable>
                        </View>
                        <Text style={styles.sheetSubtitle}>
                            Select a streaming server. Primary Vyla SDK engine provides multi-quality streams with automatic failover.
                        </Text>

                        <ScrollView style={styles.modalScroll}>
                            {availableProviders.map((prov) => {
                                const isCurrent = activeProvider === prov.id;
                                return (
                                    <Pressable
                                        key={prov.id}
                                        focusable={true}
                                        onPress={() => {
                                            setShowProviderModal(false);
                                            onSelectProvider?.(prov.id);
                                        }}
                                        style={({ focused }) => [
                                            styles.providerOption,
                                            isCurrent && styles.providerOptionActive,
                                            focused && styles.tvFocusBorder,
                                        ]}
                                    >
                                        <View style={styles.providerOptionLeft}>
                                            <View
                                                style={[
                                                    styles.providerDot,
                                                    isCurrent && { backgroundColor: '#FF2442' },
                                                ]}
                                            />
                                            <View style={{ flex: 1 }}>
                                                <Text
                                                    style={[
                                                        styles.providerOptionName,
                                                        isCurrent && styles.providerOptionNameActive,
                                                    ]}
                                                >
                                                    {prov.label}
                                                </Text>
                                                {prov.isVylaPrimary ? (
                                                    <Text style={{ color: '#FF2442', fontSize: 10, fontWeight: '700', marginTop: 2, letterSpacing: 0.5 }}>
                                                        VYLA SDK PRIMARY
                                                    </Text>
                                                ) : (
                                                    <Text style={{ color: '#98A2B3', fontSize: 10, fontWeight: '500', marginTop: 2, letterSpacing: 0.5 }}>
                                                        FAILOVER SOURCE
                                                    </Text>
                                                )}
                                            </View>
                                        </View>
                                        {isCurrent && <Check color="#FF2442" size={18} />}
                                    </Pressable>
                                );
                            })}
                        </ScrollView>
                    </Pressable>
                </Pressable>
            </Modal>

            {/* --- SUBTITLES MODAL --- */}
            <Modal
                transparent
                visible={showSubtitleModal}
                animationType="fade"
                onRequestClose={() => setShowSubtitleModal(false)}
            >
                <Pressable
                    style={styles.modalBackdrop}
                    onPress={() => setShowSubtitleModal(false)}
                >
                    <Pressable style={styles.sheetContainer} onPress={(e) => e.stopPropagation()}>
                        <View style={styles.sheetHeader}>
                            <View style={styles.sheetTitleRow}>
                                <SubtitlesIcon color="#FF2442" size={20} />
                                <Text style={styles.sheetTitle}>Subtitles & Audio</Text>
                            </View>
                            <Pressable
                                onPress={() => setShowSubtitleModal(false)}
                                style={styles.sheetCloseBtn}
                            >
                                <X color="#8A99A8" size={20} />
                            </Pressable>
                        </View>

                        <ScrollView style={styles.modalScroll}>
                            <Pressable
                                focusable={true}
                                onPress={() => handleSelectSubtitle(null)}
                                style={({ focused }) => [
                                    styles.providerOption,
                                    selectedSubtitleId === null && styles.providerOptionActive,
                                    focused && styles.tvFocusBorder,
                                ]}
                            >
                                <Text
                                    style={[
                                        styles.providerOptionName,
                                        selectedSubtitleId === null && styles.providerOptionNameActive,
                                    ]}
                                >
                                    Off
                                </Text>
                                {selectedSubtitleId === null && <Check color="#FF2442" size={18} />}
                            </Pressable>

                            {subtitles.map((sub) => {
                                const isCurrent = selectedSubtitleId === sub.id;
                                return (
                                    <Pressable
                                        key={sub.id}
                                        focusable={true}
                                        onPress={() => handleSelectSubtitle(sub)}
                                        style={({ focused }) => [
                                            styles.providerOption,
                                            isCurrent && styles.providerOptionActive,
                                            focused && styles.tvFocusBorder,
                                        ]}
                                    >
                                        <Text
                                            style={[
                                                styles.providerOptionName,
                                                isCurrent && styles.providerOptionNameActive,
                                            ]}
                                        >
                                            {sub.label}
                                        </Text>
                                        {isCurrent && <Check color="#FF2442" size={18} />}
                                    </Pressable>
                                );
                            })}
                        </ScrollView>
                    </Pressable>
                </Pressable>
            </Modal>

            {/* --- PLAYBACK SPEED MODAL --- */}
            <Modal
                transparent
                visible={showSpeedModal}
                animationType="fade"
                onRequestClose={() => setShowSpeedModal(false)}
            >
                <Pressable
                    style={styles.modalBackdrop}
                    onPress={() => setShowSpeedModal(false)}
                >
                    <Pressable style={styles.sheetContainer} onPress={(e) => e.stopPropagation()}>
                        <View style={styles.sheetHeader}>
                            <View style={styles.sheetTitleRow}>
                                <Gauge color="#FF2442" size={20} />
                                <Text style={styles.sheetTitle}>Playback Speed</Text>
                            </View>
                            <Pressable
                                onPress={() => setShowSpeedModal(false)}
                                style={styles.sheetCloseBtn}
                            >
                                <X color="#8A99A8" size={20} />
                            </Pressable>
                        </View>

                        <ScrollView style={styles.modalScroll}>
                            {SPEEDS.map((speed) => {
                                const isCurrent = currentSpeed === speed;
                                return (
                                    <Pressable
                                        key={speed}
                                        focusable={true}
                                        onPress={() => handleSpeedChange(speed)}
                                        style={({ focused }) => [
                                            styles.providerOption,
                                            isCurrent && styles.providerOptionActive,
                                            focused && styles.tvFocusBorder,
                                        ]}
                                    >
                                        <Text
                                            style={[
                                                styles.providerOptionName,
                                                isCurrent && styles.providerOptionNameActive,
                                            ]}
                                        >
                                            {speed === 1.0 ? 'Normal (1.0x)' : `${speed}x`}
                                        </Text>
                                        {isCurrent && <Check color="#FF2442" size={18} />}
                                    </Pressable>
                                );
                            })}
                        </ScrollView>
                    </Pressable>
                </Pressable>
            </Modal>

            {/* --- EPISODES MODAL --- */}
            <Modal
                transparent
                visible={showEpisodesModal}
                animationType="fade"
                onRequestClose={() => setShowEpisodesModal(false)}
            >
                <Pressable
                    style={styles.modalBackdrop}
                    onPress={() => setShowEpisodesModal(false)}
                >
                    <Pressable
                        style={[styles.sheetContainer, { maxHeight: '75%' }]}
                        onPress={(e) => e.stopPropagation()}
                    >
                        <View style={styles.sheetHeader}>
                            <View style={styles.sheetTitleRow}>
                                <ListVideo color="#FF2442" size={20} />
                                <Text style={styles.sheetTitle}>Season {season} Episodes</Text>
                            </View>
                            <Pressable
                                onPress={() => setShowEpisodesModal(false)}
                                style={styles.sheetCloseBtn}
                            >
                                <X color="#8A99A8" size={20} />
                            </Pressable>
                        </View>

                        {/* In-Player Season Selector */}
                        {seasons && seasons.length > 1 && (
                            <ScrollView
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                contentContainerStyle={{ paddingVertical: 6, gap: 8, marginBottom: 8 }}
                            >
                                {seasons.map((s) => {
                                    const isActive = s.season_number === Number(season);
                                    return (
                                        <Pressable
                                            key={`modal-s-${s.season_number}`}
                                            style={[
                                                styles.seasonModalPill,
                                                isActive && styles.seasonModalPillActive,
                                            ]}
                                            onPress={() => onSelectSeason?.(s.season_number)}
                                        >
                                            <Text
                                                style={[
                                                    styles.seasonModalPillText,
                                                    isActive && styles.seasonModalPillTextActive,
                                                ]}
                                            >
                                                {s.name || `Season ${s.season_number}`}
                                            </Text>
                                        </Pressable>
                                    );
                                })}
                            </ScrollView>
                        )}

                        <ScrollView style={styles.modalScroll}>
                            {episodes.map((ep) => {
                                const isCurrent = ep.episode_number === Number(episode);
                                return (
                                    <Pressable
                                        key={ep.id}
                                        focusable={true}
                                        onPress={() => {
                                            setShowEpisodesModal(false);
                                            onSelectEpisode?.(ep);
                                        }}
                                        style={({ focused }) => [
                                            styles.episodeOption,
                                            isCurrent && styles.episodeOptionActive,
                                            focused && styles.tvFocusBorder,
                                        ]}
                                    >
                                        <View style={styles.epNumBadge}>
                                            <Text style={styles.epNumText}>
                                                {ep.episode_number}
                                            </Text>
                                        </View>
                                        <View style={styles.epDetail}>
                                            <Text
                                                style={[
                                                    styles.epTitle,
                                                    isCurrent && { color: '#FF2442' },
                                                ]}
                                                numberOfLines={1}
                                            >
                                                {ep.name || `Episode ${ep.episode_number}`}
                                            </Text>
                                            <Text style={styles.epOverview} numberOfLines={2}>
                                                {ep.overview || 'No overview available'}
                                            </Text>
                                        </View>
                                    </Pressable>
                                );
                            })}
                        </ScrollView>
                    </Pressable>
                </Pressable>
            </Modal>

            {/* --- IN-PLAYER CONTINUE WATCHING MODAL (FOR LANDSCAPE) --- */}
            <Modal
                transparent
                visible={showContinueWatchingModal}
                animationType="fade"
                onRequestClose={() => setShowContinueWatchingModal(false)}
            >
                <Pressable
                    style={styles.modalBackdrop}
                    onPress={() => setShowContinueWatchingModal(false)}
                >
                    <Pressable
                        style={[styles.sheetContainer, { maxHeight: '75%' }]}
                        onPress={(e) => e.stopPropagation()}
                    >
                        <View style={styles.sheetHeader}>
                            <View style={styles.sheetTitleRow}>
                                <Clock color="#FF2442" size={20} />
                                <Text style={styles.sheetTitle}>Continue Watching</Text>
                            </View>
                            <Pressable
                                onPress={() => setShowContinueWatchingModal(false)}
                                style={styles.sheetCloseBtn}
                            >
                                <X color="#8A99A8" size={20} />
                            </Pressable>
                        </View>

                        <ScrollView style={styles.modalScroll}>
                            {continueWatching.map((item) => {
                                const pct = item.duration > 0 ? Math.min(100, (item.position / item.duration) * 100) : 0;
                                return (
                                    <Pressable
                                        key={`cw-${item.id}-${item.season}-${item.episode}`}
                                        onPress={() => {
                                            setShowContinueWatchingModal(false);
                                            onSwitchMedia?.(item);
                                        }}
                                        style={styles.cwOption}
                                    >
                                        {Boolean(item.poster_path || item.backdrop_path) && (
                                            <Image
                                                source={{
                                                    uri: item.backdrop_path
                                                        ? `https://image.tmdb.org/t/p/w300${item.backdrop_path}`
                                                        : `https://image.tmdb.org/t/p/w200${item.poster_path}`,
                                                }}
                                                style={styles.cwThumb}
                                                resizeMode="cover"
                                            />
                                        )}
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.cwTitle} numberOfLines={1}>
                                                {item.title}
                                            </Text>
                                            <Text style={styles.cwSubtitle}>
                                                {item.type === 'tv'
                                                    ? `S${item.season} • E${item.episode}`
                                                    : 'Movie'}{' '}
                                                • {formatTime(item.position)}
                                            </Text>
                                            <View style={styles.cwProgressTrack}>
                                                <View style={[styles.cwProgressFill, { width: `${pct}%` }]} />
                                            </View>
                                        </View>
                                        <Play color="#FF2442" size={18} fill="#FF2442" style={{ marginLeft: 10 }} />
                                    </Pressable>
                                );
                            })}
                        </ScrollView>
                    </Pressable>
                </Pressable>
            </Modal>
                    {/* --- GOOGLE CAST MODAL --- */}
            <Modal
                transparent
                visible={showCastModal}
                animationType="fade"
                onRequestClose={() => setShowCastModal(false)}
            >
                <Pressable
                    style={styles.modalBackdrop}
                    onPress={() => setShowCastModal(false)}
                >
                    <Pressable
                        style={styles.sheetContainer}
                        onPress={(e) => e.stopPropagation()}
                    >
                        <View style={styles.sheetHeader}>
                            <View style={styles.sheetTitleRow}>
                                <Cast color="#FF2442" size={20} />
                                <Text style={styles.sheetTitle}>Google Cast</Text>
                            </View>
                            <Pressable
                                onPress={() => setShowCastModal(false)}
                                style={styles.sheetCloseBtn}
                            >
                                <X color="#8A99A8" size={20} />
                            </Pressable>
                        </View>
                        <Text style={styles.sheetSubtitle}>
                            Select a Google Cast or Smart Display on your Wi-Fi network.
                        </Text>

                        <ScrollView style={styles.modalScroll}>
                            {[
                                { id: 'cast-1', name: 'Living Room Android TV', type: 'Android TV • 4K HDR' },
                                { id: 'cast-2', name: 'Chromecast with Google TV', type: 'Google Cast • 1080p' },
                                { id: 'cast-3', name: 'Family Room Shield TV', type: 'NVIDIA Shield • Dolby Atmos' },
                                { id: 'cast-4', name: 'Smart Display / AirPlay', type: 'Wireless Screen' },
                            ].map((device) => {
                                const isConnected = connectedCastDevice === device.id;
                                return (
                                    <Pressable
                                        key={device.id}
                                        style={[
                                            styles.providerOption,
                                            isConnected && styles.providerOptionActive,
                                        ]}
                                        onPress={() => {
                                            if (isConnected) {
                                                setConnectedCastDevice(null);
                                            } else {
                                                setConnectedCastDevice(device.id);
                                                setShowCastModal(false);
                                            }
                                        }}
                                    >
                                        <View style={styles.providerOptionLeft}>
                                            <Cast color={isConnected ? '#FF2442' : '#98A2B3'} size={18} />
                                            <View>
                                                <Text
                                                    style={[
                                                        styles.providerOptionName,
                                                        isConnected && styles.providerOptionNameActive,
                                                    ]}
                                                >
                                                    {device.name}
                                                </Text>
                                                <Text style={{ color: '#98A2B3', fontSize: 11, marginTop: 1 }}>
                                                    {device.type}
                                                </Text>
                                            </View>
                                        </View>
                                        {isConnected ? (
                                            <Text style={{ color: '#FF2442', fontWeight: '800', fontSize: 12 }}>
                                                CONNECTED
                                            </Text>
                                        ) : (
                                            <Text style={{ color: '#98A2B3', fontSize: 12 }}>Connect</Text>
                                        )}
                                    </Pressable>
                                );
                            })}
                        </ScrollView>
                    </Pressable>
                </Pressable>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        width: '100%',
        height: '100%',
        backgroundColor: '#000000',
        position: 'relative',
        overflow: 'hidden',
    },
    video: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
    },
    loadingContainer: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#08090C',
    },
    subtitleWrapper: {
        position: 'absolute',
        bottom: 74,
        left: 24,
        right: 24,
        alignItems: 'center',
        zIndex: 20,
    },
    subtitleText: {
        color: '#FFFFFF',
        fontSize: isTV ? 22 : 15,
        fontWeight: 'bold',
        textAlign: 'center',
        backgroundColor: 'rgba(8, 9, 12, 0.88)',
        paddingHorizontal: 16,
        paddingVertical: 7,
        borderRadius: 8,
        lineHeight: isTV ? 30 : 21,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    doubleTapOverlay: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        width: '40%',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 25,
    },
    doubleTapLeft: {
        left: 0,
    },
    doubleTapRight: {
        right: 0,
    },
    doubleTapBubble: {
        backgroundColor: 'rgba(255, 36, 66, 0.25)',
        borderWidth: 1,
        borderColor: 'rgba(255, 36, 66, 0.5)',
        borderRadius: 24,
        paddingHorizontal: 18,
        paddingVertical: 14,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
    },
    doubleTapText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '800',
    },
    bufferOverlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 15,
        backgroundColor: 'transparent',
    },
    bufferSpinnerBubble: {
        padding: 12,
        borderRadius: 24,
        backgroundColor: 'rgba(15, 18, 23, 0.75)',
        borderWidth: 1,
        borderColor: 'rgba(255, 36, 66, 0.35)',
    },
    bufferText: {
        color: '#FFFFFF',
        fontSize: 13,
        fontWeight: '700',
        marginTop: 10,
        letterSpacing: 0.3,
    },
    errorOverlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 25,
        backgroundColor: 'rgba(0,0,0,0.75)',
        padding: 24,
    },
    errorCard: {
        width: isTV ? '50%' : '90%',
        maxWidth: 480,
        padding: 26,
        borderRadius: 24,
        alignItems: 'center',
        borderWidth: 1.2,
        borderColor: 'rgba(255, 36, 66, 0.35)',
        shadowColor: '#FF2442',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 14,
    },
    errorTitle: {
        color: '#FFFFFF',
        fontSize: isTV ? 22 : 18,
        fontWeight: 'bold',
        marginTop: 12,
        textAlign: 'center',
    },
    errorSubtitle: {
        color: '#8A99A8',
        fontSize: isTV ? 15 : 13,
        textAlign: 'center',
        marginTop: 6,
        lineHeight: 18,
    },
    switchNextBtn: {
        marginTop: 20,
        borderRadius: 22,
        overflow: 'hidden',
    },
    switchNextBtnGrad: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 22,
        paddingVertical: 12,
        borderRadius: 22,
        gap: 8,
    },
    switchNextBtnText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: 'bold',
    },
    lockedContainer: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    unlockPill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: 'rgba(15, 18, 23, 0.95)',
        borderWidth: 1.5,
        borderColor: '#FF2442',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 24,
        shadowColor: '#FF2442',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.5,
        shadowRadius: 10,
        elevation: 10,
    },
    unlockPillText: {
        color: '#FFFFFF',
        fontSize: 13,
        fontWeight: '800',
    },
    controlsOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100%',
        height: '100%',
        zIndex: 30,
    },
    topGradient: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        width: '100%',
        zIndex: 35,
    },
    topBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    iconButton: {
        width: isTV ? 48 : 38,
        height: isTV ? 48 : 38,
        borderRadius: 20,
        backgroundColor: 'rgba(20, 24, 33, 0.85)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.15)',
    },
        iconButtonSmallActive: {
        backgroundColor: 'rgba(255, 36, 66, 0.25)',
        borderColor: '#FF2442',
    },
    seasonModalPill: {
        paddingHorizontal: 14,
        paddingVertical: 7,
        borderRadius: 14,
        backgroundColor: 'rgba(255, 255, 255, 0.06)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    seasonModalPillActive: {
        backgroundColor: 'rgba(255, 36, 66, 0.15)',
        borderColor: '#FF2442',
    },
    seasonModalPillText: {
        color: '#D0D5DD',
        fontSize: 12,
        fontWeight: '700',
    },
    seasonModalPillTextActive: {
        color: '#FF2442',
        fontWeight: '800',
    },
    iconButtonSmall: {
        width: 34,
        height: 34,
        borderRadius: 17,
        backgroundColor: 'rgba(20, 24, 33, 0.85)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.15)',
    },
    titleWrapper: {
        flex: 1,
        marginHorizontal: 12,
    },
    mainTitle: {
        color: '#FFFFFF',
        fontSize: isTV ? 20 : 15,
        fontWeight: '800',
        letterSpacing: 0.3,
    },
    subTitle: {
        color: '#FF2442',
        fontSize: isTV ? 14 : 11.5,
        fontWeight: '700',
        marginTop: 2,
    },
    topActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    providerBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 36, 66, 0.15)',
        borderWidth: 1,
        borderColor: 'rgba(255, 36, 66, 0.35)',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 14,
        gap: 5,
    },
    providerBadgeText: {
        color: '#FF2442',
        fontSize: 11,
        fontWeight: '800',
        maxWidth: 70,
    },
    centerControls: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'row',
        zIndex: 34,
    },
    seekButton: {
        width: isTV ? 64 : 50,
        height: isTV ? 64 : 50,
        borderRadius: 32,
        backgroundColor: 'rgba(15, 18, 23, 0.75)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.12)',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    seekBadge: {
        color: '#FFFFFF',
        fontSize: 9,
        fontWeight: '900',
        position: 'absolute',
        bottom: 6,
    },
    playPauseWrapper: {
        borderRadius: 40,
        overflow: 'hidden',
        shadowColor: '#FF2442',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.5,
        shadowRadius: 14,
        elevation: 8,
    },
    playPauseFAB: {
        width: isTV ? 80 : 64,
        height: isTV ? 80 : 64,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    bottomGradient: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        width: '100%',
        zIndex: 35,
    },
    progressContainer: {
        height: 28,
        justifyContent: 'center',
    },
    progressBarTrack: {
        height: 4,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: 2,
        position: 'relative',
    },
    progressBarFill: {
        height: '100%',
        borderRadius: 2,
    },
    progressThumb: {
        position: 'absolute',
        top: -5,
        marginLeft: -7,
        width: 14,
        height: 14,
        borderRadius: 7,
        backgroundColor: '#FF2442',
        borderWidth: 2,
        borderColor: '#FFFFFF',
        shadowColor: '#FF2442',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.6,
        shadowRadius: 4,
    },
    bottomRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 6,
    },
    timeText: {
        color: '#FFFFFF',
        fontSize: 12.5,
        fontWeight: '700',
    },
    durationText: {
        color: '#98A2B3',
        fontWeight: '500',
    },
    bottomActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    bottomBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 14,
        gap: 5,
    },
    bottomBtnActive: {
        backgroundColor: 'rgba(255, 36, 66, 0.15)',
        borderColor: 'rgba(255, 36, 66, 0.4)',
    },
    bottomBtnText: {
        color: '#FFFFFF',
        fontSize: 11.5,
        fontWeight: '700',
    },
    bottomBtnTextActive: {
        color: '#FF2442',
    },
    nextEpisodeWrapper: {
        borderRadius: 14,
        overflow: 'hidden',
    },
    nextEpisodeGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 11,
        paddingVertical: 6,
        gap: 4,
    },
    nextEpisodeBtnText: {
        color: '#FFFFFF',
        fontSize: 11.5,
        fontWeight: '800',
    },
    modalBackdrop: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    sheetContainer: {
        width: '100%',
        maxWidth: 480,
        backgroundColor: '#0F1217',
        borderRadius: 24,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        padding: 20,
    },
    sheetHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    sheetTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    sheetTitle: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '800',
    },
    sheetCloseBtn: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(255, 255, 255, 0.06)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    sheetSubtitle: {
        color: '#98A2B3',
        fontSize: 12,
        lineHeight: 17,
        marginBottom: 16,
    },
    modalScroll: {
        maxHeight: 300,
    },
    providerOption: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
        paddingHorizontal: 14,
        borderRadius: 14,
        marginBottom: 6,
        backgroundColor: 'rgba(255, 255, 255, 0.04)',
    },
    providerOptionActive: {
        backgroundColor: 'rgba(255, 36, 66, 0.12)',
        borderWidth: 1,
        borderColor: 'rgba(255, 36, 66, 0.35)',
    },
    providerOptionLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        gap: 10,
    },
    providerDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#98A2B3',
    },
    providerOptionName: {
        color: '#D0D5DD',
        fontSize: 13.5,
        fontWeight: '600',
    },
    providerOptionNameActive: {
        color: '#FFFFFF',
        fontWeight: '800',
    },
    episodeOption: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 14,
        marginBottom: 8,
        backgroundColor: 'rgba(255, 255, 255, 0.04)',
        gap: 12,
    },
    episodeOptionActive: {
        backgroundColor: 'rgba(255, 36, 66, 0.12)',
        borderWidth: 1,
        borderColor: '#FF2442',
    },
    epNumBadge: {
        width: 34,
        height: 34,
        borderRadius: 17,
        backgroundColor: '#141821',
        justifyContent: 'center',
        alignItems: 'center',
    },
    epNumText: {
        color: '#FF2442',
        fontSize: 14,
        fontWeight: '800',
    },
    epDetail: {
        flex: 1,
    },
    epTitle: {
        color: '#FFFFFF',
        fontSize: 13.5,
        fontWeight: '700',
        marginBottom: 2,
    },
    epOverview: {
        color: '#98A2B3',
        fontSize: 11,
        lineHeight: 15,
    },
    cwOption: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        borderRadius: 14,
        marginBottom: 8,
        backgroundColor: 'rgba(255, 255, 255, 0.04)',
        gap: 12,
    },
    cwThumb: {
        width: 70,
        height: 44,
        borderRadius: 8,
        backgroundColor: '#141821',
    },
    cwTitle: {
        color: '#FFFFFF',
        fontSize: 13,
        fontWeight: '700',
        marginBottom: 2,
    },
    cwSubtitle: {
        color: '#98A2B3',
        fontSize: 11,
        marginBottom: 4,
    },
    cwProgressTrack: {
        height: 3,
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        borderRadius: 1.5,
        overflow: 'hidden',
        width: '100%',
    },
    cwProgressFill: {
        height: '100%',
        backgroundColor: '#FF2442',
    },
    tvFocusBorder: {
        borderColor: '#FF2442',
        borderWidth: 2,
    },
});
