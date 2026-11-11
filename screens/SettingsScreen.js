import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Pressable,
    Switch,
    Platform,
    Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
    Moon,
    Server,
    Trash2,
    Shield,
    Info,
    ChevronRight,
    Github,
    Zap,
    Check,
    Sparkles,
} from 'lucide-react-native';
import { useAppTheme } from '../theme/ThemeContext';
import { TopBar } from '../components/TopBar';
import { clearHistory } from '../services/historyService';
import { clearBookmarks } from '../services/bookmarksService';
import { ALL_PLAYBACK_SOURCES, DEFAULT_PROVIDER_ID } from '../services/providerService';
import { isTV } from '../utils/device';

export const SettingsScreen = () => {
    const { theme } = useAppTheme();
    const insets = useSafeAreaInsets();
    const [selectedProvider, setSelectedProvider] = useState(DEFAULT_PROVIDER_ID);
    const [autoFailover, setAutoFailover] = useState(true);
    const [showProviderPicker, setShowProviderPicker] = useState(false);
    const [notice, setNotice] = useState('');

    const handleClearHistory = async () => {
        await clearHistory();
        setNotice('Watch history cleared successfully.');
        setTimeout(() => setNotice(''), 3000);
    };

    const handleClearBookmarks = async () => {
        await clearBookmarks();
        setNotice('Watchlist cleared successfully.');
        setTimeout(() => setNotice(''), 3000);
    };

    const handleOpenRepo = () => {
        Linking.openURL('https://github.com/steveyout/youplex-apk').catch(() => {});
    };

    const safeTopPadding = isTV ? 110 : Math.max(insets.top + 76, Platform.OS === 'ios' ? 120 : 100);

    return (
        <View style={[styles.container, { backgroundColor: '#08090C' }]}>
            <TopBar />

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={[
                    styles.scrollContent,
                    {
                        paddingTop: safeTopPadding,
                        paddingBottom: 110 + insets.bottom,
                    },
                    isTV && styles.scrollContentTV,
                ]}
            >
                {/* Header Title */}
                <View style={styles.header}>
                    <View style={styles.titleAccent} />
                    <Text style={styles.headerTitle}>Settings & Engine</Text>
                </View>

                {Boolean(notice) && (
                    <View style={styles.successNotice}>
                        <Check size={16} color="#FF2442" />
                        <Text style={styles.successNoticeText}>{notice}</Text>
                    </View>
                )}

                {/* SECTION 1: AI & THEME */}
                <View style={styles.section}>
                    <Text style={styles.sectionLabel}>DESIGN SYSTEM</Text>
                    <View style={styles.card}>
                        <View style={styles.row}>
                            <View style={styles.rowLeft}>
                                <View style={styles.iconCircle}>
                                    <Sparkles size={18} color="#FF2442" />
                                </View>
                                <View>
                                    <Text style={styles.rowTitle}>Theme & Aesthetic</Text>
                                    <Text style={styles.rowDesc}>Dark UI/UX with Crimson Neon Accents</Text>
                                </View>
                            </View>
                            <View style={styles.activeThemeBadge}>
                                <Text style={styles.activeThemeBadgeText}>ACTIVE</Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* SECTION 2: STREAMING & VYLA ENGINE */}
                <View style={styles.section}>
                    <Text style={styles.sectionLabel}>STREAMING & RESOLVERS</Text>
                    <View style={styles.card}>
                        {/* Auto-Failover Switch */}
                        <View style={styles.row}>
                            <View style={styles.rowLeft}>
                                <View style={styles.iconCircle}>
                                    <Zap size={18} color="#FF2442" />
                                </View>
                                <View>
                                    <Text style={styles.rowTitle}>Auto-Failover with Vyla SDK</Text>
                                    <Text style={styles.rowDesc}>
                                        Auto-switches to Vyla SDK fallback when stream fails
                                    </Text>
                                </View>
                            </View>
                            <Switch
                                value={autoFailover}
                                onValueChange={setAutoFailover}
                                trackColor={{ false: '#202632', true: '#FF2442' }}
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
                                    <Server size={18} color="#FF2442" />
                                </View>
                                <View>
                                    <Text style={styles.rowTitle}>Primary Stream Provider</Text>
                                    <Text style={styles.rowDesc}>
                                        {ALL_PLAYBACK_SOURCES.find((s) => s.id === selectedProvider)?.label ||
                                            'Horizon Play (Ultra Fast)'}
                                    </Text>
                                </View>
                            </View>
                            <ChevronRight size={18} color="#98A2B3" />
                        </Pressable>

                        {showProviderPicker && (
                            <View style={styles.providerListContainer}>
                                {ALL_PLAYBACK_SOURCES.map((prov) => {
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
                                            <View style={{ flex: 1 }}>
                                                <Text
                                                    style={[
                                                        styles.providerOptionText,
                                                        isChosen && { color: '#FF2442', fontWeight: '800' },
                                                    ]}
                                                >
                                                    {prov.label}
                                                </Text>
                                                {prov.isVylaPrimary ? (<Text style={styles.vylaBadge}>Vyla SDK Primary Source</Text>) : (<Text style={[styles.vylaBadge, { color: '#98A2B3' }]}>Secondary Fallback Source</Text>)}
                                            </View>
                                            {isChosen && <Check size={16} color="#FF2442" />}
                                        </Pressable>
                                    );
                                })}
                            </View>
                        )}
                    </View>
                </View>

                {/* SECTION 3: DATA MANAGEMENT */}
                <View style={styles.section}>
                    <Text style={styles.sectionLabel}>DATA MANAGEMENT</Text>
                    <View style={styles.card}>
                        <Pressable style={styles.rowPressable} onPress={handleClearHistory}>
                            <View style={styles.rowLeft}>
                                <View style={styles.iconCircle}>
                                    <Trash2 size={18} color="#FF2442" />
                                </View>
                                <View>
                                    <Text style={styles.rowTitle}>Clear Watch History</Text>
                                    <Text style={styles.rowDesc}>Removes all continue watching records</Text>
                                </View>
                            </View>
                            <ChevronRight size={18} color="#98A2B3" />
                        </Pressable>

                        <View style={styles.divider} />

                        <Pressable style={styles.rowPressable} onPress={handleClearBookmarks}>
                            <View style={styles.rowLeft}>
                                <View style={styles.iconCircle}>
                                    <Trash2 size={18} color="#FF2442" />
                                </View>
                                <View>
                                    <Text style={styles.rowTitle}>Clear Watchlist</Text>
                                    <Text style={styles.rowDesc}>Removes all saved titles from My List</Text>
                                </View>
                            </View>
                            <ChevronRight size={18} color="#98A2B3" />
                        </Pressable>
                    </View>
                </View>

                {/* SECTION 4: ABOUT */}
                <View style={styles.section}>
                    <Text style={styles.sectionLabel}>ABOUT</Text>
                    <View style={styles.card}>
                        <Pressable style={styles.rowPressable} onPress={handleOpenRepo}>
                            <View style={styles.rowLeft}>
                                <View style={styles.iconCircle}>
                                    <Github size={18} color="#FFFFFF" />
                                </View>
                                <View>
                                    <Text style={styles.rowTitle}>Youplex Streaming</Text>
                                    <Text style={styles.rowDesc}>v2.0 • Android & Android TV</Text>
                                </View>
                            </View>
                            <ChevronRight size={18} color="#98A2B3" />
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
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 16,
    },
    titleAccent: {
        width: 4,
        height: 18,
        borderRadius: 2,
        backgroundColor: '#FF2442',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '900',
        color: '#FFFFFF',
        letterSpacing: 0.3,
    },
    successNotice: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 36, 66, 0.12)',
        borderWidth: 1,
        borderColor: 'rgba(255, 36, 66, 0.3)',
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 10,
        marginBottom: 16,
        gap: 8,
    },
    successNoticeText: {
        color: '#FF2442',
        fontSize: 13,
        fontWeight: '700',
    },
    section: {
        marginBottom: 20,
    },
    sectionLabel: {
        fontSize: 11,
        fontWeight: '800',
        color: '#98A2B3',
        letterSpacing: 0.8,
        marginBottom: 8,
        paddingLeft: 4,
    },
    card: {
        backgroundColor: '#0F1217',
        borderRadius: 18,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.07)',
        overflow: 'hidden',
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 14,
    },
    rowPressable: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 14,
    },
    rowLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        gap: 12,
    },
    iconCircle: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(255, 36, 66, 0.12)',
        borderWidth: 1,
        borderColor: 'rgba(255, 36, 66, 0.25)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    rowTitle: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '700',
    },
    rowDesc: {
        color: '#98A2B3',
        fontSize: 11,
        marginTop: 2,
    },
    activeThemeBadge: {
        backgroundColor: 'rgba(255, 36, 66, 0.15)',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: 'rgba(255, 36, 66, 0.3)',
    },
    activeThemeBadgeText: {
        color: '#FF2442',
        fontSize: 10,
        fontWeight: '800',
    },
    divider: {
        height: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        marginHorizontal: 16,
    },
    providerListContainer: {
        backgroundColor: '#141821',
        borderTopWidth: 1,
        borderTopColor: 'rgba(255, 255, 255, 0.06)',
        paddingVertical: 6,
    },
    providerOption: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 12,
    },
    providerOptionActive: {
        backgroundColor: 'rgba(255, 36, 66, 0.1)',
    },
    providerOptionText: {
        color: '#D0D5DD',
        fontSize: 13,
        fontWeight: '600',
    },
    vylaBadge: {
        color: '#FF2442',
        fontSize: 10,
        fontWeight: '700',
        marginTop: 2,
    },
});
