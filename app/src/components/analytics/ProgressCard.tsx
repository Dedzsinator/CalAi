import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

interface ProgressCardProps {
    title: string;
    current: number;
    goal: number;
    unit: string;
    icon: string;
    color: string;
    onPress?: () => void;
}

export const ProgressCard: React.FC<ProgressCardProps> = ({
    title,
    current,
    goal,
    unit,
    icon,
    color,
    onPress,
}) => {
    const percentage = Math.min((current / goal) * 100, 100);
    const isComplete = current >= goal;

    return (
        <TouchableOpacity style={styles.container} onPress={onPress}>
            <View style={styles.header}>
                <View style={[styles.iconContainer, { backgroundColor: `${color}20` }]}>
                    <Icon name={icon} size={24} color={color} />
                </View>
                <Text style={styles.title}>{title}</Text>
            </View>

            <View style={styles.progressSection}>
                <Text style={styles.currentValue}>
                    {Math.round(current)}
                    <Text style={styles.unit}> {unit}</Text>
                </Text>
                <Text style={styles.goalText}>of {goal} {unit}</Text>

                <View style={styles.progressBar}>
                    <View
                        style={[
                            styles.progressFill,
                            {
                                width: `${percentage}%`,
                                backgroundColor: color,
                            }
                        ]}
                    />
                </View>

                <View style={styles.progressFooter}>
                    <Text style={[styles.percentageText, { color }]}>
                        {Math.round(percentage)}%
                    </Text>
                    {isComplete && (
                        <Icon name="check-circle" size={16} color={color} />
                    )}
                </View>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 20,
        marginHorizontal: 8,
        marginVertical: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
        minWidth: 160,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    iconContainer: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    title: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1a1a1a',
        flex: 1,
    },
    progressSection: {
        flex: 1,
    },
    currentValue: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1a1a1a',
        marginBottom: 4,
    },
    unit: {
        fontSize: 14,
        fontWeight: 'normal',
        color: '#666',
    },
    goalText: {
        fontSize: 14,
        color: '#666',
        marginBottom: 12,
    },
    progressBar: {
        height: 6,
        backgroundColor: '#f0f0f0',
        borderRadius: 3,
        marginBottom: 12,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        borderRadius: 3,
    },
    progressFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    percentageText: {
        fontSize: 14,
        fontWeight: '600',
    },
});
