import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Image,
    RefreshControl,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import storageService from '@/services/storage';
import apiService from '@/services/api';

interface Meal {
    id: string;
    name: string;
    timestamp: Date;
    calories: number;
    image?: string;
    foods: {
        name: string;
        quantity: string;
        calories: number;
    }[];
    mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
}

export default function MealsScreen() {
    const colorScheme = useColorScheme();
    const [meals, setMeals] = useState<Meal[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'week' | 'month'>('today');

    const colors = Colors[colorScheme ?? 'light'];

    const loadMeals = useCallback(async () => {
        try {
            setLoading(true);

            // Load meals from local storage first
            const localMeals = await storageService.getMeals();
            setMeals(localMeals);

            // Then sync with backend
            const syncedMeals = await apiService.getMeals(selectedPeriod);
            setMeals(syncedMeals);

            // Update local storage
            await storageService.saveMeals(syncedMeals);
        } catch (error) {
            console.error('Error loading meals:', error);
            Alert.alert('Error', 'Failed to load meals');
        } finally {
            setLoading(false);
        }
    }, [selectedPeriod]);

    useEffect(() => {
        loadMeals();
    }, [loadMeals]);

    const onRefresh = async () => {
        setRefreshing(true);
        await loadMeals();
        setRefreshing(false);
    };

    const deleteMeal = async (mealId: string) => {
        Alert.alert(
            'Delete Meal',
            'Are you sure you want to delete this meal?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await apiService.deleteMeal(mealId);
                            await loadMeals();
                        } catch (error) {
                            console.error('Error deleting meal:', error);
                            Alert.alert('Error', 'Failed to delete meal');
                        }
                    },
                },
            ]
        );
    };

    const editMeal = (meal: Meal) => {
        router.push({
            pathname: '/manual-entry',
            params: { mealId: meal.id, editMode: 'true' },
        });
    };

    const getMealIcon = (mealType: string) => {
        switch (mealType) {
            case 'breakfast':
                return 'breakfast-dining';
            case 'lunch':
                return 'lunch-dining';
            case 'dinner':
                return 'dinner-dining';
            case 'snack':
                return 'cookie';
            default:
                return 'restaurant';
        }
    };

    const formatTime = (timestamp: Date) => {
        return new Date(timestamp).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const formatDate = (timestamp: Date) => {
        const date = new Date(timestamp);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        if (date.toDateString() === today.toDateString()) {
            return 'Today';
        } else if (date.toDateString() === yesterday.toDateString()) {
            return 'Yesterday';
        } else {
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        }
    };

    const renderMeal = ({ item }: { item: Meal }) => (
        <ThemedView style={[styles.mealCard, { borderColor: colors.border }]}>
            <View style={styles.mealHeader}>
                <View style={styles.mealInfo}>
                    <View style={styles.mealTypeContainer}>
                        <MaterialIcons
                            name={getMealIcon(item.mealType) as any}
                            size={20}
                            color={colors.primary}
                        />
                        <ThemedText style={styles.mealType}>
                            {item.mealType.charAt(0).toUpperCase() + item.mealType.slice(1)}
                        </ThemedText>
                    </View>
                    <ThemedText style={styles.mealTime}>
                        {formatDate(item.timestamp)} • {formatTime(item.timestamp)}
                    </ThemedText>
                </View>
                <View style={styles.mealActions}>
                    <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => editMeal(item)}
                    >
                        <MaterialIcons name="edit" size={20} color={colors.text} />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => deleteMeal(item.id)}
                    >
                        <MaterialIcons name="delete" size={20} color={colors.error} />
                    </TouchableOpacity>
                </View>
            </View>

            {item.image && (
                <Image source={{ uri: item.image }} style={styles.mealImage} />
            )}

            <ThemedText style={styles.mealName}>{item.name}</ThemedText>

            <View style={styles.foodsList}>
                {item.foods.map((food, index) => (
                    <View key={index} style={styles.foodItem}>
                        <ThemedText style={styles.foodName}>{food.name}</ThemedText>
                        <ThemedText style={styles.foodQuantity}>{food.quantity}</ThemedText>
                    </View>
                ))}
            </View>

            <View style={styles.caloriesContainer}>
                <View
                    style={[styles.caloriesGradient, { backgroundColor: colors.primary }]}
                >
                    <ThemedText style={styles.caloriesText}>
                        {item.calories} cal
                    </ThemedText>
                </View>
            </View>
        </ThemedView>
    );

    const PeriodSelector = () => (
        <View style={[styles.periodSelector, { borderColor: colors.border }]}>
            {(['today', 'week', 'month'] as const).map((period) => (
                <TouchableOpacity
                    key={period}
                    style={[
                        styles.periodButton,
                        selectedPeriod === period && { backgroundColor: colors.primary },
                    ]}
                    onPress={() => setSelectedPeriod(period)}
                >
                    <ThemedText
                        style={[
                            styles.periodButtonText,
                            selectedPeriod === period && { color: 'white' },
                        ]}
                    >
                        {period.charAt(0).toUpperCase() + period.slice(1)}
                    </ThemedText>
                </TouchableOpacity>
            ))}
        </View>
    );

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <ThemedView style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    <ThemedText style={styles.loadingText}>Loading meals...</ThemedText>
                </ThemedView>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <ThemedView style={styles.header}>
                <ThemedText style={styles.title}>My Meals</ThemedText>
                <PeriodSelector />
            </ThemedView>

            <FlatList
                data={meals}
                renderItem={renderMeal}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                    <ThemedView style={styles.emptyContainer}>
                        <MaterialIcons name="restaurant" size={64} color={colors.textSecondary} />
                        <ThemedText style={styles.emptyTitle}>No meals logged</ThemedText>
                        <ThemedText style={styles.emptySubtitle}>
                            Start tracking your meals by taking a photo or adding manually
                        </ThemedText>
                        <TouchableOpacity
                            style={[styles.addButton, { backgroundColor: colors.primary }]}
                            onPress={() => router.push('/camera')}
                        >
                            <MaterialIcons name="add" size={24} color="white" />
                            <ThemedText style={styles.addButtonText}>Add Meal</ThemedText>
                        </TouchableOpacity>
                    </ThemedView>
                }
            />
        </SafeAreaView>
    );
}

const PeriodSelector = () => (
    <View style={[styles.periodSelector, { borderColor: colors.border }]}>
        {(['today', 'week', 'month'] as const).map((period) => (
            <TouchableOpacity
                key={period}
                style={[
                    styles.periodButton,
                    selectedPeriod === period && { backgroundColor: colors.primary },
                ]}
                onPress={() => setSelectedPeriod(period)}
            >
                <ThemedText
                    style={[
                        styles.periodButtonText,
                        selectedPeriod === period && { color: 'white' },
                    ]}
                >
                    {period.charAt(0).toUpperCase() + period.slice(1)}
                </ThemedText>
            </TouchableOpacity>
        ))}
    </View>
);

if (loading) {
    return (
        <SafeAreaView style={styles.container}>
            <ThemedView style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <ThemedText style={styles.loadingText}>Loading meals...</ThemedText>
            </ThemedView>
        </SafeAreaView>
    );
}

return (
    <SafeAreaView style={styles.container}>
        <ThemedView style={styles.header}>
            <ThemedText style={styles.title}>My Meals</ThemedText>
            <PeriodSelector />
        </ThemedView>

        <FlatList
            data={meals}
            renderItem={renderMeal}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
                <ThemedView style={styles.emptyContainer}>
                    <MaterialIcons name="restaurant" size={64} color={colors.textSecondary} />
                    <ThemedText style={styles.emptyTitle}>No meals logged</ThemedText>
                    <ThemedText style={styles.emptySubtitle}>
                        Start tracking your meals by taking a photo or adding manually
                    </ThemedText>
                    <TouchableOpacity
                        style={[styles.addButton, { backgroundColor: colors.primary }]}
                        onPress={() => router.push('/camera')}
                    >
                        <MaterialIcons name="add" size={24} color="white" />
                        <ThemedText style={styles.addButtonText}>Add Meal</ThemedText>
                    </TouchableOpacity>
                </ThemedView>
            }
        />
    </SafeAreaView>
);
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        padding: 20,
        paddingBottom: 10,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    periodSelector: {
        flexDirection: 'row',
        borderRadius: 12,
        borderWidth: 1,
        overflow: 'hidden',
    },
    periodButton: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
    },
    periodButtonText: {
        fontSize: 14,
        fontWeight: '600',
    },
    listContent: {
        padding: 20,
        paddingTop: 10,
    },
    mealCard: {
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
    },
    mealHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    mealInfo: {
        flex: 1,
    },
    mealTypeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    mealType: {
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
    },
    mealTime: {
        fontSize: 12,
        opacity: 0.7,
    },
    mealActions: {
        flexDirection: 'row',
    },
    actionButton: {
        padding: 8,
        marginLeft: 4,
    },
    mealImage: {
        width: '100%',
        height: 120,
        borderRadius: 12,
        marginBottom: 12,
    },
    mealName: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 8,
    },
    foodsList: {
        marginBottom: 12,
    },
    foodItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 2,
    },
    foodName: {
        flex: 1,
        fontSize: 14,
    },
    foodQuantity: {
        fontSize: 14,
        opacity: 0.7,
    },
    caloriesContainer: {
        alignItems: 'flex-end',
    },
    caloriesGradient: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
    },
    caloriesText: {
        color: 'white',
        fontSize: 14,
        fontWeight: '600',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
    },
    emptyContainer: {
        alignItems: 'center',
        paddingTop: 60,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '600',
        marginTop: 16,
        marginBottom: 8,
    },
    emptySubtitle: {
        fontSize: 14,
        opacity: 0.7,
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 20,
    },
    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 24,
    },
    addButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
    },
});
