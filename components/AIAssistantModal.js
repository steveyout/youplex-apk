import React, { useState } from 'react';
import {
    StyleSheet,
    View,
    Modal,
    TextInput,
    Pressable,
    ScrollView,
    ActivityIndicator,
    Image,
    Dimensions,
} from 'react-native';
import { Text } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { Sparkles, X, Send, Play, Film, Flame } from 'lucide-react-native';
import { searchMulti, getTrendingMovies, IMAGE_PATH } from '../services/api';
import { useNavigation } from '@react-navigation/native';

const { width, height } = Dimensions.get('window');

const AI_PRESET_PROMPTS = [
    { id: 'scifi', label: '🚀 Mind-Bending Sci-Fi', query: 'interstellar inception sci-fi matrix' },
    { id: 'adrenaline', label: '💥 High Octane Action', query: 'john wick mission impossible mad max' },
    { id: 'noir', label: '🕵️ Dark Detective Noir', query: 'se7en zodiac prisoners detective' },
    { id: 'cyberpunk', label: '⚡ Cyberpunk Dystopia', query: 'blade runner cyberpunk upgrade tron' },
    { id: 'thriller', label: '🧠 Psychological Thriller', query: 'shutter island gone girl fight club' },
    { id: 'comedy', label: '🍿 Feel-Good Blockbuster', query: 'avengers spider-man deadpool comedy' },
    { id: 'horror', label: '🎃 Spine-Chilling Horror', query: 'conjuring insidious hereditary quiet place' },
];

export const AIAssistantModal = ({ visible, onClose }) => {
    const navigation = useNavigation();
    const [promptText, setPromptText] = useState('');
    const [selectedPreset, setSelectedPreset] = useState(null);
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState([]);
    const [assistantResponse, setAssistantResponse] = useState(
        "Hello! I am your AI Movie Concierge. Pick a vibe below or describe the exact plot, mood, or characters you're craving tonight."
    );

    const executeAiSearch = async (queryToSearch, label = '') => {
        if (!queryToSearch || !queryToSearch.trim()) return;
        setLoading(true);
        if (label) {
            setAssistantResponse(`Curating high-match movies tailored for "${label}"...`);
        } else {
            setAssistantResponse(`Analyzing your request: "${queryToSearch}"...`);
        }

        try {
            // First search with query
            const data = await searchMulti(queryToSearch.trim());
            let list = (data?.results || [])
                .filter((m) => m.poster_path && (m.media_type === 'movie' || m.media_type === 'tv'))
                .slice(0, 10);

            // Fallback to trending if specific keywords yield low count
            if (list.length < 3) {
                const trending = await getTrendingMovies();
                list = [...list, ...(trending || []).slice(0, 8 - list.length)];
            }

            const formatted = list.map((item, index) => {
                const matchPct = Math.max(86, 99 - index * 2);
                return {
                    id: item.id,
                    title: item.title || item.name,
                    image: `${IMAGE_PATH}${item.poster_path}`,
                    rating: item.vote_average ? item.vote_average.toFixed(1) : '8.4',
                    year: (item.release_date || item.first_air_date || '').split('-')[0] || '2024',
                    match: `${matchPct}% Match`,
                    media_type: item.media_type || 'movie',
                    overview: item.overview || '',
                };
            });

            setResults(formatted);
            setAssistantResponse(
                `Found ${formatted.length} titles perfectly matching your vibe. Here are the top AI recommendations:`
            );
        } catch (error) {
            console.warn('AI search error:', error);
            setAssistantResponse("I couldn't fetch recommendations right now. Please try another prompt!");
        } finally {
            setLoading(false);
        }
    };

    const handleSelectPreset = (preset) => {
        setSelectedPreset(preset.id);
        setPromptText(preset.label);
        executeAiSearch(preset.query, preset.label);
    };

    const handleSubmitPrompt = () => {
        if (!promptText.trim()) return;
        executeAiSearch(promptText);
    };

    const handleSelectMovie = (movie) => {
        onClose();
        navigation.navigate('MovieDetail', { id: movie.id, type: movie.media_type });
    };

    return (
        <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
            <View style={styles.overlay}>
                <View style={styles.modalContainer}>
                    {/* Glowing Top Crimson Accent */}
                    <LinearGradient
                        colors={['#FF2442', '#D0092B', 'transparent']}
                        style={styles.topAccentBar}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                    />

                    {/* Header */}
                    <View style={styles.header}>
                        <View style={styles.headerTitleRow}>
                            <View style={styles.sparkleCircle}>
                                <Sparkles color="#FF2442" size={20} />
                            </View>
                            <View>
                                <Text style={styles.headerTitle}>AI Movie Assistant</Text>
                                <Text style={styles.headerSubtitle}>Powered by Semantic Recommendation Engine</Text>
                            </View>
                        </View>
                        <Pressable onPress={onClose} style={styles.closeBtn}>
                            <X color="#98A2B3" size={20} />
                        </Pressable>
                    </View>

                    {/* AI Message Bubble */}
                    <View style={styles.aiBubbleContainer}>
                        <LinearGradient
                            colors={['rgba(255, 36, 66, 0.12)', 'rgba(21, 25, 33, 0.9)']}
                            style={styles.aiBubble}
                        >
                            <Text style={styles.aiBubbleText}>{assistantResponse}</Text>
                        </LinearGradient>
                    </View>

                    {/* Preset Mood Chips */}
                    <View style={styles.presetsSection}>
                        <Text style={styles.presetsTitle}>Instant Mood Discovery</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.presetsRow}>
                            {AI_PRESET_PROMPTS.map((preset) => {
                                const isSelected = selectedPreset === preset.id;
                                return (
                                    <Pressable
                                        key={preset.id}
                                        onPress={() => handleSelectPreset(preset)}
                                        style={[
                                            styles.presetChip,
                                            isSelected && styles.presetChipActive,
                                        ]}
                                    >
                                        <Text
                                            style={[
                                                styles.presetChipText,
                                                isSelected && styles.presetChipTextActive,
                                            ]}
                                        >
                                            {preset.label}
                                        </Text>
                                    </Pressable>
                                );
                            })}
                        </ScrollView>
                    </View>

                    {/* AI Input Field */}
                    <View style={styles.inputWrapper}>
                        <TextInput
                            style={styles.input}
                            placeholder="Type any plot, mood, or movie title..."
                            placeholderTextColor="#667085"
                            value={promptText}
                            onChangeText={setPromptText}
                            onSubmitEditing={handleSubmitPrompt}
                            returnKeyType="search"
                        />
                        <Pressable onPress={handleSubmitPrompt} style={styles.sendBtn}>
                            <LinearGradient
                                colors={['#FF3B56', '#FF1E3C', '#B3001E']}
                                style={styles.sendBtnGradient}
                            >
                                <Send color="#FFFFFF" size={16} />
                            </LinearGradient>
                        </Pressable>
                    </View>

                    {/* Results or Loading */}
                    <View style={styles.resultsContainer}>
                        {loading ? (
                            <View style={styles.loadingBox}>
                                <ActivityIndicator size="large" color="#FF2442" />
                                <Text style={styles.loadingText}>AI is scanning deep metadata & vibes...</Text>
                            </View>
                        ) : (
                            <ScrollView
                                showsVerticalScrollIndicator={false}
                                contentContainerStyle={styles.resultsScroll}
                            >
                                {results.map((item) => (
                                    <Pressable
                                        key={item.id}
                                        style={styles.movieRowCard}
                                        onPress={() => handleSelectMovie(item)}
                                    >
                                        <Image source={{ uri: item.image }} style={styles.movieRowImage} />
                                        <View style={styles.movieRowInfo}>
                                            <View style={styles.movieRowTop}>
                                                <Text style={styles.movieRowTitle} numberOfLines={1}>
                                                    {item.title}
                                                </Text>
                                                <View style={styles.matchBadge}>
                                                    <Flame color="#FF2442" size={12} />
                                                    <Text style={styles.matchText}>{item.match}</Text>
                                                </View>
                                            </View>
                                            <Text style={styles.movieRowMeta}>
                                                ★ {item.rating} • {item.year} • {item.media_type.toUpperCase()}
                                            </Text>
                                            <Text style={styles.movieRowOverview} numberOfLines={2}>
                                                {item.overview || 'No synopsis available.'}
                                            </Text>
                                        </View>
                                        <View style={styles.movieRowAction}>
                                            <View style={styles.playMiniCircle}>
                                                <Play color="#FFFFFF" size={12} fill="#FFFFFF" />
                                            </View>
                                        </View>
                                    </Pressable>
                                ))}
                            </ScrollView>
                        )}
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        justifyContent: 'flex-end',
    },
    modalContainer: {
        height: height * 0.82,
        backgroundColor: '#0F1217',
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.08)',
        paddingBottom: 24,
    },
    topAccentBar: {
        height: 3,
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        width: '100%',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 18,
        paddingBottom: 14,
    },
    headerTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    sparkleCircle: {
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: 'rgba(255, 36, 66, 0.12)',
        borderWidth: 1,
        borderColor: 'rgba(255, 36, 66, 0.28)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#FFFFFF',
    },
    headerSubtitle: {
        fontSize: 11,
        color: '#98A2B3',
        marginTop: 2,
    },
    closeBtn: {
        width: 34,
        height: 34,
        borderRadius: 17,
        backgroundColor: 'rgba(255, 255, 255, 0.06)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    aiBubbleContainer: {
        paddingHorizontal: 20,
        marginBottom: 14,
    },
    aiBubble: {
        borderRadius: 16,
        padding: 14,
        borderWidth: 1,
        borderColor: 'rgba(255, 36, 66, 0.2)',
    },
    aiBubbleText: {
        color: '#EAECF0',
        fontSize: 13,
        lineHeight: 19,
    },
    presetsSection: {
        marginBottom: 14,
    },
    presetsTitle: {
        fontSize: 12,
        fontWeight: '700',
        color: '#98A2B3',
        paddingHorizontal: 20,
        marginBottom: 8,
        textTransform: 'uppercase',
        letterSpacing: 0.6,
    },
    presetsRow: {
        paddingHorizontal: 20,
        gap: 8,
    },
    presetChip: {
        paddingHorizontal: 14,
        paddingVertical: 7,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.08)',
    },
    presetChipActive: {
        backgroundColor: 'rgba(255, 36, 66, 0.18)',
        borderColor: '#FF2442',
    },
    presetChipText: {
        color: '#D0D5DD',
        fontSize: 12,
        fontWeight: '600',
    },
    presetChipTextActive: {
        color: '#FF2442',
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 20,
        marginBottom: 16,
        backgroundColor: '#151921',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        paddingLeft: 14,
        paddingRight: 6,
        paddingVertical: 6,
    },
    input: {
        flex: 1,
        color: '#FFFFFF',
        fontSize: 14,
        paddingVertical: 6,
    },
    sendBtn: {
        borderRadius: 12,
        overflow: 'hidden',
    },
    sendBtnGradient: {
        width: 36,
        height: 36,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 12,
    },
    resultsContainer: {
        flex: 1,
        paddingHorizontal: 20,
    },
    loadingBox: {
        paddingVertical: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        color: '#98A2B3',
        fontSize: 13,
        marginTop: 12,
    },
    resultsScroll: {
        paddingBottom: 20,
        gap: 12,
    },
    movieRowCard: {
        flexDirection: 'row',
        backgroundColor: '#151921',
        borderRadius: 16,
        padding: 10,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.06)',
    },
    movieRowImage: {
        width: 54,
        height: 76,
        borderRadius: 10,
        backgroundColor: '#202632',
    },
    movieRowInfo: {
        flex: 1,
        marginLeft: 12,
        marginRight: 8,
    },
    movieRowTop: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    movieRowTitle: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '700',
        flex: 1,
        marginRight: 6,
    },
    matchBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 36, 66, 0.15)',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 6,
        gap: 3,
    },
    matchText: {
        color: '#FF2442',
        fontSize: 10,
        fontWeight: '800',
    },
    movieRowMeta: {
        color: '#98A2B3',
        fontSize: 11,
        marginTop: 3,
    },
    movieRowOverview: {
        color: '#667085',
        fontSize: 11,
        marginTop: 3,
        lineHeight: 15,
    },
    movieRowAction: {
        paddingLeft: 4,
    },
    playMiniCircle: {
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: '#FF2442',
        justifyContent: 'center',
        alignItems: 'center',
    },
});
