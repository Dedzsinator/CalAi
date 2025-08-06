import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ActivityIndicator,
    Dimensions,
} from 'react-native';
import { MaterialIcons as Icon } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

interface Meal {
    id: string;
    type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
    calories: number;
    timestamp: string;
}

interface TodaysProgressProps {
    meals: Meal[];
    isLoading: boolean;
    dailyGoal?: number;
}

export const TodaysProgress: React.FC<TodaysProgressProps> = ({
    meals,
    isLoading,
    dailyGoal = 2000,
}) => {
    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#007AFF" />
                <Text style={styles.loadingText}>Loading today's progress...</Text>
            </View>
        );
    }

    const totalCalories = meals.reduce((sum, meal) => sum + meal.calories, 0);
    const progressPercentage = Math.min((totalCalories / dailyGoal) * 100, 100);
    const remaining = Math.max(dailyGoal - totalCalories, 0);

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Today's Progress</Text>

            <View style={styles.progressContainer}>
                <View style={styles.calorieInfo}>
                    <Text style={styles.consumedCalories}>{totalCalories}</Text>
                    <Text style={styles.calorieLabel}>consumed</Text>
                </View>

                <View style={styles.progressBar}>
                    <View
                        style={[
                            styles.progressFill,
                            { width: `${progressPercentage}%` }
                        ]}
                    />
                </View>

                <View style={styles.remainingInfo}>
                    <Text style={styles.remainingCalories}>{remaining}</Text>
                    <Text style={styles.calorieLabel}>remaining</Text>
                </View>
            </View>

            <View style={styles.macroInfo}>
                <View style={styles.macroItem}>
                    <Icon name="local-fire-department" size={16} color="#FF6B6B" />
                    <Text style={styles.macroText}>Calories</Text>
                </View>
                <View style={styles.macroItem}>
                    <Icon name="fitness-center" size={16} color="#4ECDC4" />
                    <Text style={styles.macroText}>Protein</Text>
                </View>
                <View style={styles.macroItem}>
                    <Icon name="grain" size={16} color="#45B7D1" />
                    <Text style={styles.macroText}>Carbs</Text>
                </View>
                <View style={styles.macroItem}>
                    <Icon name="opacity" size={16} color="#FFA07A" />
                    <Text style={styles.macroText}>Fat</Text>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        margin: 16,
        padding: 20,
        backgroundColor: 'white',
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    loadingContainer: {
        margin: 16,
        padding: 40,
        backgroundColor: 'white',
        borderRadius: 16,
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 12,
        color: '#666',
        fontSize: 14,
    },
    title: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1a1a1a',
        marginBottom: 16,
    },
    progressContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    calorieInfo: {
        alignItems: 'center',
        marginRight: 16,
    },
    consumedCalories: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#007AFF',
    },
    remainingCalories: {
        fontSize: 18,
        fontWeight: '500',
        color: '#666',
    },
    calorieLabel: {
        fontSize: 12,
        color: '#999',
        marginTop: 2,
    },
    progressBar: {
        flex: 1,
        height: 8,
        backgroundColor: '#f0f0f0',
        borderRadius: 4,
        marginHorizontal: 16,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        backgroundColor: '#007AFF',
        borderRadius: 4,
    },
    remainingInfo: {
        alignItems: 'center',
        marginLeft: 16,
    },
    macroInfo: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
    },
    macroItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    macroText: {
        fontSize: 12,
        color: '#666',
        marginLeft: 4,
    },
});
