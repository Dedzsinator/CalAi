import React, { useState } from 'react';
import {
    View,
    TextInput,
    TouchableOpacity,
    StyleSheet,
} from 'react-native';
import { MaterialIcons as Icon } from '@expo/vector-icons';

interface SearchBarProps {
    placeholder: string;
    value: string;
    onChangeText: (text: string) => void;
    onClear?: () => void;
    autoFocus?: boolean;
}

export const SearchBar: React.FC<SearchBarProps> = ({
    placeholder,
    value,
    onChangeText,
    onClear,
    autoFocus = false,
}) => {
    const [isFocused, setIsFocused] = useState(false);

    const handleClear = () => {
        onChangeText('');
        onClear?.();
    };

    return (
        <View style={[styles.container, isFocused && styles.focused]}>
            <Icon name="search" size={20} color="#666" style={styles.searchIcon} />
            <TextInput
                style={styles.textInput}
                placeholder={placeholder}
                placeholderTextColor="#999"
                value={value}
                onChangeText={onChangeText}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                autoFocus={autoFocus}
                returnKeyType="search"
                clearButtonMode="never" // We'll handle our own clear button
            />
            {value.length > 0 && (
                <TouchableOpacity style={styles.clearButton} onPress={handleClear}>
                    <Icon name="clear" size={20} color="#666" />
                </TouchableOpacity>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f0f0f0',
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    focused: {
        borderColor: '#007AFF',
        backgroundColor: 'white',
    },
    searchIcon: {
        marginRight: 8,
    },
    textInput: {
        flex: 1,
        fontSize: 16,
        color: '#333',
        paddingVertical: 4,
    },
    clearButton: {
        padding: 4,
        marginLeft: 8,
    },
});
