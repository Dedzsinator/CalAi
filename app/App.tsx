import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import Toast from 'react-native-toast-message';
import { StatusBar, Platform } from 'react-native';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';

// Redux store
import { store, persistor } from './src/store';

// Screens
import LoginScreen from './src/screens/auth/LoginScreen';
import RegisterScreen from './src/screens/auth/RegisterScreen';
import OnboardingScreen from './src/screens/auth/OnboardingScreen';
import CameraScreen from './src/screens/camera/CameraScreen';
import HomeScreen from './src/screens/home/HomeScreen';
import MealsScreen from './src/screens/meals/MealsScreen';
import AnalyticsScreen from './src/screens/analytics/AnalyticsScreen';
import ProfileScreen from './src/screens/profile/ProfileScreen';
import MealDetailScreen from './src/screens/meals/MealDetailScreen';
import FoodSearchScreen from './src/screens/search/FoodSearchScreen';
import SettingsScreen from './src/screens/settings/SettingsScreen';

// Components
import LoadingScreen from './src/components/common/LoadingScreen';
import TabBarIcon from './src/components/navigation/TabBarIcon';
import CustomHeader from './src/components/navigation/CustomHeader';

// Hooks & Utils
import { useAuth } from './src/hooks/useAuth';
import { useAppTheme } from './src/hooks/useAppTheme';
import { initializeApp } from './src/utils/app';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Tab Navigator for authenticated users
const TabNavigator = () => {
    const { colors } = useAppTheme();

    return (
        <Tab.Navigator
            screenOptions={{
                tabBarStyle: {
                    backgroundColor: colors.surface,
                    borderTopColor: colors.border,
                    paddingTop: 5,
                    paddingBottom: Platform.OS === 'ios' ? 25 : 10,
                    height: Platform.OS === 'ios' ? 85 : 70,
                },
                tabBarActiveTintColor: colors.primary,
                tabBarInactiveTintColor: colors.textSecondary,
                headerShown: false,
            }}>
            <Tab.Screen
                name="Home"
                component={HomeScreen}
                options={{
                    tabBarIcon: ({ color, size }) => (
                        <TabBarIcon name="home" color={color} size={size} />
                    ),
                }}
            />
            <Tab.Screen
                name="Camera"
                component={CameraScreen}
                options={{
                    tabBarIcon: ({ color, size }) => (
                        <TabBarIcon name="camera" color={color} size={size} />
                    ),
                    tabBarLabel: 'Scan',
                }}
            />
            <Tab.Screen
                name="Meals"
                component={MealsScreen}
                options={{
                    tabBarIcon: ({ color, size }) => (
                        <TabBarIcon name="restaurant" color={color} size={size} />
                    ),
                }}
            />
            <Tab.Screen
                name="Analytics"
                component={AnalyticsScreen}
                options={{
                    tabBarIcon: ({ color, size }) => (
                        <TabBarIcon name="analytics" color={color} size={size} />
                    ),
                    tabBarLabel: 'Insights',
                }}
            />
            <Tab.Screen
                name="Profile"
                component={ProfileScreen}
                options={{
                    tabBarIcon: ({ color, size }) => (
                        <TabBarIcon name="person" color={color} size={size} />
                    ),
                }}
            />
        </Tab.Navigator>
    );
};

// Main App Navigator
const AppNavigator = () => {
    const { isAuthenticated, isLoading } = useAuth();
    const { colors } = useAppTheme();

    if (isLoading) {
        return <LoadingScreen />;
    }

    return (
        <NavigationContainer>
            <StatusBar
                barStyle="dark-content"
                backgroundColor={colors.background}
                translucent={false}
            />
            <Stack.Navigator
                screenOptions={{
                    headerStyle: {
                        backgroundColor: colors.surface,
                    },
                    headerTintColor: colors.text,
                    headerTitleStyle: {
                        fontWeight: '600',
                    },
                }}>
                {!isAuthenticated ? (
                    // Auth Stack
                    <>
                        <Stack.Screen
                            name="Onboarding"
                            component={OnboardingScreen}
                            options={{ headerShown: false }}
                        />
                        <Stack.Screen
                            name="Login"
                            component={LoginScreen}
                            options={{ headerShown: false }}
                        />
                        <Stack.Screen
                            name="Register"
                            component={RegisterScreen}
                            options={{ headerShown: false }}
                        />
                    </>
                ) : (
                    // Authenticated Stack
                    <>
                        <Stack.Screen
                            name="Main"
                            component={TabNavigator}
                            options={{ headerShown: false }}
                        />
                        <Stack.Screen
                            name="MealDetail"
                            component={MealDetailScreen}
                            options={{
                                title: 'Meal Details',
                                header: props => <CustomHeader {...props} />,
                            }}
                        />
                        <Stack.Screen
                            name="FoodSearch"
                            component={FoodSearchScreen}
                            options={{
                                title: 'Search Food',
                                header: props => <CustomHeader {...props} />,
                            }}
                        />
                        <Stack.Screen
                            name="Settings"
                            component={SettingsScreen}
                            options={{
                                title: 'Settings',
                                header: props => <CustomHeader {...props} />,
                            }}
                        />
                    </>
                )}
            </Stack.Navigator>
        </NavigationContainer>
    );
};

const App = () => {
    React.useEffect(() => {
        // Initialize app
        initializeApp().then(() => {
            SplashScreen.hide();
        });
    }, []);

    return (
        <Provider store={store}>
            <PersistGate loading={<LoadingScreen />} persistor={persistor}>
                <AppNavigator />
                <Toast />
            </PersistGate>
        </Provider>
    );
};

export default App;
