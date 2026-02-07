import React, { useState } from 'react';
import { StyleSheet, View, Image, Pressable, Dimensions, Platform } from 'react-native';
import { Text } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { useAppTheme } from '../theme/ThemeContext';
import { isTV } from '../utils/device';

const { width } = Dimensions.get('window');

export const MovieCard = ({ item, isGrid }) => {
    const { theme } = useAppTheme();
    const navigation = useNavigation();
    const [isFocused, setIsFocused] = useState(false);

    // Adaptive width: We account for the 100px SideMenu on TV
    const availableWidth = isTV ? width - 100 : width;
    const mobileWidth = isGrid ? (width - 60) / 3 : 140;
    const tvWidth = isGrid ? (availableWidth - 120) / 5 : 200;
    const cardWidth = isTV ? tvWidth : mobileWidth;

    return (
        <Pressable
            // TV Navigation logic
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            enablesNextFocusAppearance={true} // Allows focus to exit the list for SideMenu

            onPress={() => navigation.navigate('MovieDetail', {
                id: item.id,
                type: item.media_type || 'movie'
            })}

            style={({ pressed }) => [
                styles.card,
                {
                    width: cardWidth,
                    marginRight: isGrid ? (isTV ? 20 : 10) : 20,
                    // Lift the card on focus
                    transform: [{ scale: isFocused ? 1.1 : 1.0 }],
                    zIndex: isFocused ? 10 : 1,
                },
                pressed && !isTV && { opacity: 0.7 }
            ]}
        >
            <View style={[
                styles.imageContainer,
                { height: cardWidth * 1.5, backgroundColor: theme.colors.surfaceVariant },
                isFocused && styles.tvFocusBorder
            ]}>
                <Image
                    source={{ uri: item.image }}
                    style={styles.image}
                    resizeMethod="resize"
                />

                {item.rating && (
                    <View style={styles.ratingBadge}>
                        <Text style={styles.ratingText}>⭐ {item.rating}</Text>
                    </View>
                )}
            </View>

            <Text
                numberOfLines={1}
                style={[
                    styles.title,
                    {
                        color: theme.colors.onBackground,
                        fontSize: isTV ? 16 : 11,
                        opacity: isFocused ? 1 : 0.8,
                        textAlign: isTV ? 'left' : 'center'
                    }
                ]}
            >
                {item.title}
            </Text>
        </Pressable>
    );
};

const styles = StyleSheet.create({
    card: {
        marginBottom: isTV ? 30 : 10,
    },
    imageContainer: {
        borderRadius: isTV ? 8 : 12,
        overflow: 'hidden',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
    },
    tvFocusBorder: {
        borderWidth: 4,
        borderColor: '#E91E63',
        // Glow effect for TV
        shadowColor: "#E91E63",
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 15,
    },
    image: { width: '100%', height: '100%', resizeMode: 'cover' },
    title: { fontWeight: '700', marginTop: 10 },
    ratingBadge: {
        position: 'absolute',
        top: 8,
        right: 8,
        backgroundColor: 'rgba(0,0,0,0.8)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6
    },
    ratingText: { color: 'white', fontSize: isTV ? 12 : 9, fontWeight: 'bold' },
});