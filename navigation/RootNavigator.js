import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { PaperProvider, Portal } from 'react-native-paper';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useAppTheme } from '../theme/ThemeContext';
import { AppNavigator } from './AppNavigator';
import { ForceUpdateModal } from '../components/ForceUpdateModal';
import { logScreenView } from '../services/analytics';

const RootNavigator = () => {
    const { theme } = useAppTheme();

    return (
        <PaperProvider
            theme={theme}
            settings={{
                icon: (props) => <MaterialCommunityIcons {...props} />,
            }}
        >
            <Portal.Host>
                <NavigationContainer
                    theme={theme}
                    onStateChange={(state) => {
                        const route = state.routes[state.index];
                        logScreenView(route.name);
                    }}
                >
                    <AppNavigator />
                </NavigationContainer>
            </Portal.Host>
        </PaperProvider>
    );
};

export default RootNavigator;
