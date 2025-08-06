import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
} from 'react-native';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { MealFood } from '../../types/nutrition';

interface FoodItemCardProps {
    foodItem: MealFood;
    showQuantity?: boolean;
    onEdit?: () => void;
    onRemove?: () => void;
}

export const FoodItemCard: React.FC<FoodItemCardProps> = ({
    foodItem,
    showQuantity = false,
    onEdit,
    onRemove,
}) => {
    const { food, quantity } = foodItem;

    const calculateNutrition = (baseValue: number) => {
        return (baseValue * quantity) / 100;
    };

    return (
        <View style={styles.container}>
            <View style={styles.content}>
                {food.imageUrl && (
                    <Image source={{ uri: food.imageUrl }} style={styles.foodImage} />
                )}

                <View style={styles.foodInfo}>
                    <Text style={styles.foodName} numberOfLines={2}>
                        {food.name}
                    </Text>

                    {food.brand && (
                        <Text style={styles.brandName} numberOfLines={1}>
                            {food.brand}
                        </Text>
                    )}

                    {showQuantity && (
                        <Text style={styles.quantity}>
                            {quantity}g
                        </Text>
                    )}

                    <View style={styles.nutritionRow}>
                        <Text style={styles.calories}>
                            {Math.round(calculateNutrition(food.calories))} cal
                        </Text>
                        <View style={styles.macroSeparator} />
                        <Text style={styles.macroText}>
                            P: {Math.round(calculateNutrition(food.protein))}g
                        </Text>
                        <Text style={styles.macroText}>
                            C: {Math.round(calculateNutrition(food.carbs))}g
                        </Text>
                        <Text style={styles.macroText}>
                            F: {Math.round(calculateNutrition(food.fat))}g
                        </Text>
                    </View>
                </View>
            </View>

            {(onEdit || onRemove) && (
                <View style={styles.actions}>
                    {onEdit && (
                        <TouchableOpacity style={styles.actionButton} onPress={onEdit}>
                            <Icon name="edit" size={20} color="#007AFF" />
                        </TouchableOpacity>
                    )}
                    {onRemove && (
                        <TouchableOpacity style={styles.actionButton} onPress={onRemove}>
                            <Icon name="close" size={20} color="#FF5722" />
                        </TouchableOpacity>
                    )}
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 12,
        marginBottom: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 1,
    },
    content: {
        flex: 1,
        flexDirection: 'row',
    },
    foodImage: {
        width: 50,
        height: 50,
        borderRadius: 8,
        marginRight: 12,
        backgroundColor: '#f5f5f5',
    },
    foodInfo: {
        flex: 1,
    },
    foodName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1a1a1a',
        marginBottom: 2,
    },
    brandName: {
        fontSize: 12,
        color: '#666',
        marginBottom: 4,
    },
    quantity: {
        fontSize: 14,
        fontWeight: '500',
        color: '#007AFF',
        marginBottom: 4,
    },
    nutritionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
    },
    calories: {
        fontSize: 14,
        fontWeight: '600',
        color: '#007AFF',
    },
    macroSeparator: {
        width: 1,
        height: 12,
        backgroundColor: '#e0e0e0',
        marginHorizontal: 8,
    },
    macroText: {
        fontSize: 12,
        color: '#666',
        marginRight: 8,
    },
    actions: {
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: 8,
    },
    actionButton: {
        padding: 8,
        marginLeft: 4,
    },
});
