import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
} from 'react-native';

interface MealFiltersProps {
    selectedDate: Date;
    mealType: string;
    onDateChange: (date: Date) => void;
    onMealTypeChange: (type: string) => void;
}

const MEAL_TYPES = [
    { key: 'all', label: 'All Meals' },
    { key: 'breakfast', label: 'Breakfast' },
    { key: 'lunch', label: 'Lunch' },
    { key: 'dinner', label: 'Dinner' },
    { key: 'snack', label: 'Snacks' },
];

export const MealFilters: React.FC<MealFiltersProps> = ({
    selectedDate,
    mealType,
    onDateChange,
    onMealTypeChange,
}) => {
    const getDateString = (date: Date) => {
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);

        if (date.toDateString() === today.toDateString()) {
            return 'Today';
        } else if (date.toDateString() === yesterday.toDateString()) {
            return 'Yesterday';
        } else {
            return date.toLocaleDateString();
        }
    };

    const getDateButtons = () => {
        const dates: Date[] = [];
        const today = new Date();

        for (let i = 6; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(today.getDate() - i);
            dates.push(date);
        }

        return dates;
    };

    return (
        <View style={styles.container}>
            {/* Date Filter */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Date</Text>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.dateScrollContainer}
                >
                    {getDateButtons().map((date, index) => (
                        <TouchableOpacity
                            key={index}
                            style={[
                                styles.dateButton,
                                selectedDate.toDateString() === date.toDateString() && styles.dateButtonActive
                            ]}
                            onPress={() => onDateChange(date)}
                        >
                            <Text style={[
                                styles.dateButtonText,
                                selectedDate.toDateString() === date.toDateString() && styles.dateButtonTextActive
                            ]}>
                                {getDateString(date)}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {/* Meal Type Filter */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Meal Type</Text>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.typeScrollContainer}
                >
                    {MEAL_TYPES.map((type) => (
                        <TouchableOpacity
                            key={type.key}
                            style={[
                                styles.typeButton,
                                mealType === type.key && styles.typeButtonActive
                            ]}
                            onPress={() => onMealTypeChange(type.key)}
                        >
                            <Text style={[
                                styles.typeButtonText,
                                mealType === type.key && styles.typeButtonTextActive
                            ]}>
                                {type.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: 'white',
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    section: {
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
        paddingHorizontal: 16,
    },
    dateScrollContainer: {
        paddingHorizontal: 16,
        gap: 8,
    },
    dateButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#f5f5f5',
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    dateButtonActive: {
        backgroundColor: '#007AFF',
        borderColor: '#007AFF',
    },
    dateButtonText: {
        fontSize: 14,
        color: '#666',
        fontWeight: '500',
    },
    dateButtonTextActive: {
        color: 'white',
    },
    typeScrollContainer: {
        paddingHorizontal: 16,
        gap: 8,
    },
    typeButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#f5f5f5',
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    typeButtonActive: {
        backgroundColor: '#4CAF50',
        borderColor: '#4CAF50',
    },
    typeButtonText: {
        fontSize: 14,
        color: '#666',
        fontWeight: '500',
    },
    typeButtonTextActive: {
        color: 'white',
    },
});
