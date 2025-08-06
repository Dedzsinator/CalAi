import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
    Image,
    Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { MaterialIcons as Icon } from '@expo/vector-icons';

import { RootState, AppDispatch } from '../../store';
import { fetchMealById, updateMeal, deleteMeal } from '../../store/slices/mealSlice';
import { NutritionCard } from '../../components/nutrition/NutritionCard';
import { FoodItemCard } from '../../components/nutrition/FoodItemCard';
import { MealNotes } from '../../components/nutrition/MealNotes';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

const { width } = Dimensions.get('window');

interface RouteParams {
    mealId: string;
    mode?: 'view' | 'edit';
}

const MealDetailScreen: React.FC = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const dispatch = useDispatch<AppDispatch>();
    const { mealId, mode = 'view' } = (route.params as RouteParams) || {};

    const { currentMeal, isLoading } = useSelector((state: RootState) => state.meals);
    const [isEditing, setIsEditing] = useState(mode === 'edit');
    const [notes, setNotes] = useState('');

    useEffect(() => {
        if (mealId) {
            dispatch(fetchMealById(mealId));
        }
    }, [dispatch, mealId]);

    useEffect(() => {
        if (currentMeal) {
            setNotes(currentMeal.notes || '');
        }
    }, [currentMeal]);

    const handleEdit = () => {
        setIsEditing(true);
    };

    const handleSave = async () => {
        if (!currentMeal) return;

        try {
            await dispatch(updateMeal({
                id: currentMeal.id,
                notes,
            })).unwrap();
            setIsEditing(false);
            Alert.alert('Success', 'Meal updated successfully');
        } catch (error) {
            Alert.alert('Error', 'Failed to update meal');
        }
    };

    const handleCancel = () => {
        setIsEditing(false);
        setNotes(currentMeal?.notes || '');
    };

    const handleDelete = () => {
        if (!currentMeal) return;

        Alert.alert(
            'Delete Meal',
            'Are you sure you want to delete this meal? This action cannot be undone.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await dispatch(deleteMeal(currentMeal.id)).unwrap();
                            navigation.goBack();
                        } catch (error) {
                            Alert.alert('Error', 'Failed to delete meal');
                        }
                    },
                },
            ]
        );
    };

    const handleDuplicate = () => {
        if (!currentMeal) return;

        Alert.alert(
            'Duplicate Meal',
            'Would you like to log this meal again for today?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Duplicate',
                    onPress: () => {
                        // Navigate to camera/search with prefilled data
                        navigation.navigate('FoodSearch' as never, {
                            duplicateFrom: currentMeal,
                        } as never);
                    },
                },
            ]
        );
    };

    const getTotalNutrition = () => {
        if (!currentMeal?.foods) return { calories: 0, protein: 0, carbs: 0, fat: 0 };

        return currentMeal.foods.reduce(
            (total, item) => ({
                calories: total.calories + (item.food.calories * item.quantity) / 100,
                protein: total.protein + (item.food.protein * item.quantity) / 100,
                carbs: total.carbs + (item.food.carbs * item.quantity) / 100,
                fat: total.fat + (item.food.fat * item.quantity) / 100,
            }),
            { calories: 0, protein: 0, carbs: 0, fat: 0 }
        );
    };

    if (isLoading) {
        return (
            <SafeAreaView style={styles.container}>
                <LoadingSpinner />
            </SafeAreaView>
        );
    }

    if (!currentMeal) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.errorContainer}>
                    <Icon name="error-outline" size={64} color="#FF5722" />
                    <Text style={styles.errorTitle}>Meal Not Found</Text>
                    <Text style={styles.errorText}>
                        The meal you're looking for doesn't exist or has been deleted.
                    </Text>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => navigation.goBack()}
                    >
                        <Text style={styles.backButtonText}>Go Back</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    const totalNutrition = getTotalNutrition();

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView style={styles.scrollView}>
                {/* Header Section */}
                <View style={styles.header}>
                    {currentMeal.imageUrl && (
                        <Image source={{ uri: currentMeal.imageUrl }} style={styles.mealImage} />
                    )}
                    <View style={styles.headerInfo}>
                        <Text style={styles.mealType}>{currentMeal.type}</Text>
                        <Text style={styles.mealTime}>
                            {new Date(currentMeal.timestamp).toLocaleString()}
                        </Text>
                        <Text style={styles.totalCalories}>
                            {Math.round(totalNutrition.calories)} cal
                        </Text>
                    </View>
                </View>

                {/* Nutrition Summary */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Nutrition Summary</Text>
                    <NutritionCard
                        calories={totalNutrition.calories}
                        protein={totalNutrition.protein}
                        carbs={totalNutrition.carbs}
                        fat={totalNutrition.fat}
                        showPercentages={true}
                    />
                </View>

                {/* Food Items */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Food Items</Text>
                    {currentMeal.foods?.map((item, index) => (
                        <FoodItemCard
                            key={`${item.food.id}-${index}`}
                            foodItem={item}
                            showQuantity={true}
                            onEdit={() => {
                                // Navigate to food edit screen
                                navigation.navigate('FoodSearch' as never, {
                                    editFood: item,
                                    mealId: currentMeal.id,
                                } as never);
                            }}
                        />
                    ))}
                </View>

                {/* Notes Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Notes</Text>
                    <MealNotes
                        notes={notes}
                        onNotesChange={setNotes}
                        isEditing={isEditing}
                        placeholder="Add notes about this meal..."
                    />
                </View>

                {/* Action Buttons */}
                <View style={styles.actionSection}>
                    {!isEditing ? (
                        <View style={styles.actionRow}>
                            <TouchableOpacity style={styles.actionButton} onPress={handleEdit}>
                                <Icon name="edit" size={20} color="#007AFF" />
                                <Text style={styles.actionButtonText}>Edit</Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.actionButton} onPress={handleDuplicate}>
                                <Icon name="content-copy" size={20} color="#007AFF" />
                                <Text style={styles.actionButtonText}>Duplicate</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.actionButton, styles.deleteButton]}
                                onPress={handleDelete}
                            >
                                <Icon name="delete" size={20} color="#FF5722" />
                                <Text style={[styles.actionButtonText, styles.deleteButtonText]}>Delete</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <View style={styles.actionRow}>
                            <TouchableOpacity
                                style={[styles.actionButton, styles.cancelButton]}
                                onPress={handleCancel}
                            >
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.actionButton, styles.saveButton]}
                                onPress={handleSave}
                            >
                                <Text style={styles.saveButtonText}>Save Changes</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    scrollView: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        padding: 16,
        backgroundColor: 'white',
        marginBottom: 8,
    },
    mealImage: {
        width: 80,
        height: 80,
        borderRadius: 12,
        marginRight: 16,
    },
    headerInfo: {
        flex: 1,
        justifyContent: 'center',
    },
    mealType: {
        fontSize: 20,
        fontWeight: '600',
        color: '#1a1a1a',
        textTransform: 'capitalize',
    },
    mealTime: {
        fontSize: 14,
        color: '#666',
        marginTop: 4,
    },
    totalCalories: {
        fontSize: 18,
        fontWeight: '500',
        color: '#007AFF',
        marginTop: 8,
    },
    section: {
        backgroundColor: 'white',
        padding: 16,
        marginBottom: 8,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1a1a1a',
        marginBottom: 12,
    },
    actionSection: {
        backgroundColor: 'white',
        padding: 16,
        marginBottom: 16,
    },
    actionRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#007AFF',
        flex: 0.3,
        justifyContent: 'center',
    },
    actionButtonText: {
        color: '#007AFF',
        fontWeight: '500',
        marginLeft: 4,
    },
    deleteButton: {
        borderColor: '#FF5722',
    },
    deleteButtonText: {
        color: '#FF5722',
    },
    cancelButton: {
        backgroundColor: '#f5f5f5',
        borderColor: '#ccc',
        flex: 0.45,
    },
    cancelButtonText: {
        color: '#666',
        fontWeight: '500',
    },
    saveButton: {
        backgroundColor: '#007AFF',
        borderColor: '#007AFF',
        flex: 0.45,
    },
    saveButtonText: {
        color: 'white',
        fontWeight: '500',
    },
    errorContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
    },
    errorTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#1a1a1a',
        marginTop: 16,
        textAlign: 'center',
    },
    errorText: {
        fontSize: 16,
        color: '#666',
        marginTop: 8,
        textAlign: 'center',
        lineHeight: 22,
    },
    backButton: {
        backgroundColor: '#007AFF',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
        marginTop: 24,
    },
    backButtonText: {
        color: 'white',
        fontWeight: '500',
        fontSize: 16,
    },
});

export default MealDetailScreen;
