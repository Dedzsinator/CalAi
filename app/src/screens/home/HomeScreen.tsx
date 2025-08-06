import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
    RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { MaterialIcons } from '@expo/vector-icons';

import { RootState, AppDispatch } from '../../store';
import { fetchTodaysMeals } from '../../store/slices/mealSlice';
import { QuickAddCard } from '../../components/nutrition/QuickAddCard';
import { TodaysProgress } from '../../components/nutrition/TodaysProgress';
import { RecentMeals } from '../../components/nutrition/RecentMeals';
import { SmartSuggestions } from '../../components/ai/SmartSuggestions';

const HomeScreen: React.FC = () => {
    const navigation = useNavigation();
    const dispatch = useDispatch<AppDispatch>();
    const { user } = useSelector((state: RootState) => state.auth);
    const { todaysMeals, isLoading } = useSelector((state: RootState) => state.meals);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        dispatch(fetchTodaysMeals());
    }, [dispatch]);

    const onRefresh = async () => {
        setRefreshing(true);
        await dispatch(fetchTodaysMeals());
        setRefreshing(false);
    };

    const navigateToCamera = () => {
        navigation.navigate('Camera' as never);
    };

    const navigateToManualAdd = () => {
        navigation.navigate('FoodSearch' as never);
    };

    const navigateToMeals = () => {
        navigation.navigate('Meals' as never);
    };

    const navigateToAnalytics = () => {
        navigation.navigate('Analytics' as never);
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView
                style={styles.scrollView}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                {/* Header */}
                <View style={styles.header}>
                    <View>
                        <Text style={styles.greeting}>
                            Good {getTimeOfDay()}, {user?.name || 'there'}!
                        </Text>
                        <Text style={styles.subtitle}>Let's track your nutrition today</Text>
                    </View>
                    <TouchableOpacity
                        style={styles.profileButton}
                        onPress={() => navigation.navigate('Profile' as never)}
                    >
                        <MaterialIcons name="account-circle" size={32} color="#007AFF" />
                    </TouchableOpacity>
                </View>

                {/* Quick Add Actions */}
                <View style={styles.quickActions}>
                    <TouchableOpacity style={styles.primaryAction} onPress={navigateToCamera}>
                        <MaterialIcons name="camera-alt" size={24} color="white" />
                        <Text style={styles.primaryActionText}>Scan Food</Text>
                    </TouchableOpacity>

                    <View style={styles.secondaryActions}>
                        <TouchableOpacity style={styles.secondaryAction} onPress={navigateToManualAdd}>
                            <MaterialIcons name="search" size={20} color="#007AFF" />
                            <Text style={styles.secondaryActionText}>Search</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.secondaryAction} onPress={() => { }}>
                            <MaterialIcons name="qr-code-scanner" size={20} color="#007AFF" />
                            <Text style={styles.secondaryActionText}>Barcode</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Today's Progress */}
                <TodaysProgress meals={todaysMeals} isLoading={isLoading} />

                {/* Smart Suggestions */}
                <SmartSuggestions />

                {/* Quick Add Cards */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Quick Add</Text>
                    <QuickAddCard />
                </View>

                {/* Recent Meals */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Recent Meals</Text>
                        <TouchableOpacity onPress={navigateToMeals}>
                            <Text style={styles.seeAllText}>See All</Text>
                        </TouchableOpacity>
                    </View>
                    <RecentMeals meals={todaysMeals.slice(0, 3)} />
                </View>

                {/* Insights Preview */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Today's Insights</Text>
                        <TouchableOpacity onPress={navigateToAnalytics}>
                            <Text style={styles.seeAllText}>View Analytics</Text>
                        </TouchableOpacity>
                    </View>
                    <View style={styles.insightCard}>
                        <MaterialIcons name="trending-up" size={24} color="#4CAF50" />
                        <View style={styles.insightContent}>
                            <Text style={styles.insightTitle}>Great protein intake!</Text>
                            <Text style={styles.insightDescription}>
                                You're 95% towards your daily protein goal
                            </Text>
                        </View>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const getTimeOfDay = (): string => {
    const hour = new Date().getHours();
    if (hour < 12) return 'morning';
    if (hour < 17) return 'afternoon';
    return 'evening';
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    scrollView: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        backgroundColor: 'white',
    },
    greeting: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
        marginTop: 4,
    },
    profileButton: {
        padding: 4,
    },
    quickActions: {
        padding: 20,
    },
    primaryAction: {
        backgroundColor: '#007AFF',
        borderRadius: 12,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    primaryActionText: {
        color: 'white',
        fontSize: 18,
        fontWeight: '600',
        marginLeft: 8,
    },
    secondaryActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    secondaryAction: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 16,
        flex: 1,
        marginHorizontal: 6,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    secondaryActionText: {
        color: '#007AFF',
        fontSize: 14,
        fontWeight: '500',
        marginTop: 4,
    },
    section: {
        marginTop: 24,
        paddingHorizontal: 20,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
    },
    seeAllText: {
        color: '#007AFF',
        fontSize: 16,
        fontWeight: '500',
    },
    insightCard: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    insightContent: {
        marginLeft: 12,
        flex: 1,
    },
    insightTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 4,
    },
    insightDescription: {
        fontSize: 14,
        color: '#666',
    },
});

export default HomeScreen;
