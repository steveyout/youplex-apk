import React from 'react';
import { StyleSheet, View, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { Text, TouchableRipple, FAB } from 'react-native-paper';
import { Film, Search, History, Tv } from 'lucide-react-native';
import { useAppTheme } from '../theme/ThemeContext';

export const BottomNav = ({ state, navigation }) => {
    const { theme, isDarkMode } = useAppTheme();

    if (!state || !state.routes) return null;
    // 1. GET THE ACTIVE TAB
    const currentTab = state.routes[state.index];

    // 2. CHECK IF PLAYER IS ACTIVE IN THE NESTED STACK
    // In a Stack inside a Tab, the stack state is found in currentTab.state
    const getActiveRouteName = (route) => {
        if (!route.state) return route.name;
        const routeState = route.state;
        return routeState.routes[routeState.index].name;
    };

    const activeRouteName = getActiveRouteName(currentTab);

    // 3. HIDE NAV IF ON PLAYER SCREEN
    if (activeRouteName === 'Player') {
        return null;
    }

    // We assume index 0 is your Home/Movies screen
    const isHomeFocused = state.index === 0;

    const NavItem = ({ Icon, label, index }) => {
        const isFocused = state.index === index;
        const onPress = () => {
            const route = state.routes[index];
            navigation.navigate(route.name);
        };

        // If index is 0, we might want to hide the label or change behavior
        // since the FAB handles the "Home" action now.
        return (
            <TouchableRipple onPress={onPress} style={styles.navItem} borderless>
                <View style={{ alignItems: 'center' }}>
                    <Icon size={20} color={isFocused ? theme.colors.primary : theme.colors.onSurfaceVariant} />
                    <Text style={[styles.label, { color: isFocused ? theme.colors.primary : theme.colors.onSurfaceVariant }]}>
                        {label}
                    </Text>
                </View>
            </TouchableRipple>
        );
    };

    return (
        <View style={styles.wrapper}>
            {/* The FAB now navigates to the first route (Home) and changes color when active */}
            <FAB
                icon="play"
                color="white"
                style={[
                    styles.fab,
                    {
                        backgroundColor: isHomeFocused ? theme.colors.primary : theme.colors.secondary,
                        transform: [{ scale: isHomeFocused ? 1.1 : 1 }] // Slight scale up when active
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
                style={[styles.container, { borderColor: theme.colors.outlineVariant }]}
            >
                {/* We keep the items, but the FAB acts as the primary "Play/Home" trigger */}
                <NavItem Icon={Film} label="MOVIES" index={1} />
                <NavItem Icon={Search} label="SEARCH" index={2} />

                <View style={styles.spacer} />

                <NavItem Icon={History} label="HISTORY" index={3} />
                <NavItem Icon={Tv} label="TV" index={4} />
            </BlurView>
        </View>
    );
};

const styles = StyleSheet.create({
    wrapper: {
        position: 'absolute',
        bottom: 25,
        width: Platform.OS === 'web' ? 420 : '92%',
        alignSelf: 'center',
        alignItems: 'center'
    },
    container: {
        width: '100%',
        height: 70,
        borderRadius: 35,
        flexDirection: 'row',
        overflow: 'hidden',
        borderWidth: 1
    },
    fab: {
        position: 'absolute',
        top: -30, // Adjusted slightly higher to look more "floating"
        zIndex: 10,
        borderRadius: 30,
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4.65,
    },
    navItem: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    spacer: { flex: 0.8 },
    label: { fontSize: 9, marginTop: 4, fontWeight: '800' }
});