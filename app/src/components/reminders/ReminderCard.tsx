import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Switch,
    Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../../store';
import { updateReminder, deleteReminder } from '../../store/slices/reminderSlice';

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

interface ReminderCardProps {
    reminder: Reminder;
    onEdit: (reminder: Reminder) => void;
}

const ReminderCard: React.FC<ReminderCardProps> = ({ reminder, onEdit }) => {
    const dispatch = useDispatch<AppDispatch>();

    const formatDays = (days: string[]) => {
        if (days.length === 7) return 'Every day';
        if (days.length === 5 && !days.includes('saturday') && !days.includes('sunday')) {
            return 'Weekdays';
        }
        if (days.length === 2 && days.includes('saturday') && days.includes('sunday')) {
            return 'Weekends';
        }

        const dayNames = {
            monday: 'Mon',
            tuesday: 'Tue',
            wednesday: 'Wed',
            thursday: 'Thu',
            friday: 'Fri',
            saturday: 'Sat',
            sunday: 'Sun'
        };

        return days.map(day => dayNames[day as keyof typeof dayNames]).join(', ');
    };

    const formatTime = (time: string) => {
        const [hours, minutes] = time.split(':');
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour % 12 || 12;
        return `${displayHour}:${minutes} ${ampm}`;
    };

    const handleToggle = async (value: boolean) => {
        try {
            await dispatch(updateReminder({
                id: reminder.id,
                updates: { isActive: value }
            })).unwrap();
        } catch (error) {
            Alert.alert('Error', 'Failed to update reminder');
        }
    };

    const handleDelete = () => {
        Alert.alert(
            'Delete Reminder',
            'Are you sure you want to delete this reminder?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await dispatch(deleteReminder(reminder.id)).unwrap();
                        } catch (error) {
                            Alert.alert('Error', 'Failed to delete reminder');
                        }
                    }
                }
            ]
        );
    };

    const getMealIcon = (mealType?: string) => {
        switch (mealType) {
            case 'breakfast': return 'sunny-outline';
            case 'lunch': return 'partly-sunny-outline';
            case 'dinner': return 'moon-outline';
            case 'snack': return 'fast-food-outline';
            default: return 'notifications-outline';
        }
    };

    return (
        <View style={[styles.container, !reminder.isActive && styles.inactive]}>
            <View style={styles.header}>
                <View style={styles.titleRow}>
                    <Ionicons
                        name={getMealIcon(reminder.mealType) as any}
                        size={20}
                        color={reminder.isActive ? '#2196F3' : '#999'}
                    />
                    <Text style={[styles.title, !reminder.isActive && styles.inactiveText]}>
                        {reminder.title}
                    </Text>
                </View>
                <Switch
                    value={reminder.isActive}
                    onValueChange={handleToggle}
                    trackColor={{ false: '#767577', true: '#2196F3' }}
                    thumbColor={reminder.isActive ? '#fff' : '#f4f3f4'}
                />
            </View>

            <Text style={[styles.time, !reminder.isActive && styles.inactiveText]}>
                {formatTime(reminder.time)}
            </Text>

            <Text style={[styles.days, !reminder.isActive && styles.inactiveText]}>
                {formatDays(reminder.days)}
            </Text>

            {reminder.message && (
                <Text style={[styles.message, !reminder.isActive && styles.inactiveText]}>
                    {reminder.message}
                </Text>
            )}

            <View style={styles.actions}>
                <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => onEdit(reminder)}
                >
                    <Ionicons name="pencil" size={16} color="#666" />
                    <Text style={styles.actionText}>Edit</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.actionButton}
                    onPress={handleDelete}
                >
                    <Ionicons name="trash" size={16} color="#ff4444" />
                    <Text style={[styles.actionText, { color: '#ff4444' }]}>Delete</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginVertical: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    inactive: {
        opacity: 0.6,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    title: {
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
        color: '#333',
    },
    time: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#2196F3',
        marginBottom: 4,
    },
    days: {
        fontSize: 14,
        color: '#666',
        marginBottom: 8,
    },
    message: {
        fontSize: 14,
        color: '#333',
        marginBottom: 12,
        fontStyle: 'italic',
    },
    actions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 16,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    actionText: {
        fontSize: 14,
        color: '#666',
    },
    inactiveText: {
        color: '#999',
    },
});

export default ReminderCard;
