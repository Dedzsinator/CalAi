import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    Dimensions,
} from 'react-native';

const { width } = Dimensions.get('window');

interface CalorieChartProps {
    data: Array<{
        date: string;
        calories: number;
    }>;
    targetCalories?: number;
}

export const CalorieChart: React.FC<CalorieChartProps> = ({
    data,
    targetCalories = 2000,
}) => {
    const maxCalories = Math.max(...data.map(d => d.calories), targetCalories);
    const chartWidth = width - 32;
    const chartHeight = 200;
    const barWidth = (chartWidth - 40) / data.length;

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString([], { weekday: 'short' });
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Daily Calories</Text>

            <View style={styles.chartContainer}>
                {/* Y-axis labels */}
                <View style={styles.yAxis}>
                    <Text style={styles.yAxisLabel}>{maxCalories}</Text>
                    <Text style={styles.yAxisLabel}>{Math.round(maxCalories * 0.5)}</Text>
                    <Text style={styles.yAxisLabel}>0</Text>
                </View>

                {/* Chart area */}
                <View style={styles.chartArea}>
                    {/* Target line */}
                    <View
                        style={[
                            styles.targetLine,
                            {
                                bottom: (targetCalories / maxCalories) * chartHeight,
                            }
                        ]}
                    />

                    {/* Bars */}
                    <View style={styles.barsContainer}>
                        {data.map((item, index) => {
                            const barHeight = (item.calories / maxCalories) * chartHeight;
                            const isOverTarget = item.calories > targetCalories;

                            return (
                                <View key={index} style={styles.barContainer}>
                                    <View style={styles.barArea}>
                                        <View
                                            style={[
                                                styles.bar,
                                                {
                                                    height: barHeight,
                                                    backgroundColor: isOverTarget ? '#FF9800' : '#4CAF50',
                                                    width: barWidth - 8,
                                                }
                                            ]}
                                        />
                                    </View>
                                    <Text style={styles.xAxisLabel}>
                                        {formatDate(item.date)}
                                    </Text>
                                    <Text style={styles.valueLabel}>
                                        {Math.round(item.calories)}
                                    </Text>
                                </View>
                            );
                        })}
                    </View>
                </View>
            </View>

            {/* Legend */}
            <View style={styles.legend}>
                <View style={styles.legendItem}>
                    <View style={[styles.legendColor, { backgroundColor: '#4CAF50' }]} />
                    <Text style={styles.legendText}>Within target</Text>
                </View>
                <View style={styles.legendItem}>
                    <View style={[styles.legendColor, { backgroundColor: '#FF9800' }]} />
                    <Text style={styles.legendText}>Over target</Text>
                </View>
                <View style={styles.legendItem}>
                    <View style={[styles.legendColor, { backgroundColor: '#007AFF' }]} />
                    <Text style={styles.legendText}>Target ({targetCalories} cal)</Text>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    title: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1a1a1a',
        marginBottom: 16,
    },
    chartContainer: {
        flexDirection: 'row',
        height: 240,
    },
    yAxis: {
        width: 40,
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        paddingRight: 8,
        paddingVertical: 20,
    },
    yAxisLabel: {
        fontSize: 12,
        color: '#666',
    },
    chartArea: {
        flex: 1,
        position: 'relative',
    },
    targetLine: {
        position: 'absolute',
        left: 0,
        right: 0,
        height: 1,
        backgroundColor: '#007AFF',
        zIndex: 1,
    },
    barsContainer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        height: 200,
        marginTop: 20,
    },
    barContainer: {
        flex: 1,
        alignItems: 'center',
    },
    barArea: {
        height: 200,
        justifyContent: 'flex-end',
        alignItems: 'center',
    },
    bar: {
        borderRadius: 4,
        minHeight: 2,
    },
    xAxisLabel: {
        fontSize: 12,
        color: '#666',
        marginTop: 8,
    },
    valueLabel: {
        fontSize: 10,
        color: '#999',
        marginTop: 2,
    },
    legend: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginTop: 16,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    legendColor: {
        width: 12,
        height: 12,
        borderRadius: 6,
        marginRight: 6,
    },
    legendText: {
        fontSize: 12,
        color: '#666',
    },
});
