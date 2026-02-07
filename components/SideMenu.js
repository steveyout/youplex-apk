import React, { useState, useRef } from 'react';
import { StyleSheet, View, Pressable, Animated, Dimensions } from 'react-native';
import { Text } from 'react-native-paper';
import { Home, Film, Tv, Search, Clock } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useAppTheme } from '../theme/ThemeContext';
import { isTV } from '../utils/device';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const COLLAPSED_WIDTH = 80;
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
                duration: 300,
                useNativeDriver: true,
            }),
            Animated.timing(labelOpacity, {
                toValue: expanded ? 1 : 0,
                duration: 200,
                delay: expanded ? 100 : 0,
                useNativeDriver: true,
            }),
        ]).start();
    };

    const menuItems = [
        { label: 'Home', icon: Home, route: 'Home', index: 0 },
        { label: 'Movies', icon: Film, route: 'Movies', index: 1 },
        { label: 'TV Shows', icon: Tv, route: 'Tv', index: 4 },
        { label: 'Search', icon: Search, route: 'Search', index: 2 },
        { label: 'History', icon: Clock, route: 'History', index: 3 },
    ];

    const renderItem = (item) => {
        // Checking state.index against our local index mapping
        const isActive = state.index === item.index;

        return (
            <Pressable
                key={item.route}
                onFocus={() => toggleMenu(true)}
                onBlur={() => toggleMenu(false)}
                onPress={() => navigation.navigate(item.route)}
                style={({ focused }) => [
                    styles.menuItem,
                    focused && { backgroundColor: 'rgba(233, 30, 99, 0.15)' },
                ]}
            >
                {({ focused }) => (
                    <View style={styles.itemInner}>
                        <View style={styles.iconContainer}>
                            <item.icon
                                size={28}
                                color={focused || isActive ? theme.colors.primary : 'rgba(255,255,255,0.6)'}
                                strokeWidth={focused || isActive ? 2.5 : 2}
                            />
                            {isActive && (
                                <View style={[styles.activePill, { backgroundColor: theme.colors.primary }]} />
                            )}
                        </View>

                        <Animated.View style={[styles.labelWrapper, { opacity: labelOpacity }]}>
                            <Text
                                numberOfLines={1}
                                style={[
                                    styles.menuLabel,
                                    { color: focused || isActive ? 'white' : 'rgba(255,255,255,0.6)' }
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
            {/* Dark Overlay Background */}
            <Animated.View
                pointerEvents="none"
                style={[
                    styles.overlay,
                    { opacity: overlayOpacity }
                ]}
            />

            {/* The Side Menu Blade */}
            <Animated.View
                style={[
                    styles.container,
                    {
                        width: widthAnim,
                        backgroundColor: theme.colors.elevation.level1,
                    }
                ]}
            >
                <View style={styles.logoSpace}>
                    <View style={[styles.logoDot, { backgroundColor: theme.colors.primary }]} />
                    {isExpanded && (
                        <Animated.View style={{ opacity: labelOpacity }}>
                            <Text style={styles.brandName}>{process.env.EXPO_PUBLIC_APP_TITLE}</Text>
                        </Animated.View>
                    )}
                </View>

                <View style={styles.itemsContainer}>
                    {menuItems.map(renderItem)}
                </View>

                <View style={styles.footer}>
                    <View style={styles.userCircle} />
                </View>
            </Animated.View>
        </>
    );
};

const styles = StyleSheet.create({
    overlay: {
        position: 'absolute',
        top: 0,
        left: COLLAPSED_WIDTH,
        right: 0,
        bottom: 0,
        zIndex: 1999,
        backgroundColor: 'rgba(0,0,0,0.8)',
    },
    container: {
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        zIndex: 2000,
        paddingVertical: 40,
        borderRightWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
        overflow: 'hidden',
    },
    logoSpace: {
        height: 60,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 28,
        marginBottom: 40,
    },
    logoDot: {
        width: 14,
        height: 14,
        borderRadius: 7,
        shadowColor: '#E91E63',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 10,
    },
    brandName: {
        marginLeft: 20,
        fontSize: 20,
        fontWeight: '900',
        color: 'white',
        letterSpacing: 2,
    },
    itemsContainer: {
        flex: 1,
        justifyContent: 'center',
    },
    menuItem: {
        height: 60,
        marginHorizontal: 12,
        borderRadius: 10,
        justifyContent: 'center',
        marginBottom: 8,
    },
    itemInner: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 15,
    },
    iconContainer: {
        width: 30,
        alignItems: 'center',
        justifyContent: 'center',
    },
    activePill: {
        position: 'absolute',
        left: -27,
        width: 4,
        height: 24,
        borderTopRightRadius: 4,
        borderBottomRightRadius: 4,
    },
    labelWrapper: {
        marginLeft: 20,
    },
    menuLabel: {
        fontSize: 18,
        fontWeight: '600',
    },
    footer: {
        paddingHorizontal: 25,
        alignItems: 'flex-start',
    },
    userCircle: {
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    }
});