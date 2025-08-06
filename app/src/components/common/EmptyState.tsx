import React from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
} from 'react-native';
import { MaterialIcons as Icon } from '@expo/vector-icons';

interface EmptyStateProps {
    icon: keyof typeof Icon.glyphMap;
    title: string;
    description: string;
    actionText?: string;
    onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
    icon,
    title,
    description,
    actionText,
    onAction,
}) => {
    return (
        <View style={styles.container}>
            <Icon name={icon} size={64} color="#ccc" style={styles.icon} />
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.description}>{description}</Text>
            {actionText && onAction && (
                <TouchableOpacity style={styles.actionButton} onPress={onAction}>
                    <Text style={styles.actionButtonText}>{actionText}</Text>
                </TouchableOpacity>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
        paddingVertical: 60,
    },
    icon: {
        marginBottom: 16,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 8,
        textAlign: 'center',
    },
    description: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 24,
    },
    actionButton: {
        backgroundColor: '#007AFF',
        borderRadius: 8,
        paddingHorizontal: 24,
        paddingVertical: 12,
    },
    actionButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
});
