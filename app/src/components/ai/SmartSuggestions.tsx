import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
} from 'react-native';
import { MaterialIcons as Icon } from '@expo/vector-icons';

interface Suggestion {
    id: string;
    title: string;
    description: string;
    icon: keyof typeof Icon.glyphMap;
    color: string;
    action: () => void;
}

interface SmartSuggestionsProps {
    suggestions?: Suggestion[];
}

export const SmartSuggestions: React.FC<SmartSuggestionsProps> = ({
    suggestions = defaultSuggestions,
}) => {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>Smart Suggestions</Text>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.scrollContainer}
            >
                {suggestions.map((suggestion) => (
                    <TouchableOpacity
                        key={suggestion.id}
                        style={[styles.suggestionCard, { borderLeftColor: suggestion.color }]}
                        onPress={suggestion.action}
                    >
                        <View style={[styles.iconContainer, { backgroundColor: `${suggestion.color}20` }]}>
                            <Icon name={suggestion.icon} size={24} color={suggestion.color} />
                        </View>
                        <Text style={styles.suggestionTitle} numberOfLines={2}>
                            {suggestion.title}
                        </Text>
                        <Text style={styles.suggestionDescription} numberOfLines={3}>
                            {suggestion.description}
                        </Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </View>
    );
};

const defaultSuggestions: Suggestion[] = [
    {
        id: '1',
        title: 'Add Breakfast',
        description: 'Start your day with a nutritious breakfast',
        icon: 'wb-sunny',
        color: '#FFB347',
        action: () => console.log('Add breakfast'),
    },
    {
        id: '2',
        title: 'Hydrate',
        description: 'You\'re behind on your water goal today',
        icon: 'local-drink',
        color: '#2196F3',
        action: () => console.log('Add water'),
    },
    {
        id: '3',
        title: 'Evening Snack',
        description: 'Consider a healthy snack for tonight',
        icon: 'restaurant',
        color: '#4CAF50',
        action: () => console.log('Add snack'),
    },
];

const styles = StyleSheet.create({
    container: {
        marginTop: 24,
        paddingHorizontal: 20,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 16,
    },
    scrollContainer: {
        paddingRight: 20,
    },
    suggestionCard: {
        width: 200,
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 16,
        marginRight: 16,
        borderLeftWidth: 4,
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
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    suggestionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1a1a1a',
        marginBottom: 8,
    },
    suggestionDescription: {
        fontSize: 14,
        color: '#666',
        lineHeight: 20,
    },
});
