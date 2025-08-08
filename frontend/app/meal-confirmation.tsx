import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
    ScrollView,
    TextInput,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';

import StorageService from '../services/storage';
import ApiService from '../services/api';

interface FoodPrediction {
    food_name: string;
    confidence: number;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    portion_estimate: string;
}

interface NutritionData {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    portion: string;
}

export default function MealConfirmationScreen() {
    const params = useLocalSearchParams();
    const [predictions, setPredictions] = useState<FoodPrediction[]>([]);
    const [selectedPrediction, setSelectedPrediction] = useState<FoodPrediction | null>(null);
    const [imageUri, setImageUri] = useState<string>('');
    const [isEditing, setIsEditing] = useState(false);
    const [editedNutrition, setEditedNutrition] = useState<NutritionData>({
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
        portion: '',
    });
    const [customFoodName, setCustomFoodName] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        // Parse predictions once on component mount
        const predictionsParam = params.predictions;
        const imageUriParam = params.imageUri;

        if (predictionsParam && typeof predictionsParam === 'string') {
            try {
                const parsedPredictions = JSON.parse(predictionsParam);
                setPredictions(parsedPredictions);

                if (parsedPredictions.length > 0) {
                    const firstPrediction = parsedPredictions[0];
                    setSelectedPrediction(firstPrediction);
                    setEditedNutrition({
                        calories: firstPrediction.calories,
                        protein: firstPrediction.protein,
                        carbs: firstPrediction.carbs,
                        fat: firstPrediction.fat,
                        portion: firstPrediction.portion_estimate,
                    });
                    setCustomFoodName(firstPrediction.food_name);
                }
            } catch (error) {
                console.error('Error parsing predictions:', error);
            }
        }

        if (imageUriParam && typeof imageUriParam === 'string') {
            setImageUri(decodeURIComponent(imageUriParam));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Intentionally empty to prevent infinite loop

    const selectPrediction = (prediction: FoodPrediction) => {
        setSelectedPrediction(prediction);
        setEditedNutrition({
            calories: prediction.calories,
            protein: prediction.protein,
            carbs: prediction.carbs,
            fat: prediction.fat,
            portion: prediction.portion_estimate,
        });
        setCustomFoodName(prediction.food_name);
    };

    const handleEdit = () => {
        setIsEditing(true);
    };

    const handleSave = async () => {
        if (!selectedPrediction) return;

        setIsSaving(true);

        try {
            const mealData = {
                foods: [{
                    name: customFoodName,
                    calories: editedNutrition.calories,
                    protein: editedNutrition.protein,
                    carbs: editedNutrition.carbs,
                    fat: editedNutrition.fat,
                    confidence: selectedPrediction.confidence,
                    portion_size: editedNutrition.portion,
                }],
                image_uri: imageUri,
                eaten_at: new Date().toISOString(),
                notes: params.barcode ? `Scanned barcode: ${params.barcode}` : '',
                synced: false,
            };

            // Save locally first
            await StorageService.saveMeal(mealData);

            // Try to sync with backend
            try {
                await ApiService.logMeal({
                    foods: mealData.foods,
                    image_url: mealData.image_uri,
                    notes: mealData.notes,
                    eaten_at: mealData.eaten_at,
                });
            } catch (syncError) {
                console.log('Could not sync immediately, will retry later:', syncError);
                // The meal is already saved locally and will sync when online
            }

            Alert.alert(
                'Meal Logged!',
                'Your meal has been successfully added to your diary.',
                [
                    {
                        text: 'OK',
                        onPress: () => router.push('/(tabs)'),
                    },
                ]
            );
        } catch (error) {
            console.error('Error saving meal:', error);
            Alert.alert('Error', 'Failed to save your meal. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleManualEntry = () => {
        router.push('./manual-entry');
    };

    if (predictions.length === 0) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#007AFF" />
                    <Text style={styles.loadingText}>Loading predictions...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                        <Ionicons name="arrow-back" size={24} color="#333" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Confirm Your Meal</Text>
                    <TouchableOpacity style={styles.editButton} onPress={handleEdit}>
                        <Ionicons name="create-outline" size={24} color="#007AFF" />
                    </TouchableOpacity>
                </View>

                {/* Image */}
                {imageUri && (
                    <View style={styles.imageContainer}>
                        <Image source={{ uri: imageUri }} style={styles.foodImage} />
                    </View>
                )}

                {/* Food Predictions */}
                {predictions.length > 1 && (
                    <View style={styles.predictionsContainer}>
                        <Text style={styles.sectionTitle}>AI Predictions</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.predictionsList}>
                            {predictions.map((prediction, index) => (
                                <TouchableOpacity
                                    key={index}
                                    style={[
                                        styles.predictionCard,
                                        selectedPrediction === prediction && styles.selectedPredictionCard,
                                    ]}
                                    onPress={() => selectPrediction(prediction)}
                                >
                                    <Text style={styles.predictionName}>{prediction.food_name}</Text>
                                    <Text style={styles.confidenceText}>
                                        {Math.round(prediction.confidence * 100)}% match
                                    </Text>
                                    <Text style={styles.caloriesText}>{prediction.calories} cal</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                )}

                {/* Selected Food Details */}
                {selectedPrediction && (
                    <View style={styles.detailsContainer}>
                        <Text style={styles.sectionTitle}>Meal Details</Text>

                        {/* Food Name */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Food Name</Text>
                            <TextInput
                                style={[styles.textInput, !isEditing && styles.disabledInput]}
                                value={customFoodName}
                                onChangeText={setCustomFoodName}
                                editable={isEditing}
                                placeholder="Enter food name"
                            />
                        </View>

                        {/* Portion */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Portion Size</Text>
                            <TextInput
                                style={[styles.textInput, !isEditing && styles.disabledInput]}
                                value={editedNutrition.portion}
                                onChangeText={(value) => setEditedNutrition({ ...editedNutrition, portion: value })}
                                editable={isEditing}
                                placeholder="e.g., 1 cup, 100g"
                            />
                        </View>

                        {/* Nutrition Grid */}
                        <View style={styles.nutritionGrid}>
                            <View style={styles.nutritionItem}>
                                <Text style={styles.nutritionLabel}>Calories</Text>
                                <TextInput
                                    style={[styles.nutritionInput, !isEditing && styles.disabledInput]}
                                    value={editedNutrition.calories.toString()}
                                    onChangeText={(value) => setEditedNutrition({
                                        ...editedNutrition,
                                        calories: parseInt(value) || 0
                                    })}
                                    editable={isEditing}
                                    keyboardType="numeric"
                                />
                            </View>

                            <View style={styles.nutritionItem}>
                                <Text style={styles.nutritionLabel}>Protein (g)</Text>
                                <TextInput
                                    style={[styles.nutritionInput, !isEditing && styles.disabledInput]}
                                    value={editedNutrition.protein.toString()}
                                    onChangeText={(value) => setEditedNutrition({
                                        ...editedNutrition,
                                        protein: parseFloat(value) || 0
                                    })}
                                    editable={isEditing}
                                    keyboardType="numeric"
                                />
                            </View>

                            <View style={styles.nutritionItem}>
                                <Text style={styles.nutritionLabel}>Carbs (g)</Text>
                                <TextInput
                                    style={[styles.nutritionInput, !isEditing && styles.disabledInput]}
                                    value={editedNutrition.carbs.toString()}
                                    onChangeText={(value) => setEditedNutrition({
                                        ...editedNutrition,
                                        carbs: parseFloat(value) || 0
                                    })}
                                    editable={isEditing}
                                    keyboardType="numeric"
                                />
                            </View>

                            <View style={styles.nutritionItem}>
                                <Text style={styles.nutritionLabel}>Fat (g)</Text>
                                <TextInput
                                    style={[styles.nutritionInput, !isEditing && styles.disabledInput]}
                                    value={editedNutrition.fat.toString()}
                                    onChangeText={(value) => setEditedNutrition({
                                        ...editedNutrition,
                                        fat: parseFloat(value) || 0
                                    })}
                                    editable={isEditing}
                                    keyboardType="numeric"
                                />
                            </View>
                        </View>

                        {/* Confidence Badge */}
                        <View style={styles.confidenceContainer}>
                            <View style={[
                                styles.confidenceBadge,
                                selectedPrediction.confidence > 0.7 ? styles.highConfidence :
                                    selectedPrediction.confidence > 0.4 ? styles.mediumConfidence : styles.lowConfidence
                            ]}>
                                <Ionicons
                                    name={selectedPrediction.confidence > 0.7 ? "checkmark-circle" : "warning"}
                                    size={16}
                                    color="white"
                                />
                                <Text style={styles.confidenceBadgeText}>
                                    {Math.round(selectedPrediction.confidence * 100)}% confidence
                                </Text>
                            </View>
                        </View>
                    </View>
                )}

                {/* Action Buttons */}
                <View style={styles.actionContainer}>
                    {isEditing ? (
                        <View style={styles.editingButtons}>
                            <TouchableOpacity
                                style={[styles.button, styles.cancelButton]}
                                onPress={() => setIsEditing(false)}
                            >
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.button, styles.saveButton]}
                                onPress={() => setIsEditing(false)}
                            >
                                <Text style={styles.saveButtonText}>Done</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <>
                            <TouchableOpacity
                                style={[styles.button, styles.secondaryButton]}
                                onPress={handleManualEntry}
                            >
                                <Ionicons name="create" size={20} color="#007AFF" />
                                <Text style={styles.secondaryButtonText}>Manual Entry</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.button, styles.primaryButton, isSaving && styles.disabledButton]}
                                onPress={handleSave}
                                disabled={isSaving}
                            >
                                {isSaving ? (
                                    <ActivityIndicator size="small" color="white" />
                                ) : (
                                    <Ionicons name="checkmark" size={20} color="white" />
                                )}
                                <Text style={styles.primaryButtonText}>
                                    {isSaving ? 'Saving...' : 'Log Meal'}
                                </Text>
                            </TouchableOpacity>
                        </>
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    scrollView: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        fontSize: 16,
        color: '#666',
        marginTop: 16,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#e9ecef',
    },
    backButton: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
    },
    editButton: {
        padding: 8,
    },
    imageContainer: {
        alignItems: 'center',
        paddingVertical: 20,
        backgroundColor: 'white',
    },
    foodImage: {
        width: 200,
        height: 200,
        borderRadius: 16,
    },
    predictionsContainer: {
        backgroundColor: 'white',
        marginTop: 12,
        paddingVertical: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
        marginBottom: 16,
        paddingHorizontal: 20,
    },
    predictionsList: {
        paddingHorizontal: 20,
    },
    predictionCard: {
        backgroundColor: '#f8f9fa',
        borderRadius: 12,
        padding: 16,
        marginRight: 12,
        minWidth: 120,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    selectedPredictionCard: {
        backgroundColor: '#e7f3ff',
        borderColor: '#007AFF',
    },
    predictionName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginBottom: 4,
    },
    confidenceText: {
        fontSize: 12,
        color: '#666',
        marginBottom: 4,
    },
    caloriesText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#007AFF',
    },
    detailsContainer: {
        backgroundColor: 'white',
        marginTop: 12,
        paddingHorizontal: 20,
        paddingVertical: 20,
    },
    inputGroup: {
        marginBottom: 20,
    },
    inputLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
    },
    textInput: {
        backgroundColor: '#f8f9fa',
        borderRadius: 8,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 16,
        borderWidth: 1,
        borderColor: '#e9ecef',
    },
    disabledInput: {
        backgroundColor: '#f1f3f4',
        color: '#666',
    },
    nutritionGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: 20,
        gap: 12,
    },
    nutritionItem: {
        flex: 1,
        minWidth: '45%',
    },
    nutritionLabel: {
        fontSize: 14,
        fontWeight: '500',
        color: '#666',
        marginBottom: 6,
    },
    nutritionInput: {
        backgroundColor: '#f8f9fa',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 16,
        textAlign: 'center',
        borderWidth: 1,
        borderColor: '#e9ecef',
    },
    confidenceContainer: {
        alignItems: 'center',
        marginTop: 12,
    },
    confidenceBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        gap: 6,
    },
    highConfidence: {
        backgroundColor: '#28a745',
    },
    mediumConfidence: {
        backgroundColor: '#ffc107',
    },
    lowConfidence: {
        backgroundColor: '#dc3545',
    },
    confidenceBadgeText: {
        color: 'white',
        fontSize: 12,
        fontWeight: '600',
    },
    actionContainer: {
        paddingHorizontal: 20,
        paddingVertical: 24,
        gap: 12,
    },
    editingButtons: {
        flexDirection: 'row',
        gap: 12,
    },
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        paddingHorizontal: 24,
        borderRadius: 12,
        gap: 8,
    },
    primaryButton: {
        backgroundColor: '#007AFF',
        flex: 1,
    },
    primaryButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
    secondaryButton: {
        backgroundColor: 'white',
        borderWidth: 2,
        borderColor: '#007AFF',
        flex: 1,
    },
    secondaryButtonText: {
        color: '#007AFF',
        fontSize: 16,
        fontWeight: '600',
    },
    saveButton: {
        backgroundColor: '#007AFF',
        flex: 1,
    },
    saveButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
    cancelButton: {
        backgroundColor: 'white',
        borderWidth: 2,
        borderColor: '#6c757d',
        flex: 1,
    },
    cancelButtonText: {
        color: '#6c757d',
        fontSize: 16,
        fontWeight: '600',
    },
    disabledButton: {
        opacity: 0.6,
    },
});
