import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
    Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { MaterialIcons as Icon } from '@expo/vector-icons';

import { RootState, AppDispatch } from '../../store';
import { logout } from '../../store/slices/authSlice';
import { loadSettings, saveSettings } from '../../store/slices/settingsSlice';

const ProfileScreen: React.FC = () => {
    const navigation = useNavigation();
    const dispatch = useDispatch<AppDispatch>();
    const { user } = useSelector((state: RootState) => state.auth);
    const { settings } = useSelector((state: RootState) => state.settings);

    useEffect(() => {
        dispatch(loadSettings());
    }, [dispatch]);

    const handleLogout = () => {
        Alert.alert(
            'Logout',
            'Are you sure you want to logout?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Logout',
                    style: 'destructive',
                    onPress: () => dispatch(logout()),
                },
            ]
        );
    };

    const toggleNotification = (key: keyof typeof settings.notifications) => {
        if (settings) {
            const updatedNotifications = {
                ...settings.notifications,
                [key]: !settings.notifications[key],
            };
            dispatch(saveSettings({ notifications: updatedNotifications }));
        }
    };

    const navigateToSettings = () => {
        navigation.navigate('Settings' as never);
    };

    const navigateToEditProfile = () => {
        navigation.navigate('EditProfile' as never);
    };

    const navigateToGoals = () => {
        navigation.navigate('Goals' as never);
    };

    const navigateToPrivacy = () => {
        navigation.navigate('Privacy' as never);
    };

    const navigateToHelp = () => {
        navigation.navigate('Help' as never);
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => navigation.goBack()}
                    >
                        <Icon name="arrow-back" size={24} color="#333" />
                    </TouchableOpacity>
                    <Text style={styles.title}>Profile</Text>
                    <TouchableOpacity style={styles.editButton} onPress={navigateToEditProfile}>
                        <Icon name="edit" size={20} color="#007AFF" />
                    </TouchableOpacity>
                </View>

                {/* User Info */}
                <View style={styles.userInfo}>
                    <View style={styles.avatar}>
                        <Text style={styles.avatarText}>
                            {user?.name?.charAt(0).toUpperCase() || 'U'}
                        </Text>
                    </View>
                    <Text style={styles.userName}>{user?.name || 'User'}</Text>
                    <Text style={styles.userEmail}>{user?.email || 'user@example.com'}</Text>

                    {/* Quick Stats */}
                    <View style={styles.quickStats}>
                        <StatCard title="Streak" value="12" unit="days" />
                        <StatCard title="Weight" value="70" unit="kg" />
                        <StatCard title="BMI" value="22.5" unit="" />
                    </View>
                </View>

                {/* Menu Items */}
                <View style={styles.menuSection}>
                    <Text style={styles.sectionTitle}>Settings</Text>

                    <MenuItem
                        icon="flag"
                        title="Goals & Targets"
                        subtitle="Set your nutrition and fitness goals"
                        onPress={navigateToGoals}
                    />

                    <MenuItem
                        icon="notifications"
                        title="Notifications"
                        subtitle="Manage your notification preferences"
                        onPress={() => { }}
                        rightComponent={
                            <Switch
                                value={settings?.notifications.mealReminders || false}
                                onValueChange={() => toggleNotification('mealReminders')}
                                trackColor={{ false: '#e0e0e0', true: '#007AFF40' }}
                                thumbColor={settings?.notifications.mealReminders ? '#007AFF' : '#fff'}
                            />
                        }
                    />

                    <MenuItem
                        icon="palette"
                        title="Appearance"
                        subtitle={`${settings?.preferences.theme || 'Auto'} theme`}
                        onPress={navigateToSettings}
                    />

                    <MenuItem
                        icon="language"
                        title="Language & Region"
                        subtitle={`${settings?.preferences.units || 'Metric'} units`}
                        onPress={navigateToSettings}
                    />
                </View>

                <View style={styles.menuSection}>
                    <Text style={styles.sectionTitle}>Data & Privacy</Text>

                    <MenuItem
                        icon="privacy-tip"
                        title="Privacy Settings"
                        subtitle="Control your data sharing"
                        onPress={navigateToPrivacy}
                    />

                    <MenuItem
                        icon="file-download"
                        title="Export Data"
                        subtitle="Download your nutrition data"
                        onPress={() => { }}
                    />

                    <MenuItem
                        icon="delete"
                        title="Delete Account"
                        subtitle="Permanently delete your account"
                        onPress={() => { }}
                        textColor="#FF5722"
                    />
                </View>

                <View style={styles.menuSection}>
                    <Text style={styles.sectionTitle}>Support</Text>

                    <MenuItem
                        icon="help"
                        title="Help & FAQ"
                        subtitle="Get help using CalAi"
                        onPress={navigateToHelp}
                    />

                    <MenuItem
                        icon="feedback"
                        title="Send Feedback"
                        subtitle="Help us improve CalAi"
                        onPress={() => { }}
                    />

                    <MenuItem
                        icon="info"
                        title="About"
                        subtitle="Version 1.0.0"
                        onPress={() => { }}
                    />
                </View>

                {/* Logout Button */}
                <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                    <Icon name="logout" size={20} color="#FF5722" />
                    <Text style={styles.logoutText}>Logout</Text>
                </TouchableOpacity>

                <View style={styles.footer}>
                    <Text style={styles.footerText}>CalAi v1.0.0</Text>
                    <Text style={styles.footerText}>Made with ❤️ for your health</Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const StatCard: React.FC<{
    title: string;
    value: string;
    unit: string;
}> = ({ title, value, unit }) => (
    <View style={styles.statCard}>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statUnit}>{unit}</Text>
        <Text style={styles.statTitle}>{title}</Text>
    </View>
);

const MenuItem: React.FC<{
    icon: keyof typeof Icon.glyphMap;
    title: string;
    subtitle: string;
    onPress: () => void;
    rightComponent?: React.ReactNode;
    textColor?: string;
}> = ({ icon, title, subtitle, onPress, rightComponent, textColor = '#333' }) => (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
        <View style={styles.menuItemLeft}>
            <Icon name={icon} size={24} color="#666" />
            <View style={styles.menuItemText}>
                <Text style={[styles.menuItemTitle, { color: textColor }]}>{title}</Text>
                <Text style={styles.menuItemSubtitle}>{subtitle}</Text>
            </View>
        </View>
        {rightComponent || <Icon name="chevron-right" size={20} color="#ccc" />}
    </TouchableOpacity>
);

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    scrollView: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    backButton: {
        padding: 4,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
    },
    editButton: {
        padding: 4,
    },
    userInfo: {
        backgroundColor: 'white',
        alignItems: 'center',
        paddingVertical: 32,
        paddingHorizontal: 20,
    },
    avatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#007AFF',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    avatarText: {
        fontSize: 32,
        fontWeight: 'bold',
        color: 'white',
    },
    userName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 4,
    },
    userEmail: {
        fontSize: 16,
        color: '#666',
        marginBottom: 24,
    },
    quickStats: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        width: '100%',
    },
    statCard: {
        alignItems: 'center',
        flex: 1,
    },
    statValue: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#007AFF',
    },
    statUnit: {
        fontSize: 12,
        color: '#666',
        marginTop: 2,
    },
    statTitle: {
        fontSize: 14,
        color: '#333',
        marginTop: 4,
    },
    menuSection: {
        marginTop: 24,
        backgroundColor: 'white',
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#666',
        paddingHorizontal: 20,
        paddingVertical: 12,
        backgroundColor: '#f8f9fa',
    },
    menuItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    menuItemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    menuItemText: {
        marginLeft: 16,
        flex: 1,
    },
    menuItemTitle: {
        fontSize: 16,
        fontWeight: '500',
        marginBottom: 2,
    },
    menuItemSubtitle: {
        fontSize: 14,
        color: '#666',
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 32,
        marginHorizontal: 20,
        backgroundColor: 'white',
        borderRadius: 12,
        paddingVertical: 16,
        borderWidth: 1,
        borderColor: '#FF5722',
    },
    logoutText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FF5722',
        marginLeft: 8,
    },
    footer: {
        alignItems: 'center',
        paddingVertical: 32,
    },
    footerText: {
        fontSize: 14,
        color: '#999',
        marginBottom: 4,
    },
});

export default ProfileScreen;
