import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    ScrollView,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import StorageService from '../services/storage';

export default function ManualEntryScreen() {
    const [foodName, setFoodName] = useState('');
    const [calories, setCalories] = useState('');
    const [protein, setProtein] = useState('');
    const [carbs, setCarbs] = useState('');
    const [fat, setFat] = useState('');
    const [portion, setPortion] = useState('');

    const handleSave = async () => {
        if (!foodName || !calories) {
            Alert.alert('Error', 'Please enter at least the food name and calories.');
            return;
        }

        try {
            const mealData = {
                foods: [{
                    name: foodName,
                    calories: parseInt(calories) || 0,
                    protein: parseFloat(protein) || 0,
                    carbs: parseFloat(carbs) || 0,
                    fat: parseFloat(fat) || 0,
                    confidence: 1.0, // Manual entry is always 100% confident
                    portion_size: portion || '1 serving',
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

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Manual Entry</Text>
                <View style={styles.placeholder} />
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Food Name *</Text>
                    <TextInput
                        style={styles.input}
                        value={foodName}
                        onChangeText={setFoodName}
                        placeholder="Enter food name"
                        autoFocus
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Portion Size</Text>
                    <TextInput
                        style={styles.input}
                        value={portion}
                        onChangeText={setPortion}
                        placeholder="e.g., 1 cup, 100g, 1 medium"
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Calories *</Text>
                    <TextInput
                        style={styles.input}
                        value={calories}
                        onChangeText={setCalories}
                        placeholder="0"
                        keyboardType="numeric"
                    />
                </View>

                <View style={styles.row}>
                    <View style={styles.halfInput}>
                        <Text style={styles.label}>Protein (g)</Text>
                        <TextInput
                            style={styles.input}
                            value={protein}
                            onChangeText={setProtein}
                            placeholder="0"
                            keyboardType="numeric"
                        />
                    </View>

                    <View style={styles.halfInput}>
                        <Text style={styles.label}>Carbs (g)</Text>
                        <TextInput
                            style={styles.input}
                            value={carbs}
                            onChangeText={setCarbs}
                            placeholder="0"
                            keyboardType="numeric"
                        />
                    </View>
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Fat (g)</Text>
                    <TextInput
                        style={styles.input}
                        value={fat}
                        onChangeText={setFat}
                        placeholder="0"
                        keyboardType="numeric"
                    />
                </View>

                <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                    <Ionicons name="checkmark" size={20} color="white" />
                    <Text style={styles.saveButtonText}>Add Meal</Text>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
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
    placeholder: {
        width: 40,
    },
    content: {
        flex: 1,
        paddingHorizontal: 20,
        paddingTop: 20,
    },
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
        backgroundColor: 'white',
        borderRadius: 8,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 16,
        borderWidth: 1,
        borderColor: '#e9ecef',
    },
    row: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 20,
    },
    halfInput: {
        flex: 1,
    },
    saveButton: {
        backgroundColor: '#007AFF',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        borderRadius: 12,
        marginTop: 20,
        marginBottom: 40,
        gap: 8,
    },
    saveButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
});
