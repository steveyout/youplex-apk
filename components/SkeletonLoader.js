import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Animated, Dimensions, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { isTV } from '../utils/device';

const { width, height } = Dimensions.get('window');

/**
 * Shimmering animated base element
 */
export const ShimmerBlock = ({ style, borderRadius = 8 }) => {
    const shimmerAnim = useRef(new Animated.Value(0.25)).current;

    useEffect(() => {
        const loop = Animated.loop(
            Animated.sequence([
                Animated.timing(shimmerAnim, {
                    toValue: 0.65,
                    duration: 850,
                    useNativeDriver: true,
                }),
                Animated.timing(shimmerAnim, {
                    toValue: 0.25,
                    duration: 850,
                    useNativeDriver: true,
                }),
            ])
        );
        loop.start();
        return () => loop.stop();
    }, [shimmerAnim]);

    return (
        <Animated.View
            style={[
                styles.shimmerBase,
                { borderRadius, opacity: shimmerAnim },
                style,
            ]}
        />
    );
};

/**
 * Poster Card Skeleton
 */
export const CardSkeleton = () => {
    const cardWidth = isTV ? 160 : 126;
    const cardHeight = isTV ? 230 : 182;

    return (
        <View style={[styles.cardContainer, { width: cardWidth }]}>
            <ShimmerBlock style={{ width: cardWidth, height: cardHeight, borderRadius: 14 }} />
            <ShimmerBlock style={{ width: '80%', height: 13, marginTop: 8, borderRadius: 4 }} />
            <ShimmerBlock style={{ width: '45%', height: 10, marginTop: 5, borderRadius: 3 }} />
        </View>
    );
};

/**
 * Horizontal Row of Skeleton Cards
 */
export const RowSkeleton = ({ count = 5 }) => {
    return (
        <View style={styles.rowSection}>
            <View style={styles.rowHeader}>
                <ShimmerBlock style={styles.rowAccent} borderRadius={2} />
                <ShimmerBlock style={{ width: 140, height: 16, borderRadius: 4 }} />
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
 * Cinematic Hero Banner Skeleton
 */
export const HeroSkeleton = () => {
    const TV_LEFT_OFFSET = 100;
    const CONTENT_WIDTH = isTV ? width - TV_LEFT_OFFSET : width;
    const HERO_HEIGHT = isTV ? height * 0.72 : Math.min(height * 0.58, 480);

    return (
        <View style={[styles.heroWrapper, { width: CONTENT_WIDTH, height: HERO_HEIGHT }]}>
            {/* Shimmer backdrop */}
            <ShimmerBlock style={styles.heroBackdrop} borderRadius={0} />

            {/* Dark fade gradient */}
            <LinearGradient
                colors={['transparent', 'rgba(8, 9, 12, 0.5)', 'rgba(8, 9, 12, 0.85)', '#08090C']}
                style={styles.heroGradient}
                start={{ x: 0.5, y: 0.2 }}
                end={{ x: 0.5, y: 1 }}
            />

            {/* Content overlay */}
            <View style={[styles.heroContent, isTV && { paddingLeft: 36, paddingBottom: 32 }]}>
                <View style={styles.heroBadgeRow}>
                    <ShimmerBlock style={{ width: 130, height: 22, borderRadius: 8 }} />
                    <ShimmerBlock style={{ width: 75, height: 22, borderRadius: 8 }} />
                    <ShimmerBlock style={{ width: 45, height: 22, borderRadius: 6 }} />
                </View>

                {/* Title skeleton */}
                <ShimmerBlock style={{ width: '70%', height: 32, borderRadius: 6, marginBottom: 8 }} />
                <ShimmerBlock style={{ width: '45%', height: 24, borderRadius: 6, marginBottom: 16 }} />

                {/* Buttons skeleton */}
                <View style={styles.heroButtons}>
                    <ShimmerBlock style={{ width: 125, height: 42, borderRadius: 22 }} />
                    <ShimmerBlock style={{ width: 105, height: 42, borderRadius: 22 }} />
                    <ShimmerBlock style={{ width: 42, height: 42, borderRadius: 21 }} />
                </View>
            </View>
        </View>
    );
};

/**
 * TopBar Skeleton Header
 */
export const TopBarSkeleton = () => {
    return (
        <View style={styles.topBarWrapper}>
            <View style={styles.topBarContent}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <ShimmerBlock style={{ width: 34, height: 34, borderRadius: 17 }} />
                    <ShimmerBlock style={{ width: 85, height: 18, borderRadius: 4 }} />
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <ShimmerBlock style={{ width: 95, height: 28, borderRadius: 14 }} />
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
            <RowSkeleton count={4} />
            <RowSkeleton count={4} />
        </View>
    );
};

/**
 * Detail Screen Skeleton
 */
export const DetailSkeleton = () => {
    return (
        <View style={styles.screenContainer}>
            {/* Backdrop */}
            <View style={{ width: '100%', height: Math.min(height * 0.52, 420), position: 'relative' }}>
                <ShimmerBlock style={{ width: '100%', height: '100%' }} borderRadius={0} />
                <LinearGradient
                    colors={['transparent', 'rgba(8, 9, 12, 0.6)', '#08090C']}
                    style={StyleSheet.absoluteFillObject}
                />
            </View>

            {/* Info details */}
            <View style={{ paddingHorizontal: 20, marginTop: -60 }}>
                <ShimmerBlock style={{ width: '80%', height: 30, borderRadius: 6, marginBottom: 12 }} />
                <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
                    <ShimmerBlock style={{ width: 60, height: 18, borderRadius: 4 }} />
                    <ShimmerBlock style={{ width: 45, height: 18, borderRadius: 4 }} />
                    <ShimmerBlock style={{ width: 70, height: 18, borderRadius: 4 }} />
                </View>
                <View style={{ flexDirection: 'row', gap: 12, marginBottom: 24 }}>
                    <ShimmerBlock style={{ flex: 1, height: 48, borderRadius: 24 }} />
                    <ShimmerBlock style={{ width: 48, height: 48, borderRadius: 24 }} />
                </View>
                <ShimmerBlock style={{ width: '100%', height: 14, borderRadius: 4, marginBottom: 6 }} />
                <ShimmerBlock style={{ width: '90%', height: 14, borderRadius: 4, marginBottom: 6 }} />
                <ShimmerBlock style={{ width: '60%', height: 14, borderRadius: 4, marginBottom: 24 }} />
            </View>

            {/* Episodes or Recommendations */}
            <RowSkeleton count={4} />
        </View>
    );
};

const styles = StyleSheet.create({
    screenContainer: {
        flex: 1,
        backgroundColor: '#08090C',
    },
    shimmerBase: {
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
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
        borderColor: 'rgba(255, 255, 255, 0.05)',
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
        backgroundColor: '#FF2442',
    },
    rowCards: {
        flexDirection: 'row',
        gap: 12,
        overflow: 'hidden',
    },
    cardContainer: {
        marginRight: 2,
    },
});
