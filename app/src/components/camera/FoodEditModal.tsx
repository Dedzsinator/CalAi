import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TextInput,
    TouchableOpacity,
    ScrollView,
    Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

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

interface FoodEditModalProps {
    visible: boolean;
    foodItem: FoodItem | null;
    onSave: (updatedFood: FoodItem) => void;
    onClose: () => void;
}

const units = [
    { value: 'g', label: 'grams' },
    { value: 'oz', label: 'ounces' },
    { value: 'cup', label: 'cups' },
    { value: 'tbsp', label: 'tablespoons' },
    { value: 'tsp', label: 'teaspoons' },
    { value: 'piece', label: 'pieces' },
    { value: 'slice', label: 'slices' },
];

const FoodEditModal: React.FC<FoodEditModalProps> = ({
    visible,
    foodItem,
    onSave,
    onClose
}) => {
    const [formData, setFormData] = useState({
        name: foodItem?.name || '',
        quantity: foodItem?.quantity?.toString() || '100',
        unit: foodItem?.unit || 'g',
        calories: foodItem?.calories?.toString() || '0',
        protein: foodItem?.protein?.toString() || '0',
        carbs: foodItem?.carbs?.toString() || '0',
        fat: foodItem?.fat?.toString() || '0',
    });

    React.useEffect(() => {
        if (foodItem) {
            setFormData({
                name: foodItem.name,
                quantity: foodItem.quantity.toString(),
                unit: foodItem.unit,
                calories: foodItem.calories.toString(),
                protein: foodItem.protein.toString(),
                carbs: foodItem.carbs.toString(),
                fat: foodItem.fat.toString(),
            });
        }
    }, [foodItem]);

    const handleSave = () => {
        if (!foodItem) return;

        const quantity = parseFloat(formData.quantity);
        const calories = parseFloat(formData.calories);
        const protein = parseFloat(formData.protein);
        const carbs = parseFloat(formData.carbs);
        const fat = parseFloat(formData.fat);

        if (isNaN(quantity) || quantity <= 0) {
            Alert.alert('Error', 'Please enter a valid quantity');
            return;
        }

        if (!formData.name.trim()) {
            Alert.alert('Error', 'Please enter a food name');
            return;
        }

        const updatedFood: FoodItem = {
            ...foodItem,
            name: formData.name.trim(),
            quantity,
            unit: formData.unit,
            calories: isNaN(calories) ? 0 : calories,
            protein: isNaN(protein) ? 0 : protein,
            carbs: isNaN(carbs) ? 0 : carbs,
            fat: isNaN(fat) ? 0 : fat,
        };

        onSave(updatedFood);
        onClose();
    };

    const calculateNutritionFromBase = (baseValue: number, baseQuantity: number, newQuantity: number) => {
        return ((baseValue * newQuantity) / baseQuantity).toFixed(1);
    };

    const handleQuantityChange = (value: string) => {
        setFormData(prev => ({ ...prev, quantity: value }));

        if (foodItem && !isNaN(parseFloat(value))) {
            const newQuantity = parseFloat(value);
            const ratio = newQuantity / foodItem.quantity;

            setFormData(prev => ({
                ...prev,
                quantity: value,
                calories: (foodItem.calories * ratio).toFixed(1),
                protein: (foodItem.protein * ratio).toFixed(1),
                carbs: (foodItem.carbs * ratio).toFixed(1),
                fat: (foodItem.fat * ratio).toFixed(1),
            }));
        }
    };

    if (!foodItem) return null;

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
            <View style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={onClose}>
                        <Ionicons name="close" size={24} color="#666" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Edit Food Item</Text>
                    <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
                        <Text style={styles.saveButtonText}>Save</Text>
                    </TouchableOpacity>
                </View>

                <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
                    {/* Food Name */}
                    <View style={styles.section}>
                        <Text style={styles.label}>Food Name</Text>
                        <TextInput
                            style={styles.textInput}
                            value={formData.name}
                            onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
                            placeholder="Enter food name"
                            placeholderTextColor="#999"
                        />
                    </View>

                    {/* Quantity and Unit */}
                    <View style={styles.section}>
                        <Text style={styles.label}>Quantity</Text>
                        <View style={styles.quantityRow}>
                            <TextInput
                                style={[styles.textInput, styles.quantityInput]}
                                value={formData.quantity}
                                onChangeText={handleQuantityChange}
                                placeholder="0"
                                placeholderTextColor="#999"
                                keyboardType="numeric"
                            />
                            <View style={styles.unitSelector}>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                    {units.map((unit) => (
                                        <TouchableOpacity
                                            key={unit.value}
                                            style={[
                                                styles.unitButton,
                                                formData.unit === unit.value && styles.unitButtonActive
                                            ]}
                                            onPress={() => setFormData(prev => ({ ...prev, unit: unit.value }))}
                                        >
                                            <Text style={[
                                                styles.unitText,
                                                formData.unit === unit.value && styles.unitTextActive
                                            ]}>
                                                {unit.label}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </View>
                        </View>
                    </View>

                    {/* Nutrition Information */}
                    <View style={styles.section}>
                        <Text style={styles.label}>Nutrition Information</Text>
                        <Text style={styles.sublabel}>
                            Adjust these values if the AI estimation seems incorrect
                        </Text>

                        <View style={styles.nutritionGrid}>
                            <View style={styles.nutritionItem}>
                                <Text style={styles.nutritionLabel}>Calories</Text>
                                <TextInput
                                    style={styles.nutritionInput}
                                    value={formData.calories}
                                    onChangeText={(text) => setFormData(prev => ({ ...prev, calories: text }))}
                                    placeholder="0"
                                    placeholderTextColor="#999"
                                    keyboardType="numeric"
                                />
                            </View>

                            <View style={styles.nutritionItem}>
                                <Text style={styles.nutritionLabel}>Protein (g)</Text>
                                <TextInput
                                    style={styles.nutritionInput}
                                    value={formData.protein}
                                    onChangeText={(text) => setFormData(prev => ({ ...prev, protein: text }))}
                                    placeholder="0"
                                    placeholderTextColor="#999"
                                    keyboardType="numeric"
                                />
                            </View>

                            <View style={styles.nutritionItem}>
                                <Text style={styles.nutritionLabel}>Carbs (g)</Text>
                                <TextInput
                                    style={styles.nutritionInput}
                                    value={formData.carbs}
                                    onChangeText={(text) => setFormData(prev => ({ ...prev, carbs: text }))}
                                    placeholder="0"
                                    placeholderTextColor="#999"
                                    keyboardType="numeric"
                                />
                            </View>

                            <View style={styles.nutritionItem}>
                                <Text style={styles.nutritionLabel}>Fat (g)</Text>
                                <TextInput
                                    style={styles.nutritionInput}
                                    value={formData.fat}
                                    onChangeText={(text) => setFormData(prev => ({ ...prev, fat: text }))}
                                    placeholder="0"
                                    placeholderTextColor="#999"
                                    keyboardType="numeric"
                                />
                            </View>
                        </View>
                    </View>

                    {/* Confidence Info */}
                    <View style={styles.section}>
                        <View style={styles.confidenceInfo}>
                            <Ionicons name="information-circle-outline" size={20} color="#666" />
                            <View style={styles.confidenceText}>
                                <Text style={styles.confidenceTitle}>AI Confidence</Text>
                                <Text style={styles.confidenceValue}>
                                    {Math.round(foodItem.confidence * 100)}% confident in food identification
                                </Text>
                            </View>
                        </View>
                    </View>
                </ScrollView>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        paddingTop: 60,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
    },
    saveButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        backgroundColor: '#2196F3',
        borderRadius: 6,
    },
    saveButtonText: {
        color: '#fff',
        fontWeight: '600',
    },
    form: {
        flex: 1,
        padding: 16,
    },
    section: {
        marginBottom: 24,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
    },
    sublabel: {
        fontSize: 14,
        color: '#666',
        marginBottom: 12,
    },
    textInput: {
        backgroundColor: '#fff',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    quantityRow: {
        flexDirection: 'row',
        gap: 12,
    },
    quantityInput: {
        flex: 1,
    },
    unitSelector: {
        flex: 2,
    },
    unitButton: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        backgroundColor: '#fff',
        borderRadius: 6,
        borderWidth: 1,
        borderColor: '#e0e0e0',
        marginRight: 8,
    },
    unitButtonActive: {
        backgroundColor: '#2196F3',
        borderColor: '#2196F3',
    },
    unitText: {
        fontSize: 14,
        color: '#666',
    },
    unitTextActive: {
        color: '#fff',
        fontWeight: '600',
    },
    nutritionGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    nutritionItem: {
        flex: 1,
        minWidth: '45%',
    },
    nutritionLabel: {
        fontSize: 14,
        fontWeight: '500',
        color: '#333',
        marginBottom: 4,
    },
    nutritionInput: {
        backgroundColor: '#fff',
        borderRadius: 6,
        padding: 10,
        fontSize: 14,
        borderWidth: 1,
        borderColor: '#e0e0e0',
        textAlign: 'center',
    },
    confidenceInfo: {
        flexDirection: 'row',
        backgroundColor: '#e3f2fd',
        padding: 12,
        borderRadius: 8,
        alignItems: 'flex-start',
        gap: 8,
    },
    confidenceText: {
        flex: 1,
    },
    confidenceTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1976d2',
        marginBottom: 2,
    },
    confidenceValue: {
        fontSize: 12,
        color: '#1976d2',
    },
});

export default FoodEditModal;
