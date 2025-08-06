import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ActivityIndicator,
    StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';

const LoadingScreen: React.FC = () => {
    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#007AFF" />
            <View style={styles.content}>
                <View style={styles.logoContainer}>
                    <MaterialIcons name="restaurant" size={64} color="#007AFF" />
                </View>
                <Text style={styles.title}>CalAi</Text>
                <Text style={styles.subtitle}>AI-Powered Nutrition Tracking</Text>

                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#007AFF" />
                    <Text style={styles.loadingText}>Loading...</Text>
                </View>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 24,
    },
    logoContainer: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: '#f0f8ff',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
        shadowColor: '#007AFF',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#1a1a1a',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        marginBottom: 48,
    },
    loadingContainer: {
        alignItems: 'center',
        marginTop: 32,
    },
    loadingText: {
        fontSize: 14,
        color: '#666',
        marginTop: 12,
    },
});

export default LoadingScreen;
