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
} from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import {
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
    Check,
    X,
    SkipForward,
    RefreshCw,
    AlertCircle,
    Zap,
} from 'lucide-react-native';
import { fetchAndParseVtt } from '../../services/providerService';
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
}) => {
    // Controls Visibility State
    const [controlsVisible, setControlsVisible] = useState(true);
    const hideTimeoutRef = useRef(null);

    // Playback state
    const [isPlaying, setIsPlaying] = useState(true);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [isBuffering, setIsBuffering] = useState(true);
    const [hasPlaybackError, setHasPlaybackError] = useState(false);
    const [currentSpeed, setCurrentSpeed] = useState(1.0);
    const [contentFit, setContentFit] = useState('contain'); // 'contain' | 'cover'

    // Modals
    const [showProviderModal, setShowProviderModal] = useState(false);
    const [showSubtitleModal, setShowSubtitleModal] = useState(false);
    const [showSpeedModal, setShowSpeedModal] = useState(false);
    const [showEpisodesModal, setShowEpisodesModal] = useState(false);

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
                    'Origin': 'https://youplex.site',
                    'Referer': 'https://youplex.site/',
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
        if (initialPosition > 0) {
            p.currentTime = initialPosition;
        }
        p.play();
    });

    // Auto-hide controls timer
    const resetControlsTimer = useCallback(() => {
        setControlsVisible(true);
        if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
        hideTimeoutRef.current = setTimeout(() => {
            setControlsVisible(false);
        }, 4500);
    }, []);

    const toggleControls = useCallback(() => {
        if (controlsVisible) {
            setControlsVisible(false);
            if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
        } else {
            resetControlsTimer();
        }
    }, [controlsVisible, resetControlsTimer]);

    // Reset state & failover watchdog on streamUrl change
    useEffect(() => {
        setHasPlaybackError(false);
        setIsBuffering(true);
        if (autoSwitchTimeoutRef.current) clearTimeout(autoSwitchTimeoutRef.current);
        if (bufferWatchdogRef.current) clearTimeout(bufferWatchdogRef.current);

        // Failover watchdog: if loading persists over 8s, trigger auto-failover
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

    // Handle Player Events & Auto-Switching on Error
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
            onProgressUpdate?.({ position: time, duration: dur });
        });

        const statusSub = player.addListener('statusChange', (payload) => {
            const rawStatus = typeof payload === 'string' ? payload : (payload?.status || player?.status);
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
    const progressPercent = duration > 0 ? (displayTime / duration) * 100 : 0;

    return (
        <View style={styles.container}>
            {/* Native Video View */}
            <Pressable
                style={StyleSheet.absoluteFill}
                onPress={toggleControls}
                focusable={false}
            >
                {player ? (
                    <VideoView
                        player={player}
                        style={styles.video}
                        contentFit={contentFit}
                        nativeControls={false}
                    />
                ) : (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#FF3030" />
                    </View>
                )}
            </Pressable>

            {/* Custom Subtitles Overlay */}
            {Boolean(activeCueText) && (
                <View style={styles.subtitleWrapper} pointerEvents="none">
                    <Text style={styles.subtitleText}>{activeCueText}</Text>
                </View>
            )}

            {/* Buffering Indicator */}
            {isBuffering && !hasPlaybackError && (
                <View style={styles.bufferOverlay} pointerEvents="none">
                    <ActivityIndicator size={isTV ? 60 : 48} color="#FF3030" />
                    <Text style={styles.bufferText}>Loading stream from {activeProviderLabel}...</Text>
                </View>
            )}

            {/* Playback Error & Auto-Switch Banner */}
            {hasPlaybackError && (
                <View style={styles.errorOverlay} pointerEvents="box-none">
                    <BlurView intensity={85} tint="dark" style={styles.errorCard}>
                        <AlertCircle color="#FF3030" size={32} />
                        <Text style={styles.errorTitle}>Stream Blocked / 403 Forbidden</Text>
                        <Text style={styles.errorSubtitle}>
                            Auto-switching to the next provider from @p-stream in 2 seconds...
                        </Text>
                        <Pressable
                            focusable={true}
                            onPress={() => { if (autoSwitchTimeoutRef.current) clearTimeout(autoSwitchTimeoutRef.current); onAutoSwitchNext?.(); }}
                            style={styles.switchNextBtn}
                        >
                            <LinearGradient
                                colors={['#FF4565', '#FF3030', '#B71833']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.switchNextBtnGrad}
                            >
                                <RefreshCw color="#FFFFFF" size={18} />
                                <Text style={styles.switchNextBtnText}>Switch to Next Provider Now</Text>
                            </LinearGradient>
                        </Pressable>
                    </BlurView>
                </View>
            )}

            {/* CONTROLS OVERLAY */}
            <View
                style={[
                    styles.controlsOverlay,
                    { opacity: controlsVisible ? 1 : 0 },
                ]}
                pointerEvents={controlsVisible ? 'box-none' : 'none'}
            >
                {/* TOP BAR */}
                <LinearGradient
                    colors={['rgba(5, 5, 5, 0.95)', 'rgba(5, 5, 5, 0.4)', 'transparent']}
                    style={styles.topGradient}
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
                            <ChevronLeft color="#FFFFFF" size={isTV ? 32 : 24} />
                        </Pressable>

                        <View style={styles.titleWrapper}>
                            <Text style={styles.mainTitle} numberOfLines={1}>
                                {title}
                            </Text>
                            {Boolean(subtitle) && (
                                <Text style={styles.subTitle}>{subtitle}</Text>
                            )}
                        </View>

                        {/* Top Action Pills */}
                        <View style={styles.topActions}>
                            {/* Auto-Switch Status Badge */}
                            <View style={styles.autoBadge}>
                                <Zap color="#10B981" size={12} fill="#10B981" />
                                <Text style={styles.autoBadgeText}>AUTO-FAILOVER</Text>
                            </View>

                            {/* Active Provider Badge */}
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
                                <Server color="#FF4D4D" size={14} />
                                <Text style={styles.providerBadgeText}>
                                    {activeProviderLabel}
                                </Text>
                            </Pressable>

                            {/* Fit Toggle */}
                            <Pressable
                                focusable={true}
                                onPress={handleFitToggle}
                                style={({ focused }) => [
                                    styles.iconButtonSmall,
                                    focused && styles.tvFocusBorder,
                                ]}
                            >
                                <Maximize color="#FFFFFF" size={16} />
                            </Pressable>
                        </View>
                    </View>
                </LinearGradient>

                {/* CENTER CONTROLS (Rewind, Play/Pause, Fast-Forward) */}
                <View style={styles.centerControls} pointerEvents="box-none">
                    <Pressable
                        focusable={true}
                        onPress={() => handleSeekBy(-10)}
                        style={({ focused }) => [
                            styles.seekButton,
                            focused && styles.tvFocusBorder,
                        ]}
                    >
                        <RotateCcw color="#FFFFFF" size={isTV ? 34 : 26} />
                        <Text style={styles.seekBadge}>-10s</Text>
                    </Pressable>

                    <Pressable
                        focusable={true}
                        onPress={handlePlayPause}
                        style={({ focused }) => [
                            styles.playPauseWrapper,
                            focused && styles.tvFocusBorder,
                        ]}
                    >
                        <LinearGradient
                            colors={['#FF5252', '#FF3030', '#B71833']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.playPauseFAB}
                        >
                            {isPlaying ? (
                                <Pause
                                    color="#FFFFFF"
                                    size={isTV ? 44 : 32}
                                    fill="#FFFFFF"
                                />
                            ) : (
                                <Play
                                    color="#FFFFFF"
                                    size={isTV ? 44 : 32}
                                    fill="#FFFFFF"
                                    style={{ marginLeft: 3 }}
                                />
                            )}
                        </LinearGradient>
                    </Pressable>

                    <Pressable
                        focusable={true}
                        onPress={() => handleSeekBy(10)}
                        style={({ focused }) => [
                            styles.seekButton,
                            focused && styles.tvFocusBorder,
                        ]}
                    >
                        <RotateCw color="#FFFFFF" size={isTV ? 34 : 26} />
                        <Text style={styles.seekBadge}>+10s</Text>
                    </Pressable>
                </View>

                {/* BOTTOM BAR: Scrubber, Timestamps & Extras */}
                <LinearGradient
                    colors={['transparent', 'rgba(5, 5, 5, 0.65)', 'rgba(5, 5, 5, 0.98)']}
                    style={styles.bottomGradient}
                    pointerEvents="box-none"
                >
                    {/* Scrub Bar */}
                    <View
                        style={styles.progressContainer}
                        {...panResponder.panHandlers}
                        onLayout={(e) => {
                            progressBarWidth.current = e.nativeEvent.layout.width;
                        }}
                    >
                        <View style={styles.progressBarTrack}>
                            <LinearGradient
                                colors={['#FF5252', '#FF3030', '#B71833']}
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
                            <Text style={styles.durationText}>/ {formatTime(duration)}</Text>
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
                                    color={selectedSubtitleId ? '#FF3030' : '#FFFFFF'}
                                    size={isTV ? 22 : 18}
                                />
                                <Text
                                    style={[
                                        styles.bottomBtnText,
                                        Boolean(selectedSubtitleId) && styles.bottomBtnTextActive,
                                    ]}
                                >
                                    CC
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
                                <Gauge color="#FFFFFF" size={isTV ? 22 : 18} />
                                <Text style={styles.bottomBtnText}>{currentSpeed}x</Text>
                            </Pressable>

                            {/* Episodes Drawer (TV Series) */}
                            {type === 'tv' && episodes?.length > 0 && (
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
                                    <ListVideo color="#FFFFFF" size={isTV ? 22 : 18} />
                                    <Text style={styles.bottomBtnText}>Episodes</Text>
                                </Pressable>
                            )}

                            {/* Next Episode Button */}
                            {type === 'tv' && Boolean(onNextEpisode) && (
                                <Pressable
                                    focusable={true}
                                    onPress={onNextEpisode}
                                    style={({ focused }) => [
                                        styles.nextEpisodeWrapper,
                                        focused && styles.tvFocusBorder,
                                    ]}
                                >
                                    <LinearGradient
                                        colors={['#FF4D4D', '#FF3030', '#B71833']}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 0 }}
                                        style={styles.nextEpisodeGradient}
                                    >
                                        <SkipForward color="#FFFFFF" size={isTV ? 20 : 16} />
                                        <Text style={styles.nextEpisodeBtnText}>Next</Text>
                                    </LinearGradient>
                                </Pressable>
                            )}
                        </View>
                    </View>
                </LinearGradient>
            </View>

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
                                <Server color="#FF3030" size={20} />
                                <Text style={styles.sheetTitle}>@p-stream Sources</Text>
                            </View>
                            <Pressable
                                onPress={() => setShowProviderModal(false)}
                                style={styles.sheetCloseBtn}
                            >
                                <X color="#8A99A8" size={20} />
                            </Pressable>
                        </View>
                        <Text style={styles.sheetSubtitle}>
                            Select a native streaming provider. Automatic failover will switch to the next provider if a source drops.
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
                                                    isCurrent && { backgroundColor: '#10B981' },
                                                ]}
                                            />
                                            <Text
                                                style={[
                                                    styles.providerOptionName,
                                                    isCurrent && styles.providerOptionNameActive,
                                                ]}
                                            >
                                                {prov.label}
                                            </Text>
                                        </View>
                                        {isCurrent && <Check color="#10B981" size={18} />}
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
                                <SubtitlesIcon color="#FF3030" size={20} />
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
                            {/* Off option */}
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
                                {selectedSubtitleId === null && <Check color="#FF3030" size={18} />}
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
                                        {isCurrent && <Check color="#FF3030" size={18} />}
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
                                <Gauge color="#FF3030" size={20} />
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
                                        {isCurrent && <Check color="#FF3030" size={18} />}
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
                                <ListVideo color="#FF3030" size={20} />
                                <Text style={styles.sheetTitle}>Season {season} Episodes</Text>
                            </View>
                            <Pressable
                                onPress={() => setShowEpisodesModal(false)}
                                style={styles.sheetCloseBtn}
                            >
                                <X color="#8A99A8" size={20} />
                            </Pressable>
                        </View>

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
                                                    isCurrent && { color: '#FF3030' },
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
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000000',
    },
    video: {
        ...StyleSheet.absoluteFillObject,
    },
    loadingContainer: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#050505',
    },
    subtitleWrapper: {
        position: 'absolute',
        bottom: 80,
        left: 30,
        right: 30,
        alignItems: 'center',
        zIndex: 20,
    },
    subtitleText: {
        color: '#FFFFFF',
        fontSize: isTV ? 24 : 16,
        fontWeight: 'bold',
        textAlign: 'center',
        backgroundColor: 'rgba(5, 5, 5, 0.85)',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
        lineHeight: isTV ? 32 : 22,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    bufferOverlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 15,
        backgroundColor: 'rgba(0,0,0,0.45)',
    },
    bufferText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '700',
        marginTop: 12,
        letterSpacing: 0.5,
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
        borderColor: 'rgba(255, 48, 48, 0.35)',
        shadowColor: '#FF3030',
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
    controlsOverlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'space-between',
        zIndex: 30,
    },
    topGradient: {
        paddingTop: Platform.OS === 'ios' ? 44 : 20,
        paddingBottom: 40,
        paddingHorizontal: 24,
    },
    topBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    iconButton: {
        width: isTV ? 52 : 40,
        height: isTV ? 52 : 40,
        borderRadius: 26,
        backgroundColor: 'rgba(20, 26, 33, 0.85)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.15)',
    },
    iconButtonSmall: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(20, 26, 33, 0.85)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.15)',
    },
    titleWrapper: {
        flex: 1,
        marginLeft: 16,
        marginRight: 16,
    },
    mainTitle: {
        color: '#FFFFFF',
        fontSize: isTV ? 20 : 16,
        fontWeight: 'bold',
    },
    subTitle: {
        color: '#FF4D4D',
        fontSize: 12,
        fontWeight: '700',
        marginTop: 2,
    },
    topActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    autoBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(16, 185, 129, 0.15)',
        paddingHorizontal: 8,
        paddingVertical: 5,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(16, 185, 129, 0.4)',
        gap: 4,
    },
    autoBadgeText: {
        color: '#10B981',
        fontSize: 10,
        fontWeight: '900',
        letterSpacing: 0.5,
    },
    providerBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(20, 26, 33, 0.85)',
        paddingHorizontal: 12,
        paddingVertical: 7,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(255, 48, 48, 0.4)',
        gap: 6,
    },
    providerBadgeText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '800',
    },
    centerControls: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: isTV ? 48 : 32,
    },
    seekButton: {
        width: isTV ? 68 : 52,
        height: isTV ? 68 : 52,
        borderRadius: 34,
        backgroundColor: 'rgba(20, 26, 33, 0.8)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.15)',
    },
    seekBadge: {
        color: '#8A99A8',
        fontSize: 10,
        fontWeight: 'bold',
        marginTop: 2,
    },
    playPauseWrapper: {
        borderRadius: 44,
        overflow: 'hidden',
    },
    playPauseFAB: {
        width: isTV ? 88 : 70,
        height: isTV ? 88 : 70,
        borderRadius: 44,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 10,
        shadowColor: '#FF3030',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.7,
        shadowRadius: 16,
        borderWidth: 2,
        borderColor: 'rgba(255, 255, 255, 0.25)',
    },
    bottomGradient: {
        paddingTop: 30,
        paddingBottom: Platform.OS === 'ios' ? 34 : 20,
        paddingHorizontal: 24,
    },
    progressContainer: {
        height: 30,
        justifyContent: 'center',
        marginBottom: 8,
    },
    progressBarTrack: {
        height: 6,
        borderRadius: 3,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        overflow: 'visible',
        position: 'relative',
    },
    progressBarFill: {
        height: '100%',
        borderRadius: 3,
    },
    progressThumb: {
        position: 'absolute',
        top: -5,
        width: 16,
        height: 16,
        borderRadius: 8,
        backgroundColor: '#FFFFFF',
        borderWidth: 3,
        borderColor: '#FF3030',
        marginLeft: -8,
        elevation: 6,
        shadowColor: '#FF3030',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.9,
        shadowRadius: 6,
    },
    bottomRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    timeText: {
        color: '#FFFFFF',
        fontSize: 13,
        fontWeight: '800',
    },
    durationText: {
        color: '#8A99A8',
        fontWeight: '500',
    },
    bottomActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    bottomBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(20, 26, 33, 0.85)',
        paddingHorizontal: 12,
        paddingVertical: 7,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.15)',
        gap: 6,
    },
    bottomBtnActive: {
        borderColor: '#FF3030',
        backgroundColor: 'rgba(255, 48, 48, 0.18)',
    },
    bottomBtnText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '700',
    },
    bottomBtnTextActive: {
        color: '#FF4D4D',
    },
    nextEpisodeWrapper: {
        borderRadius: 14,
        overflow: 'hidden',
    },
    nextEpisodeGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 7,
        borderRadius: 14,
        gap: 6,
    },
    nextEpisodeBtnText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '800',
    },
    tvFocusBorder: {
        borderWidth: 3,
        borderColor: '#FF3030',
        shadowColor: '#FF3030',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 14,
        transform: [{ scale: 1.05 }],
    },

    // Modals
    modalBackdrop: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        justifyContent: 'flex-end',
        alignItems: 'center',
    },
    sheetContainer: {
        width: isTV ? '50%' : '100%',
        backgroundColor: '#0D0F12',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        maxHeight: '65%',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    sheetHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6,
    },
    sheetTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    sheetTitle: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: 'bold',
    },
    sheetSubtitle: {
        color: '#8A99A8',
        fontSize: 12,
        marginBottom: 16,
    },
    sheetCloseBtn: {
        padding: 4,
    },
    modalScroll: {
        marginTop: 6,
    },
    providerOption: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderRadius: 12,
        backgroundColor: '#141A21',
        marginBottom: 8,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.08)',
    },
    providerOptionActive: {
        borderColor: '#10B981',
        backgroundColor: 'rgba(16, 185, 129, 0.12)',
    },
    providerOptionLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    providerDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#637381',
    },
    providerOptionName: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '600',
    },
    providerOptionNameActive: {
        color: '#10B981',
        fontWeight: 'bold',
    },
    episodeOption: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 12,
        backgroundColor: '#141A21',
        marginBottom: 8,
        gap: 14,
    },
    episodeOptionActive: {
        borderColor: '#FF3030',
        backgroundColor: 'rgba(255, 48, 48, 0.14)',
        borderWidth: 1,
    },
    epNumBadge: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(255, 48, 48, 0.15)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    epNumText: {
        color: '#FF4D4D',
        fontSize: 14,
        fontWeight: 'bold',
    },
    epDetail: {
        flex: 1,
    },
    epTitle: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '600',
    },
    epOverview: {
        color: '#8A99A8',
        fontSize: 11,
        marginTop: 2,
    },
});
