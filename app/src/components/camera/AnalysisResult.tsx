import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    Image,
    TouchableOpacity,
    ScrollView,
    Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../../store';
import { createMeal } from '../../store/slices/mealSlice';

interface FoodItem {
    id: string;
    name: string;
    confidence: number;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    quantity: number;
    unit: string;
    boundingBox?: {
        x: number;
        y: number;
        width: number;
        height: number;
    };
}

interface AnalysisResultProps {
    imageUri: string;
    detectedFoods: FoodItem[];
    totalCalories: number;
    totalProtein: number;
    totalCarbs: number;
    totalFat: number;
    onSave: () => void;
    onRetake: () => void;
    onEdit: (foodItem: FoodItem) => void;
}

const AnalysisResult: React.FC<AnalysisResultProps> = ({
    imageUri,
    detectedFoods,
    totalCalories,
    totalProtein,
    totalCarbs,
    totalFat,
    onSave,
    onRetake,
    onEdit
}) => {
    const dispatch = useDispatch<AppDispatch>();

    const handleSaveMeal = async () => {
        try {
            const mealData = {
                name: `AI Detected Meal - ${new Date().toLocaleDateString()}`,
                mealType: getMealTypeByTime(),
                eatenAt: new Date(),
                imageUrl: imageUri,
                totalCalories,
                totalProtein,
                totalCarbs,
                totalFat,
                aiGenerated: true,
                isVerified: false,
                processingStatus: 'completed' as const,
                mealFoods: detectedFoods.map(food => ({
                    food: {
                        id: food.id,
                        name: food.name,
                        caloriesPer100g: (food.calories / food.quantity) * 100,
                        proteinPer100g: (food.protein / food.quantity) * 100,
                        carbsPer100g: (food.carbs / food.quantity) * 100,
                        fatPer100g: (food.fat / food.quantity) * 100,
                    },
                    quantityGrams: food.quantity,
                    confidenceScore: food.confidence,
                    aiDetected: true,
                    userVerified: false,
                    boundingBox: food.boundingBox
                }))
            };

            await dispatch(createMeal(mealData)).unwrap();
            onSave();
        } catch (error) {
            Alert.alert('Error', 'Failed to save meal');
        }
    };

    const getMealTypeByTime = () => {
        const hour = new Date().getHours();
        if (hour < 11) return 'breakfast';
        if (hour < 15) return 'lunch';
        if (hour < 19) return 'dinner';
        return 'snack';
    };

    const getConfidenceColor = (confidence: number) => {
        if (confidence >= 0.8) return '#4CAF50';
        if (confidence >= 0.6) return '#FF9800';
        return '#F44336';
    };

    const renderNutritionSummary = () => (
        <View style={styles.nutritionSummary}>
            <Text style={styles.summaryTitle}>Nutrition Summary</Text>
            <View style={styles.nutritionGrid}>
                <View style={styles.nutritionItem}>
                    <Text style={styles.nutritionValue}>{Math.round(totalCalories)}</Text>
                    <Text style={styles.nutritionLabel}>Calories</Text>
                </View>
                <View style={styles.nutritionItem}>
                    <Text style={styles.nutritionValue}>{Math.round(totalProtein)}g</Text>
                    <Text style={styles.nutritionLabel}>Protein</Text>
                </View>
                <View style={styles.nutritionItem}>
                    <Text style={styles.nutritionValue}>{Math.round(totalCarbs)}g</Text>
                    <Text style={styles.nutritionLabel}>Carbs</Text>
                </View>
                <View style={styles.nutritionItem}>
                    <Text style={styles.nutritionValue}>{Math.round(totalFat)}g</Text>
                    <Text style={styles.nutritionLabel}>Fat</Text>
                </View>
            </View>
        </View>
    );

    const renderFoodItem = (food: FoodItem, index: number) => (
        <TouchableOpacity
            key={`${food.id}-${index}`}
            style={styles.foodItem}
            onPress={() => onEdit(food)}
        >
            <View style={styles.foodHeader}>
                <View style={styles.foodInfo}>
                    <Text style={styles.foodName}>{food.name}</Text>
                    <Text style={styles.foodQuantity}>
                        {food.quantity}{food.unit}
                    </Text>
                </View>
                <View style={styles.confidenceContainer}>
                    <View
                        style={[
                            styles.confidenceDot,
                            { backgroundColor: getConfidenceColor(food.confidence) }
                        ]}
                    />
                    <Text style={styles.confidenceText}>
                        {Math.round(food.confidence * 100)}%
                    </Text>
                </View>
            </View>

            <View style={styles.foodNutrition}>
                <Text style={styles.nutritionText}>
                    {Math.round(food.calories)} cal • {Math.round(food.protein)}g protein
                </Text>
            </View>

            <View style={styles.editHint}>
                <Ionicons name="pencil" size={12} color="#666" />
                <Text style={styles.editHintText}>Tap to edit</Text>
            </View>
        </TouchableOpacity>
    );

    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            {/* Image Preview */}
            <View style={styles.imageContainer}>
                <Image source={{ uri: imageUri }} style={styles.image} />
                <TouchableOpacity style={styles.retakeButton} onPress={onRetake}>
                    <Ionicons name="camera" size={20} color="#fff" />
                </TouchableOpacity>
            </View>

            {/* Analysis Status */}
            <View style={styles.statusContainer}>
                <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
                <Text style={styles.statusText}>
                    Found {detectedFoods.length} food item{detectedFoods.length !== 1 ? 's' : ''}
                </Text>
            </View>

            {/* Nutrition Summary */}
            {renderNutritionSummary()}

            {/* Detected Foods */}
            <View style={styles.foodsContainer}>
                <Text style={styles.foodsTitle}>Detected Foods</Text>
                <Text style={styles.foodsSubtitle}>
                    Tap any item to edit quantity or details
                </Text>
                {detectedFoods.map(renderFoodItem)}
            </View>

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
                <TouchableOpacity style={styles.retakeActionButton} onPress={onRetake}>
                    <Ionicons name="camera-outline" size={20} color="#666" />
                    <Text style={styles.retakeActionText}>Retake Photo</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.saveButton} onPress={handleSaveMeal}>
                    <Ionicons name="checkmark" size={20} color="#fff" />
                    <Text style={styles.saveButtonText}>Save Meal</Text>
                </TouchableOpacity>
            </View>

            {/* Confidence Legend */}
            <View style={styles.legendContainer}>
                <Text style={styles.legendTitle}>Confidence Level</Text>
                <View style={styles.legendItems}>
                    <View style={styles.legendItem}>
                        <View style={[styles.legendDot, { backgroundColor: '#4CAF50' }]} />
                        <Text style={styles.legendText}>High (80%+)</Text>
                    </View>
                    <View style={styles.legendItem}>
                        <View style={[styles.legendDot, { backgroundColor: '#FF9800' }]} />
                        <Text style={styles.legendText}>Medium (60-79%)</Text>
                    </View>
                    <View style={styles.legendItem}>
                        <View style={[styles.legendDot, { backgroundColor: '#F44336' }]} />
                        <Text style={styles.legendText}>Low (60%)</Text>
                    </View>
                </View>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    imageContainer: {
        position: 'relative',
        margin: 16,
        borderRadius: 12,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    image: {
        width: '100%',
        height: 200,
        resizeMode: 'cover',
    },
    retakeButton: {
        position: 'absolute',
        top: 12,
        right: 12,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    statusContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#e8f5e8',
        margin: 16,
        marginTop: 0,
        padding: 12,
        borderRadius: 8,
    },
    statusText: {
        marginLeft: 8,
        fontSize: 16,
        color: '#2e7d32',
        fontWeight: '600',
    },
    nutritionSummary: {
        backgroundColor: '#fff',
        margin: 16,
        marginTop: 0,
        borderRadius: 12,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    summaryTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
        marginBottom: 12,
    },
    nutritionGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    nutritionItem: {
        alignItems: 'center',
    },
    nutritionValue: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#2196F3',
    },
    nutritionLabel: {
        fontSize: 12,
        color: '#666',
        marginTop: 4,
    },
    foodsContainer: {
        margin: 16,
        marginTop: 0,
    },
    foodsTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
        marginBottom: 4,
    },
    foodsSubtitle: {
        fontSize: 14,
        color: '#666',
        marginBottom: 12,
    },
    foodItem: {
        backgroundColor: '#fff',
        borderRadius: 8,
        padding: 12,
        marginBottom: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    foodHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    foodInfo: {
        flex: 1,
    },
    foodName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
    foodQuantity: {
        fontSize: 14,
        color: '#666',
        marginTop: 2,
    },
    confidenceContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    confidenceDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 4,
    },
    confidenceText: {
        fontSize: 12,
        color: '#666',
    },
    foodNutrition: {
        marginBottom: 8,
    },
    nutritionText: {
        fontSize: 14,
        color: '#666',
    },
    editHint: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    editHintText: {
        fontSize: 12,
        color: '#666',
        fontStyle: 'italic',
    },
    actionButtons: {
        flexDirection: 'row',
        margin: 16,
        marginTop: 0,
        gap: 12,
    },
    retakeActionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#e0e0e0',
        gap: 8,
    },
    retakeActionText: {
        fontSize: 16,
        color: '#666',
        fontWeight: '600',
    },
    saveButton: {
        flex: 2,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#2196F3',
        padding: 16,
        borderRadius: 8,
        gap: 8,
    },
    saveButtonText: {
        fontSize: 16,
        color: '#fff',
        fontWeight: '600',
    },
    legendContainer: {
        backgroundColor: '#fff',
        margin: 16,
        marginTop: 0,
        borderRadius: 8,
        padding: 12,
    },
    legendTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
    },
    legendItems: {
        flexDirection: 'row',
        justifyContent: 'space-between',
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
});

export default AnalysisResult;
