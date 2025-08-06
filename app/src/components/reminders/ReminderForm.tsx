import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TextInput,
    TouchableOpacity,
    ScrollView,
    Switch,
    Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../../store';
import { createReminder, updateReminder } from '../../store/slices/reminderSlice';

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

interface ReminderFormProps {
    visible: boolean;
    onClose: () => void;
    reminder?: Reminder | null;
}

const daysOfWeek = [
    { key: 'monday', label: 'Monday', short: 'Mon' },
    { key: 'tuesday', label: 'Tuesday', short: 'Tue' },
    { key: 'wednesday', label: 'Wednesday', short: 'Wed' },
    { key: 'thursday', label: 'Thursday', short: 'Thu' },
    { key: 'friday', label: 'Friday', short: 'Fri' },
    { key: 'saturday', label: 'Saturday', short: 'Sat' },
    { key: 'sunday', label: 'Sunday', short: 'Sun' },
];

const mealTypes = [
    { key: 'breakfast', label: 'Breakfast', icon: 'sunny-outline' },
    { key: 'lunch', label: 'Lunch', icon: 'partly-sunny-outline' },
    { key: 'dinner', label: 'Dinner', icon: 'moon-outline' },
    { key: 'snack', label: 'Snack', icon: 'fast-food-outline' },
];

const ReminderForm: React.FC<ReminderFormProps> = ({ visible, onClose, reminder }) => {
    const dispatch = useDispatch<AppDispatch>();
    const isEditing = !!reminder;

    const [formData, setFormData] = useState({
        title: reminder?.title || '',
        message: reminder?.message || '',
        time: reminder?.time || '08:00',
        days: reminder?.days || ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
        isActive: reminder?.isActive ?? true,
        mealType: reminder?.mealType || 'breakfast',
    });

    const [showTimePicker, setShowTimePicker] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleTimeChange = (event: any, selectedTime?: Date) => {
        setShowTimePicker(false);
        if (selectedTime) {
            const hours = selectedTime.getHours().toString().padStart(2, '0');
            const minutes = selectedTime.getMinutes().toString().padStart(2, '0');
            setFormData(prev => ({ ...prev, time: `${hours}:${minutes}` }));
        }
    };

    const toggleDay = (day: string) => {
        setFormData(prev => ({
            ...prev,
            days: prev.days.includes(day)
                ? prev.days.filter(d => d !== day)
                : [...prev.days, day]
        }));
    };

    const selectAllDays = () => {
        setFormData(prev => ({
            ...prev,
            days: daysOfWeek.map(d => d.key)
        }));
    };

    const selectWeekdays = () => {
        setFormData(prev => ({
            ...prev,
            days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
        }));
    };

    const handleSubmit = async () => {
        if (!formData.title.trim()) {
            Alert.alert('Error', 'Please enter a title for the reminder');
            return;
        }

        if (formData.days.length === 0) {
            Alert.alert('Error', 'Please select at least one day');
            return;
        }

        setIsLoading(true);
        try {
            if (isEditing && reminder) {
                await dispatch(updateReminder({
                    id: reminder.id,
                    updates: formData
                })).unwrap();
            } else {
                await dispatch(createReminder(formData)).unwrap();
            }
            onClose();
        } catch (error) {
            Alert.alert('Error', 'Failed to save reminder');
        } finally {
            setIsLoading(false);
        }
    };

    const getTimeForPicker = () => {
        const [hours, minutes] = formData.time.split(':');
        const date = new Date();
        date.setHours(parseInt(hours), parseInt(minutes));
        return date;
    };

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
            <View style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={onClose}>
                        <Ionicons name="close" size={24} color="#666" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>
                        {isEditing ? 'Edit Reminder' : 'New Reminder'}
                    </Text>
                    <TouchableOpacity
                        onPress={handleSubmit}
                        disabled={isLoading}
                        style={[styles.saveButton, isLoading && styles.saveButtonDisabled]}
                    >
                        <Text style={[styles.saveButtonText, isLoading && styles.saveButtonTextDisabled]}>
                            Save
                        </Text>
                    </TouchableOpacity>
                </View>

                <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
                    {/* Title */}
                    <View style={styles.section}>
                        <Text style={styles.label}>Title</Text>
                        <TextInput
                            style={styles.textInput}
                            value={formData.title}
                            onChangeText={(text) => setFormData(prev => ({ ...prev, title: text }))}
                            placeholder="Enter reminder title"
                            placeholderTextColor="#999"
                        />
                    </View>

                    {/* Message */}
                    <View style={styles.section}>
                        <Text style={styles.label}>Message (Optional)</Text>
                        <TextInput
                            style={[styles.textInput, styles.textArea]}
                            value={formData.message}
                            onChangeText={(text) => setFormData(prev => ({ ...prev, message: text }))}
                            placeholder="Enter reminder message"
                            placeholderTextColor="#999"
                            multiline
                            numberOfLines={3}
                        />
                    </View>

                    {/* Meal Type */}
                    <View style={styles.section}>
                        <Text style={styles.label}>Meal Type</Text>
                        <View style={styles.mealTypeGrid}>
                            {mealTypes.map((type) => (
                                <TouchableOpacity
                                    key={type.key}
                                    style={[
                                        styles.mealTypeButton,
                                        formData.mealType === type.key && styles.mealTypeButtonActive
                                    ]}
                                    onPress={() => setFormData(prev => ({ ...prev, mealType: type.key as any }))}
                                >
                                    <Ionicons
                                        name={type.icon as any}
                                        size={20}
                                        color={formData.mealType === type.key ? '#2196F3' : '#666'}
                                    />
                                    <Text style={[
                                        styles.mealTypeText,
                                        formData.mealType === type.key && styles.mealTypeTextActive
                                    ]}>
                                        {type.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* Time */}
                    <View style={styles.section}>
                        <Text style={styles.label}>Time</Text>
                        <TouchableOpacity
                            style={styles.timeButton}
                            onPress={() => setShowTimePicker(true)}
                        >
                            <Ionicons name="time-outline" size={20} color="#666" />
                            <Text style={styles.timeText}>
                                {new Date(`2000-01-01T${formData.time}`).toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* Days */}
                    <View style={styles.section}>
                        <View style={styles.daysHeader}>
                            <Text style={styles.label}>Days</Text>
                            <View style={styles.quickSelectButtons}>
                                <TouchableOpacity style={styles.quickSelectButton} onPress={selectWeekdays}>
                                    <Text style={styles.quickSelectText}>Weekdays</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.quickSelectButton} onPress={selectAllDays}>
                                    <Text style={styles.quickSelectText}>Every day</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                        <View style={styles.daysGrid}>
                            {daysOfWeek.map((day) => (
                                <TouchableOpacity
                                    key={day.key}
                                    style={[
                                        styles.dayButton,
                                        formData.days.includes(day.key) && styles.dayButtonActive
                                    ]}
                                    onPress={() => toggleDay(day.key)}
                                >
                                    <Text style={[
                                        styles.dayText,
                                        formData.days.includes(day.key) && styles.dayTextActive
                                    ]}>
                                        {day.short}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* Active Toggle */}
                    <View style={styles.section}>
                        <View style={styles.toggleRow}>
                            <Text style={styles.label}>Active</Text>
                            <Switch
                                value={formData.isActive}
                                onValueChange={(value) => setFormData(prev => ({ ...prev, isActive: value }))}
                                trackColor={{ false: '#767577', true: '#2196F3' }}
                                thumbColor={formData.isActive ? '#fff' : '#f4f3f4'}
                            />
                        </View>
                    </View>
                </ScrollView>

                {showTimePicker && (
                    <DateTimePicker
                        value={getTimeForPicker()}
                        mode="time"
                        is24Hour={false}
                        onChange={handleTimeChange}
                    />
                )}
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
    saveButtonDisabled: {
        backgroundColor: '#ccc',
    },
    saveButtonText: {
        color: '#fff',
        fontWeight: '600',
    },
    saveButtonTextDisabled: {
        color: '#999',
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
    textInput: {
        backgroundColor: '#fff',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    textArea: {
        height: 80,
        textAlignVertical: 'top',
    },
    mealTypeGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    mealTypeButton: {
        flex: 1,
        minWidth: '45%',
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#e0e0e0',
        gap: 8,
    },
    mealTypeButtonActive: {
        borderColor: '#2196F3',
        backgroundColor: '#f0f8ff',
    },
    mealTypeText: {
        fontSize: 14,
        color: '#666',
    },
    mealTypeTextActive: {
        color: '#2196F3',
        fontWeight: '600',
    },
    timeButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#e0e0e0',
        gap: 8,
    },
    timeText: {
        fontSize: 16,
        color: '#333',
    },
    daysHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    quickSelectButtons: {
        flexDirection: 'row',
        gap: 8,
    },
    quickSelectButton: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        backgroundColor: '#e0e0e0',
        borderRadius: 4,
    },
    quickSelectText: {
        fontSize: 12,
        color: '#666',
    },
    daysGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    dayButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#e0e0e0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    dayButtonActive: {
        backgroundColor: '#2196F3',
        borderColor: '#2196F3',
    },
    dayText: {
        fontSize: 12,
        color: '#666',
    },
    dayTextActive: {
        color: '#fff',
        fontWeight: '600',
    },
    toggleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 8,
    },
});

export default ReminderForm;
