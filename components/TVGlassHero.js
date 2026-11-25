import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Image, Pressable, useWindowDimensions } from 'react-native';
import { Text } from 'react-native-paper';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import {
    Play,
    Search,
    SlidersHorizontal,
    Heart,
    Bookmark,
    Plus,
    Check,
} from 'lucide-react-native';
import { isBookmarked, toggleBookmark } from '../services/bookmarksService';
import { IMAGE_PATH } from '../services/api';

const TMDB_GENRE_MAP = {
    28: 'action',
    12: 'adventure',
    16: 'animation',
    35: 'comedy',
    80: 'crime',
    99: 'documentary',
    18: 'drama',
    10751: 'family',
    14: 'fantasy',
    36: 'history',
    27: 'horror',
    10402: 'music',
    9648: 'mystery',
    10749: 'romance',
    878: 'sci-fi',
    53: 'thriller',
    10752: 'war',
    37: 'western',
    10759: 'action',
    10765: 'sci-fi & fantasy',
    10768: 'war & politics',
};

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function formatHeroDate(item) {
    const raw = item?.release_date || item?.first_air_date;
    if (!raw) return item?.year || '2026';
    const parts = raw.split('-');
    if (parts.length !== 3) return raw;
    const monthIdx = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    if (monthIdx >= 0 && monthIdx < 12 && !isNaN(day)) {
        return `${MONTHS[monthIdx]}, ${day}`;
    }
    return parts[0];
}

function formatHeroGenres(item, fallbackType) {
    if (Array.isArray(item?.genre_ids) && item.genre_ids.length > 0) {
        const names = item.genre_ids
            .map((id) => TMDB_GENRE_MAP[id])
            .filter(Boolean)
            .slice(0, 3);
        if (names.length > 0) return names.join(', ');
    }
    return fallbackType === 'tv' ? 'drama, series' : 'action, thriller';
}

export const TVGlassHero = ({
    items = [],
    mediaType = 'movie',
    onOpenAI,
}) => {
    const navigation = useNavigation();
    const { width, height } = useWindowDimensions();
    const [activeIndex, setActiveIndex] = useState(0);
    const [bookmarked, setBookmarked] = useState(false);
    const [liked, setLiked] = useState(false);

    const previewItems = items.slice(0, 5);
    const activeItem = previewItems[activeIndex] || previewItems[0];

    useEffect(() => {
        if (activeItem?.id) {
            isBookmarked(activeItem.id).then(setBookmarked).catch(() => {});
        }
    }, [activeItem?.id]);

    if (!activeItem) return null;

    const itemType = activeItem.media_type || mediaType;
    const dateLabel = formatHeroDate(activeItem);
    const genresLabel = formatHeroGenres(activeItem, itemType);
    const ratingVal = activeItem.rating || (activeItem.vote_average ? activeItem.vote_average.toFixed(1) : '8.5');
    const yearVal = activeItem.year || (activeItem.release_date || activeItem.first_air_date || '').split('-')[0] || '2026';

    const handleToggleWatchlist = async () => {
        const next = await toggleBookmark({
            ...activeItem,
            media_type: itemType,
        });
        setBookmarked(next);
    };

    const handlePlay = () => {
        navigation.navigate('Player', {
            id: activeItem.id,
            type: itemType,
            item: activeItem,
            ...(itemType === 'tv' ? { season: 1, episode: 1 } : {}),
        });
    };

    const handleDetails = () => {
        navigation.navigate('MovieDetail', {
            id: activeItem.id,
            type: itemType,
        });
    };

    return (
        <View style={[styles.heroCanvas, { width, height }]}>
            {/* Full-Bleed Backdrop Artwork */}
            <Image
                source={{ uri: activeItem.backdrop || activeItem.image }}
                style={{ position: 'absolute', top: 0, left: 0, width, height }}
                resizeMode="cover"
            />

            {/* Left-to-Right Deep Cinema Vignette */}
            <LinearGradient
                colors={['#08090C', 'rgba(8, 9, 12, 0.88)', 'rgba(8, 9, 12, 0.36)', 'transparent']}
                style={StyleSheet.absoluteFillObject}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 0.88, y: 0.5 }}
            />

            {/* Bottom Edge Vignette into Content Rows */}
            <LinearGradient
                colors={['transparent', 'rgba(8, 9, 12, 0.58)', '#08090C']}
                style={StyleSheet.absoluteFillObject}
                start={{ x: 0.5, y: 0.58 }}
                end={{ x: 0.5, y: 1 }}
            />

            {/* Top-Right Floating Frosted-Glass Search Pill */}
            <View style={styles.searchPillOuter}>
                <BlurView intensity={52} tint="dark" style={styles.searchPillBlur}>
                    <Pressable
                        focusable={true}
                        onPress={() => navigation.navigate('Search')}
                        style={({ focused }) => [
                            styles.searchMainArea,
                            focused && styles.searchMainFocused,
                        ]}
                    >
                        <Search color="rgba(255, 255, 255, 0.88)" size={16} />
                        <Text style={styles.searchPlaceholder}>
                            {mediaType === 'tv' ? 'Search for Series' : 'Search for Movie'}
                        </Text>
                    </Pressable>

                    <Pressable
                        focusable={true}
                        onPress={() => (onOpenAI ? onOpenAI() : navigation.navigate('Search'))}
                        style={({ focused }) => [
                            styles.searchFilterBtn,
                            focused && styles.searchFilterFocused,
                        ]}
                    >
                        <SlidersHorizontal color="rgba(255, 255, 255, 0.9)" size={15} />
                    </Pressable>
                </BlurView>
            </View>

            {/* Left-Aligned Hero Typography & Pill CTAs */}
            <View style={styles.heroTextBlock}>
                <View style={styles.metaLine}>
                    <Text style={styles.metaDate}>{dateLabel}</Text>
                    <Text style={styles.metaGenres} numberOfLines={1}>
                        {genresLabel}
                    </Text>
                </View>

                <Text style={styles.heroTitle} numberOfLines={2}>
                    {(activeItem.title || '').toUpperCase()}
                </Text>

                <Text style={styles.heroSubtitle} numberOfLines={1}>
                    {`Top Pick #${activeIndex + 1} • ★ ${ratingVal} (${yearVal}) • 4K HDR`}
                </Text>

                <View style={styles.ctaRow}>
                    {/* Primary Brand Crimson Pill CTA */}
                    <Pressable
                        focusable={true}
                        hasTVPreferredFocus={true}
                        onPress={handlePlay}
                        style={({ focused }) => [
                            styles.watchBtn,
                            focused && styles.ctaFocused,
                        ]}
                    >
                        <LinearGradient
                            colors={['#FF3B56', '#FF1E3C', '#C40826']}
                            style={styles.watchBtnGradient}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                        >
                            <Play color="#FFFFFF" size={15} fill="#FFFFFF" />
                            <Text style={styles.watchBtnText}>Watch now</Text>
                        </LinearGradient>
                    </Pressable>

                    {/* Secondary Frosted Glass Outline Pill */}
                    <Pressable
                        focusable={true}
                        onPress={handleDetails}
                        style={({ focused }) => [
                            styles.secondaryBtn,
                            focused && styles.secondaryBtnFocused,
                        ]}
                    >
                        <BlurView intensity={30} tint="dark" style={styles.secondaryBtnBlur} pointerEvents="none">
                            <Text style={styles.secondaryBtnText}>Details</Text>
                        </BlurView>
                    </Pressable>
                </View>
            </View>

            {/* Bottom-Left 5-Thumbnail Hero Switcher + Indicator Track */}
            <View style={styles.thumbSection}>
                <View style={styles.thumbRow}>
                    {previewItems.map((item, idx) => {
                        const isActive = idx === activeIndex;
                        const thumbUri =
                            item.image ||
                            (item.poster_path ? `${IMAGE_PATH}${item.poster_path}` : item.backdrop);

                        return (
                            <Pressable
                                key={`hero-thumb-${item.id}-${idx}`}
                                focusable={true}
                                onFocus={() => setActiveIndex(idx)}
                                onPress={() => {
                                    if (activeIndex !== idx) {
                                        setActiveIndex(idx);
                                    } else {
                                        navigation.navigate('MovieDetail', {
                                            id: item.id,
                                            type: item.media_type || mediaType,
                                        });
                                    }
                                }}
                                style={({ focused }) => [
                                    styles.thumbCard,
                                    isActive && styles.thumbCardActive,
                                    focused && styles.thumbCardFocused,
                                ]}
                            >
                                <Image
                                    source={{ uri: thumbUri }}
                                    style={styles.thumbImg}
                                    resizeMode="cover"
                                />
                                {!isActive && <View style={styles.thumbDimOverlay} />}
                                <LinearGradient
                                    colors={['transparent', 'rgba(8, 9, 12, 0.85)']}
                                    style={styles.thumbBottomFade}
                                />
                                <Text style={styles.thumbMiniTitle} numberOfLines={1}>
                                    {(item.title || '').toUpperCase()}
                                </Text>
                            </Pressable>
                        );
                    })}
                </View>

                {/* Minimal Indicator Track */}
                <View style={styles.indicatorTrack}>
                    <View
                        style={[
                            styles.indicatorFill,
                            { transform: [{ translateX: activeIndex * 18.5 }] },
                        ]}
                    />
                </View>
            </View>

            {/* Bottom-Right 3 Circular Frosted-Glass Quick Action Buttons */}
            <View style={styles.quickActionsRow}>
                <Pressable
                    focusable={true}
                    onPress={() => {
                        setLiked((v) => !v);
                        if (onOpenAI) onOpenAI();
                    }}
                    style={({ focused }) => [
                        styles.quickCircle,
                        liked && styles.quickCircleActive,
                        focused && styles.quickCircleFocused,
                    ]}
                >
                    <BlurView intensity={45} tint="dark" style={styles.quickCircleBlur} pointerEvents="none">
                        <Heart
                            color={liked ? '#FF2442' : '#FFFFFF'}
                            fill={liked ? '#FF2442' : 'transparent'}
                            size={18}
                        />
                    </BlurView>
                </Pressable>

                <Pressable
                    focusable={true}
                    onPress={handleToggleWatchlist}
                    style={({ focused }) => [
                        styles.quickCircle,
                        bookmarked && styles.quickCircleBookmarked,
                        focused && styles.quickCircleFocused,
                    ]}
                >
                    <BlurView intensity={45} tint="dark" style={styles.quickCircleBlur} pointerEvents="none">
                        <Bookmark
                            color="#FFFFFF"
                            fill={bookmarked ? '#FFFFFF' : 'transparent'}
                            size={18}
                        />
                    </BlurView>
                </Pressable>

                <Pressable
                    focusable={true}
                    onPress={handleDetails}
                    style={({ focused }) => [
                        styles.quickCircle,
                        focused && styles.quickCircleFocused,
                    ]}
                >
                    <BlurView intensity={45} tint="dark" style={styles.quickCircleBlur} pointerEvents="none">
                        {bookmarked ? (
                            <Check color="#FFFFFF" size={18} />
                        ) : (
                            <Plus color="#FFFFFF" size={19} />
                        )}
                    </BlurView>
                </Pressable>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    heroCanvas: {
        position: 'relative',
        overflow: 'hidden',
        backgroundColor: '#08090C',
    },
    searchPillOuter: {
        position: 'absolute',
        top: 24,
        right: 36,
        width: 310,
        height: 44,
        borderRadius: 22,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.24)',
        backgroundColor: 'rgba(255, 255, 255, 0.12)',
        zIndex: 20,
    },
    searchPillBlur: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        paddingLeft: 16,
        paddingRight: 8,
    },
    searchMainArea: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        height: '100%',
        gap: 10,
        borderRadius: 18,
    },
    searchMainFocused: {
        backgroundColor: 'rgba(255, 36, 66, 0.22)',
        paddingHorizontal: 8,
    },
    searchPlaceholder: {
        color: 'rgba(255, 255, 255, 0.85)',
        fontSize: 13,
        fontWeight: '600',
    },
    searchFilterBtn: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    searchFilterFocused: {
        backgroundColor: '#FF2442',
    },
    heroTextBlock: {
        position: 'absolute',
        left: 96,
        top: 104,
        maxWidth: 470,
        zIndex: 10,
    },
    metaLine: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 28,
        marginBottom: 10,
    },
    metaDate: {
        color: 'rgba(255, 255, 255, 0.88)',
        fontSize: 13.5,
        fontWeight: '600',
    },
    metaGenres: {
        color: 'rgba(255, 255, 255, 0.82)',
        fontSize: 13.5,
        fontWeight: '500',
        maxWidth: 320,
    },
    heroTitle: {
        color: '#FFFFFF',
        fontSize: 42,
        lineHeight: 46,
        fontWeight: '900',
        letterSpacing: 1.0,
        textShadowColor: 'rgba(0, 0, 0, 0.75)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 10,
    },
    heroSubtitle: {
        color: 'rgba(255, 255, 255, 0.82)',
        fontSize: 14,
        fontWeight: '600',
        marginTop: 6,
        marginBottom: 20,
    },
    ctaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
    },
    watchBtn: {
        borderRadius: 999,
        overflow: 'hidden',
        borderWidth: 1.5,
        borderColor: 'transparent',
        shadowColor: '#FF2442',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.5,
        shadowRadius: 10,
        elevation: 8,
    },
    ctaFocused: {
        borderColor: '#FFFFFF',
        borderWidth: 2,
        transform: [{ scale: 1.06 }],
    },
    watchBtnGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        height: 40,
        paddingHorizontal: 22,
        gap: 8,
    },
    watchBtnText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '800',
        letterSpacing: 0.3,
    },
    secondaryBtn: {
        borderRadius: 999,
        overflow: 'hidden',
        borderWidth: 1.2,
        borderColor: 'rgba(255, 255, 255, 0.55)',
        backgroundColor: 'rgba(255, 255, 255, 0.10)',
    },
    secondaryBtnFocused: {
        borderColor: '#FF2442',
        borderWidth: 2,
        backgroundColor: 'rgba(255, 36, 66, 0.28)',
        transform: [{ scale: 1.06 }],
    },
    secondaryBtnBlur: {
        height: 40,
        paddingHorizontal: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    secondaryBtnText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '700',
    },
    thumbSection: {
        position: 'absolute',
        left: 96,
        bottom: 26,
        zIndex: 10,
    },
    thumbRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    thumbCard: {
        width: 82,
        height: 82,
        borderRadius: 12,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.16)',
        position: 'relative',
        justifyContent: 'flex-end',
    },
    thumbCardActive: {
        borderColor: '#FF2442',
        borderWidth: 2,
    },
    thumbCardFocused: {
        borderColor: '#FFFFFF',
        borderWidth: 2.5,
        transform: [{ scale: 1.08 }],
        shadowColor: '#FF2442',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.85,
        shadowRadius: 10,
        elevation: 8,
    },
    thumbImg: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
    },
    thumbDimOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(8, 9, 12, 0.52)',
    },
    thumbBottomFade: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        height: 36,
    },
    thumbMiniTitle: {
        color: '#FFFFFF',
        fontSize: 9.5,
        fontWeight: '800',
        letterSpacing: 0.4,
        paddingHorizontal: 6,
        paddingBottom: 6,
    },
    indicatorTrack: {
        width: 110,
        height: 3,
        borderRadius: 2,
        backgroundColor: 'rgba(255, 255, 255, 0.22)',
        marginTop: 10,
        overflow: 'hidden',
    },
    indicatorFill: {
        width: 36,
        height: 3,
        borderRadius: 2,
        backgroundColor: '#FF2442',
    },
    quickActionsRow: {
        position: 'absolute',
        right: 36,
        bottom: 30,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        zIndex: 15,
    },
    quickCircle: {
        width: 44,
        height: 44,
        borderRadius: 22,
        overflow: 'hidden',
        backgroundColor: 'rgba(255, 255, 255, 0.14)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.25)',
    },
    quickCircleActive: {
        backgroundColor: 'rgba(255, 36, 66, 0.25)',
        borderColor: '#FF2442',
    },
    quickCircleBookmarked: {
        backgroundColor: 'rgba(255, 36, 66, 0.48)',
        borderColor: '#FF2442',
        borderWidth: 1.5,
    },
    quickCircleFocused: {
        borderColor: '#FFFFFF',
        borderWidth: 2,
        backgroundColor: '#FF2442',
        transform: [{ scale: 1.12 }],
    },
    quickCircleBlur: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
