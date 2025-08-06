import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

interface InsightCardProps {
    title: string;
    description: string;
    type: 'success' | 'warning' | 'info' | 'tip';
    icon?: string;
    onPress?: () => void;
    onDismiss?: () => void;
}

export const InsightCard: React.FC<InsightCardProps> = ({
    title,
    description,
    type,
    icon,
    onPress,
    onDismiss,
}) => {
    const getTypeConfig = () => {
        switch (type) {
            case 'success':
                return {
                    backgroundColor: '#E8F5E8',
                    borderColor: '#4CAF50',
                    iconColor: '#4CAF50',
                    defaultIcon: 'check-circle',
                };
            case 'warning':
                return {
                    backgroundColor: '#FFF3E0',
                    borderColor: '#FF9800',
                    iconColor: '#FF9800',
                    defaultIcon: 'warning',
                };
            case 'info':
                return {
                    backgroundColor: '#E3F2FD',
                    borderColor: '#2196F3',
                    iconColor: '#2196F3',
                    defaultIcon: 'info',
                };
            case 'tip':
                return {
                    backgroundColor: '#F3E5F5',
                    borderColor: '#9C27B0',
                    iconColor: '#9C27B0',
                    defaultIcon: 'lightbulb',
                };
            default:
                return {
                    backgroundColor: '#F5F5F5',
                    borderColor: '#666',
                    iconColor: '#666',
                    defaultIcon: 'info',
                };
        }
    };

    const config = getTypeConfig();

    return (
        <TouchableOpacity
            style={[
                styles.container,
                {
                    backgroundColor: config.backgroundColor,
                    borderLeftColor: config.borderColor,
                }
            ]}
            onPress={onPress}
            disabled={!onPress}
        >
            <View style={styles.content}>
                <View style={styles.iconContainer}>
                    <Icon
                        name={icon || config.defaultIcon}
                        size={24}
                        color={config.iconColor}
                    />
                </View>

                <View style={styles.textContainer}>
                    <Text style={styles.title}>{title}</Text>
                    <Text style={styles.description}>{description}</Text>
                </View>

                {onDismiss && (
                    <TouchableOpacity
                        style={styles.dismissButton}
                        onPress={onDismiss}
                    >
                        <Icon name="close" size={20} color="#666" />
                    </TouchableOpacity>
                )}
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        borderRadius: 12,
        borderLeftWidth: 4,
        marginHorizontal: 16,
        marginVertical: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
    },
    iconContainer: {
        marginRight: 12,
    },
    textContainer: {
        flex: 1,
    },
    title: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1a1a1a',
        marginBottom: 4,
    },
    description: {
        fontSize: 14,
        color: '#666',
        lineHeight: 20,
    },
    dismissButton: {
        padding: 4,
        marginLeft: 8,
    },
});
