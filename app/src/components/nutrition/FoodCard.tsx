import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
} from 'react-native';
import { MaterialIcons as Icon } from '@expo/vector-icons';

interface Food {
    id: string;
    name: string;
    brand?: string;
    calories_per_100g: number;
    protein_per_100g: number;
    carbs_per_100g: number;
    fat_per_100g: number;
    imageUrl?: string;
}

interface FoodCardProps {
    food: Food;
    onPress: () => void;
    showFavoriteButton?: boolean;
    isFavorite?: boolean;
    onToggleFavorite?: () => void;
}

export const FoodCard: React.FC<FoodCardProps> = ({
    food,
    onPress,
    showFavoriteButton = false,
    isFavorite = false,
    onToggleFavorite,
}) => {
    return (
        <TouchableOpacity style={styles.container} onPress={onPress}>
            <View style={styles.content}>
                <View style={styles.info}>
                    <Text style={styles.name} numberOfLines={2}>
                        {food.name}
                    </Text>
                    {food.brand && (
                        <Text style={styles.brand} numberOfLines={1}>
                            {food.brand}
                        </Text>
                    )}
                    <Text style={styles.calories}>
                        {food.calories_per_100g} cal/100g
                    </Text>
                </View>

                <View style={styles.actions}>
                    {showFavoriteButton && (
                        <TouchableOpacity
                            style={styles.favoriteButton}
                            onPress={onToggleFavorite}
                        >
                            <Icon
                                name={isFavorite ? 'favorite' : 'favorite-border'}
                                size={20}
                                color={isFavorite ? '#FF6B6B' : '#666'}
                            />
                        </TouchableOpacity>
                    )}
                    <Icon name="chevron-right" size={24} color="#666" />
                </View>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: 'white',
        marginHorizontal: 16,
        marginVertical: 4,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    content: {
        flexDirection: 'row',
        padding: 16,
        alignItems: 'center',
    },
    info: {
        flex: 1,
        marginRight: 12,
    },
    name: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1a1a1a',
        marginBottom: 4,
    },
    brand: {
        fontSize: 14,
        color: '#666',
        marginBottom: 4,
    },
    calories: {
        fontSize: 14,
        color: '#007AFF',
        fontWeight: '500',
    },
    actions: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    favoriteButton: {
        padding: 8,
        marginRight: 4,
    },
});
