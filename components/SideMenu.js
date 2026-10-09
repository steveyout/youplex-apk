import React, { useState, useRef } from 'react';
import { StyleSheet, View, Pressable, Animated, Dimensions } from 'react-native';
import { Text } from 'react-native-paper';
import { Home, Film, Tv, Search, Clock, PlayCircle, Settings, Bookmark } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useAppTheme } from '../theme/ThemeContext';
import { isTV } from '../utils/device';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const COLLAPSED_WIDTH = 84;
const EXPANDED_WIDTH = 260;

export const SideMenu = ({ state }) => {
    const { theme, isDarkMode } = useAppTheme();
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
        { label: 'My List', icon: Bookmark, route: 'Bookmarks' },
        { label: 'Progress', icon: PlayCircle, route: 'Progress' },
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
                                size={26}
                                color={focused || isActive ? '#FF3030' : (isDarkMode ? 'rgba(255,255,255,0.65)' : 'rgba(0,0,0,0.6)')}
                                strokeWidth={focused || isActive ? 2.6 : 2}
                            />
                            {isActive && <View style={styles.activePill} />}
                        </View>

                        <Animated.View style={[styles.labelWrapper, { opacity: labelOpacity }]}>
                            <Text
                                numberOfLines={1}
                                style={[
                                    styles.menuLabel,
                                    { color: focused || isActive ? (isDarkMode ? '#FFFFFF' : '#111827') : (isDarkMode ? 'rgba(255,255,255,0.65)' : 'rgba(0,0,0,0.6)') },
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
                        backgroundColor: isDarkMode ? 'rgba(10, 13, 18, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                        borderRightColor: theme.colors.outlineVariant,
                    },
                ]}
            >
                <View style={styles.topSection}>
                    <View style={styles.logoDot} />
                </View>

                <View style={styles.menuList}>
                    {menuItems.map(renderItem)}
                </View>
            </Animated.View>
        </>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 0,
        left: 0,
        bottom: 0,
        zIndex: 2000,
        borderRightWidth: 1,
        elevation: 16,
        paddingVertical: 36,
        shadowColor: '#000',
        shadowOffset: { width: 4, height: 0 },
        shadowOpacity: 0.35,
        shadowRadius: 16,
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        zIndex: 1999,
    },
    topSection: {
        height: 60,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 28,
    },
    logoDot: {
        width: 14,
        height: 14,
        borderRadius: 7,
        backgroundColor: '#FF3030',
        shadowColor: '#FF3030',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 10,
        elevation: 6,
    },
    menuList: {
        flex: 1,
        gap: 16,
    },
    menuItem: {
        height: 52,
        justifyContent: 'center',
        paddingHorizontal: 20,
    },
    menuItemActive: {
        backgroundColor: 'rgba(255, 48, 48, 0.1)',
    },
    menuItemFocused: {
        backgroundColor: 'rgba(255, 48, 48, 0.25)',
        transform: [{ scale: 1.05 }],
    },
    itemInner: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconContainer: {
        width: 44,
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
    },
    activePill: {
        position: 'absolute',
        left: -14,
        width: 4,
        height: 24,
        borderRadius: 2,
        backgroundColor: '#FF3030',
    },
    labelWrapper: {
        marginLeft: 16,
        flex: 1,
    },
    menuLabel: {
        fontSize: 16,
        fontWeight: '600',
    },
});
