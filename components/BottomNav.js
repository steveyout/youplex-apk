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
    const { theme } = useAppTheme();
    const insets = useSafeAreaInsets();

    useEffect(() => {
        if (Platform.OS === 'android') {
            const setupNavBar = async () => {
                try {
                    await NavigationBar.setPositionAsync('absolute');
                    await NavigationBar.setBackgroundColorAsync('#00000000');
                    await NavigationBar.setBehaviorAsync('overlay-swipe');
                    await NavigationBar.setVisibilityAsync('hidden');
                } catch (e) {}
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

    // Hide Bottom Nav on Video Player and Movie Detail screens
    if (activeRouteName === 'Player' || activeRouteName === 'MovieDetail') return null;

    const navItems = [
        { name: 'Home', label: 'Home', icon: Home },
        { name: 'Movies', label: 'Movies', icon: Film },
        { name: 'Tv', label: 'TV Shows', icon: Tv },
        { name: 'Bookmarks', label: 'Watchlist', icon: Bookmark },
        { name: 'Settings', label: 'Settings', icon: Settings },
    ];

    const currentRouteName = state.routes[state.index]?.name;

    const safeBottom = Math.max(
        insets.bottom > 0 ? insets.bottom + 6 : 12,
        Platform.OS === 'ios' ? 24 : 12
    );

    return (
        <View style={[styles.wrapper, { bottom: safeBottom }]} pointerEvents="box-none">
            <BlurView
                intensity={80}
                tint="dark"
                style={[
                    styles.container,
                    {
                        backgroundColor: 'rgba(12, 14, 18, 0.92)',
                        borderColor: 'rgba(255, 255, 255, 0.08)',
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
                            android_ripple={{ color: 'rgba(255, 36, 66, 0.2)', borderless: true }}
                        >
                            <View style={[styles.navItemInner, isFocused && styles.navItemInnerFocused]}>
                                <View style={[styles.iconContainer, isFocused && styles.iconContainerFocused]}>
                                    <IconComponent
                                        size={19}
                                        strokeWidth={isFocused ? 2.5 : 1.8}
                                        color={isFocused ? '#FF2442' : '#98A2B3'}
                                    />
                                </View>
                                <Text
                                    style={[
                                        styles.label,
                                        { color: isFocused ? '#FF2442' : '#8A99A8' },
                                        isFocused && styles.labelFocused,
                                    ]}
                                    numberOfLines={1}
                                >
                                    {item.label}
                                </Text>
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
        left: 20,
        right: 20,
        alignItems: 'center',
        zIndex: 99,
    },
    container: {
        flexDirection: 'row',
        width: '100%',
        maxWidth: 500,
        height: 64,
        borderRadius: 32,
        borderWidth: 1,
        overflow: 'hidden',
        paddingHorizontal: 8,
        alignItems: 'center',
        justifyContent: 'space-around',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.5,
        shadowRadius: 20,
        elevation: 16,
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
        paddingVertical: 4,
        paddingHorizontal: 8,
        borderRadius: 16,
    },
    navItemInnerFocused: {
        backgroundColor: 'rgba(255, 36, 66, 0.08)',
    },
    iconContainer: {
        width: 30,
        height: 30,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 15,
        marginBottom: 2,
    },
    iconContainerFocused: {
        backgroundColor: 'rgba(255, 36, 66, 0.16)',
    },
    label: {
        fontSize: 10.5,
        fontWeight: '600',
        letterSpacing: 0.2,
    },
    labelFocused: {
        fontWeight: '800',
    },
});
