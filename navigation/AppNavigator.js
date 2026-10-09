import React from 'react';
import { View, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { isTV } from '../utils/device';

// SCREENS
import { HomeScreen } from '../screens/HomeScreen';
import { MoviesScreen } from '../screens/MoviesScreen';
import { TVScreen } from '../screens/TVScreen';
import { PlayerScreen } from '../screens/PlayerScreen';
import { SearchScreen } from '../screens/SearchScreen';
import { HistoryScreen } from '../screens/HistoryScreen';
import { ProgressScreen } from '../screens/ProgressScreen';
import { BookmarksScreen } from '../screens/BookmarksScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { MovieDetailScreen } from '../screens/MovieDetailScreen';

// COMPONENTS
import { BottomNav } from '../components/BottomNav';
import { SideMenu } from '../components/SideMenu';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const createStack = (MainComponent) => () => (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Main" component={MainComponent} />
        <Stack.Screen name="MovieDetail" component={MovieDetailScreen} />
        <Stack.Screen name="Player" component={PlayerScreen} />
    </Stack.Navigator>
);

export const AppNavigator = () => {
    return (
        <View style={styles.appWrapper}>
            <Tab.Navigator
                initialRouteName="Home"
                tabBar={(props) => (
                    <>
                        <BottomNav {...props} />
                        {isTV && <SideMenu state={props.state} />}
                    </>
                )}
                screenOptions={{
                    headerShown: false,
                    swipeEnabled: !isTV,
                }}
            >
                <Tab.Screen name="Home" component={createStack(HomeScreen)} />
                <Tab.Screen name="Movies" component={createStack(MoviesScreen)} />
                <Tab.Screen name="Bookmarks" component={createStack(BookmarksScreen)} />
                <Tab.Screen name="Progress" component={createStack(ProgressScreen)} />
                <Tab.Screen name="Settings" component={createStack(SettingsScreen)} />
                <Tab.Screen name="History" component={createStack(HistoryScreen)} />
                <Tab.Screen name="Search" component={createStack(SearchScreen)} />
                <Tab.Screen name="Tv" component={createStack(TVScreen)} />
            </Tab.Navigator>
        </View>
    );
};

const styles = StyleSheet.create({
    appWrapper: {
        flex: 1,
        backgroundColor: '#000',
    },
});
