import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    Dimensions,
} from 'react-native';
import { LineChart } from 'react-native-chart-kit';

const { width } = Dimensions.get('window');

interface NutritionBreakdownProps {
    data: {
        protein: number;
        carbs: number;
        fat: number;
        fiber: number;
    };
    goals: {
        protein: number;
        carbs: number;
        fat: number;
        fiber: number;
    };
}

export const NutritionBreakdown: React.FC<NutritionBreakdownProps> = ({
    data,
    goals,
}) => {
    const chartData = {
        labels: ['Protein', 'Carbs', 'Fat', 'Fiber'],
        datasets: [
            {
                data: [
                    (data.protein / goals.protein) * 100,
                    (data.carbs / goals.carbs) * 100,
                    (data.fat / goals.fat) * 100,
                    (data.fiber / goals.fiber) * 100,
                ],
            },
        ],
    };

    const chartConfig = {
        backgroundColor: '#ffffff',
        backgroundGradientFrom: '#ffffff',
        backgroundGradientTo: '#ffffff',
        decimalPlaces: 0,
        color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
        labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
        style: {
            borderRadius: 16,
        },
        propsForDots: {
            r: '6',
            strokeWidth: '2',
            stroke: '#007AFF',
        },
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Nutrition Breakdown</Text>

            <LineChart
                data={chartData}
                width={width - 32}
                height={220}
                chartConfig={chartConfig}
                bezier
                style={styles.chart}
            />

            <View style={styles.macroGrid}>
                <MacroItem
                    name="Protein"
                    current={data.protein}
                    goal={goals.protein}
                    unit="g"
                    color="#4ECDC4"
                />
                <MacroItem
                    name="Carbs"
                    current={data.carbs}
                    goal={goals.carbs}
                    unit="g"
                    color="#45B7D1"
                />
                <MacroItem
                    name="Fat"
                    current={data.fat}
                    goal={goals.fat}
                    unit="g"
                    color="#FFA07A"
                />
                <MacroItem
                    name="Fiber"
                    current={data.fiber}
                    goal={goals.fiber}
                    unit="g"
                    color="#98D8C8"
                />
            </View>
        </View>
    );
};

interface MacroItemProps {
    name: string;
    current: number;
    goal: number;
    unit: string;
    color: string;
}

const MacroItem: React.FC<MacroItemProps> = ({
    name,
    current,
    goal,
    unit,
    color,
}) => {
    const percentage = Math.min((current / goal) * 100, 100);

    return (
        <View style={styles.macroItem}>
            <Text style={styles.macroName}>{name}</Text>
            <Text style={styles.macroValue}>
                {Math.round(current)}/{goal}{unit}
            </Text>
            <View style={styles.progressBar}>
                <View
                    style={[
                        styles.progressFill,
                        { width: `${percentage}%`, backgroundColor: color }
                    ]}
                />
            </View>
            <Text style={styles.progressText}>{Math.round(percentage)}%</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: 'white',
        margin: 16,
        borderRadius: 16,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    title: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1a1a1a',
        marginBottom: 16,
    },
    chart: {
        borderRadius: 16,
        marginVertical: 8,
    },
    macroGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginTop: 16,
    },
    macroItem: {
        width: '48%',
        backgroundColor: '#f8f9fa',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
    },
    macroName: {
        fontSize: 14,
        fontWeight: '500',
        color: '#666',
        marginBottom: 4,
    },
    macroValue: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1a1a1a',
        marginBottom: 8,
    },
    progressBar: {
        height: 4,
        backgroundColor: '#e0e0e0',
        borderRadius: 2,
        marginBottom: 8,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        borderRadius: 2,
    },
    progressText: {
        fontSize: 12,
        color: '#666',
        textAlign: 'right',
    },
});
