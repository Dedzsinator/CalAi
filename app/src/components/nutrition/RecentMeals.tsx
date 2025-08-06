import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    FlatList,
} from 'react-native';
import { MaterialIcons as Icon } from '@expo/vector-icons';

interface Meal {
    id: string;
    type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
    calories: number;
    timestamp: string;
    foods: Array<{
        name: string;
        quantity: number;
    }>;
}

interface RecentMealsProps {
    meals: Meal[];
    onMealPress?: (meal: Meal) => void;
}

export const RecentMeals: React.FC<RecentMealsProps> = ({
    meals,
    onMealPress,
}) => {
    const renderMealItem = ({ item }: { item: Meal }) => (
        <TouchableOpacity
            style={styles.mealItem}
            onPress={() => onMealPress?.(item)}
        >
            <View style={styles.mealIcon}>
                <Icon
                    name={getMealIcon(item.type)}
                    size={24}
                    color={getMealColor(item.type)}
                />
            </View>

            <View style={styles.mealInfo}>
                <Text style={styles.mealType}>{item.type}</Text>
                <Text style={styles.mealFoods} numberOfLines={1}>
                    {item.foods.map(food => food.name).join(', ')}
                </Text>
            </View>

            <View style={styles.mealCalories}>
                <Text style={styles.caloriesText}>{item.calories}</Text>
                <Text style={styles.caloriesLabel}>cal</Text>
            </View>
        </TouchableOpacity>
    );

    if (meals.length === 0) {
        return (
            <View style={styles.emptyContainer}>
                <Icon name="restaurant" size={48} color="#ccc" />
                <Text style={styles.emptyText}>No recent meals</Text>
                <Text style={styles.emptySubtext}>Start logging your meals to see them here</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <FlatList
                data={meals}
                renderItem={renderMealItem}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
                scrollEnabled={false}
            />
        </View>
    );
};

const getMealIcon = (type: string): keyof typeof Icon.glyphMap => {
    switch (type) {
        case 'breakfast':
            return 'wb-sunny';
        case 'lunch':
            return 'wb-cloudy';
        case 'dinner':
            return 'brightness-3';
        case 'snack':
            return 'restaurant';
        default:
            return 'restaurant';
    }
};

const getMealColor = (type: string): string => {
    switch (type) {
        case 'breakfast':
            return '#FFB347';
        case 'lunch':
            return '#87CEEB';
        case 'dinner':
            return '#DDA0DD';
        case 'snack':
            return '#98FB98';
        default:
            return '#666';
    }
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: 'white',
        borderRadius: 12,
        marginHorizontal: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    mealItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f5f5f5',
    },
    mealIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#f8f9fa',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    mealInfo: {
        flex: 1,
    },
    mealType: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1a1a1a',
        textTransform: 'capitalize',
        marginBottom: 4,
    },
    mealFoods: {
        fontSize: 14,
        color: '#666',
    },
    mealCalories: {
        alignItems: 'center',
    },
    caloriesText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#007AFF',
    },
    caloriesLabel: {
        fontSize: 12,
        color: '#666',
    },
    emptyContainer: {
        alignItems: 'center',
        padding: 40,
        backgroundColor: 'white',
        borderRadius: 12,
        marginHorizontal: 16,
    },
    emptyText: {
        fontSize: 16,
        fontWeight: '500',
        color: '#666',
        marginTop: 12,
    },
    emptySubtext: {
        fontSize: 14,
        color: '#999',
        textAlign: 'center',
        marginTop: 4,
    },
});
