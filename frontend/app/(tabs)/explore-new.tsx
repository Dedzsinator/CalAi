import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Switch,
    Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import StorageService from '../../services/storage';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

interface UserProfile {
    name: string;
    email: string;
    goals: {
        daily_calories: number;
        protein_percent: number;
        carbs_percent: number;
        fat_percent: number;
    };
    preferences: {
        diet_type?: string;
        allergies: string[];
        notifications_enabled: boolean;
    };
}

export default function ProfileScreen() {
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        try {
            const userProfile = await StorageService.getProfile();
            const notifSetting = await StorageService.getSetting('notifications_enabled', true);

            setProfile(userProfile);
            setNotificationsEnabled(notifSetting);
        } catch (error) {
            console.error('Failed to load profile:', error);
        }
    };

    const toggleNotifications = async (value: boolean) => {
        try {
            await StorageService.saveSetting('notifications_enabled', value);
            setNotificationsEnabled(value);
        } catch (error) {
            console.error('Failed to update notification setting:', error);
            Alert.alert('Error', 'Failed to update notification settings.');
        }
    };

    const clearData = async () => {
        Alert.alert(
            'Clear All Data',
            'This will delete all your meals, settings, and profile data. This cannot be undone.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Clear Data',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await StorageService.clearAllData();
                            Alert.alert('Success', 'All data has been cleared.');
                            setProfile(null);
                        } catch (error) {
                            Alert.alert('Error', 'Failed to clear data.');
                        }
                    },
                },
            ]
        );
    };

    const exportData = async () => {
        try {
            const data = await StorageService.exportData();
            Alert.alert(
                'Data Export',
                `Found ${data.meals.length} meals to export. In a full implementation, this would save to a file or share the data.`
            );
        } catch (error) {
            Alert.alert('Error', 'Failed to export data.');
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView style={styles.scrollView}>
                {/* Header */}
                <View style={styles.header}>
                    <ThemedText style={styles.title}>Profile</ThemedText>
                    <Text style={styles.subtitle}>Manage your CalAi settings</Text>
                </View>

                {/* Profile Info */}
                <ThemedView style={styles.profileCard}>
                    <View style={styles.profileHeader}>
                        <View style={styles.profileAvatar}>
                            <Ionicons name="person" size={40} color="#007AFF" />
                        </View>
                        <View style={styles.profileInfo}>
                            <Text style={styles.profileName}>
                                {profile?.name || 'CalAi User'}
                            </Text>
                            <Text style={styles.profileEmail}>
                                {profile?.email || 'No email set'}
                            </Text>
                        </View>
                    </View>
                </ThemedView>

                {/* Settings */}
                <ThemedView style={styles.settingsCard}>
                    <Text style={styles.sectionTitle}>Settings</Text>

                    <View style={styles.settingItem}>
                        <View style={styles.settingInfo}>
                            <Ionicons name="notifications" size={24} color="#007AFF" />
                            <View style={styles.settingText}>
                                <Text style={styles.settingTitle}>Smart Reminders</Text>
                                <Text style={styles.settingDescription}>
                                    Get AI-powered meal reminders based on your habits
                                </Text>
                            </View>
                        </View>
                        <Switch
                            value={notificationsEnabled}
                            onValueChange={toggleNotifications}
                            trackColor={{ false: '#ccc', true: '#007AFF' }}
                            thumbColor="#fff"
                        />
                    </View>

                    <TouchableOpacity style={styles.settingItem}>
                        <View style={styles.settingInfo}>
                            <Ionicons name="target" size={24} color="#4ECDC4" />
                            <View style={styles.settingText}>
                                <Text style={styles.settingTitle}>Nutrition Goals</Text>
                                <Text style={styles.settingDescription}>
                                    Daily calories: {profile?.goals?.daily_calories || 2000} kcal
                                </Text>
                            </View>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color="#666" />
                    </TouchableOpacity>
                </ThemedView>

                {/* Data Management */}
                <ThemedView style={styles.settingsCard}>
                    <Text style={styles.sectionTitle}>Data Management</Text>

                    <TouchableOpacity style={styles.settingItem} onPress={exportData}>
                        <View style={styles.settingInfo}>
                            <Ionicons name="download" size={24} color="#4ECDC4" />
                            <View style={styles.settingText}>
                                <Text style={styles.settingTitle}>Export Data</Text>
                                <Text style={styles.settingDescription}>
                                    Download your nutrition data
                                </Text>
                            </View>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color="#666" />
                    </TouchableOpacity>

                    <TouchableOpacity style={[styles.settingItem, styles.dangerItem]} onPress={clearData}>
                        <View style={styles.settingInfo}>
                            <Ionicons name="trash" size={24} color="#FF6B6B" />
                            <View style={styles.settingText}>
                                <Text style={[styles.settingTitle, styles.dangerText]}>Clear All Data</Text>
                                <Text style={styles.settingDescription}>
                                    Delete all meals and settings
                                </Text>
                            </View>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color="#FF6B6B" />
                    </TouchableOpacity>
                </ThemedView>

                {/* App Info */}
                <ThemedView style={styles.infoCard}>
                    <Text style={styles.appName}>CalAi</Text>
                    <Text style={styles.version}>Version 1.0.0</Text>
                    <Text style={styles.description}>
                        AI-powered food recognition and calorie tracking with privacy-first design.
                    </Text>
                </ThemedView>

                <View style={styles.bottomPadding} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    scrollView: {
        flex: 1,
    },
    header: {
        padding: 20,
        paddingBottom: 10,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
    },
    profileCard: {
        margin: 20,
        marginVertical: 10,
        padding: 20,
        borderRadius: 16,
        backgroundColor: 'white',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    profileHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    profileAvatar: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#f0f0f0',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    profileInfo: {
        flex: 1,
    },
    profileName: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 4,
    },
    profileEmail: {
        fontSize: 14,
        color: '#666',
    },
    settingsCard: {
        margin: 20,
        marginVertical: 10,
        padding: 20,
        borderRadius: 16,
        backgroundColor: 'white',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 16,
    },
    settingItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    settingInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    settingText: {
        marginLeft: 16,
        flex: 1,
    },
    settingTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 2,
    },
    settingDescription: {
        fontSize: 14,
        color: '#666',
    },
    dangerItem: {
        borderBottomWidth: 0,
    },
    dangerText: {
        color: '#FF6B6B',
    },
    infoCard: {
        margin: 20,
        marginVertical: 10,
        padding: 20,
        borderRadius: 16,
        backgroundColor: 'white',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
        alignItems: 'center',
    },
    appName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#007AFF',
        marginBottom: 4,
    },
    version: {
        fontSize: 14,
        color: '#666',
        marginBottom: 12,
    },
    description: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        lineHeight: 20,
    },
    bottomPadding: {
        height: 100,
    },
});
