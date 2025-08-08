import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    ScrollView,
    Alert,
    ActivityIndicator,
    FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import StorageService from '../services/storage';
import ApiService from '../services/api';

interface FoodItem {
    id: string;
    name: string;
    brand?: string;
    calories_per_100g: number;
    protein_per_100g: number;
    carbs_per_100g: number;
    fat_per_100g: number;
}

interface NutritionData {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
}

export default function ManualEntryScreen() {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<FoodItem[]>([]);
    const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);
    const [isSearching, setIsSearching] = useState(false);
    const [showManualEntry, setShowManualEntry] = useState(false);

    // For selected food
    const [portion, setPortion] = useState('100');
    const [portionUnit] = useState('g');
    const [nutrition, setNutrition] = useState<NutritionData>({
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
    });

    // For manual entry
    const [manualFoodName, setManualFoodName] = useState('');
    const [manualCalories, setManualCalories] = useState('');
    const [manualProtein, setManualProtein] = useState('');
    const [manualCarbs, setManualCarbs] = useState('');
    const [manualFat, setManualFat] = useState('');
    const [manualPortion, setManualPortion] = useState('');

    // Search food database with debouncing
    const searchFoods = useCallback(async (query: string) => {
        if (query.length < 2) {
            setSearchResults([]);
            return;
        }

        setIsSearching(true);
        try {
            const results = await ApiService.searchFoods(query);
            if (results.success) {
                setSearchResults(results.data);
            }
        } catch (error) {
            console.error('Food search failed:', error);
            // Provide fallback with common foods
            const fallbackFoods = getFallbackFoods(query);
            setSearchResults(fallbackFoods);
        } finally {
            setIsSearching(false);
        }
    }, []);

    // Fallback food database for when API is not available
    const getFallbackFoods = (query: string): FoodItem[] => {
        const commonFoods: FoodItem[] = [
            { id: '1', name: 'Apple', calories_per_100g: 52, protein_per_100g: 0.3, carbs_per_100g: 14, fat_per_100g: 0.2 },
            { id: '2', name: 'Banana', calories_per_100g: 89, protein_per_100g: 1.1, carbs_per_100g: 23, fat_per_100g: 0.3 },
            { id: '3', name: 'Chicken Breast', calories_per_100g: 165, protein_per_100g: 31, carbs_per_100g: 0, fat_per_100g: 3.6 },
            { id: '4', name: 'Rice', calories_per_100g: 130, protein_per_100g: 2.7, carbs_per_100g: 28, fat_per_100g: 0.3 },
            { id: '5', name: 'Pasta', calories_per_100g: 131, protein_per_100g: 5, carbs_per_100g: 25, fat_per_100g: 1.1 },
            { id: '6', name: 'Bread', calories_per_100g: 265, protein_per_100g: 9, carbs_per_100g: 49, fat_per_100g: 3.2 },
            { id: '7', name: 'Milk', calories_per_100g: 42, protein_per_100g: 3.4, carbs_per_100g: 5, fat_per_100g: 1 },
            { id: '8', name: 'Egg', calories_per_100g: 155, protein_per_100g: 13, carbs_per_100g: 1.1, fat_per_100g: 11 },
            { id: '9', name: 'Broccoli', calories_per_100g: 34, protein_per_100g: 2.8, carbs_per_100g: 7, fat_per_100g: 0.4 },
            { id: '10', name: 'Salmon', calories_per_100g: 208, protein_per_100g: 20, carbs_per_100g: 0, fat_per_100g: 13 },
            { id: '11', name: 'Yogurt', calories_per_100g: 59, protein_per_100g: 10, carbs_per_100g: 3.6, fat_per_100g: 0.4 },
            { id: '12', name: 'Oats', calories_per_100g: 389, protein_per_100g: 17, carbs_per_100g: 66, fat_per_100g: 7 },
        ];

        return commonFoods.filter(food =>
            food.name.toLowerCase().includes(query.toLowerCase())
        );
    };

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            searchFoods(searchQuery);
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [searchQuery, searchFoods]);

    useEffect(() => {
        if (selectedFood && portion) {
            const portionAmount = parseFloat(portion) || 0;
            const multiplier = portionAmount / 100; // Since nutrition data is per 100g

            setNutrition({
                calories: Math.round(selectedFood.calories_per_100g * multiplier),
                protein: Math.round((selectedFood.protein_per_100g * multiplier) * 10) / 10,
                carbs: Math.round((selectedFood.carbs_per_100g * multiplier) * 10) / 10,
                fat: Math.round((selectedFood.fat_per_100g * multiplier) * 10) / 10,
            });
        }
    }, [selectedFood, portion]);

    const selectFood = (food: FoodItem) => {
        setSelectedFood(food);
        setSearchQuery('');
        setSearchResults([]);
    };

    const handleSaveSelectedFood = async () => {
        if (!selectedFood) return;

        try {
            const mealData = {
                foods: [{
                    name: selectedFood.name + (selectedFood.brand ? ` (${selectedFood.brand})` : ''),
                    calories: nutrition.calories,
                    protein: nutrition.protein,
                    carbs: nutrition.carbs,
                    fat: nutrition.fat,
                    confidence: 1.0,
                    portion_size: `${portion}${portionUnit}`,
                }],
                eaten_at: new Date().toISOString(),
                notes: 'Food database entry',
                synced: false,
            };

            await StorageService.saveMeal(mealData);

            Alert.alert(
                'Success',
                'Meal added successfully!',
                [
                    {
                        text: 'OK',
                        onPress: () => router.push('/(tabs)'),
                    },
                ]
            );
        } catch (error) {
            console.error('Error saving meal:', error);
            Alert.alert('Error', 'Failed to save meal. Please try again.');
        }
    };

    const handleSaveManualEntry = async () => {
        if (!manualFoodName || !manualCalories) {
            Alert.alert('Error', 'Please enter at least the food name and calories.');
            return;
        }

        try {
            const mealData = {
                foods: [{
                    name: manualFoodName,
                    calories: parseInt(manualCalories) || 0,
                    protein: parseFloat(manualProtein) || 0,
                    carbs: parseFloat(manualCarbs) || 0,
                    fat: parseFloat(manualFat) || 0,
                    confidence: 1.0,
                    portion_size: manualPortion || '1 serving',
                }],
                eaten_at: new Date().toISOString(),
                notes: 'Manual entry',
                synced: false,
            };

            await StorageService.saveMeal(mealData);

            Alert.alert(
                'Success',
                'Meal added successfully!',
                [
                    {
                        text: 'OK',
                        onPress: () => router.push('/(tabs)'),
                    },
                ]
            );
        } catch (error) {
            console.error('Error saving manual entry:', error);
            Alert.alert('Error', 'Failed to save meal. Please try again.');
        }
    };

    const renderFoodSearchItem = ({ item }: { item: FoodItem }) => (
        <TouchableOpacity style={styles.searchResultItem} onPress={() => selectFood(item)}>
            <View style={styles.searchResultContent}>
                <Text style={styles.foodName}>{item.name}</Text>
                {item.brand && <Text style={styles.foodBrand}>{item.brand}</Text>}
                <Text style={styles.foodCalories}>{item.calories_per_100g} cal/100g</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
        </TouchableOpacity>
    );

    if (selectedFood) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity style={styles.backButton} onPress={() => setSelectedFood(null)}>
                        <Ionicons name="arrow-back" size={24} color="#333" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Add Food</Text>
                    <TouchableOpacity style={styles.saveButton} onPress={handleSaveSelectedFood}>
                        <Text style={styles.saveButtonText}>Save</Text>
                    </TouchableOpacity>
                </View>

                <ScrollView style={styles.content}>
                    <View style={styles.selectedFoodCard}>
                        <Text style={styles.selectedFoodName}>{selectedFood.name}</Text>
                        {selectedFood.brand && (
                            <Text style={styles.selectedFoodBrand}>{selectedFood.brand}</Text>
                        )}
                    </View>

                    <View style={styles.portionSection}>
                        <Text style={styles.sectionTitle}>Portion Size</Text>
                        <View style={styles.portionInputContainer}>
                            <TextInput
                                style={styles.portionInput}
                                value={portion}
                                onChangeText={setPortion}
                                keyboardType="numeric"
                                placeholder="100"
                            />
                            <View style={styles.unitSelector}>
                                <Text style={styles.unitText}>{portionUnit}</Text>
                            </View>
                        </View>
                    </View>

                    <View style={styles.nutritionSection}>
                        <Text style={styles.sectionTitle}>Nutrition (per {portion}{portionUnit})</Text>

                        <View style={styles.nutritionGrid}>
                            <View style={styles.nutritionItem}>
                                <Text style={styles.nutritionValue}>{nutrition.calories}</Text>
                                <Text style={styles.nutritionLabel}>Calories</Text>
                            </View>
                            <View style={styles.nutritionItem}>
                                <Text style={styles.nutritionValue}>{nutrition.protein}g</Text>
                                <Text style={styles.nutritionLabel}>Protein</Text>
                            </View>
                            <View style={styles.nutritionItem}>
                                <Text style={styles.nutritionValue}>{nutrition.carbs}g</Text>
                                <Text style={styles.nutritionLabel}>Carbs</Text>
                            </View>
                            <View style={styles.nutritionItem}>
                                <Text style={styles.nutritionValue}>{nutrition.fat}g</Text>
                                <Text style={styles.nutritionLabel}>Fat</Text>
                            </View>
                        </View>
                    </View>
                </ScrollView>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Add Food</Text>
                <TouchableOpacity
                    style={styles.manualButton}
                    onPress={() => setShowManualEntry(!showManualEntry)}
                >
                    <Text style={styles.manualButtonText}>
                        {showManualEntry ? 'Search' : 'Manual'}
                    </Text>
                </TouchableOpacity>
            </View>

            {!showManualEntry ? (
                <>
                    {/* Search Interface */}
                    <View style={styles.searchContainer}>
                        <View style={styles.searchInputContainer}>
                            <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
                            <TextInput
                                style={styles.searchInput}
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                                placeholder="Search foods (e.g., apple, chicken breast, pasta)"
                                autoFocus
                            />
                            {searchQuery.length > 0 && (
                                <TouchableOpacity onPress={() => setSearchQuery('')}>
                                    <Ionicons name="close-circle" size={20} color="#666" />
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>

                    {/* Search Results */}
                    {isSearching && (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color="#007AFF" />
                            <Text style={styles.loadingText}>Searching foods...</Text>
                        </View>
                    )}

                    {searchResults.length > 0 && !isSearching && (
                        <FlatList
                            data={searchResults}
                            renderItem={renderFoodSearchItem}
                            keyExtractor={(item) => item.id}
                            style={styles.searchResults}
                        />
                    )}

                    {searchQuery.length >= 2 && searchResults.length === 0 && !isSearching && (
                        <View style={styles.noResultsContainer}>
                            <Ionicons name="search" size={48} color="#ccc" />
                            <Text style={styles.noResultsText}>No foods found</Text>
                            <Text style={styles.noResultsSubtext}>
                                Try a different search term or add it manually
                            </Text>
                            <TouchableOpacity
                                style={styles.addManuallyButton}
                                onPress={() => setShowManualEntry(true)}
                            >
                                <Text style={styles.addManuallyButtonText}>Add Manually</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {searchQuery.length === 0 && (
                        <View style={styles.emptyStateContainer}>
                            <Ionicons name="restaurant" size={64} color="#ccc" />
                            <Text style={styles.emptyStateTitle}>Search for Foods</Text>
                            <Text style={styles.emptyStateSubtext}>
                                Search our database of over 1M foods, or add your own manually
                            </Text>
                        </View>
                    )}
                </>
            ) : (
                /* Manual Entry Interface */
                <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Food Name *</Text>
                        <TextInput
                            style={styles.input}
                            value={manualFoodName}
                            onChangeText={setManualFoodName}
                            placeholder="Enter food name"
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Portion Size</Text>
                        <TextInput
                            style={styles.input}
                            value={manualPortion}
                            onChangeText={setManualPortion}
                            placeholder="e.g., 1 cup, 100g, 1 medium"
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Calories *</Text>
                        <TextInput
                            style={styles.input}
                            value={manualCalories}
                            onChangeText={setManualCalories}
                            placeholder="Enter calories"
                            keyboardType="numeric"
                        />
                    </View>

                    <View style={styles.row}>
                        <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
                            <Text style={styles.label}>Protein (g)</Text>
                            <TextInput
                                style={styles.input}
                                value={manualProtein}
                                onChangeText={setManualProtein}
                                placeholder="0"
                                keyboardType="numeric"
                            />
                        </View>

                        <View style={[styles.inputGroup, { flex: 1, marginLeft: 10 }]}>
                            <Text style={styles.label}>Carbs (g)</Text>
                            <TextInput
                                style={styles.input}
                                value={manualCarbs}
                                onChangeText={setManualCarbs}
                                placeholder="0"
                                keyboardType="numeric"
                            />
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Fat (g)</Text>
                        <TextInput
                            style={styles.input}
                            value={manualFat}
                            onChangeText={setManualFat}
                            placeholder="0"
                            keyboardType="numeric"
                        />
                    </View>

                    <TouchableOpacity style={styles.primaryButton} onPress={handleSaveManualEntry}>
                        <Text style={styles.primaryButtonText}>Save Meal</Text>
                    </TouchableOpacity>
                </ScrollView>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    backButton: {
        padding: 8,
        marginLeft: -8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    saveButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        backgroundColor: '#007AFF',
        borderRadius: 20,
    },
    saveButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    manualButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        backgroundColor: '#f0f0f0',
        borderRadius: 20,
    },
    manualButtonText: {
        color: '#333',
        fontSize: 16,
        fontWeight: '600',
    },
    content: {
        flex: 1,
        paddingHorizontal: 20,
    },

    // Search Interface
    searchContainer: {
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: '#f8f9fa',
    },
    searchInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    searchIcon: {
        marginRight: 12,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: '#333',
    },
    searchResults: {
        flex: 1,
    },
    searchResultItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    searchResultContent: {
        flex: 1,
    },
    foodName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 4,
    },
    foodBrand: {
        fontSize: 14,
        color: '#666',
        marginBottom: 4,
    },
    foodCalories: {
        fontSize: 14,
        color: '#007AFF',
    },

    // Loading & Empty States
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 60,
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: '#666',
    },
    noResultsContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 60,
        paddingHorizontal: 40,
    },
    noResultsText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginTop: 16,
        textAlign: 'center',
    },
    noResultsSubtext: {
        fontSize: 14,
        color: '#666',
        marginTop: 8,
        textAlign: 'center',
        lineHeight: 20,
    },
    addManuallyButton: {
        marginTop: 20,
        paddingHorizontal: 24,
        paddingVertical: 12,
        backgroundColor: '#007AFF',
        borderRadius: 24,
    },
    addManuallyButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    emptyStateContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 60,
        paddingHorizontal: 40,
    },
    emptyStateTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        marginTop: 20,
        textAlign: 'center',
    },
    emptyStateSubtext: {
        fontSize: 14,
        color: '#666',
        marginTop: 12,
        textAlign: 'center',
        lineHeight: 20,
    },

    // Selected Food Interface
    selectedFoodCard: {
        backgroundColor: '#f8f9fa',
        padding: 20,
        borderRadius: 12,
        marginVertical: 16,
    },
    selectedFoodName: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 4,
    },
    selectedFoodBrand: {
        fontSize: 16,
        color: '#666',
    },
    portionSection: {
        marginVertical: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 12,
    },
    portionInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    portionInput: {
        flex: 1,
        fontSize: 16,
        color: '#333',
        borderWidth: 1,
        borderColor: '#e0e0e0',
        borderRadius: 8,
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#fff',
    },
    unitSelector: {
        marginLeft: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#f0f0f0',
        borderRadius: 8,
    },
    unitText: {
        fontSize: 16,
        color: '#333',
        fontWeight: '600',
    },
    nutritionSection: {
        marginVertical: 16,
    },
    nutritionGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    nutritionItem: {
        width: '50%',
        alignItems: 'center',
        paddingVertical: 16,
        borderWidth: 1,
        borderColor: '#e0e0e0',
        backgroundColor: '#f8f9fa',
    },
    nutritionValue: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#007AFF',
        marginBottom: 4,
    },
    nutritionLabel: {
        fontSize: 14,
        color: '#666',
    },

    // Manual Entry Interface
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
    },
    input: {
        fontSize: 16,
        color: '#333',
        borderWidth: 1,
        borderColor: '#e0e0e0',
        borderRadius: 8,
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#fff',
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    primaryButton: {
        backgroundColor: '#007AFF',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 20,
        marginBottom: 40,
    },
    primaryButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
});
