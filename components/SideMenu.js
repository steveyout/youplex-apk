import React, { useState, useRef } from 'react';
import { StyleSheet, View, Pressable, Animated, Dimensions, Image } from 'react-native';
import { Text } from 'react-native-paper';
import { Home, Film, Tv, Search, Clock, Settings, Bookmark } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useAppTheme } from '../theme/ThemeContext';
import { isTV } from '../utils/device';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const COLLAPSED_WIDTH = 84;
const EXPANDED_WIDTH = 260;

export const SideMenu = ({ state }) => {
    const { theme } = useAppTheme();
    const navigation = useNavigation();

    // Animation Refs
    const widthAnim = useRef(new Animated.Value(COLLAPSED_WIDTH)).current;
    const overlayOpacity = useRef(new Animated.Value(0)).current;
    const labelOpacity = useRef(new Animated.Value(0)).current;

    const [isExpanded, setIsExpanded] = useState(false);

    const toggleMenu = (expanded) => {
        setIsExpanded(expanded);
        Animated.parallel([
            Animated.spring(widthAnim, {
                toValue: expanded ? EXPANDED_WIDTH : COLLAPSED_WIDTH,
                useNativeDriver: false,
                friction: 8,
                tension: 40,
            }),
            Animated.timing(overlayOpacity, {
                toValue: expanded ? 1 : 0,
                duration: 250,
                useNativeDriver: true,
            }),
            Animated.timing(labelOpacity, {
                toValue: expanded ? 1 : 0,
                duration: 180,
                delay: expanded ? 80 : 0,
                useNativeDriver: true,
            }),
        ]).start();
    };

    const menuItems = [
        { label: 'Home', icon: Home, route: 'Home' },
        { label: 'Movies', icon: Film, route: 'Movies' },
        { label: 'TV Series', icon: Tv, route: 'Tv' },
        { label: 'Watchlist', icon: Bookmark, route: 'Bookmarks' },
        { label: 'History', icon: Clock, route: 'History' },
        { label: 'Search', icon: Search, route: 'Search' },
        { label: 'Settings', icon: Settings, route: 'Settings' },
    ];

    const currentRoute = state?.routes?.[state.index]?.name;

    const renderItem = (item) => {
        const isActive = currentRoute === item.route;

        return (
            <Pressable
                key={item.route}
                onFocus={() => toggleMenu(true)}
                onBlur={() => toggleMenu(false)}
                onPress={() => navigation.navigate(item.route)}
                style={({ focused }) => [
                    styles.menuItem,
                    isActive && styles.menuItemActive,
                    focused && styles.menuItemFocused,
                ]}
            >
                {({ focused }) => (
                    <View style={styles.itemInner}>
                        <View style={styles.iconContainer}>
                            <item.icon
                                size={24}
                                color={focused || isActive ? '#FF2442' : 'rgba(255,255,255,0.65)'}
                                strokeWidth={focused || isActive ? 2.5 : 1.8}
                            />
                            {isActive && <View style={styles.activePill} />}
                        </View>

                        <Animated.View style={[styles.labelWrapper, { opacity: labelOpacity }]}>
                            <Text
                                numberOfLines={1}
                                style={[
                                    styles.menuLabel,
                                    { color: focused || isActive ? '#FFFFFF' : 'rgba(255,255,255,0.65)' },
                                    (focused || isActive) && { fontWeight: '800' },
                                ]}
                            >
                                {item.label}
                            </Text>
                        </Animated.View>
                    </View>
                )}
            </Pressable>
        );
    };

    if (!isTV) return null;

    return (
        <>
            {/* Backdrop Overlay */}
            <Animated.View
                pointerEvents="none"
                style={[
                    styles.overlay,
                    { opacity: overlayOpacity },
                ]}
            />

            {/* Side Blade Navigation */}
            <Animated.View
                style={[
                    styles.container,
                    {
                        width: widthAnim,
                        backgroundColor: 'rgba(8, 9, 12, 0.96)',
                        borderRightColor: 'rgba(255, 255, 255, 0.08)',
                    },
                ]}
            >
                <View style={styles.topSection}>
                    <Image
                        source={require('../assets/logo.png')}
                        style={{ width: 36, height: 36 }}
                        resizeMode="contain"
                    />
                </View>

                <View style={styles.menuList}>
                    {menuItems.map(renderItem)}
                </View>
            </Animated.View>
        </>
    );
};

const styles = StyleSheet.create({
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        zIndex: 998,
    },
    container: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: 0,
        zIndex: 999,
        borderRightWidth: 1,
        justifyContent: 'flex-start',
        paddingVertical: 28,
    },
    topSection: {
        height: 60,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
    },
    menuList: {
        flex: 1,
        gap: 10,
    },
    menuItem: {
        height: 52,
        justifyContent: 'center',
        paddingHorizontal: 16,
        borderRadius: 14,
        marginHorizontal: 10,
    },
    menuItemActive: {
        backgroundColor: 'rgba(255, 36, 66, 0.12)',
    },
    menuItemFocused: {
        backgroundColor: 'rgba(255, 36, 66, 0.22)',
        borderColor: '#FF2442',
        borderWidth: 1.5,
    },
    itemInner: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconContainer: {
        width: 36,
        height: 36,
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
    },
    activePill: {
        position: 'absolute',
        left: -12,
        width: 4,
        height: 18,
        borderRadius: 2,
        backgroundColor: '#FF2442',
    },
    labelWrapper: {
        marginLeft: 16,
        overflow: 'hidden',
    },
    menuLabel: {
        fontSize: 16,
        letterSpacing: 0.3,
    },
});
