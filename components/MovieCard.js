import React from 'react';
import { StyleSheet, View, Image, TouchableOpacity, Dimensions } from 'react-native';
import { Text, ProgressBar } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { useAppTheme } from '../theme/ThemeContext';

const { width } = Dimensions.get('window');

export const MovieCard = ({ item, isContinue, isGrid }) => {
    const { theme } = useAppTheme();
    const navigation = useNavigation();

    const cardWidth = isGrid ? (width - 60) / 3 : 140;

    return (
        <TouchableOpacity
            activeOpacity={0.8}
            // Pass the media_type (defaulting to movie if not provided)
            onPress={() => navigation.navigate('MovieDetail', {
                id: item.id,
                type: item.media_type || 'movie'
            })}
            style={[styles.card, { width: cardWidth, marginRight: isGrid ? 0 : 15 }]}
        >
            <View style={[styles.imageContainer, { height: cardWidth * 1.5 }]}>
                <Image source={{ uri: item.image }} style={styles.image} />
                {item.rating && (
                    <View style={styles.ratingBadge}>
                        <Text style={styles.ratingText}>⭐ {item.rating}</Text>
                    </View>
                )}
            </View>
            <Text numberOfLines={1} style={[styles.title, { color: theme.colors.onBackground }]}>
                {item.title}
            </Text>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    card: { marginBottom: 5 },
    imageContainer: { borderRadius: 12, overflow: 'hidden', backgroundColor: '#333' },
    image: { width: '100%', height: '100%', resizeMode: 'cover' },
    title: { fontSize: 11, fontWeight: '700', marginTop: 6 },
    ratingBadge: { position: 'absolute', top: 5, right: 5, backgroundColor: 'rgba(0,0,0,0.7)', paddingHorizontal: 4, paddingVertical: 2, borderRadius: 4 },
    ratingText: { color: 'white', fontSize: 9, fontWeight: 'bold' },
});