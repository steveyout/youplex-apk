import React, { useState } from 'react';
import { StyleSheet, View, Image, Pressable, Dimensions } from 'react-native';
import { Text } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useAppTheme } from '../theme/ThemeContext';
import { isTV } from '../utils/device';

const { width } = Dimensions.get('window');

export const MovieCard = ({ item, isGrid }) => {
    const { theme, isDarkMode } = useAppTheme();
    const navigation = useNavigation();
    const [isFocused, setIsFocused] = useState(false);

    if (!item) return null;

    const availableWidth = isTV ? width - 100 : width;
    const mobileWidth = isGrid ? (width - 56) / 3 : 138;
    const tvWidth = isGrid ? (availableWidth - 120) / 5 : 210;
    const cardWidth = isTV ? tvWidth : mobileWidth;

    const ratingVal = parseFloat(item.rating || item.vote_average);
    const hasRating = !isNaN(ratingVal) && ratingVal > 0;
    const isHighRating = ratingVal >= 7.0;

    const displayTitle = item.title || item.name || '';
    const mediaType = item.media_type || (item.first_air_date ? 'tv' : 'movie');

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
                    width: cardWidth,
                    marginRight: isGrid ? (isTV ? 20 : 8) : 14,
                    transform: [{ scale: isFocused ? 1.08 : 1.0 }],
                    zIndex: isFocused ? 10 : 1,
                },
                pressed && !isTV && { opacity: 0.75 },
            ]}
        >
            <View
                style={[
                    styles.imageContainer,
                    {
                        height: cardWidth * 1.48,
                        backgroundColor: theme.colors.cardBg,
                        borderColor: isFocused ? '#FF3030' : theme.colors.cardBorder,
                    },
                    isFocused && styles.tvFocusBorder,
                ]}
            >
                <Image
                    source={{
                        uri: item.image || item.poster || (item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : 'https://via.placeholder.com/300x450'),
                    }}
                    style={styles.image}
                    resizeMethod="resize"
                />

                {/* Bottom dark gradient for depth */}
                <LinearGradient
                    colors={['transparent', 'rgba(5, 5, 5, 0.85)']}
                    style={styles.cardGradient}
                />

                {/* Rating Badge at Top-Left */}
                {hasRating && (
                    <View
                        style={[
                            styles.ratingPill,
                            isHighRating ? styles.ratingHigh : styles.ratingMed,
                            cardWidth < 130 && styles.ratingPillCompact,
                        ]}
                    >
                        <Text style={[styles.ratingText, cardWidth < 130 && { fontSize: 9 }]}>
                            ★ {ratingVal.toFixed(1)}
                        </Text>
                    </View>
                )}

                {/* Quality / Type Tag at Bottom-Right to PREVENT OVERLAPPING */}
                <View style={[styles.qualityTag, cardWidth < 130 && styles.qualityTagCompact]}>
                    <Text style={[styles.qualityText, cardWidth < 130 && { fontSize: 8.5 }]}>
                        {mediaType === 'tv' ? 'SERIES' : 'HD'}
                    </Text>
                </View>
            </View>

            <Text
                numberOfLines={1}
                ellipsizeMode="tail"
                style={[
                    styles.title,
                    {
                        color: isFocused ? '#FF3030' : (isDarkMode ? '#FFFFFF' : '#111827'),
                        fontSize: isTV ? 16 : 12,
                        maxWidth: cardWidth,
                        textAlign: isTV ? 'left' : 'center',
                    },
                ]}
            >
                {displayTitle}
            </Text>
        </Pressable>
    );
};

const styles = StyleSheet.create({
    card: {
        marginBottom: isTV ? 30 : 12,
    },
    imageContainer: {
        borderRadius: 14,
        overflow: 'hidden',
        borderWidth: 1.2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 6,
        position: 'relative',
    },
    image: {
        width: '100%',
        height: '100%',
        borderRadius: 13,
    },
    cardGradient: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '55%',
    },
    ratingPill: {
        position: 'absolute',
        top: 6,
        left: 6,
        paddingHorizontal: 6,
        paddingVertical: 2.5,
        borderRadius: 6,
        elevation: 4,
        zIndex: 5,
    },
    ratingPillCompact: {
        paddingHorizontal: 4,
        paddingVertical: 1.5,
        borderRadius: 4,
        top: 4,
        left: 4,
    },
    ratingHigh: {
        backgroundColor: '#10B981',
    },
    ratingMed: {
        backgroundColor: '#F59E0B',
    },
    ratingText: {
        color: '#FFFFFF',
        fontSize: 10,
        fontWeight: '900',
    },
    // Positioned at Bottom-Right so it NEVER collides with Top-Left rating badge!
    qualityTag: {
        position: 'absolute',
        bottom: 6,
        right: 6,
        backgroundColor: 'rgba(0, 0, 0, 0.72)',
        paddingHorizontal: 5,
        paddingVertical: 2,
        borderRadius: 5,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.25)',
        zIndex: 5,
    },
    qualityTagCompact: {
        bottom: 4,
        right: 4,
        paddingHorizontal: 4,
        paddingVertical: 1,
        borderRadius: 4,
    },
    qualityText: {
        color: '#FFFFFF',
        fontSize: 9,
        fontWeight: '800',
        letterSpacing: 0.4,
    },
    title: {
        marginTop: 6,
        fontWeight: '700',
        paddingHorizontal: 2,
    },
    tvFocusBorder: {
        borderWidth: 3.5,
        borderColor: '#FF3030',
        shadowColor: '#FF3030',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 18,
        elevation: 12,
    },
});
