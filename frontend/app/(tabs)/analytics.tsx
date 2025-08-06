import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import StorageService from '../../services/storage';

const { width: screenWidth } = Dimensions.get('window');

interface NutritionStats {
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  mealCount: number;
  averageConfidence: number;
}

interface DailySummary {
  date: string;
  calories: number;
  meals: number;
}

export default function AnalyticsScreen() {
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('week');
  const [nutritionStats, setNutritionStats] = useState<NutritionStats | null>(null);
  const [dailySummaries, setDailySummaries] = useState<DailySummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, [selectedPeriod]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const meals = await StorageService.getMeals();

      // Calculate date range based on selected period
      const now = new Date();
      let startDate = new Date();

      switch (selectedPeriod) {
        case 'week':
          startDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(now.getMonth() - 1);
          break;
        case 'year':
          startDate.setFullYear(now.getFullYear() - 1);
          break;
      }

      // Filter meals by date range
      const filteredMeals = meals.filter(meal =>
        new Date(meal.eaten_at) >= startDate
      );

      // Calculate nutrition stats
      const stats: NutritionStats = filteredMeals.reduce((acc, meal) => {
        const mealStats = meal.foods.reduce((mealAcc, food) => ({
          calories: mealAcc.calories + food.calories,
          protein: mealAcc.protein + food.protein,
          carbs: mealAcc.carbs + food.carbs,
          fat: mealAcc.fat + food.fat,
          confidence: mealAcc.confidence + food.confidence,
        }), { calories: 0, protein: 0, carbs: 0, fat: 0, confidence: 0 });

        return {
          totalCalories: acc.totalCalories + mealStats.calories,
          totalProtein: acc.totalProtein + mealStats.protein,
          totalCarbs: acc.totalCarbs + mealStats.carbs,
          totalFat: acc.totalFat + mealStats.fat,
          mealCount: acc.mealCount + 1,
          averageConfidence: acc.averageConfidence + (mealStats.confidence / meal.foods.length),
        };
      }, {
        totalCalories: 0,
        totalProtein: 0,
        totalCarbs: 0,
        totalFat: 0,
        mealCount: 0,
        averageConfidence: 0,
      });

      if (stats.mealCount > 0) {
        stats.averageConfidence /= stats.mealCount;
      }

      setNutritionStats(stats);

      // Calculate daily summaries for chart
      const dailyData = new Map<string, { calories: number; meals: number }>();

      filteredMeals.forEach(meal => {
        const date = new Date(meal.eaten_at).toISOString().split('T')[0];
        const mealCalories = meal.foods.reduce((sum, food) => sum + food.calories, 0);

        if (dailyData.has(date)) {
          const existing = dailyData.get(date)!;
          existing.calories += mealCalories;
          existing.meals += 1;
        } else {
          dailyData.set(date, { calories: mealCalories, meals: 1 });
        }
      });

      const summaries: DailySummary[] = Array.from(dailyData.entries()).map(([date, data]) => ({
        date,
        calories: data.calories,
        meals: data.meals,
      })).sort((a, b) => a.date.localeCompare(b.date));

      setDailySummaries(summaries);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderPeriodSelector = () => (
    <View style={styles.periodSelector}>
      {(['week', 'month', 'year'] as const).map(period => (
        <TouchableOpacity
          key={period}
          style={[
            styles.periodButton,
            selectedPeriod === period && styles.selectedPeriodButton,
          ]}
          onPress={() => setSelectedPeriod(period)}
        >
          <Text
            style={[
              styles.periodButtonText,
              selectedPeriod === period && styles.selectedPeriodButtonText,
            ]}
          >
            {period.charAt(0).toUpperCase() + period.slice(1)}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderNutritionCard = (
    title: string,
    value: number,
    unit: string,
    icon: string,
    color: string
  ) => (
    <View style={[styles.nutritionCard, { borderLeftColor: color }]}>
      <View style={styles.nutritionCardHeader}>
        <Ionicons name={icon as any} size={20} color={color} />
        <Text style={styles.nutritionCardTitle}>{title}</Text>
      </View>
      <Text style={styles.nutritionCardValue}>
        {Math.round(value)} {unit}
      </Text>
    </View>
  );

  const renderSimpleChart = () => {
    if (dailySummaries.length === 0) return null;

    const maxCalories = Math.max(...dailySummaries.map(d => d.calories));
    const chartWidth = screenWidth - 60;
    const chartHeight = 120;

    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Daily Calories</Text>
        <View style={styles.chart}>
          {dailySummaries.map((summary, index) => {
            const barHeight = maxCalories > 0 ? (summary.calories / maxCalories) * chartHeight : 0;
            return (
              <View key={summary.date} style={styles.chartBar}>
                <View
                  style={[
                    styles.bar,
                    {
                      height: barHeight,
                      backgroundColor: '#007AFF',
                      width: (chartWidth / dailySummaries.length) - 4,
                    },
                  ]}
                />
                <Text style={styles.barLabel}>
                  {new Date(summary.date).getDate()}
                </Text>
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading analytics...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Analytics</Text>
        <Text style={styles.subtitle}>Track your nutrition journey</Text>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {renderPeriodSelector()}

        {nutritionStats && nutritionStats.mealCount > 0 ? (
          <>
            <View style={styles.statsGrid}>
              {renderNutritionCard('Calories', nutritionStats.totalCalories, 'cal', 'flame', '#FF6B6B')}
              {renderNutritionCard('Protein', nutritionStats.totalProtein, 'g', 'fitness', '#4ECDC4')}
              {renderNutritionCard('Carbs', nutritionStats.totalCarbs, 'g', 'leaf', '#45B7D1')}
              {renderNutritionCard('Fat', nutritionStats.totalFat, 'g', 'water', '#96CEB4')}
            </View>

            {renderSimpleChart()}

            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>Summary</Text>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Total Meals Logged</Text>
                <Text style={styles.summaryValue}>{nutritionStats.mealCount}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Average Daily Calories</Text>
                <Text style={styles.summaryValue}>
                  {Math.round(nutritionStats.totalCalories / Math.max(dailySummaries.length, 1))}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Average AI Confidence</Text>
                <Text style={styles.summaryValue}>
                  {Math.round(nutritionStats.averageConfidence * 100)}%
                </Text>
              </View>
            </View>
          </>
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="bar-chart-outline" size={64} color="#ccc" />
            <Text style={styles.emptyStateTitle}>No Data Yet</Text>
            <Text style={styles.emptyStateText}>
              Start logging meals to see your nutrition analytics
            </Text>
          </View>
        )}
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
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
    backgroundColor: 'white',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 12,
  },
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 10,
    borderRadius: 12,
    padding: 4,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  selectedPeriodButton: {
    backgroundColor: '#007AFF',
  },
  periodButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  selectedPeriodButtonText: {
    color: 'white',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    marginTop: 10,
    gap: 12,
  },
  nutritionCard: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
  },
  nutritionCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  nutritionCardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginLeft: 8,
  },
  nutritionCardValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  chartContainer: {
    backgroundColor: 'white',
    margin: 20,
    borderRadius: 12,
    padding: 20,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 120,
    justifyContent: 'space-between',
  },
  chartBar: {
    alignItems: 'center',
    flex: 1,
  },
  bar: {
    backgroundColor: '#007AFF',
    borderRadius: 2,
    marginBottom: 8,
  },
  barLabel: {
    fontSize: 12,
    color: '#666',
  },
  summaryCard: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 12,
    padding: 20,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  summaryLabel: {
    fontSize: 16,
    color: '#666',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingTop: 60,
  },
  emptyStateTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#333',
    marginTop: 20,
    marginBottom: 10,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
});
