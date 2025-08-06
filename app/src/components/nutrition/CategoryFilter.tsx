import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

interface Category {
    id: string;
    name: string;
    icon: string;
}

interface CategoryFilterProps {
    categories: Category[];
    selectedCategory: string;
    onCategorySelect: (categoryId: string) => void;
}

export const CategoryFilter: React.FC<CategoryFilterProps> = ({
    categories,
    selectedCategory,
    onCategorySelect,
}) => {
    return (
        <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.container}
        >
            {categories.map((category) => (
                <TouchableOpacity
                    key={category.id}
                    style={[
                        styles.categoryButton,
                        selectedCategory === category.id && styles.selectedCategory
                    ]}
                    onPress={() => onCategorySelect(category.id)}
                >
                    <Icon
                        name={category.icon}
                        size={20}
                        color={selectedCategory === category.id ? '#007AFF' : '#666'}
                    />
                    <Text
                        style={[
                            styles.categoryText,
                            selectedCategory === category.id && styles.selectedCategoryText
                        ]}
                    >
                        {category.name}
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
    categoryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
        marginRight: 12,
        borderRadius: 20,
        backgroundColor: '#f5f5f5',
        borderWidth: 1,
        borderColor: 'transparent',
    },
    selectedCategory: {
        backgroundColor: '#e6f3ff',
        borderColor: '#007AFF',
    },
    categoryText: {
        fontSize: 14,
        color: '#666',
        marginLeft: 6,
        fontWeight: '500',
    },
    selectedCategoryText: {
        color: '#007AFF',
    },
});
