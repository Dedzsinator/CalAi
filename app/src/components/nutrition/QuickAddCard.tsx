import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

interface QuickAddCardProps {
    onAddMeal?: () => void;
    onAddWater?: () => void;
    onAddWeight?: () => void;
}

export const QuickAddCard: React.FC<QuickAddCardProps> = ({
    onAddMeal,
    onAddWater,
    onAddWeight,
}) => {
    return (
        <View style={styles.container}>
            <TouchableOpacity style={styles.quickButton} onPress={onAddMeal}>
                <View style={styles.iconContainer}>
                    <Icon name="restaurant" size={24} color="#4CAF50" />
                </View>
                <Text style={styles.buttonText}>Quick Meal</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.quickButton} onPress={onAddWater}>
                <View style={styles.iconContainer}>
                    <Icon name="local-drink" size={24} color="#2196F3" />
                </View>
                <Text style={styles.buttonText}>Add Water</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.quickButton} onPress={onAddWeight}>
                <View style={styles.iconContainer}>
                    <Icon name="monitor-weight" size={24} color="#FF9800" />
                </View>
                <Text style={styles.buttonText}>Log Weight</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
    },
    quickButton: {
        flex: 1,
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        marginHorizontal: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#f8f9fa',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    buttonText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#333',
        textAlign: 'center',
    },
});
