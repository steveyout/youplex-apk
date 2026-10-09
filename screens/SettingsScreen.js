import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Pressable,
    Switch,
    Alert,
    Platform,
    Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
    Moon,
    Sun,
    Server,
    Trash2,
    Shield,
    Info,
    ChevronRight,
    Github,
    Zap,
    Bookmark,
    Check,
} from 'lucide-react-native';
import { useAppTheme } from '../theme/ThemeContext';
import { TopBar } from '../components/TopBar';
import { clearHistory } from '../services/historyService';
import { clearBookmarks } from '../services/bookmarksService';
import { PSTREAM_SOURCES, DEFAULT_PROVIDER_ID } from '../services/providerService';
import { isTV } from '../utils/device';

export const SettingsScreen = () => {
    const { theme, isDarkMode, toggleTheme } = useAppTheme();
    const insets = useSafeAreaInsets();
    const [selectedProvider, setSelectedProvider] = useState(DEFAULT_PROVIDER_ID);
    const [autoFailover, setAutoFailover] = useState(true);
    const [showProviderPicker, setShowProviderPicker] = useState(false);
    const [notice, setNotice] = useState('');

    const handleClearHistory = async () => {
        await clearHistory();
        setNotice('Watch history successfully cleared!');
        setTimeout(() => setNotice(''), 3000);
    };

    const handleClearBookmarks = async () => {
        await clearBookmarks();
        setNotice('Bookmarks successfully cleared!');
        setTimeout(() => setNotice(''), 3000);
    };

    const handleOpenRepo = () => {
        Linking.openURL('https://github.com/steveyout/youplex-apk').catch(() => {});
    };

    const safeTopPadding = isTV ? 130 : Math.max(insets.top + 92, Platform.OS === 'ios' ? 140 : 128);

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <TopBar />

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={[
                    styles.scrollContent,
                    {
                        paddingTop: safeTopPadding,
                        paddingBottom: 150 + insets.bottom,
                    },
                    isTV && styles.scrollContentTV,
                ]}
            >
                {/* Header Title safely beneath TopBar */}
                <View style={styles.header}>
                    <View style={styles.titleAccent} />
                    <Text style={[styles.headerTitle, { color: theme.colors.onBackground }]}>
                        Settings & Preferences
                    </Text>
                </View>

                {Boolean(notice) && (
                    <View style={styles.successNotice}>
                        <Check size={16} color="#10B981" />
                        <Text style={styles.successNoticeText}>{notice}</Text>
                    </View>
                )}

                {/* SECTION 1: APPEARANCE */}
                <View style={styles.section}>
                    <Text style={styles.sectionLabel}>APPEARANCE</Text>
                    <View
                        style={[
                            styles.card,
                            {
                                backgroundColor: theme.colors.cardBg,
                                borderColor: theme.colors.cardBorder,
                            },
                        ]}
                    >
                        <View style={styles.row}>
                            <View style={styles.rowLeft}>
                                <View style={styles.iconCircle}>
                                    {isDarkMode ? (
                                        <Moon size={20} color="#FF3030" />
                                    ) : (
                                        <Sun size={20} color="#FFD700" />
                                    )}
                                </View>
                                <View>
                                    <Text style={[styles.rowTitle, { color: theme.colors.onSurface }]}>
                                        Theme Mode
                                    </Text>
                                    <Text style={styles.rowDesc}>
                                        {isDarkMode ? 'Dark Reddish Cinematic Theme' : 'Light Clean Theme'}
                                    </Text>
                                </View>
                            </View>
                            <Pressable
                                onPress={toggleTheme}
                                style={styles.themeTogglePill}
                            >
                                <LinearGradient
                                    colors={['#FF4565', '#FF3030', '#B71833']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={styles.toggleGradient}
                                >
                                    <Text style={styles.toggleText}>
                                        {isDarkMode ? 'DARK' : 'LIGHT'}
                                    </Text>
                                </LinearGradient>
                            </Pressable>
                        </View>
                    </View>
                </View>

                {/* SECTION 2: STREAMING & PLAYBACK */}
                <View style={styles.section}>
                    <Text style={styles.sectionLabel}>STREAMING & ENGINE</Text>
                    <View
                        style={[
                            styles.card,
                            {
                                backgroundColor: theme.colors.cardBg,
                                borderColor: theme.colors.cardBorder,
                            },
                        ]}
                    >
                        {/* Auto-Failover Switch */}
                        <View style={styles.row}>
                            <View style={styles.rowLeft}>
                                <View style={styles.iconCircle}>
                                    <Zap size={20} color="#10B981" />
                                </View>
                                <View>
                                    <Text style={[styles.rowTitle, { color: theme.colors.onSurface }]}>
                                        Auto-Failover
                                    </Text>
                                    <Text style={styles.rowDesc}>
                                        Automatically switches sources on 403 / stream errors
                                    </Text>
                                </View>
                            </View>
                            <Switch
                                value={autoFailover}
                                onValueChange={setAutoFailover}
                                trackColor={{ false: '#3A3F48', true: '#FF3030' }}
                                thumbColor="#FFFFFF"
                            />
                        </View>

                        <View style={styles.divider} />

                        {/* Preferred Provider Selector */}
                        <Pressable
                            style={styles.rowPressable}
                            onPress={() => setShowProviderPicker(!showProviderPicker)}
                        >
                            <View style={styles.rowLeft}>
                                <View style={styles.iconCircle}>
                                    <Server size={20} color="#FF4D4D" />
                                </View>
                                <View>
                                    <Text style={[styles.rowTitle, { color: theme.colors.onSurface }]}>
                                        Preferred Provider
                                    </Text>
                                    <Text style={styles.rowDesc}>
                                        {PSTREAM_SOURCES.find((s) => s.id === selectedProvider)?.label || 'NovaLink (Fast)'}
                                    </Text>
                                </View>
                            </View>
                            <ChevronRight size={18} color="#8A99A8" />
                        </Pressable>

                        {showProviderPicker && (
                            <View style={styles.providerListContainer}>
                                {PSTREAM_SOURCES.map((prov) => {
                                    const isChosen = prov.id === selectedProvider;
                                    return (
                                        <Pressable
                                            key={prov.id}
                                            style={[
                                                styles.providerOption,
                                                isChosen && styles.providerOptionActive,
                                            ]}
                                            onPress={() => {
                                                setSelectedProvider(prov.id);
                                                setShowProviderPicker(false);
                                            }}
                                        >
                                            <Text
                                                style={[
                                                    styles.providerOptionText,
                                                    isChosen && { color: '#FF4D4D', fontWeight: '800' },
                                                ]}
                                            >
                                                {prov.label}
                                            </Text>
                                            {isChosen && <Check size={16} color="#FF4D4D" />}
                                        </Pressable>
                                    );
                                })}
                            </View>
                        )}
                    </View>
                </View>

                {/* SECTION 3: PRIVACY & STORAGE */}
                <View style={styles.section}>
                    <Text style={styles.sectionLabel}>DATA & PRIVACY</Text>
                    <View
                        style={[
                            styles.card,
                            {
                                backgroundColor: theme.colors.cardBg,
                                borderColor: theme.colors.cardBorder,
                            },
                        ]}
                    >
                        <Pressable style={styles.rowPressable} onPress={handleClearHistory}>
                            <View style={styles.rowLeft}>
                                <View style={[styles.iconCircle, { backgroundColor: 'rgba(255, 82, 82, 0.12)' }]}>
                                    <Trash2 size={20} color="#FF5252" />
                                </View>
                                <View>
                                    <Text style={[styles.rowTitle, { color: '#FF5252' }]}>
                                        Clear Watch History
                                    </Text>
                                    <Text style={styles.rowDesc}>
                                        Remove all saved progress and playback logs
                                    </Text>
                                </View>
                            </View>
                            <ChevronRight size={18} color="#8A99A8" />
                        </Pressable>

                        <View style={styles.divider} />

                        <Pressable style={styles.rowPressable} onPress={handleClearBookmarks}>
                            <View style={styles.rowLeft}>
                                <View style={[styles.iconCircle, { backgroundColor: 'rgba(255, 82, 82, 0.12)' }]}>
                                    <Bookmark size={20} color="#FF5252" />
                                </View>
                                <View>
                                    <Text style={[styles.rowTitle, { color: '#FF5252' }]}>
                                        Clear My List (Bookmarks)
                                    </Text>
                                    <Text style={styles.rowDesc}>
                                        Remove all saved movies and series
                                    </Text>
                                </View>
                            </View>
                            <ChevronRight size={18} color="#8A99A8" />
                        </Pressable>
                    </View>
                </View>

                {/* SECTION 4: ABOUT & APP INFO */}
                <View style={styles.section}>
                    <Text style={styles.sectionLabel}>ABOUT</Text>
                    <View
                        style={[
                            styles.card,
                            {
                                backgroundColor: theme.colors.cardBg,
                                borderColor: theme.colors.cardBorder,
                            },
                        ]}
                    >
                        <View style={styles.row}>
                            <View style={styles.rowLeft}>
                                <View style={styles.iconCircle}>
                                    <Info size={20} color="#38BDF8" />
                                </View>
                                <View>
                                    <Text style={[styles.rowTitle, { color: theme.colors.onSurface }]}>
                                        Youplex Version
                                    </Text>
                                    <Text style={styles.rowDesc}>
                                        v1.0.56 (Expo SDK 57 • React 19 Native Engine)
                                    </Text>
                                </View>
                            </View>
                        </View>

                        <View style={styles.divider} />

                        <Pressable style={styles.rowPressable} onPress={handleOpenRepo}>
                            <View style={styles.rowLeft}>
                                <View style={styles.iconCircle}>
                                    <Github size={20} color="#FFFFFF" />
                                </View>
                                <View>
                                    <Text style={[styles.rowTitle, { color: theme.colors.onSurface }]}>
                                        GitHub Repository
                                    </Text>
                                    <Text style={styles.rowDesc}>
                                        github.com/steveyout/youplex-apk
                                    </Text>
                                </View>
                            </View>
                            <ChevronRight size={18} color="#8A99A8" />
                        </Pressable>
                    </View>
                </View>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 20,
    },
    scrollContentTV: {
        paddingLeft: 120,
        paddingRight: 60,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 24,
    },
    titleAccent: {
        width: 4,
        height: 24,
        borderRadius: 2,
        backgroundColor: '#FF3030',
    },
    headerTitle: {
        fontSize: isTV ? 32 : 24,
        fontWeight: '900',
    },
    successNotice: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(16, 185, 129, 0.15)',
        borderWidth: 1,
        borderColor: 'rgba(16, 185, 129, 0.4)',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 14,
        gap: 8,
        marginBottom: 16,
    },
    successNoticeText: {
        color: '#10B981',
        fontSize: 13,
        fontWeight: '700',
    },
    section: {
        marginBottom: 24,
    },
    sectionLabel: {
        fontSize: 12,
        fontWeight: '800',
        color: '#FF4D4D',
        letterSpacing: 1.1,
        marginBottom: 10,
        marginLeft: 4,
    },
    card: {
        borderRadius: 20,
        borderWidth: 1.2,
        padding: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 3,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 14,
        paddingVertical: 12,
    },
    rowPressable: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 14,
        paddingVertical: 12,
    },
    rowLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        flex: 1,
    },
    iconCircle: {
        width: 42,
        height: 42,
        borderRadius: 21,
        backgroundColor: 'rgba(255, 48, 48, 0.12)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 48, 48, 0.25)',
    },
    rowTitle: {
        fontSize: 15,
        fontWeight: '700',
        marginBottom: 2,
    },
    rowDesc: {
        fontSize: 12,
        color: '#8A99A8',
    },
    themeTogglePill: {
        borderRadius: 16,
        overflow: 'hidden',
    },
    toggleGradient: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 16,
    },
    toggleText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '900',
        letterSpacing: 0.5,
    },
    divider: {
        height: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.06)',
        marginHorizontal: 14,
    },
    providerListContainer: {
        paddingHorizontal: 12,
        paddingBottom: 8,
        marginTop: 4,
    },
    providerOption: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 10,
        paddingHorizontal: 14,
        borderRadius: 12,
        marginBottom: 4,
    },
    providerOptionActive: {
        backgroundColor: 'rgba(255, 48, 48, 0.15)',
    },
    providerOptionText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#8A99A8',
    },
});
