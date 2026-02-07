import React from 'react';
import { StyleSheet, View, Platform, Image, Pressable, Dimensions } from 'react-native';
import { BlurView } from 'expo-blur';
import { IconButton } from 'react-native-paper';
import Svg, { Text as SvgText, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';
import { useAppTheme } from '../theme/ThemeContext';
import { useNavigation } from '@react-navigation/native';
import { Search } from 'lucide-react-native';

import { isTV } from '../utils/device';

const { width } = Dimensions.get('window');

export const TopBar = () => {
    const { theme, isDarkMode, toggleTheme } = useAppTheme();
    const navigation = useNavigation();

    // The SideMenu is 100px wide on TV
    const TV_OFFSET = 100;
    const TOPBAR_WIDTH = isTV ? width - TV_OFFSET : width;

    return (
        <View style={[
            styles.stickyWrapper,
            isTV && {
                left: TV_OFFSET,
                width: TOPBAR_WIDTH,
                paddingHorizontal: 40,
                paddingTop: 20 // Adjusted for Web/HDMI (no status bar)
            }
        ]}>
            <BlurView
                intensity={isTV ? 40 : 80}
                tint={isDarkMode ? 'dark' : 'light'}
                style={[
                    styles.container,
                    { borderColor: theme.colors.outlineVariant },
                    isTV && styles.containerTV
                ]}
            >
                <View style={styles.content}>
                    <View style={styles.logoSection}>
                        <Image
                            source={require('../assets/logo.png')}
                            style={[styles.logoImage, isTV && styles.logoImageTV]}
                        />
                        <Svg height={isTV ? "40" : "30"} width={isTV ? "150" : "100"}>
                            <Defs>
                                <SvgGradient id="grad" x1="0" y1="0" x2="1" y2="0">
                                    <Stop offset="0" stopColor="#E91E63" stopOpacity="1" />
                                    <Stop offset="1" stopColor="#9C27B0" stopOpacity="1" />
                                </SvgGradient>
                            </Defs>
                            <SvgText
                                fill="url(#grad)"
                                fontSize={isTV ? "28" : "22"}
                                fontWeight="900"
                                x="0"
                                y={isTV ? "30" : "22"}
                            >
                                {process.env.EXPO_PUBLIC_APP_TITLE || 'GEMINI'}
                            </SvgText>
                        </Svg>
                    </View>

                    <View style={styles.actionSection}>
                        {isTV && (
                            <Pressable
                                onPress={() => navigation.navigate('Search')}
                                style={({ focused }) => [
                                    styles.tvIconWrapper,
                                    focused && styles.tvFocus
                                ]}
                            >
                                <Search color="white" size={32} />
                            </Pressable>
                        )}

                        <Pressable
                            onPress={toggleTheme}
                            style={({ focused }) => [
                                isTV && styles.tvIconWrapper,
                                isTV && focused && styles.tvFocus
                            ]}
                        >
                            <IconButton
                                icon={isDarkMode ? 'weather-sunny' : 'weather-night'}
                                iconColor={isDarkMode ? '#FFD700' : theme.colors.primary}
                                size={isTV ? 32 : 20}
                                style={isTV ? { margin: 0 } : null}
                            />
                        </Pressable>
                    </View>
                </View>
            </BlurView>
        </View>
    );
};

const styles = StyleSheet.create({
    stickyWrapper: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000, // Highest zIndex to stay above SideMenu expansion if needed
        paddingTop: Platform.OS === 'ios' ? 50 : 35,
        paddingHorizontal: 15
    },
    container: {
        height: 50,
        borderRadius: 25,
        overflow: 'hidden',
        borderWidth: 1
    },
    containerTV: {
        height: 80, // Taller for TV
        borderRadius: 40,
        backgroundColor: 'rgba(26, 26, 26, 0.8)', // Darker for cinematic look
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    content: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20
    },
    logoSection: { flexDirection: 'row', alignItems: 'center' },
    logoImage: { width: 24, height: 24, marginRight: 8 },
    logoImageTV: { width: 40, height: 40, marginRight: 15 },
    actionSection: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 20
    },
    tvIconWrapper: {
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center'
    },
    tvFocus: {
        backgroundColor: 'rgba(233, 30, 99, 0.4)',
        transform: [{ scale: 1.1 }]
    }
});