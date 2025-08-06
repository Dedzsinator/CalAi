import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    RefreshControl,
    Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { MaterialIcons as Icon } from '@expo/vector-icons';

import { RootState, AppDispatch } from '../../store';
import { fetchAnalytics, setDateRange } from '../../store/slices/analyticsSlice';
import { CalorieChart } from '../../components/analytics/CalorieChart';
import { NutritionBreakdown } from '../../components/analytics/NutritionBreakdown';
import { ProgressCard } from '../../components/analytics/ProgressCard';
import { InsightCard } from '../../components/analytics/InsightCard';
import { DateRangeSelector } from '../../components/analytics/DateRangeSelector';

const { width } = Dimensions.get('window');

const AnalyticsScreen: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const { data, isLoading, dateRange, error } = useSelector(
        (state: RootState) => state.analytics
    );
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        dispatch(fetchAnalytics(dateRange));
    }, [dispatch, dateRange]);

    const onRefresh = async () => {
        setRefreshing(true);
        await dispatch(fetchAnalytics(dateRange));
        setRefreshing(false);
    };

    const handleDateRangeChange = (range: 'week' | 'month' | 'year') => {
        dispatch(setDateRange(range));
    };

    if (error) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.errorContainer}>
                    <Icon name="error-outline" size={48} color="#FF5722" />
                    <Text style={styles.errorTitle}>Unable to load analytics</Text>
                    <Text style={styles.errorMessage}>{error}</Text>
                    <TouchableOpacity style={styles.retryButton} onPress={onRefresh}>
                        <Text style={styles.retryButtonText}>Retry</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView
                style={styles.scrollView}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.title}>Analytics</Text>
                    <TouchableOpacity style={styles.exportButton}>
                        <Icon name="file-download" size={20} color="#007AFF" />
                    </TouchableOpacity>
                </View>

                {/* Date Range Selector */}
                <DateRangeSelector
                    selectedRange={dateRange}
                    onRangeChange={handleDateRangeChange}
                />

                {/* Progress Overview */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Progress Overview</Text>
                    <View style={styles.progressCards}>
                        <ProgressCard
                            title="Current Streak"
                            value={data?.streaks.currentStreak || 0}
                            unit="days"
                            icon="local-fire-department"
                            color="#FF6B35"
                        />
                        <ProgressCard
                            title="Avg Calories"
                            value={data?.weeklyNutrition ?
                                Math.round((data.weeklyNutrition.protein * 4 +
                                    data.weeklyNutrition.carbs * 4 +
                                    data.weeklyNutrition.fat * 9) / 7) : 0}
                            unit="kcal"
                            icon="local-dining"
                            color="#4CAF50"
                        />
                    </View>
                </View>

                {/* Calorie Trends */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Calorie Trends</Text>
                    <View style={styles.chartContainer}>
                        <CalorieChart
                            data={data?.dailyCalories || []}
                            goal={data?.goals.dailyCalories || 2000}
                            isLoading={isLoading}
                        />
                    </View>
                </View>

                {/* Nutrition Breakdown */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Nutrition Breakdown</Text>
                    <NutritionBreakdown
                        nutrition={data?.weeklyNutrition}
                        goals={data?.goals}
                        isLoading={isLoading}
                    />
                </View>

                {/* Insights */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Insights</Text>
                    <InsightCard
                        title="Protein Intake"
                        description="You're consistently meeting your protein goals"
                        type="success"
                        action="View Details"
                    />
                    <InsightCard
                        title="Meal Timing"
                        description="Consider eating lunch earlier for better metabolism"
                        type="info"
                        action="Learn More"
                    />
                    <InsightCard
                        title="Hydration"
                        description="Your water intake could be improved"
                        type="warning"
                        action="Set Reminder"
                    />
                </View>

                {/* Goals Summary */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Goals Progress</Text>
                    <View style={styles.goalsGrid}>
                        {data?.goals && (
                            <>
                                <GoalCard
                                    title="Calories"
                                    current={data.weeklyNutrition ?
                                        Math.round((data.weeklyNutrition.protein * 4 +
                                            data.weeklyNutrition.carbs * 4 +
                                            data.weeklyNutrition.fat * 9) / 7) : 0}
                                    target={data.goals.dailyCalories}
                                    unit="kcal"
                                />
                                <GoalCard
                                    title="Protein"
                                    current={Math.round(data.weeklyNutrition?.protein / 7 || 0)}
                                    target={data.goals.protein}
                                    unit="g"
                                />
                                <GoalCard
                                    title="Carbs"
                                    current={Math.round(data.weeklyNutrition?.carbs / 7 || 0)}
                                    target={data.goals.carbs}
                                    unit="g"
                                />
                                <GoalCard
                                    title="Fat"
                                    current={Math.round(data.weeklyNutrition?.fat / 7 || 0)}
                                    target={data.goals.fat}
                                    unit="g"
                                />
                            </>
                        )}
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const GoalCard: React.FC<{
    title: string;
    current: number;
    target: number;
    unit: string;
}> = ({ title, current, target, unit }) => {
    const percentage = Math.round((current / target) * 100);
    const isOnTrack = percentage >= 80 && percentage <= 120;

    return (
        <View style={styles.goalCard}>
            <Text style={styles.goalTitle}>{title}</Text>
            <Text style={styles.goalValue}>
                {current} / {target} {unit}
            </Text>
            <View style={styles.progressBar}>
                <View
                    style={[
                        styles.progressFill,
                        {
                            width: `${Math.min(percentage, 100)}%`,
                            backgroundColor: isOnTrack ? '#4CAF50' : '#FF9800',
                        },
                    ]}
                />
            </View>
            <Text style={[styles.goalPercentage, { color: isOnTrack ? '#4CAF50' : '#FF9800' }]}>
                {percentage}%
            </Text>
        </View>
    );
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
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#333',
    },
    exportButton: {
        padding: 8,
    },
    section: {
        marginTop: 24,
        paddingHorizontal: 20,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 16,
    },
    progressCards: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    chartContainer: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    goalsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    goalCard: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 16,
        width: (width - 52) / 2, // 52 = padding + gap
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    goalTitle: {
        fontSize: 14,
        fontWeight: '500',
        color: '#666',
        marginBottom: 8,
    },
    goalValue: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 8,
    },
    progressBar: {
        backgroundColor: '#e0e0e0',
        height: 4,
        borderRadius: 2,
        marginBottom: 8,
    },
    progressFill: {
        height: 4,
        borderRadius: 2,
    },
    goalPercentage: {
        fontSize: 12,
        fontWeight: '500',
        textAlign: 'right',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    errorTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        marginTop: 16,
        marginBottom: 8,
    },
    errorMessage: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        marginBottom: 24,
    },
    retryButton: {
        backgroundColor: '#007AFF',
        borderRadius: 8,
        paddingHorizontal: 24,
        paddingVertical: 12,
    },
    retryButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
});

export default AnalyticsScreen;
