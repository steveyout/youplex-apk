import React from 'react';
import { StyleSheet, View, ScrollView } from 'react-native';
import { Text } from 'react-native-paper';
import { TopBar } from '../components/TopBar';
import { BottomNav } from '../components/BottomNav';
import { useAppTheme } from '../theme/ThemeContext';

export const HomeScreen = () => {
    const { theme } = useAppTheme();

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <TopBar />

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                <Text style={[styles.title, { color: theme.colors.onBackground }]}>
                    Trending Now
                </Text>

                {/* Placeholder for Movie Content */}
                <View style={[styles.placeholder, { backgroundColor: theme.colors.surfaceVariant }]} />
            </ScrollView>

            <BottomNav />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    scrollContent: {
        paddingTop: 110, // Space for TopBar
        paddingBottom: 110, // Space for BottomNav
        paddingHorizontal: 20,
    },
    title: { fontSize: 24, fontWeight: '900', marginBottom: 20 },
    placeholder: { height: 800, borderRadius: 20, opacity: 0.3 }
});