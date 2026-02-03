import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { HomeScreen } from '../screens/HomeScreen';
import { MoviesScreen } from '../screens/MoviesScreen';
import { TVScreen } from '../screens/TVScreen';
import { SearchScreen } from '../screens/SearchScreen';
import { MovieDetailScreen } from '../screens/MovieDetailScreen';
import { BottomNav } from '../components/BottomNav';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// Stack for the Home Tab
const HomeStack = () => (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="HomeMain" component={HomeScreen} />
        <Stack.Screen name="MovieDetail" component={MovieDetailScreen} />
    </Stack.Navigator>
);

///movies stack
const MoviesStack = () => (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="MoviesMain" component={MoviesScreen} />
        <Stack.Screen name="MovieDetail" component={MovieDetailScreen} />
    </Stack.Navigator>
);

// Stack for the Search Tab (allows details from search results)
const SearchStack = () => (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="SearchMain" component={SearchScreen} />
        <Stack.Screen name="MovieDetail" component={MovieDetailScreen} />
    </Stack.Navigator>
);

///tv
const TVStack = () => (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="TVMain" component={TVScreen} />
        <Stack.Screen name="MovieDetail" component={MovieDetailScreen} />
    </Stack.Navigator>
);

export const AppNavigator = () => {
    return (
        <Tab.Navigator
            initialRouteName="Home"
            tabBar={(props) => <BottomNav {...props} />}
            screenOptions={{ headerShown: false }}
        >
            <Tab.Screen name="Home" component={HomeStack} />
            <Tab.Screen name="Movies" component={MoviesStack} />
            <Tab.Screen name="Search" component={SearchStack} />
            <Tab.Screen name="History" component={HomeScreen} />
            <Tab.Screen name="TV" component={TVStack} />
        </Tab.Navigator>
    );
};