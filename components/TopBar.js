import React from 'react';
import { StyleSheet, View, Platform, Image, Pressable, Dimensions } from 'react-native';
import { BlurView } from 'expo-blur';
import Svg, { Text as SvgText, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Search, Sun, Moon, Settings, Tv } from 'lucide-react-native';
import { useAppTheme } from '../theme/ThemeContext';
import { isTV } from '../utils/device';

const { width } = Dimensions.get('window');

export const TopBar = () => {
    const { theme, isDarkMode, toggleTheme } = useAppTheme();
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();

    const TV_OFFSET = 100;
    const TOPBAR_WIDTH = isTV ? width - TV_OFFSET : width;

    const safeTop = isTV ? 24 : Math.max(insets.top + 8, Platform.OS === 'ios' ? 48 : 34);

    return (
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
                intensity={isTV ? 55 : 85}
                tint={isDarkMode ? 'dark' : 'light'}
                style={[
                    styles.container,
                    isTV && styles.containerTV,
                    {
                        backgroundColor: theme.colors.glassBg,
                        borderColor: theme.colors.glassBorder,
                    },
                ]}
            >
                <View style={styles.content}>
                    {/* Brand Logo + Title with Reddish Gradient */}
                    <Pressable
                        style={styles.logoSection}
                        onPress={() => navigation.navigate('Home')}
                    >
                        <View style={styles.logoRing}>
                            <Image
                                source={require('../assets/logo.png')}
                                style={[styles.logoImage, isTV && styles.logoImageTV]}
                            />
                        </View>
                        <Svg height={isTV ? '42' : '32'} width={isTV ? '160' : '116'}>
                            <Defs>
                                <SvgGradient id="youplexRedGrad" x1="0" y1="0" x2="1" y2="0">
                                    <Stop offset="0%" stopColor="#FF4565" stopOpacity="1" />
                                    <Stop offset="50%" stopColor="#FF3030" stopOpacity="1" />
                                    <Stop offset="100%" stopColor="#B71833" stopOpacity="1" />
                                </SvgGradient>
                            </Defs>
                            <SvgText
                                fill="url(#youplexRedGrad)"
                                fontSize={isTV ? '28' : '22'}
                                fontWeight="900"
                                letterSpacing="1.4"
                                x="0"
                                y={isTV ? '31' : '23'}
                            >
                                {process.env.EXPO_PUBLIC_APP_TITLE || 'YOUPLEX'}
                            </SvgText>
                        </Svg>
                    </Pressable>

                    {/* Action Buttons: Search, Live TV, Theme Switcher, Settings */}
                    <View style={styles.actionSection}>
                        {/* Search Action */}
                        <Pressable
                            onPress={() => navigation.navigate('Search')}
                            style={({ focused }) => [
                                styles.actionPill,
                                isTV && styles.tvActionWrapper,
                                focused && styles.tvFocus,
                                {
                                    backgroundColor: isDarkMode
                                        ? 'rgba(255, 255, 255, 0.08)'
                                        : 'rgba(0, 0, 0, 0.05)',
                                    borderColor: theme.colors.outlineVariant,
                                },
                            ]}
                        >
                            <Search
                                color={theme.colors.onSurface}
                                size={isTV ? 26 : 17}
                            />
                        </Pressable>

                        {/* Live TV Shortcut */}
                        <Pressable
                            onPress={() => navigation.navigate('Tv')}
                            style={({ focused }) => [
                                styles.actionPill,
                                isTV && styles.tvActionWrapper,
                                focused && styles.tvFocus,
                                {
                                    backgroundColor: isDarkMode
                                        ? 'rgba(255, 255, 255, 0.08)'
                                        : 'rgba(0, 0, 0, 0.05)',
                                    borderColor: theme.colors.outlineVariant,
                                },
                            ]}
                        >
                            <Tv
                                color={theme.colors.onSurface}
                                size={isTV ? 26 : 17}
                            />
                        </Pressable>

                        {/* Theme Switcher Button */}
                        <Pressable
                            onPress={toggleTheme}
                            style={({ focused }) => [
                                styles.actionPill,
                                isTV && styles.tvActionWrapper,
                                focused && styles.tvFocus,
                                {
                                    backgroundColor: isDarkMode
                                        ? 'rgba(255, 48, 48, 0.12)'
                                        : 'rgba(255, 48, 48, 0.08)',
                                    borderColor: isDarkMode
                                        ? 'rgba(255, 48, 48, 0.3)'
                                        : 'rgba(255, 48, 48, 0.2)',
                                },
                            ]}
                        >
                            {isDarkMode ? (
                                <Sun color="#FFD700" size={isTV ? 26 : 17} />
                            ) : (
                                <Moon color="#FF3030" size={isTV ? 26 : 17} />
                            )}
                        </Pressable>

                        {/* Settings Button */}
                        <Pressable
                            onPress={() => navigation.navigate('Settings')}
                            style={({ focused }) => [
                                styles.actionPill,
                                isTV && styles.tvActionWrapper,
                                focused && styles.tvFocus,
                                {
                                    backgroundColor: isDarkMode
                                        ? 'rgba(255, 255, 255, 0.08)'
                                        : 'rgba(0, 0, 0, 0.05)',
                                    borderColor: theme.colors.outlineVariant,
                                },
                            ]}
                        >
                            <Settings
                                color={theme.colors.onSurface}
                                size={isTV ? 26 : 17}
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
        zIndex: 1000,
        paddingHorizontal: 16,
    },
    container: {
        height: 54,
        borderRadius: 27,
        overflow: 'hidden',
        borderWidth: 1.2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 8,
    },
    containerTV: {
        height: 80,
        borderRadius: 40,
    },
    content: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
    },
    logoSection: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    logoRing: {
        width: 30,
        height: 30,
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
        backgroundColor: 'rgba(255, 48, 48, 0.1)',
        borderWidth: 1,
        borderColor: 'rgba(255, 48, 48, 0.25)',
    },
    logoImage: {
        width: 20,
        height: 20,
    },
    logoImageTV: {
        width: 36,
        height: 36,
    },
    actionSection: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    actionPill: {
        width: 36,
        height: 36,
        borderRadius: 18,
        borderWidth: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    tvActionWrapper: {
        width: 56,
        height: 56,
        borderRadius: 28,
    },
    tvFocus: {
        backgroundColor: 'rgba(255, 48, 48, 0.3)',
        borderWidth: 2.5,
        borderColor: '#FF3030',
        transform: [{ scale: 1.1 }],
    },
});
