import React, { useState } from 'react';
import { StyleSheet, View, Image, Pressable, Dimensions } from 'react-native';
import { Text } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useAppTheme } from '../theme/ThemeContext';
import { isTV } from '../utils/device';

const { width } = Dimensions.get('window');

export const MovieCard = ({ item, isGrid, rank, showMatch = false }) => {
    const { theme } = useAppTheme();
    const navigation = useNavigation();
    const [isFocused, setIsFocused] = useState(false);

    if (!item) return null;

    const availableWidth = isTV ? width - 100 : width;
    const mobileWidth = isGrid ? (width - 48) / 3 : 138;
    const tvWidth = isGrid ? (availableWidth - 120) / 5 : 210;
    const cardWidth = isTV ? tvWidth : mobileWidth;

    const ratingVal = parseFloat(item.rating || item.vote_average);
    const hasRating = !isNaN(ratingVal) && ratingVal > 0;

    const displayTitle = item.title || item.name || '';
    const mediaType = item.media_type || (item.first_air_date ? 'tv' : 'movie');

    // Synthetic match score based on rating / id for realism
    const matchScore = item.match || `${Math.min(99, Math.max(85, Math.round((ratingVal || 7.5) * 10 + 12)))}% Match`;

    return (
        <Pressable
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            enablesNextFocusAppearance={true}
            onPress={() =>
                navigation.navigate('MovieDetail', { id: item.id, type: mediaType })
            }
            style={({ pressed }) => [
                styles.card,
                {
                    width: rank ? cardWidth + 34 : cardWidth,
                    marginRight: isGrid ? (isTV ? 20 : 8) : 12,
                    transform: [{ scale: isFocused ? 1.06 : 1.0 }],
                    zIndex: isFocused ? 10 : 1,
                },
                pressed && !isTV && { opacity: 0.8 },
            ]}
        >
            <View style={styles.cardContentRow}>
                {/* Ranking Numeral for Top 10 Carousels */}
                {Boolean(rank) && (
                    <View style={styles.rankContainer}>
                        <Text style={styles.rankText}>{rank}</Text>
                    </View>
                )}

                <View style={{ width: cardWidth }}>
                    <View
                        style={[
                            styles.imageContainer,
                            {
                                height: cardWidth * 1.48,
                                backgroundColor: '#12161F',
                                borderColor: isFocused ? '#FF2442' : 'rgba(255, 255, 255, 0.08)',
                            },
                            isFocused && styles.focusedGlow,
                        ]}
                    >
                        <Image
                            source={{
                                uri:
                                    item.image ||
                                    item.poster ||
                                    (item.poster_path
                                        ? `https://image.tmdb.org/t/p/w500${item.poster_path}`
                                        : 'https://via.placeholder.com/300x450'),
                            }}
                            style={styles.image}
                            resizeMethod="resize"
                        />

                        {/* Bottom Dark Fade */}
                        <LinearGradient
                            colors={['transparent', 'rgba(8, 9, 12, 0.9)']}
                            style={styles.cardGradient}
                        />

                        {/* Top-Left Rating Pill */}
                        {hasRating && (
                            <View style={styles.ratingPill}>
                                <Text style={styles.ratingText}>
                                    ★ {ratingVal.toFixed(1)}
                                </Text>
                            </View>
                        )}

                        {/* Bottom-Right Quality Tag */}
                        <View style={styles.qualityTag}>
                            <Text style={styles.qualityText}>
                                {mediaType === 'tv' ? 'SERIES' : '4K HDR'}
                            </Text>
                        </View>
                    </View>

                    {/* Movie Title */}
                    <Text
                        numberOfLines={1}
                        ellipsizeMode="tail"
                        style={[
                            styles.title,
                            {
                                color: isFocused ? '#FF2442' : '#FFFFFF',
                                fontSize: isTV ? 15 : 12.5,
                            },
                        ]}
                    >
                        {displayTitle}
                    </Text>

                    {/* Match Score or Year */}
                    <View style={styles.metaRow}>
                        {showMatch ? (
                            <Text style={styles.matchText}>{matchScore}</Text>
                        ) : (
                            <Text style={styles.yearText}>
                                {item.year || (item.release_date || item.first_air_date || '').split('-')[0] || ''}
                            </Text>
                        )}
                    </View>
                </View>
            </View>
        </Pressable>
    );
};

const styles = StyleSheet.create({
    card: {
        marginBottom: isTV ? 28 : 12,
    },
    cardContentRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    rankContainer: {
        width: 34,
        alignItems: 'center',
        justifyContent: 'center',
    },
    rankText: {
        fontSize: 48,
        fontWeight: '900',
        color: '#FF2442',
        opacity: 0.85,
        letterSpacing: -2,
    },
    imageContainer: {
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1,
        position: 'relative',
    },
    focusedGlow: {
        borderColor: '#FF2442',
        shadowColor: '#FF2442',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.5,
        shadowRadius: 10,
        elevation: 8,
    },
    image: {
        width: '100%',
        height: '100%',
    },
    cardGradient: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 60,
    },
    ratingPill: {
        position: 'absolute',
        top: 8,
        left: 8,
        backgroundColor: 'rgba(15, 18, 23, 0.82)',
        paddingHorizontal: 6,
        paddingVertical: 3,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    ratingText: {
        color: '#FFC107',
        fontSize: 10,
        fontWeight: '800',
    },
    qualityTag: {
        position: 'absolute',
        bottom: 8,
        right: 8,
        backgroundColor: 'rgba(255, 36, 66, 0.2)',
        borderWidth: 1,
        borderColor: 'rgba(255, 36, 66, 0.4)',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 6,
    },
    qualityText: {
        color: '#FF2442',
        fontSize: 9,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    title: {
        fontWeight: '700',
        marginTop: 7,
        letterSpacing: 0.2,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 2,
    },
    yearText: {
        color: '#98A2B3',
        fontSize: 11,
    },
    matchText: {
        color: '#FF2442',
        fontSize: 11,
        fontWeight: '700',
    },
});
