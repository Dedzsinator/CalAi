import React, { useState, useEffect } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import StorageService, { MealLog } from '../../services/storage';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

interface DayNutrition {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  meal_count: number;
}

export default function HomeScreen() {
  const [todaysMeals, setTodaysMeals] = useState<MealLog[]>([]);
  const [todaysNutrition, setTodaysNutrition] = useState<DayNutrition>({
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    meal_count: 0,
  });
  const [goals] = useState({
    daily_calories: 2000,
    protein_percent: 25,
    carbs_percent: 50,
    fat_percent: 25,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    loadTodaysData();
  }, []);

  const loadTodaysData = async () => {
    try {
      const meals = await StorageService.getTodaysMeals();
      const nutrition = await StorageService.calculateDailyNutrition();

      setTodaysMeals(meals);
      setTodaysNutrition(nutrition);
    } catch (error) {
      console.error('Failed to load today\'s data:', error);
      Alert.alert('Error', 'Failed to load your data. Please try again.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadTodaysData();
  };

  const openCamera = () => {
    router.push('/(tabs)/camera' as any);
  };

  const calculateProgress = (current: number, goal: number) => {
    return Math.min((current / goal) * 100, 100);
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading your nutrition data...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <ThemedText style={styles.greeting}>Good morning! 🌅</ThemedText>
            <ThemedText style={styles.date}>{new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}</ThemedText>
          </View>
        </View>

        {/* Quick Add Button */}
        <TouchableOpacity style={styles.addButton} onPress={openCamera}>
          <View style={styles.addButtonContent}>
            <Ionicons name="camera" size={24} color="white" />
            <Text style={styles.addButtonText}>Add Food</Text>
          </View>
        </TouchableOpacity>

        {/* Today's Progress */}
        <ThemedView style={styles.progressCard}>
          <ThemedText style={styles.cardTitle}>Today&apos;s Progress</ThemedText>

          {/* Calorie Progress */}
          <View style={styles.progressItem}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>Calories</Text>
              <Text style={styles.progressValue}>
                {todaysNutrition.calories} / {goals.daily_calories} kcal
              </Text>
            </View>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${calculateProgress(todaysNutrition.calories, goals.daily_calories)}%`,
                    backgroundColor: '#007AFF'
                  }
                ]}
              />
            </View>
          </View>

          {/* Macros */}
          <View style={styles.macrosContainer}>
            <View style={styles.macroItem}>
              <Text style={styles.macroLabel}>Protein</Text>
              <Text style={styles.macroValue}>{Math.round(todaysNutrition.protein)}g</Text>
              <View style={styles.macroProgress}>
                <View
                  style={[
                    styles.macroFill,
                    {
                      width: `${calculateProgress(todaysNutrition.protein * 4, (goals.daily_calories * goals.protein_percent / 100))}%`,
                      backgroundColor: '#FF6B6B'
                    }
                  ]}
                />
              </View>
            </View>

            <View style={styles.macroItem}>
              <Text style={styles.macroLabel}>Carbs</Text>
              <Text style={styles.macroValue}>{Math.round(todaysNutrition.carbs)}g</Text>
              <View style={styles.macroProgress}>
                <View
                  style={[
                    styles.macroFill,
                    {
                      width: `${calculateProgress(todaysNutrition.carbs * 4, (goals.daily_calories * goals.carbs_percent / 100))}%`,
                      backgroundColor: '#4ECDC4'
                    }
                  ]}
                />
              </View>
            </View>

            <View style={styles.macroItem}>
              <Text style={styles.macroLabel}>Fat</Text>
              <Text style={styles.macroValue}>{Math.round(todaysNutrition.fat)}g</Text>
              <View style={styles.macroProgress}>
                <View
                  style={[
                    styles.macroFill,
                    {
                      width: `${calculateProgress(todaysNutrition.fat * 9, (goals.daily_calories * goals.fat_percent / 100))}%`,
                      backgroundColor: '#FFE66D'
                    }
                  ]}
                />
              </View>
            </View>
          </View>
        </ThemedView>

        {/* Recent Meals */}
        <ThemedView style={styles.mealsCard}>
          <View style={styles.cardHeader}>
            <ThemedText style={styles.cardTitle}>Today&apos;s Meals</ThemedText>
            <Text style={styles.mealCount}>{todaysNutrition.meal_count} meals</Text>
          </View>

          {todaysMeals.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="restaurant-outline" size={48} color="#ccc" />
              <Text style={styles.emptyText}>No meals logged today</Text>
              <Text style={styles.emptySubtext}>Take a photo of your food to get started!</Text>
            </View>
          ) : (
            <View style={styles.mealsList}>
              {todaysMeals.slice(0, 5).map((meal) => (
                <TouchableOpacity
                  key={meal.id}
                  style={styles.mealItem}
                >
                  <View style={styles.mealInfo}>
                    <Text style={styles.mealTime}>{formatTime(meal.eaten_at)}</Text>
                    <Text style={styles.mealFoods}>
                      {meal.foods.map(food => food.name).join(', ')}
                    </Text>
                  </View>
                  <View style={styles.mealCalories}>
                    <Text style={styles.calorieText}>
                      {meal.foods.reduce((sum, food) => sum + food.calories, 0)} cal
                    </Text>
                    <Ionicons name="chevron-forward" size={16} color="#666" />
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </ThemedView>

        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{todaysNutrition.meal_count}</Text>
            <Text style={styles.statLabel}>Meals Today</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{Math.round(todaysNutrition.calories)}</Text>
            <Text style={styles.statLabel}>Calories</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statNumber}>
              {todaysNutrition.calories > 0 ? Math.round((todaysNutrition.calories / goals.daily_calories) * 100) : 0}%
            </Text>
            <Text style={styles.statLabel}>Daily Goal</Text>
          </View>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 20,
    paddingBottom: 10,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  date: {
    fontSize: 16,
    color: '#666',
  },
  addButton: {
    backgroundColor: '#007AFF',
    marginHorizontal: 20,
    marginVertical: 10,
    borderRadius: 16,
    overflow: 'hidden',
  },
  addButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  addButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  progressCard: {
    margin: 20,
    marginVertical: 10,
    padding: 20,
    borderRadius: 16,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  progressItem: {
    marginBottom: 16,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  progressValue: {
    fontSize: 16,
    color: '#666',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  macrosContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  macroItem: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  macroLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  macroValue: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  macroProgress: {
    width: '100%',
    height: 6,
    backgroundColor: '#f0f0f0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  macroFill: {
    height: '100%',
    borderRadius: 3,
  },
  mealsCard: {
    margin: 20,
    marginVertical: 10,
    padding: 20,
    borderRadius: 16,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  mealCount: {
    fontSize: 14,
    color: '#666',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  mealsList: {
    gap: 12,
  },
  mealItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
  },
  mealInfo: {
    flex: 1,
  },
  mealTime: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
    marginBottom: 4,
  },
  mealFoods: {
    fontSize: 16,
    color: '#333',
  },
  mealCalories: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  calorieText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  statsContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginVertical: 10,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  bottomPadding: {
    height: 100,
  },
});
