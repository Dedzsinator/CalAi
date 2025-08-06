import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface NutritionDay {
    date: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
    sugar: number;
    sodium: number;
}

interface NutritionTrendsProps {
    data: NutritionDay[];
    dailyGoals: {
        calories: number;
        protein: number;
        carbs: number;
        fat: number;
    };
}

type MetricType = 'calories' | 'protein' | 'carbs' | 'fat';

const NutritionTrends: React.FC<NutritionTrendsProps> = ({
    data,
    dailyGoals
}) => {
    const [selectedMetric, setSelectedMetric] = useState<MetricType>('calories');

    const metrics = [
        { key: 'calories' as const, label: 'Calories', unit: 'cal', color: '#2196F3' },
        { key: 'protein' as const, label: 'Protein', unit: 'g', color: '#4CAF50' },
        { key: 'carbs' as const, label: 'Carbs', unit: 'g', color: '#FF9800' },
        { key: 'fat' as const, label: 'Fat', unit: 'g', color: '#F44336' },
    ];

    const getMetricData = (metric: MetricType) => {
        return data.slice(-7).map(day => day[metric]);
    };

    const getAverage = (metric: MetricType) => {
        const values = getMetricData(metric);
        return values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
    };

    const getGoalPercentage = (metric: MetricType) => {
        const average = getAverage(metric);
        const goal = dailyGoals[metric];
        return goal > 0 ? (average / goal) * 100 : 0;
    };

    const getTrend = (metric: MetricType) => {
        const values = getMetricData(metric);
        if (values.length < 2) return 'stable';

        const recent = values.slice(-3).reduce((a, b) => a + b, 0) / 3;
        const older = values.slice(0, -3).reduce((a, b) => a + b, 0) / (values.length - 3);

        const change = ((recent - older) / older) * 100;

        if (change > 5) return 'increasing';
        if (change < -5) return 'decreasing';
        return 'stable';
    };

    const renderMetricSelector = () => (
        <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.metricSelector}
        >
            {metrics.map((metric) => (
                <TouchableOpacity
                    key={metric.key}
                    style={[
                        styles.metricButton,
                        selectedMetric === metric.key && styles.metricButtonActive,
                        { borderColor: metric.color }
                    ]}
                    onPress={() => setSelectedMetric(metric.key)}
                >
                    <Text style={[
                        styles.metricButtonText,
                        selectedMetric === metric.key && { color: metric.color }
                    ]}>
                        {metric.label}
                    </Text>
                </TouchableOpacity>
            ))}
        </ScrollView>
    );

    const renderTrendIndicator = (trend: string) => {
        const icons = {
            increasing: 'trending-up',
            decreasing: 'trending-down',
            stable: 'remove'
        };

        const colors = {
            increasing: '#4CAF50',
            decreasing: '#F44336',
            stable: '#666'
        };

        return (
            <View style={styles.trendIndicator}>
                <Ionicons
                    name={icons[trend as keyof typeof icons] as any}
                    size={16}
                    color={colors[trend as keyof typeof colors]}
                />
                <Text style={[styles.trendText, { color: colors[trend as keyof typeof colors] }]}>
                    {trend.charAt(0).toUpperCase() + trend.slice(1)}
                </Text>
            </View>
        );
    };

    const renderBarChart = () => {
        const selectedMetricData = metrics.find(m => m.key === selectedMetric);
        if (!selectedMetricData) return null;

        const values = getMetricData(selectedMetric);
        const maxValue = Math.max(...values, dailyGoals[selectedMetric]);
        const goal = dailyGoals[selectedMetric];

        return (
            <View style={styles.chartContainer}>
                <View style={styles.chartHeader}>
                    <Text style={styles.chartTitle}>
                        7-Day {selectedMetricData.label} Intake
                    </Text>
                    <Text style={styles.goalText}>
                        Goal: {goal} {selectedMetricData.unit}
                    </Text>
                </View>

                <View style={styles.barsContainer}>
                    {values.map((value, index) => {
                        const height = (value / maxValue) * 120;
                        const goalHeight = (goal / maxValue) * 120;
                        const date = new Date(data[data.length - 7 + index]?.date || new Date());
                        const dayLabel = date.toLocaleDateString('en', { weekday: 'short' });

                        return (
                            <View key={index} style={styles.barColumn}>
                                <View style={styles.barContainer}>
                                    {/* Goal line */}
                                    <View
                                        style={[
                                            styles.goalLine,
                                            { bottom: goalHeight, backgroundColor: selectedMetricData.color + '40' }
                                        ]}
                                    />

                                    {/* Actual bar */}
                                    <View
                                        style={[
                                            styles.bar,
                                            {
                                                height: height,
                                                backgroundColor: value >= goal ? selectedMetricData.color : selectedMetricData.color + '80'
                                            }
                                        ]}
                                    />
                                </View>

                                <Text style={styles.barValue}>
                                    {Math.round(value)}
                                </Text>
                                <Text style={styles.barLabel}>{dayLabel}</Text>
                            </View>
                        );
                    })}
                </View>
            </View>
        );
    };

    const selectedMetricData = metrics.find(m => m.key === selectedMetric);
    const average = getAverage(selectedMetric);
    const goalPercentage = getGoalPercentage(selectedMetric);
    const trend = getTrend(selectedMetric);

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Nutrition Trends</Text>

            {renderMetricSelector()}

            {selectedMetricData && (
                <View style={styles.statsContainer}>
                    <View style={styles.statItem}>
                        <Text style={styles.statValue}>
                            {Math.round(average)} {selectedMetricData.unit}
                        </Text>
                        <Text style={styles.statLabel}>7-Day Average</Text>
                    </View>

                    <View style={styles.statItem}>
                        <Text style={[
                            styles.statValue,
                            { color: goalPercentage >= 100 ? '#4CAF50' : '#F44336' }
                        ]}>
                            {Math.round(goalPercentage)}%
                        </Text>
                        <Text style={styles.statLabel}>of Goal</Text>
                    </View>

                    <View style={styles.statItem}>
                        {renderTrendIndicator(trend)}
                    </View>
                </View>
            )}

            {renderBarChart()}

            {/* Insights */}
            <View style={styles.insightsContainer}>
                <Text style={styles.insightsTitle}>Insights</Text>
                {goalPercentage < 80 && (
                    <Text style={styles.insightText}>
                        📉 You're averaging {Math.round(100 - goalPercentage)}% below your {selectedMetricData?.label.toLowerCase()} goal
                    </Text>
                )}
                {goalPercentage > 120 && (
                    <Text style={styles.insightText}>
                        📈 You're exceeding your {selectedMetricData?.label.toLowerCase()} goal by {Math.round(goalPercentage - 100)}%
                    </Text>
                )}
                {trend === 'increasing' && (
                    <Text style={styles.insightText}>
                        🔥 Your {selectedMetricData?.label.toLowerCase()} intake is trending upward
                    </Text>
                )}
                {trend === 'decreasing' && (
                    <Text style={styles.insightText}>
                        📉 Your {selectedMetricData?.label.toLowerCase()} intake is trending downward
                    </Text>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginVertical: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    title: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
        marginBottom: 16,
    },
    metricSelector: {
        marginBottom: 16,
    },
    metricButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#e0e0e0',
        marginRight: 8,
        backgroundColor: '#fff',
    },
    metricButtonActive: {
        backgroundColor: '#f8f9fa',
    },
    metricButtonText: {
        fontSize: 14,
        color: '#666',
        fontWeight: '500',
    },
    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 20,
        paddingVertical: 12,
        backgroundColor: '#f8f9fa',
        borderRadius: 8,
    },
    statItem: {
        alignItems: 'center',
    },
    statValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    statLabel: {
        fontSize: 12,
        color: '#666',
        marginTop: 4,
    },
    trendIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    trendText: {
        fontSize: 12,
        fontWeight: '600',
    },
    chartContainer: {
        marginBottom: 16,
    },
    chartHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    chartTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
    goalText: {
        fontSize: 12,
        color: '#666',
    },
    barsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        height: 160,
        paddingHorizontal: 4,
    },
    barColumn: {
        flex: 1,
        alignItems: 'center',
        marginHorizontal: 2,
    },
    barContainer: {
        width: '80%',
        height: 120,
        position: 'relative',
        justifyContent: 'flex-end',
    },
    bar: {
        width: '100%',
        borderRadius: 4,
        minHeight: 4,
    },
    goalLine: {
        position: 'absolute',
        width: '100%',
        height: 2,
        borderRadius: 1,
    },
    barValue: {
        fontSize: 10,
        color: '#333',
        marginTop: 4,
        fontWeight: '600',
    },
    barLabel: {
        fontSize: 10,
        color: '#666',
        marginTop: 2,
    },
    insightsContainer: {
        backgroundColor: '#f8f9fa',
        borderRadius: 8,
        padding: 12,
    },
    insightsTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
    },
    insightText: {
        fontSize: 12,
        color: '#666',
        marginBottom: 4,
    },
});

export default NutritionTrends;
