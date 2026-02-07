import React from 'react';
import { StyleSheet, View, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { Text, TouchableRipple, FAB } from 'react-native-paper';
import { Film, Search, History, Tv } from 'lucide-react-native';
import { useAppTheme } from '../theme/ThemeContext';

import { isTV } from '../utils/device';

export const BottomNav = ({ state, navigation }) => {
    const { theme, isDarkMode } = useAppTheme();

    // --- TV CHECK ---
    // On TV, we hide the BottomNav entirely to maintain a cinematic look.
    // Navigation on TV is handled via the TopBar or Side Menu.
    if (isTV || !state || !state.routes) return null;

    const currentTab = state.routes[state.index];

    const getActiveRouteName = (route) => {
        if (!route.state) return route.name;
        const routeState = route.state;
        return routeState.routes[routeState.index].name;
    };

    const activeRouteName = getActiveRouteName(currentTab);

    // Hide on Player Screen
    if (activeRouteName === 'Player') return null;

    const isHomeFocused = state.index === 0;

    const NavItem = ({ Icon, label, index }) => {
        const isFocused = state.index === index;
        const onPress = () => {
            const route = state.routes[index];
            navigation.navigate(route.name);
        };

        return (
            <TouchableRipple
                onPress={onPress}
                style={styles.navItem}
                borderless
                rippleColor="rgba(233, 30, 99, 0.1)"
            >
                <View style={{ alignItems: 'center' }}>
                    <Icon
                        size={20}
                        strokeWidth={isFocused ? 2.5 : 2}
                        color={isFocused ? theme.colors.primary : theme.colors.onSurfaceVariant}
                    />
                    <Text style={[
                        styles.label,
                        { color: isFocused ? theme.colors.primary : theme.colors.onSurfaceVariant }
                    ]}>
                        {label}
                    </Text>
                </View>
            </TouchableRipple>
        );
    };

    return (
        <View style={styles.wrapper}>
            {/* Centered Action FAB */}
            <FAB
                icon="play"
                color="white"
                customSize={56}
                style={[
                    styles.fab,
                    {
                        backgroundColor: isHomeFocused ? theme.colors.primary : theme.colors.secondary,
                        transform: [{ scale: isHomeFocused ? 1.1 : 1 }]
                    }
                ]}
                onPress={() => {
                    const homeRoute = state.routes[0];
                    navigation.navigate(homeRoute.name);
                }}
            />

            <BlurView
                intensity={80}
                tint={isDarkMode ? 'dark' : 'light'}
                style={[
                    styles.container,
                    {
                        borderColor: theme.colors.outlineVariant,
                        backgroundColor: isDarkMode ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.5)'
                    }
                ]}
            >
                <NavItem Icon={Film} label="Movies" index={1} />
                <NavItem Icon={Search} label="Search" index={2} />

                {/* Spacer for the FAB */}
                <View style={styles.spacer} />

                <NavItem Icon={History} label="History" index={3} />
                <NavItem Icon={Tv} label="Tv" index={4} />
            </BlurView>
        </View>
    );
};

const styles = StyleSheet.create({
    wrapper: {
        position: 'absolute',
        bottom: Platform.OS === 'ios' ? 35 : 20, // Adjusted for iOS home indicator
        width: Platform.OS === 'web' ? 420 : '92%',
        alignSelf: 'center',
        alignItems: 'center',
        zIndex: 1000,
    },
    container: {
        width: '100%',
        height: 64,
        borderRadius: 32,
        flexDirection: 'row',
        overflow: 'hidden',
        borderWidth: 1,
        elevation: 4,
    },
    fab: {
        position: 'absolute',
        top: -28,
        zIndex: 1010,
        borderRadius: 28,
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 5,
    },
    navItem: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },
    spacer: { flex: 0.7 },
    label: {
        fontSize: 8,
        marginTop: 4,
        fontWeight: '900',
        letterSpacing: 0.5
    }
});