import React, { useState } from 'react';
import { StyleSheet, View, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { Text, TouchableRipple, FAB } from 'react-native-paper';
import { Film, Search, History, Tv } from 'lucide-react-native';
import { useAppTheme } from '../theme/ThemeContext';

export const BottomNav = () => {
    const { theme, isDarkMode } = useAppTheme();
    const [activeIndex, setActiveIndex] = useState(0);

    const NavItem = ({ Icon, label, index }) => (
        <TouchableRipple
            onPress={() => setActiveIndex(index)}
            style={styles.navItem}
            borderless
        >
            <View style={{ alignItems: 'center' }}>
                <Icon
                    size={20}
                    color={activeIndex === index ? theme.colors.primary : theme.colors.onSurfaceVariant}
                />
                <Text style={[
                    styles.label,
                    { color: activeIndex === index ? theme.colors.primary : theme.colors.onSurfaceVariant }
                ]}>
                    {label}
                </Text>
            </View>
        </TouchableRipple>
    );

    return (
        <View style={styles.wrapper}>
            <FAB
                icon="play"
                color="white"
                style={[styles.fab, { backgroundColor: theme.colors.primary }]}
                onPress={() => {}}
            />
            <BlurView
                intensity={80}
                tint={isDarkMode ? 'dark' : 'light'}
                style={[styles.container, { borderColor: theme.colors.outlineVariant }]}
            >
                <NavItem Icon={Film} label="MOVIES" index={0} />
                <NavItem Icon={Search} label="SEARCH" index={1} />
                <View style={styles.spacer} />
                <NavItem Icon={History} label="HISTORY" index={2} />
                <NavItem Icon={Tv} label="TV" index={3} />
            </BlurView>
        </View>
    );
};

const styles = StyleSheet.create({
    wrapper: { position: 'absolute', bottom: 25, width: Platform.OS === 'web' ? 420 : '92%', alignSelf: 'center', alignItems: 'center' },
    container: { width: '100%', height: 70, borderRadius: 35, flexDirection: 'row', overflow: 'hidden', borderWidth: 1 },
    fab: { position: 'absolute', top: -25, zIndex: 10, borderRadius: 30 },
    navItem: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    spacer: { flex: 0.8 },
    label: { fontSize: 9, marginTop: 4, fontWeight: '800' }
});