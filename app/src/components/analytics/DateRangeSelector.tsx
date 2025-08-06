import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

interface DateRangeSelectorProps {
    selectedRange: '7d' | '30d' | '90d' | '1y';
    onRangeChange: (range: '7d' | '30d' | '90d' | '1y') => void;
}

export const DateRangeSelector: React.FC<DateRangeSelectorProps> = ({
    selectedRange,
    onRangeChange,
}) => {
    const ranges = [
        { key: '7d', label: '7 Days', icon: 'date-range' },
        { key: '30d', label: '30 Days', icon: 'calendar-today' },
        { key: '90d', label: '3 Months', icon: 'calendar-month' },
        { key: '1y', label: '1 Year', icon: 'event' },
    ] as const;

    return (
        <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.container}
        >
            {ranges.map((range) => (
                <TouchableOpacity
                    key={range.key}
                    style={[
                        styles.rangeButton,
                        selectedRange === range.key && styles.selectedRange
                    ]}
                    onPress={() => onRangeChange(range.key)}
                >
                    <Icon
                        name={range.icon}
                        size={18}
                        color={selectedRange === range.key ? '#007AFF' : '#666'}
                    />
                    <Text
                        style={[
                            styles.rangeText,
                            selectedRange === range.key && styles.selectedRangeText
                        ]}
                    >
                        {range.label}
                    </Text>
                </TouchableOpacity>
            ))}
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    rangeButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
        marginRight: 12,
        borderRadius: 20,
        backgroundColor: '#f5f5f5',
        borderWidth: 1,
        borderColor: 'transparent',
    },
    selectedRange: {
        backgroundColor: '#e6f3ff',
        borderColor: '#007AFF',
    },
    rangeText: {
        fontSize: 14,
        color: '#666',
        marginLeft: 6,
        fontWeight: '500',
    },
    selectedRangeText: {
        color: '#007AFF',
        fontWeight: '600',
    },
});
