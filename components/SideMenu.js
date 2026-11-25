import React, { useState } from 'react';
import { StyleSheet, View, Pressable, Image } from 'react-native';
import { Text } from 'react-native-paper';
import { BlurView } from 'expo-blur';
import { Home, Film, Tv, Search, Clock, Settings, Bookmark } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { isTV } from '../utils/device';

export const SideMenu = ({ state }) => {
    const navigation = useNavigation();
    const [focusedRoute, setFocusedRoute] = useState(null);

    const menuItems = [
        { label: 'Home', icon: Home, route: 'Home' },
        { label: 'Search', icon: Search, route: 'Search' },
        { label: 'Movies', icon: Film, route: 'Movies' },
        { label: 'TV Series', icon: Tv, route: 'Tv' },
        { label: 'Watchlist', icon: Bookmark, route: 'Bookmarks' },
        { label: 'History', icon: Clock, route: 'History' },
        { label: 'Settings', icon: Settings, route: 'Settings' },
    ];

    const currentRoute = state?.routes?.[state.index]?.name;
    const currentTab = state?.routes?.[state.index];
    const getActiveRouteName = (route) => {
        if (!route) return '';
        if (!route.state) return route.name;
        const routeState = route.state;
        return routeState.routes[routeState.index].name;
    };
    const activeRouteName = getActiveRouteName(currentTab);

    if (!isTV || activeRouteName === 'Player' || activeRouteName === 'MovieDetail') return null;

    return (
        <View style={styles.railContainer} pointerEvents="box-none">
            {/* Top Brand Glass Badge */}
            <Pressable
                focusable={true}
                onFocus={() => setFocusedRoute('__brand__')}
                onBlur={() => setFocusedRoute((prev) => (prev === '__brand__' ? null : prev))}
                onPress={() => navigation.navigate('Home')}
                style={({ focused }) => [
                    styles.brandBadge,
                    (focused || focusedRoute === '__brand__') && styles.brandBadgeFocused,
                ]}
            >
                <BlurView intensity={45} tint="dark" style={styles.brandBlur} pointerEvents="none">
                    <Image
                        source={require('../assets/logo.png')}
                        style={styles.brandLogo}
                        resizeMode="contain"
                    />
                </BlurView>
            </Pressable>

            {/* 6 Circular Frosted-Glass Icon Buttons */}
            <View style={styles.menuList}>
                {menuItems.map((item) => {
                    const isActive = currentRoute === item.route;
                    const isItemFocused = focusedRoute === item.route;

                    return (
                        <Pressable
                            key={item.route}
                            focusable={true}
                            onFocus={() => setFocusedRoute(item.route)}
                            onBlur={() =>
                                setFocusedRoute((prev) => (prev === item.route ? null : prev))
                            }
                            onPress={() => navigation.navigate(item.route)}
                            style={styles.itemAnchor}
                        >
                            {({ focused }) => {
                                const highlight = Boolean(focused || isItemFocused);
                                return (
                                    <>
                                        <View
                                            style={[
                                                styles.circleBtn,
                                                isActive && styles.circleBtnActive,
                                                highlight && styles.circleBtnFocused,
                                            ]}
                                        >
                                            <BlurView
                                                intensity={38}
                                                tint="dark"
                                                style={styles.circleBlur}
                                                pointerEvents="none"
                                            >
                                                <item.icon
                                                    size={20}
                                                    color={
                                                        highlight || isActive
                                                            ? '#FFFFFF'
                                                            : 'rgba(255, 255, 255, 0.72)'
                                                    }
                                                    strokeWidth={highlight || isActive ? 2.4 : 1.8}
                                                />
                                            </BlurView>
                                        </View>

                                        {highlight && (
                                            <View style={styles.tooltipPill} pointerEvents="none">
                                                <BlurView
                                                    intensity={60}
                                                    tint="dark"
                                                    style={styles.tooltipBlur}
                                                    pointerEvents="none"
                                                >
                                                    <Text style={styles.tooltipText} numberOfLines={1}>
                                                        {item.label}
                                                    </Text>
                                                </BlurView>
                                            </View>
                                        )}
                                    </>
                                );
                            }}
                        </Pressable>
                    );
                })}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    railContainer: {
        position: 'absolute',
        top: 24,
        bottom: 24,
        left: 20,
        width: 52,
        zIndex: 999,
        alignItems: 'center',
        justifyContent: 'flex-start',
    },
    brandBadge: {
        width: 44,
        height: 44,
        borderRadius: 14,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255, 36, 66, 0.45)',
        backgroundColor: 'rgba(255, 36, 66, 0.18)',
        marginBottom: 16,
    },
    brandBadgeFocused: {
        borderColor: '#FFFFFF',
        borderWidth: 2,
        transform: [{ scale: 1.1 }],
    },
    brandBlur: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    brandLogo: {
        width: 28,
        height: 28,
    },
    menuList: {
        alignItems: 'center',
        gap: 9,
    },
    itemAnchor: {
        position: 'relative',
        alignItems: 'center',
        justifyContent: 'center',
    },
    circleBtn: {
        width: 42,
        height: 42,
        borderRadius: 21,
        overflow: 'hidden',
        backgroundColor: 'rgba(255, 255, 255, 0.10)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.18)',
    },
    circleBtnActive: {
        backgroundColor: 'rgba(255, 36, 66, 0.32)',
        borderColor: '#FF2442',
        borderWidth: 1.5,
        shadowColor: '#FF2442',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.55,
        shadowRadius: 8,
        elevation: 6,
    },
    circleBtnFocused: {
        backgroundColor: '#FF2442',
        borderColor: '#FFFFFF',
        borderWidth: 2,
        transform: [{ scale: 1.12 }],
        shadowColor: '#FF2442',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.9,
        shadowRadius: 12,
        elevation: 10,
    },
    circleBlur: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    tooltipPill: {
        position: 'absolute',
        left: 56,
        minWidth: 108,
        borderRadius: 14,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255, 36, 66, 0.55)',
        backgroundColor: 'rgba(15, 18, 25, 0.92)',
        zIndex: 1000,
    },
    tooltipBlur: {
        paddingHorizontal: 14,
        paddingVertical: 7,
        alignItems: 'center',
        justifyContent: 'center',
    },
    tooltipText: {
        color: '#FFFFFF',
        fontSize: 12.5,
        fontWeight: '800',
        letterSpacing: 0.3,
    },
});
