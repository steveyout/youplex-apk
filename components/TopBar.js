import React from 'react';
import { StyleSheet, View, Platform, Image } from 'react-native';
import { BlurView } from 'expo-blur';
import { IconButton } from 'react-native-paper';
import Svg, { Text as SvgText, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';
import { useAppTheme } from '../theme/ThemeContext';

export const TopBar = () => {
    const { theme, isDarkMode, toggleTheme } = useAppTheme();

    return (
        <View style={styles.stickyWrapper}>
            <BlurView
                intensity={80}
                tint={isDarkMode ? 'dark' : 'light'}
                style={[styles.container, { borderColor: theme.colors.outlineVariant }]}
            >
                <View style={styles.content}>
                    <View style={styles.logoSection}>
                        <Image
                            source={require('../assets/logo.png')}
                            style={[styles.logoImage]}
                        />
                        <Svg height="30" width="100">
                            <Defs>
                                <SvgGradient id="grad" x1="0" y1="0" x2="1" y2="0">
                                    <Stop offset="0" stopColor="#E91E63" stopOpacity="1" />
                                    <Stop offset="1" stopColor="#9C27B0" stopOpacity="1" />
                                </SvgGradient>
                            </Defs>
                            <SvgText fill="url(#grad)" fontSize="22" fontWeight="900" x="0" y="22">{process.env.EXPO_PUBLIC_APP_TITLE}</SvgText>
                        </Svg>
                    </View>
                    <IconButton
                        icon={isDarkMode ? 'weather-sunny' : 'weather-night'}
                        iconColor={isDarkMode ? '#FFD700' : theme.colors.primary}
                        onPress={toggleTheme}
                    />
                </View>
            </BlurView>
        </View>
    );
};

const styles = StyleSheet.create({
    stickyWrapper: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 100, paddingTop: Platform.OS === 'ios' ? 50 : 35, paddingHorizontal: 15 },
    container: { height: 50, borderRadius: 25, overflow: 'hidden', borderWidth: 1 },
    content: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12 },
    logoSection: { flexDirection: 'row', alignItems: 'center' },
    logoImage: { width: 24, height: 24 }
});