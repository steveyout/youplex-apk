import React, { useState } from 'react';
import { StyleSheet, View, Platform, Image, Pressable, Dimensions } from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Search, Sparkles } from 'lucide-react-native';
import { Text } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppTheme } from '../theme/ThemeContext';
import { AIAssistantModal } from './AIAssistantModal';
import { isTV } from '../utils/device';

const { width } = Dimensions.get('window');

export const TopBar = () => {
    const { theme } = useAppTheme();
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();
    const [aiModalVisible, setAiModalVisible] = useState(false);

    const TV_OFFSET = 100;
    const TOPBAR_WIDTH = isTV ? width - TV_OFFSET : width;
    const safeTop = isTV ? 20 : Math.max(insets.top + 6, Platform.OS === 'ios' ? 48 : 34);

    return (
        <>
            <View
                style={[
                    styles.stickyWrapper,
                    { paddingTop: safeTop },
                    isTV && {
                        left: TV_OFFSET,
                        width: TOPBAR_WIDTH,
                        paddingHorizontal: 40,
                    },
                ]}
                pointerEvents="box-none"
            >
                <BlurView
                    intensity={isTV ? 45 : 75}
                    tint="dark"
                    style={[
                        styles.container,
                        isTV && styles.containerTV,
                        {
                            backgroundColor: 'rgba(8, 9, 12, 0.85)',
                            borderColor: 'rgba(255, 255, 255, 0.08)',
                        },
                    ]}
                >
                    <View style={styles.content}>
                        {/* Brand Logo + Title without AI word */}
                        <Pressable
                            style={styles.logoSection}
                            onPress={() => navigation.navigate('Home')}
                        >
                            <Image
                                source={require('../assets/logo.png')}
                                style={styles.brandLogoImage}
                                resizeMode="contain"
                            />
                            <View style={styles.brandTitleCol}>
                                <Text style={styles.brandName}>YOUPLEX</Text>
                            </View>
                        </Pressable>

                        {/* Action Buttons: AI Discover Quick Pill & Search */}
                        <View style={styles.actionSection}>
                            {/* AI Discover Quick Pill Button */}
                            <Pressable
                                onPress={() => setAiModalVisible(true)}
                                style={styles.aiPillBtn}
                            >
                                <LinearGradient
                                    colors={['rgba(255, 36, 66, 0.22)', 'rgba(255, 36, 66, 0.08)']}
                                    style={styles.aiPillGradient}
                                >
                                    <Sparkles size={14} color="#FF2442" />
                                    <Text style={styles.aiPillText}>AI Discover</Text>
                                </LinearGradient>
                            </Pressable>

                            {/* Search Action */}
                            <Pressable
                                onPress={() => navigation.navigate('Search')}
                                style={styles.searchIconBtn}
                            >
                                <Search color="#EAECF0" size={18} />
                            </Pressable>
                        </View>
                    </View>
                </BlurView>
            </View>

            {/* In-app AI Movie Assistant Modal */}
            <AIAssistantModal
                visible={aiModalVisible}
                onClose={() => setAiModalVisible(false)}
            />
        </>
    );
};

const styles = StyleSheet.create({
    stickyWrapper: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 999,
        paddingHorizontal: 16,
    },
    container: {
        borderRadius: 22,
        borderWidth: 1,
        overflow: 'hidden',
        paddingVertical: 8,
        paddingHorizontal: 14,
    },
    containerTV: {
        borderRadius: 24,
        paddingVertical: 12,
        paddingHorizontal: 20,
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    logoSection: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    brandLogoImage: {
        width: 32,
        height: 32,
        marginRight: 9,
    },
    brandTitleCol: {
        justifyContent: 'center',
    },
    brandName: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '900',
        letterSpacing: 1.4,
    },
    actionSection: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    aiPillBtn: {
        borderRadius: 14,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255, 36, 66, 0.35)',
    },
    aiPillGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 11,
        paddingVertical: 6,
        gap: 5,
    },
    aiPillText: {
        color: '#FF2442',
        fontSize: 12,
        fontWeight: '700',
    },
    searchIconBtn: {
        width: 34,
        height: 34,
        borderRadius: 17,
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
});
