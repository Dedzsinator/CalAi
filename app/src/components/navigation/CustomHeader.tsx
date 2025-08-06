import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';

interface CustomHeaderProps {
    route: {
        name: string;
    };
    options?: {
        title?: string;
    };
}

const CustomHeader: React.FC<CustomHeaderProps> = ({ route, options }) => {
    const navigation = useNavigation();
    const title = options?.title || route.name;

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#fff" />
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <MaterialIcons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>

                <Text style={styles.title} numberOfLines={1}>
                    {title}
                </Text>

                {/* Placeholder for right actions */}
                <View style={styles.rightActions} />
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        height: 56,
    },
    backButton: {
        padding: 8,
        marginRight: 8,
    },
    title: {
        flex: 1,
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
        textAlign: 'center',
        marginHorizontal: 16,
    },
    rightActions: {
        width: 40, // Match back button width for centering
    },
});

export default CustomHeader;
