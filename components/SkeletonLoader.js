import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Animated, Platform, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { isTV } from '../utils/device';

/**
 * Glassmorphic shimmering base element
 */
export const ShimmerBlock = ({ style, borderRadius = 8, tint = 'glass' }) => {
    const shimmerAnim = useRef(new Animated.Value(0.3)).current;

    useEffect(() => {
        const loop = Animated.loop(
            Animated.sequence([
                Animated.timing(shimmerAnim, {
                    toValue: 0.78,
                    duration: 820,
                    useNativeDriver: true,
                }),
                Animated.timing(shimmerAnim, {
                    toValue: 0.3,
                    duration: 820,
                    useNativeDriver: true,
                }),
            ])
        );
        loop.start();
        return () => loop.stop();
    }, [shimmerAnim]);

    const tintStyle = !isTV
        ? styles.shimmerMobileBase
        : tint === 'crimson'
          ? styles.shimmerCrimson
          : styles.shimmerBase;

    return (
        <Animated.View
            style={[
                tintStyle,
                { borderRadius, opacity: shimmerAnim },
                style,
            ]}
        />
    );
};

/**
 * Poster Card Skeleton
 */
export const CardSkeleton = ({ customWidth }) => {
    const cardWidth = customWidth || (isTV ? 136 : 126);
    const cardHeight = Math.round(cardWidth * 1.48);

    return (
        <View style={[styles.cardContainer, { width: cardWidth }]}>
            <ShimmerBlock
                style={{ width: cardWidth, height: cardHeight, borderRadius: 16 }}
            />
            <ShimmerBlock style={{ width: '82%', height: 12, marginTop: 8, borderRadius: 5 }} />
            <ShimmerBlock style={{ width: '48%', height: 10, marginTop: 5, borderRadius: 4 }} />
        </View>
    );
};

/**
 * Horizontal Row of Skeleton Cards
 */
export const RowSkeleton = ({ count = 5 }) => {
    return (
        <View style={[styles.rowSection, isTV && { paddingLeft: 96 }]}>
            <View style={styles.rowHeader}>
                <ShimmerBlock style={styles.rowAccent} borderRadius={2} tint="crimson" />
                <ShimmerBlock style={{ width: 150, height: 16, borderRadius: 5 }} />
            </View>
            <View style={styles.rowCards}>
                {Array.from({ length: count }).map((_, i) => (
                    <CardSkeleton key={`skeleton-card-${i}`} />
                ))}
            </View>
        </View>
    );
};

/**
 * Search Grid Skeleton (4 columns on TV, 3 columns on Mobile)
 */
export const SearchGridSkeleton = () => {
    const { width } = useWindowDimensions();
    const columns = isTV ? 4 : 3;
    const count = isTV ? 8 : 6;
    const cardWidth = isTV ? 122 : Math.floor((width - 48) / 3);

    return (
        <View style={[styles.searchGrid, { gap: isTV ? 14 : 10 }]}>
            {Array.from({ length: count }).map((_, i) => (
                <View key={`search-skel-${i}`} style={{ width: cardWidth, marginBottom: 14 }}>
                    <CardSkeleton customWidth={cardWidth} />
                </View>
            ))}
        </View>
    );
};

/**
 * Cinematic Hero Banner Skeleton (matches TVGlassHero on TV)
 */
export const HeroSkeleton = () => {
    const { width, height } = useWindowDimensions();

    if (isTV) {
        return (
            <View style={[styles.heroWrapper, { width, height }]}>
                <ShimmerBlock style={styles.heroBackdrop} borderRadius={0} />
                <LinearGradient
                    colors={['#08090C', 'rgba(8, 9, 12, 0.85)', 'rgba(8, 9, 12, 0.35)', 'transparent']}
                    style={StyleSheet.absoluteFillObject}
                    start={{ x: 0, y: 0.5 }}
                    end={{ x: 0.88, y: 0.5 }}
                />
                <LinearGradient
                    colors={['transparent', 'rgba(8, 9, 12, 0.6)', '#08090C']}
                    style={StyleSheet.absoluteFillObject}
                    start={{ x: 0.5, y: 0.58 }}
                    end={{ x: 0.5, y: 1 }}
                />

                {/* Top-right floating glass search pill skeleton */}
                <ShimmerBlock
                    style={{ position: 'absolute', top: 24, right: 36, width: 310, height: 44 }}
                    borderRadius={22}
                />

                {/* Left-aligned hero text & CTAs */}
                <View style={styles.tvHeroTextBlock}>
                    <View style={{ flexDirection: 'row', gap: 20, marginBottom: 12 }}>
                        <ShimmerBlock style={{ width: 64, height: 14 }} borderRadius={4} />
                        <ShimmerBlock style={{ width: 150, height: 14 }} borderRadius={4} />
                    </View>
                    <ShimmerBlock style={{ width: 380, height: 40, marginBottom: 8 }} borderRadius={8} />
                    <ShimmerBlock style={{ width: 280, height: 40, marginBottom: 10 }} borderRadius={8} />
                    <ShimmerBlock style={{ width: 220, height: 14, marginBottom: 20 }} borderRadius={5} />
                    <View style={{ flexDirection: 'row', gap: 14 }}>
                        <ShimmerBlock style={{ width: 142, height: 40 }} borderRadius={20} tint="crimson" />
                        <ShimmerBlock style={{ width: 104, height: 40 }} borderRadius={20} />
                    </View>
                </View>

                {/* Bottom-left 5 preview thumbnail skeletons */}
                <View style={styles.tvThumbSection}>
                    <View style={{ flexDirection: 'row', gap: 12 }}>
                        {Array.from({ length: 5 }).map((_, i) => (
                            <ShimmerBlock
                                key={`hero-skel-thumb-${i}`}
                                style={{ width: 82, height: 82 }}
                                borderRadius={12}
                                tint={i === 0 ? 'crimson' : 'glass'}
                            />
                        ))}
                    </View>
                    <ShimmerBlock style={{ width: 110, height: 3, marginTop: 10 }} borderRadius={2} />
                </View>

                {/* Bottom-right 3 circular quick action skeletons */}
                <View style={styles.tvQuickActions}>
                    <ShimmerBlock style={{ width: 44, height: 44 }} borderRadius={22} />
                    <ShimmerBlock style={{ width: 44, height: 44 }} borderRadius={22} />
                    <ShimmerBlock style={{ width: 44, height: 44 }} borderRadius={22} />
                </View>
            </View>
        );
    }

    const HERO_HEIGHT = Math.min(height * 0.58, 480);

    return (
        <View style={[styles.heroWrapper, { width, height: HERO_HEIGHT }]}>
            <ShimmerBlock style={styles.heroBackdrop} borderRadius={0} />
            <LinearGradient
                colors={['transparent', 'rgba(8, 9, 12, 0.5)', 'rgba(8, 9, 12, 0.85)', '#08090C']}
                style={styles.heroGradient}
                start={{ x: 0.5, y: 0.2 }}
                end={{ x: 0.5, y: 1 }}
            />
            <View style={styles.heroContent}>
                <View style={styles.heroBadgeRow}>
                    <ShimmerBlock style={{ width: 130, height: 22, borderRadius: 8 }} tint="crimson" />
                    <ShimmerBlock style={{ width: 75, height: 22, borderRadius: 8 }} />
                    <ShimmerBlock style={{ width: 45, height: 22, borderRadius: 6 }} />
                </View>
                <ShimmerBlock style={{ width: '70%', height: 32, borderRadius: 6, marginBottom: 8 }} />
                <ShimmerBlock style={{ width: '45%', height: 24, borderRadius: 6, marginBottom: 16 }} />
                <View style={styles.heroButtons}>
                    <ShimmerBlock style={{ width: 125, height: 42, borderRadius: 22 }} tint="crimson" />
                    <ShimmerBlock style={{ width: 105, height: 42, borderRadius: 22 }} />
                    <ShimmerBlock style={{ width: 42, height: 42, borderRadius: 21 }} />
                </View>
            </View>
        </View>
    );
};

/**
 * TopBar Skeleton Header (Mobile only)
 */
export const TopBarSkeleton = () => {
    if (isTV) return null;

    return (
        <View style={styles.topBarWrapper}>
            <View style={styles.topBarContent}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <ShimmerBlock style={{ width: 34, height: 34, borderRadius: 17 }} />
                    <ShimmerBlock style={{ width: 85, height: 18, borderRadius: 4 }} />
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <ShimmerBlock style={{ width: 95, height: 28, borderRadius: 14 }} tint="crimson" />
                    <ShimmerBlock style={{ width: 34, height: 34, borderRadius: 17 }} />
                </View>
            </View>
        </View>
    );
};

/**
 * Full Screen Skeleton for Home / Movies / TV Screens
 */
export const ScreenSkeleton = () => {
    return (
        <View style={styles.screenContainer}>
            <TopBarSkeleton />
            <HeroSkeleton />
            {!isTV && <RowSkeleton count={4} />}
            {!isTV && <RowSkeleton count={4} />}
        </View>
    );
};

/**
 * Detail Screen Skeleton
 */
export const DetailSkeleton = () => {
    const { height } = useWindowDimensions();

    return (
        <View style={styles.screenContainer}>
            <View
                style={{
                    width: '100%',
                    height: isTV ? height * 0.54 : Math.min(height * 0.52, 420),
                    position: 'relative',
                }}
            >
                <ShimmerBlock style={{ width: '100%', height: '100%' }} borderRadius={0} />
                <LinearGradient
                    colors={['transparent', 'rgba(8, 9, 12, 0.65)', '#08090C']}
                    style={StyleSheet.absoluteFillObject}
                />
                {isTV && (
                    <LinearGradient
                        colors={['#08090C', 'rgba(8, 9, 12, 0.75)', 'transparent']}
                        style={StyleSheet.absoluteFillObject}
                        start={{ x: 0, y: 0.5 }}
                        end={{ x: 0.85, y: 0.5 }}
                    />
                )}
            </View>

            <View style={{ paddingHorizontal: isTV ? 36 : 20, marginTop: -60 }}>
                <ShimmerBlock
                    style={{ width: isTV ? 420 : '80%', height: 32, borderRadius: 8, marginBottom: 12 }}
                />
                <View style={{ flexDirection: 'row', gap: 10, marginBottom: 18 }}>
                    <ShimmerBlock style={{ width: 64, height: 18, borderRadius: 5 }} />
                    <ShimmerBlock style={{ width: 48, height: 18, borderRadius: 5 }} />
                    <ShimmerBlock style={{ width: 76, height: 18, borderRadius: 5 }} />
                </View>
                <View style={{ flexDirection: 'row', gap: 12, marginBottom: 24 }}>
                    <ShimmerBlock
                        style={{ ...(isTV ? { width: 220 } : { flex: 1 }), height: 46, borderRadius: 23 }}
                        tint="crimson"
                    />
                    <ShimmerBlock style={{ width: isTV ? 160 : 48, height: 46, borderRadius: 23 }} />
                    {isTV && <ShimmerBlock style={{ width: 200, height: 46, borderRadius: 23 }} />}
                </View>
                <ShimmerBlock
                    style={{ width: isTV ? 640 : '100%', height: 14, borderRadius: 4, marginBottom: 6 }}
                />
                <ShimmerBlock
                    style={{ width: isTV ? 520 : '90%', height: 14, borderRadius: 4, marginBottom: 6 }}
                />
                <ShimmerBlock
                    style={{ width: isTV ? 340 : '60%', height: 14, borderRadius: 4, marginBottom: 24 }}
                />
            </View>

            <RowSkeleton count={isTV ? 5 : 4} />
        </View>
    );
};

const styles = StyleSheet.create({
    screenContainer: {
        flex: 1,
        backgroundColor: '#08090C',
    },
    shimmerMobileBase: {
        backgroundColor: '#161A24',
    },
    shimmerBase: {
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.14)',
    },
    shimmerCrimson: {
        backgroundColor: 'rgba(255, 36, 66, 0.22)',
        borderWidth: 1,
        borderColor: 'rgba(255, 36, 66, 0.45)',
    },
    topBarWrapper: {
        paddingTop: Platform.OS === 'ios' ? 48 : 36,
        paddingHorizontal: 20,
        paddingBottom: 10,
        backgroundColor: 'transparent',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 10,
    },
    topBarContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'rgba(15, 18, 23, 0.7)',
        borderRadius: 22,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.08)',
    },
    heroWrapper: {
        position: 'relative',
        overflow: 'hidden',
    },
    heroBackdrop: {
        width: '100%',
        height: '100%',
    },
    heroGradient: {
        ...StyleSheet.absoluteFillObject,
    },
    heroContent: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    heroBadgeRow: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 12,
    },
    heroButtons: {
        flexDirection: 'row',
        gap: 10,
    },
    tvHeroTextBlock: {
        position: 'absolute',
        left: 96,
        top: 104,
    },
    tvThumbSection: {
        position: 'absolute',
        left: 96,
        bottom: 26,
    },
    tvQuickActions: {
        position: 'absolute',
        right: 36,
        bottom: 30,
        flexDirection: 'row',
        gap: 12,
    },
    rowSection: {
        marginTop: 20,
        paddingLeft: 20,
    },
    rowHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        gap: 10,
    },
    rowAccent: {
        width: 3.5,
        height: 18,
    },
    rowCards: {
        flexDirection: 'row',
        gap: 12,
        overflow: 'hidden',
    },
    cardContainer: {
        marginRight: 2,
    },
    searchGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingTop: 6,
    },
});
