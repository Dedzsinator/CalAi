import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Meal } from '../../types/nutrition';

interface MealCardProps {
    meal: Meal;
    onPress?: () => void;
    onEdit?: () => void;
    onDelete?: () => void;
}

export const MealCard: React.FC<MealCardProps> = ({
    meal,
    onPress,
    onEdit,
    onDelete,
}) => {
    const getTotalCalories = () => {
        if (!meal.foods) return 0;
        return meal.foods.reduce((total, item) =>
            total + (item.food.calories * item.quantity) / 100, 0
        );
    };

    const formatTime = (timestamp: string) => {
        return new Date(timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getMealTypeIcon = (type: string) => {
        switch (type.toLowerCase()) {
            case 'breakfast': return 'free-breakfast';
            case 'lunch': return 'lunch-dining';
            case 'dinner': return 'dinner-dining';
            case 'snack': return 'cookie';
            default: return 'restaurant';
        }
    };

    return (
        <TouchableOpacity style={styles.container} onPress={onPress}>
            <View style={styles.content}>
                <View style={styles.header}>
                    <View style={styles.mealTypeContainer}>
                        <Icon
                            name={getMealTypeIcon(meal.type)}
                            size={20}
                            color="#007AFF"
                            style={styles.mealTypeIcon}
                        />
                        <Text style={styles.mealType}>{meal.type}</Text>
                    </View>
                    <Text style={styles.time}>{formatTime(meal.timestamp)}</Text>
                </View>

                {meal.imageUrl && (
                    <Image source={{ uri: meal.imageUrl }} style={styles.mealImage} />
                )}

                <View style={styles.nutrition}>
                    <View style={styles.caloriesContainer}>
                        <Text style={styles.calories}>{Math.round(getTotalCalories())}</Text>
                        <Text style={styles.caloriesLabel}>cal</Text>
                    </View>

                    {meal.foods && meal.foods.length > 0 && (
                        <Text style={styles.foodCount} numberOfLines={1}>
                            {meal.foods.length} item{meal.foods.length > 1 ? 's' : ''}
                        </Text>
                    )}
                </View>

                {meal.foods && meal.foods.length > 0 && (
                    <View style={styles.foodPreview}>
                        <Text style={styles.foodPreviewText} numberOfLines={2}>
                            {meal.foods.map(item => item.food.name).join(', ')}
                        </Text>
                    </View>
                )}

                {meal.notes && (
                    <View style={styles.notesContainer}>
                        <Icon name="notes" size={14} color="#666" />
                        <Text style={styles.notes} numberOfLines={1}>
                            {meal.notes}
                        </Text>
                    </View>
                )}
            </View>

            {(onEdit || onDelete) && (
                <View style={styles.actions}>
                    {onEdit && (
                        <TouchableOpacity style={styles.actionButton} onPress={onEdit}>
                            <Icon name="edit" size={20} color="#007AFF" />
                        </TouchableOpacity>
                    )}
                    {onDelete && (
                        <TouchableOpacity style={styles.actionButton} onPress={onDelete}>
                            <Icon name="delete" size={20} color="#FF5722" />
                        </TouchableOpacity>
                    )}
                </View>
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: 'white',
        borderRadius: 12,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    content: {
        padding: 16,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    mealTypeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    mealTypeIcon: {
        marginRight: 8,
    },
    mealType: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1a1a1a',
        textTransform: 'capitalize',
    },
    time: {
        fontSize: 14,
        color: '#666',
    },
    mealImage: {
        width: '100%',
        height: 160,
        borderRadius: 8,
        marginBottom: 12,
    },
    nutrition: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    caloriesContainer: {
        flexDirection: 'row',
        alignItems: 'baseline',
    },
    calories: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#007AFF',
    },
    caloriesLabel: {
        fontSize: 14,
        color: '#007AFF',
        marginLeft: 4,
    },
    foodCount: {
        fontSize: 14,
        color: '#666',
    },
    foodPreview: {
        marginBottom: 8,
    },
    foodPreviewText: {
        fontSize: 14,
        color: '#333',
        lineHeight: 18,
    },
    notesContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
    },
    notes: {
        fontSize: 12,
        color: '#666',
        marginLeft: 4,
        flex: 1,
    },
    actions: {
        flexDirection: 'row',
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
        paddingHorizontal: 16,
        paddingVertical: 8,
    },
    actionButton: {
        padding: 8,
        marginRight: 16,
    },
});
