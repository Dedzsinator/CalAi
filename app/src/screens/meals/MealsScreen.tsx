import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    RefreshControl,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { RootState, AppDispatch } from '../../store';
import { fetchMeals, deleteMeal } from '../../store/slices/mealSlice';
import { MealCard } from '../../components/nutrition/MealCard';
import { MealFilters } from '../../components/nutrition/MealFilters';
import { EmptyState } from '../../components/common/EmptyState';

const MealsScreen: React.FC = () => {
    const navigation = useNavigation();
    const dispatch = useDispatch<AppDispatch>();
    const { meals, isLoading, totalPages, currentPage } = useSelector(
        (state: RootState) => state.meals
    );

    const [refreshing, setRefreshing] = useState(false);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [mealType, setMealType] = useState<string>('all');

    useEffect(() => {
        dispatch(fetchMeals({
            page: 1,
            date: selectedDate.toISOString().split('T')[0],
            mealType: mealType === 'all' ? undefined : mealType
        }));
    }, [dispatch, selectedDate, mealType]);

    const onRefresh = async () => {
        setRefreshing(true);
        await dispatch(fetchMeals({
            page: 1,
            date: selectedDate.toISOString().split('T')[0],
            mealType: mealType === 'all' ? undefined : mealType
        }));
        setRefreshing(false);
    };

    const loadMore = () => {
        if (currentPage < totalPages && !isLoading) {
            dispatch(fetchMeals({
                page: currentPage + 1,
                date: selectedDate.toISOString().split('T')[0],
                mealType: mealType === 'all' ? undefined : mealType
            }));
        }
    };

    const handleDeleteMeal = (mealId: string) => {
        Alert.alert(
            'Delete Meal',
            'Are you sure you want to delete this meal?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => dispatch(deleteMeal(mealId)),
                },
            ]
        );
    };

    const handleEditMeal = (mealId: string) => {
        navigation.navigate('MealDetail' as never, { mealId, mode: 'edit' } as never);
    };

    const navigateToAddMeal = () => {
        navigation.navigate('Camera' as never);
    };

    const renderMealCard = ({ item }: { item: any }) => (
        <MealCard
            meal={item}
            onEdit={() => handleEditMeal(item.id)}
            onDelete={() => handleDeleteMeal(item.id)}
            onPress={() => navigation.navigate('MealDetail' as never, { mealId: item.id } as never)}
        />
    );

    const renderEmptyState = () => (
        <EmptyState
            icon="restaurant"
            title="No meals found"
            description="Start by adding your first meal!"
            actionText="Add Meal"
            onAction={navigateToAddMeal}
        />
    );

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.title}>Meals</Text>
                <TouchableOpacity style={styles.addButton} onPress={navigateToAddMeal}>
                    <Icon name="add" size={24} color="white" />
                </TouchableOpacity>
            </View>

            {/* Filters */}
            <MealFilters
                selectedDate={selectedDate}
                onDateChange={setSelectedDate}
                selectedMealType={mealType}
                onMealTypeChange={setMealType}
            />

            {/* Meals List */}
            <FlatList
                data={meals}
                renderItem={renderMealCard}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContainer}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
                onEndReached={loadMore}
                onEndReachedThreshold={0.5}
                ListEmptyComponent={!isLoading ? renderEmptyState : null}
                showsVerticalScrollIndicator={false}
                ListFooterComponent={
                    isLoading && meals.length > 0 ? (
                        <View style={styles.loadingFooter}>
                            <Text style={styles.loadingText}>Loading more meals...</Text>
                        </View>
                    ) : null
                }
            />

            {/* Floating Action Button */}
            <TouchableOpacity style={styles.fab} onPress={navigateToAddMeal}>
                <Icon name="camera-alt" size={24} color="white" />
            </TouchableOpacity>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#333',
    },
    addButton: {
        backgroundColor: '#007AFF',
        borderRadius: 20,
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContainer: {
        padding: 16,
        paddingBottom: 100, // Space for FAB
    },
    loadingFooter: {
        padding: 20,
        alignItems: 'center',
    },
    loadingText: {
        color: '#666',
        fontSize: 14,
    },
    fab: {
        position: 'absolute',
        bottom: 30,
        right: 20,
        backgroundColor: '#007AFF',
        borderRadius: 28,
        width: 56,
        height: 56,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
});

export default MealsScreen;
