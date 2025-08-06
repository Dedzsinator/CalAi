import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    RefreshControl,
    Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../../store';
import { fetchReminders } from '../../store/slices/reminderSlice';
import ReminderCard from '../../components/reminders/ReminderCard';
import ReminderForm from '../../components/reminders/ReminderForm';
import EmptyState from '../../components/common/EmptyState';
import LoadingSpinner from '../../components/common/LoadingSpinner';

interface Reminder {
    id: string;
    title: string;
    message: string;
    time: string;
    days: string[];
    isActive: boolean;
    mealType?: 'breakfast' | 'lunch' | 'dinner' | 'snack';
    createdAt: Date;
}

export default function RemindersScreen() {
    const dispatch = useDispatch<AppDispatch>();
    const { reminders, isLoading, error } = useSelector((state: RootState) => state.reminders);

    const [showForm, setShowForm] = useState(false);
    const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        dispatch(fetchReminders());
    }, [dispatch]);

    const handleRefresh = async () => {
        setRefreshing(true);
        try {
            await dispatch(fetchReminders()).unwrap();
        } catch (error) {
            Alert.alert('Error', 'Failed to refresh reminders');
        } finally {
            setRefreshing(false);
        }
    };

    const handleAddReminder = () => {
        setEditingReminder(null);
        setShowForm(true);
    };

    const handleEditReminder = (reminder: Reminder) => {
        setEditingReminder(reminder);
        setShowForm(true);
    };

    const handleCloseForm = () => {
        setShowForm(false);
        setEditingReminder(null);
    };

    const renderReminderCard = ({ item }: { item: Reminder }) => (
        <ReminderCard
            reminder={item}
            onEdit={handleEditReminder}
        />
    );

    const renderEmptyState = () => (
        <EmptyState
            icon="notifications-outline"
            title="No Reminders Yet"
            message="Create your first meal reminder to stay on track with your nutrition goals."
            actionText="Add Reminder"
            onAction={handleAddReminder}
        />
    );

    const getStats = () => {
        const total = reminders.length;
        const active = reminders.filter(r => r.isActive).length;
        const byMealType = reminders.reduce((acc, reminder) => {
            const type = reminder.mealType || 'other';
            acc[type] = (acc[type] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        return { total, active, byMealType };
    };

    const stats = getStats();

    if (isLoading && reminders.length === 0) {
        return (
            <View style={styles.container}>
                <LoadingSpinner message="Loading reminders..." />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.title}>Meal Reminders</Text>
                <TouchableOpacity
                    style={styles.addButton}
                    onPress={handleAddReminder}
                >
                    <Ionicons name="add" size={24} color="#fff" />
                </TouchableOpacity>
            </View>

            {/* Stats */}
            {reminders.length > 0 && (
                <View style={styles.statsContainer}>
                    <View style={styles.statItem}>
                        <Text style={styles.statNumber}>{stats.active}</Text>
                        <Text style={styles.statLabel}>Active</Text>
                    </View>
                    <View style={styles.statItem}>
                        <Text style={styles.statNumber}>{stats.total}</Text>
                        <Text style={styles.statLabel}>Total</Text>
                    </View>
                    <View style={styles.statItem}>
                        <Text style={styles.statNumber}>{stats.byMealType.breakfast || 0}</Text>
                        <Text style={styles.statLabel}>Breakfast</Text>
                    </View>
                    <View style={styles.statItem}>
                        <Text style={styles.statNumber}>{stats.byMealType.lunch || 0}</Text>
                        <Text style={styles.statLabel}>Lunch</Text>
                    </View>
                </View>
            )}

            {/* Error Message */}
            {error && (
                <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>{error}</Text>
                    <TouchableOpacity onPress={() => dispatch(fetchReminders())}>
                        <Text style={styles.retryText}>Retry</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* Reminders List */}
            <FlatList
                data={reminders}
                keyExtractor={(item) => item.id}
                renderItem={renderReminderCard}
                ListEmptyComponent={renderEmptyState}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={handleRefresh}
                        colors={['#2196F3']}
                        tintColor="#2196F3"
                    />
                }
                contentContainerStyle={[
                    styles.listContainer,
                    reminders.length === 0 && styles.emptyListContainer
                ]}
                showsVerticalScrollIndicator={false}
            />

            {/* Form Modal */}
            <ReminderForm
                visible={showForm}
                onClose={handleCloseForm}
                reminder={editingReminder}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        paddingTop: 60,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
    },
    addButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#2196F3',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    statsContainer: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        margin: 16,
        marginBottom: 8,
        borderRadius: 12,
        paddingVertical: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
    },
    statNumber: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#2196F3',
    },
    statLabel: {
        fontSize: 12,
        color: '#666',
        marginTop: 4,
    },
    errorContainer: {
        backgroundColor: '#ffebee',
        margin: 16,
        marginBottom: 8,
        padding: 12,
        borderRadius: 8,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    errorText: {
        color: '#c62828',
        flex: 1,
    },
    retryText: {
        color: '#2196F3',
        fontWeight: '600',
    },
    listContainer: {
        padding: 16,
        paddingTop: 8,
    },
    emptyListContainer: {
        flex: 1,
        justifyContent: 'center',
    },
});
