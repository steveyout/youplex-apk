import React, { useEffect } from 'react';
import { StyleSheet, View, Platform, Pressable } from 'react-native';
import { BlurView } from 'expo-blur';
import { Text } from 'react-native-paper';
import { Home, Film, Tv, Bookmark, Settings } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as NavigationBar from 'expo-navigation-bar';
import { useAppTheme } from '../theme/ThemeContext';
import { isTV } from '../utils/device';

export const BottomNav = ({ state, navigation }) => {
    const { theme, isDarkMode } = useAppTheme();
    const insets = useSafeAreaInsets();

    // Ensure Android navigation bar is configured cleanly
    useEffect(() => {
        if (Platform.OS === 'android') {
            const setupNavBar = async () => {
                try {
                    await NavigationBar.setPositionAsync('absolute');
                    await NavigationBar.setBackgroundColorAsync('#00000000');
                    await NavigationBar.setBehaviorAsync('overlay-swipe');
                    await NavigationBar.setVisibilityAsync('hidden');
                } catch (e) {
                    // Handled gracefully in environments like Expo Go
                }
            };
            setupNavBar();
        }
    }, []);

    if (isTV || !state || !state.routes) return null;

    const currentTab = state.routes[state.index];

    const getActiveRouteName = (route) => {
        if (!route) return '';
        if (!route.state) return route.name;
        const routeState = route.state;
        return routeState.routes[routeState.index].name;
    };

    const activeRouteName = getActiveRouteName(currentTab);

    // Hide Bottom Nav on Video Player and Movie Detail screens for immersive viewing
    if (activeRouteName === 'Player' || activeRouteName === 'MovieDetail') return null;

    const navItems = [
        { name: 'Home', label: 'Home', icon: Home },
        { name: 'Movies', label: 'Movies', icon: Film },
        { name: 'Tv', label: 'TV Shows', icon: Tv },
        { name: 'Bookmarks', label: 'My List', icon: Bookmark },
        { name: 'Settings', label: 'Settings', icon: Settings },
    ];

    const currentRouteName = state.routes[state.index]?.name;

    // Dynamically calculate bottom offset so native Android buttons NEVER overlap the navbar
    const safeBottom = Math.max(
        insets.bottom > 0 ? insets.bottom + 8 : 14,
        Platform.OS === 'ios' ? 24 : 14
    );

    return (
        <View
            style={[
                styles.wrapper,
                { bottom: safeBottom },
            ]}
            pointerEvents="box-none"
        >
            {/* Elegant Frosted Glass Bar */}
            <BlurView
                intensity={85}
                tint={isDarkMode ? 'dark' : 'light'}
                style={[
                    styles.container,
                    {
                        backgroundColor: theme.colors.glassBg,
                        borderColor: theme.colors.glassBorder,
                    },
                ]}
            >
                {navItems.map((item) => {
                    const isFocused = currentRouteName === item.name;
                    const onPress = () => {
                        const targetRoute = state.routes.find((r) => r.name === item.name);
                        if (targetRoute) {
                            navigation.navigate(targetRoute.name);
                        }
                    };

                    const IconComponent = item.icon;

                    return (
                        <Pressable
                            key={item.name}
                            onPress={onPress}
                            style={styles.navItem}
                            android_ripple={{ color: 'rgba(255, 48, 48, 0.15)', borderless: true }}
                        >
                            <View style={[styles.navItemInner, isFocused && styles.navItemInnerFocused]}>
                                <IconComponent
                                    size={20}
                                    strokeWidth={isFocused ? 2.5 : 1.8}
                                    color={isFocused ? '#FF3030' : (isDarkMode ? '#8A99A8' : '#6B7280')}
                                />
                                <Text
                                    style={[
                                        styles.label,
                                        { color: isFocused ? '#FF3030' : (isDarkMode ? '#8A99A8' : '#6B7280') },
                                        isFocused && styles.labelFocused,
                                    ]}
                                    numberOfLines={1}
                                >
                                    {item.label}
                                </Text>
                                {isFocused && <View style={styles.activeDot} />}
                            </View>
                        </Pressable>
                    );
                })}
            </BlurView>
        </View>
    );
};

const styles = StyleSheet.create({
    wrapper: {
        position: 'absolute',
        width: Platform.OS === 'web' ? 460 : '92%',
        maxWidth: 500,
        alignSelf: 'center',
        alignItems: 'center',
        zIndex: 1000,
    },
    container: {
        width: '100%',
        height: 64,
        borderRadius: 32,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
        overflow: 'hidden',
        borderWidth: 1.2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.35,
        shadowRadius: 14,
        elevation: 8,
        paddingHorizontal: 8,
    },
    navItem: {
        flex: 1,
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    navItemInner: {
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        paddingVertical: 4,
        paddingHorizontal: 6,
    },
    navItemInnerFocused: {
        transform: [{ scale: 1.05 }],
    },
    label: {
        fontSize: 10,
        marginTop: 3,
        fontWeight: '600',
        letterSpacing: 0.3,
    },
    labelFocused: {
        fontWeight: '900',
    },
    activeDot: {
        position: 'absolute',
        bottom: -2,
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: '#FF3030',
        shadowColor: '#FF3030',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 4,
        elevation: 4,
    },
});
