import React from 'react';
import {
    View,
    Text,
    TextInput,
    StyleSheet,
} from 'react-native';

interface MealNotesProps {
    notes: string;
    onNotesChange: (notes: string) => void;
    isEditing: boolean;
    placeholder?: string;
}

export const MealNotes: React.FC<MealNotesProps> = ({
    notes,
    onNotesChange,
    isEditing,
    placeholder = 'Add notes about this meal...',
}) => {
    if (!isEditing && !notes) {
        return (
            <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No notes added</Text>
            </View>
        );
    }

    if (isEditing) {
        return (
            <TextInput
                style={styles.textInput}
                value={notes}
                onChangeText={onNotesChange}
                placeholder={placeholder}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                placeholderTextColor="#999"
            />
        );
    }

    return (
        <View style={styles.notesContainer}>
            <Text style={styles.notesText}>{notes}</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    emptyContainer: {
        padding: 16,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f8f9fa',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#e9ecef',
        borderStyle: 'dashed',
    },
    emptyText: {
        color: '#999',
        fontSize: 14,
        fontStyle: 'italic',
    },
    textInput: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        backgroundColor: 'white',
        minHeight: 100,
        maxHeight: 200,
    },
    notesContainer: {
        backgroundColor: '#f8f9fa',
        borderRadius: 8,
        padding: 12,
    },
    notesText: {
        fontSize: 16,
        color: '#333',
        lineHeight: 22,
    },
});
