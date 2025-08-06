import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Dimensions
} from 'react-native';
import { LineChart } from 'react-native-chart-kit';

interface WeightData {
    date: string;
    weight: number;
}

interface WeightProgressProps {
    data: WeightData[];
    goalWeight?: number;
    unit?: 'kg' | 'lbs';
}

const WeightProgress: React.FC<WeightProgressProps> = ({
    data,
    goalWeight,
    unit = 'kg'
}) => {
    const screenWidth = Dimensions.get('window').width;
    const chartWidth = screenWidth - 32;

    const getChartData = () => {
        if (data.length === 0) return null;

        const labels = data.slice(-7).map(item => {
            const date = new Date(item.date);
            return `${date.getMonth() + 1}/${date.getDate()}`;
        });

        const datasets = [{
            data: data.slice(-7).map(item => item.weight),
            color: (opacity = 1) => `rgba(33, 150, 243, ${opacity})`,
            strokeWidth: 3,
        }];

        if (goalWeight) {
            datasets.push({
                data: Array(labels.length).fill(goalWeight),
                color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`,
                strokeWidth: 2,
                withDots: false,
            } as any);
        }

        return { labels, datasets };
    };

    const getCurrentWeight = () => {
        if (data.length === 0) return null;
        return data[data.length - 1].weight;
    };

    const getWeightChange = () => {
        if (data.length < 2) return null;
        const current = data[data.length - 1].weight;
        const previous = data[data.length - 2].weight;
        return current - previous;
    };

    const getTotalChange = () => {
        if (data.length < 2) return null;
        const current = data[data.length - 1].weight;
        const start = data[0].weight;
        return current - start;
    };

    const chartData = getChartData();
    const currentWeight = getCurrentWeight();
    const weightChange = getWeightChange();
    const totalChange = getTotalChange();

    const chartConfig = {
        backgroundColor: '#fff',
        backgroundGradientFrom: '#fff',
        backgroundGradientTo: '#fff',
        decimalPlaces: 1,
        color: (opacity = 1) => `rgba(33, 150, 243, ${opacity})`,
        labelColor: (opacity = 1) => `rgba(102, 102, 102, ${opacity})`,
        style: {
            borderRadius: 16,
        },
        propsForDots: {
            r: '4',
            strokeWidth: '2',
            stroke: '#2196F3'
        },
        propsForVerticalLabels: {
            fontSize: 12,
        },
        propsForHorizontalLabels: {
            fontSize: 12,
        },
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Weight Progress</Text>

            {/* Current Stats */}
            <View style={styles.statsContainer}>
                <View style={styles.statItem}>
                    <Text style={styles.statValue}>
                        {currentWeight ? `${currentWeight.toFixed(1)} ${unit}` : '-'}
                    </Text>
                    <Text style={styles.statLabel}>Current Weight</Text>
                </View>

                {weightChange !== null && (
                    <View style={styles.statItem}>
                        <Text style={[
                            styles.statValue,
                            weightChange > 0 ? styles.positiveChange : styles.negativeChange
                        ]}>
                            {weightChange > 0 ? '+' : ''}{weightChange.toFixed(1)} {unit}
                        </Text>
                        <Text style={styles.statLabel}>Recent Change</Text>
                    </View>
                )}

                {totalChange !== null && (
                    <View style={styles.statItem}>
                        <Text style={[
                            styles.statValue,
                            totalChange > 0 ? styles.positiveChange : styles.negativeChange
                        ]}>
                            {totalChange > 0 ? '+' : ''}{totalChange.toFixed(1)} {unit}
                        </Text>
                        <Text style={styles.statLabel}>Total Change</Text>
                    </View>
                )}
            </View>

            {/* Chart */}
            {chartData ? (
                <View style={styles.chartContainer}>
                    <LineChart
                        data={chartData}
                        width={chartWidth}
                        height={220}
                        chartConfig={chartConfig}
                        bezier
                        style={styles.chart}
                        withInnerLines={false}
                        withOuterLines={true}
                        withVerticalLines={false}
                        withHorizontalLines={true}
                        fromZero={false}
                    />

                    {goalWeight && (
                        <View style={styles.legendContainer}>
                            <View style={styles.legendItem}>
                                <View style={[styles.legendDot, { backgroundColor: '#2196F3' }]} />
                                <Text style={styles.legendText}>Actual Weight</Text>
                            </View>
                            <View style={styles.legendItem}>
                                <View style={[styles.legendDot, { backgroundColor: '#4CAF50' }]} />
                                <Text style={styles.legendText}>Goal Weight</Text>
                            </View>
                        </View>
                    )}
                </View>
            ) : (
                <View style={styles.noDataContainer}>
                    <Text style={styles.noDataText}>
                        Start logging your weight to see progress
                    </Text>
                </View>
            )}
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
    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 20,
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
    positiveChange: {
        color: '#F44336',
    },
    negativeChange: {
        color: '#4CAF50',
    },
    chartContainer: {
        alignItems: 'center',
    },
    chart: {
        marginVertical: 8,
        borderRadius: 16,
    },
    legendContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 16,
        marginTop: 8,
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    legendDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    legendText: {
        fontSize: 12,
        color: '#666',
    },
    noDataContainer: {
        alignItems: 'center',
        paddingVertical: 40,
    },
    noDataText: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
    },
});

export default WeightProgress;
