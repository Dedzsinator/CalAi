import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface NutritionCardProps {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    showPercentages?: boolean;
    targetCalories?: number;
}

export const NutritionCard: React.FC<NutritionCardProps> = ({
    calories,
    protein,
    carbs,
    fat,
    showPercentages = false,
    targetCalories = 2000,
}) => {
    const caloriePercentage = showPercentages ? (calories / targetCalories) * 100 : 0;

    const MacroBar: React.FC<{
        label: string;
        value: number;
        color: string;
        unit?: string;
        percentage?: number;
    }> = ({ label, value, color, unit = 'g', percentage }) => (
        <View style={styles.macroRow}>
            <View style={styles.macroInfo}>
                <Text style={styles.macroLabel}>{label}</Text>
                <Text style={styles.macroValue}>
                    {Math.round(value)}{unit}
                    {percentage !== undefined && (
                        <Text style={styles.percentage}> ({Math.round(percentage)}%)</Text>
                    )}
                </Text>
            </View>
            {percentage !== undefined && (
                <View style={styles.progressBarContainer}>
                    <View
                        style={[
                            styles.progressBar,
                            { backgroundColor: color, width: `${Math.min(percentage, 100)}%` }
                        ]}
                    />
                </View>
            )}
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={styles.caloriesSection}>
                <Text style={styles.caloriesValue}>{Math.round(calories)}</Text>
                <Text style={styles.caloriesLabel}>Calories</Text>
                {showPercentages && (
                    <Text style={styles.caloriesPercentage}>
                        {Math.round(caloriePercentage)}% of goal
                    </Text>
                )}
            </View>

            <View style={styles.macrosSection}>
                <MacroBar
                    label="Protein"
                    value={protein}
                    color="#4CAF50"
                    percentage={showPercentages ? (protein / (targetCalories * 0.15 / 4)) * 100 : undefined}
                />
                <MacroBar
                    label="Carbs"
                    value={carbs}
                    color="#2196F3"
                    percentage={showPercentages ? (carbs / (targetCalories * 0.50 / 4)) * 100 : undefined}
                />
                <MacroBar
                    label="Fat"
                    value={fat}
                    color="#FF9800"
                    percentage={showPercentages ? (fat / (targetCalories * 0.35 / 9)) * 100 : undefined}
                />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    caloriesSection: {
        alignItems: 'center',
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
        marginBottom: 16,
    },
    caloriesValue: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#007AFF',
    },
    caloriesLabel: {
        fontSize: 16,
        color: '#666',
        marginTop: 4,
    },
    caloriesPercentage: {
        fontSize: 12,
        color: '#666',
        marginTop: 2,
    },
    macrosSection: {
        gap: 12,
    },
    macroRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    macroInfo: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    macroLabel: {
        fontSize: 14,
        fontWeight: '500',
        color: '#333',
    },
    macroValue: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
    },
    percentage: {
        fontSize: 12,
        color: '#666',
        fontWeight: 'normal',
    },
    progressBarContainer: {
        width: 60,
        height: 4,
        backgroundColor: '#f0f0f0',
        borderRadius: 2,
        marginLeft: 12,
    },
    progressBar: {
        height: '100%',
        borderRadius: 2,
    },
});
