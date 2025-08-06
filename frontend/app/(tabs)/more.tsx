import React, { useState } from 'react';
import {
    View,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
    Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';

import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

interface MenuSection {
    title: string;
    items: MenuItem[];
}

interface MenuItem {
    id: string;
    title: string;
    subtitle?: string;
    icon: string;
    action: () => void;
    showSwitch?: boolean;
    switchValue?: boolean;
    showChevron?: boolean;
    color?: string;
}

export default function MoreScreen() {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];

    const [notificationsEnabled, setNotificationsEnabled] = useState(true);
    const [privacyMode, setPrivacyMode] = useState(false);

    const handleLogout = () => {
        Alert.alert(
            'Log Out',
            'Are you sure you want to log out?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Log Out',
                    style: 'destructive',
                    onPress: () => {
                        // TODO: Implement logout logic
                        console.log('Logging out...');
                    },
                },
            ]
        );
    };

    const showComingSoon = (feature: string) => {
        Alert.alert(
            'Coming Soon',
            `${feature} will be available in a future update.`,
            [{ text: 'OK', style: 'default' }]
        );
    };

    const menuSections: MenuSection[] = [
        {
            title: 'Tracking',
            items: [
                {
                    id: 'goals',
                    title: 'Goals & Targets',
                    subtitle: 'Set your daily calorie and nutrition goals',
                    icon: 'flag',
                    action: () => showComingSoon('Goals & Targets'),
                    showChevron: true,
                },
                {
                    id: 'progress',
                    title: 'Progress & History',
                    subtitle: 'View your weight and measurement trends',
                    icon: 'trending-up',
                    action: () => showComingSoon('Progress & History'),
                    showChevron: true,
                },
                {
                    id: 'reminders',
                    title: 'Meal Reminders',
                    subtitle: 'Set up notifications for meal logging',
                    icon: 'alarm',
                    action: () => showComingSoon('Meal Reminders'),
                    showChevron: true,
                },
            ],
        },
        {
            title: 'Food & Database',
            items: [
                {
                    id: 'favorites',
                    title: 'Favorite Foods',
                    subtitle: 'Quick access to frequently eaten items',
                    icon: 'favorite',
                    action: () => showComingSoon('Favorite Foods'),
                    showChevron: true,
                },
                {
                    id: 'custom-foods',
                    title: 'Custom Foods',
                    subtitle: 'Manage your custom food entries',
                    icon: 'restaurant',
                    action: () => showComingSoon('Custom Foods'),
                    showChevron: true,
                },
                {
                    id: 'barcode-history',
                    title: 'Barcode History',
                    subtitle: 'Previously scanned products',
                    icon: 'qr-code',
                    action: () => showComingSoon('Barcode History'),
                    showChevron: true,
                },
            ],
        },
        {
            title: 'App Settings',
            items: [
                {
                    id: 'notifications',
                    title: 'Notifications',
                    subtitle: 'Enable push notifications',
                    icon: 'notifications',
                    action: () => setNotificationsEnabled(!notificationsEnabled),
                    showSwitch: true,
                    switchValue: notificationsEnabled,
                },
                {
                    id: 'privacy',
                    title: 'Privacy Mode',
                    subtitle: 'Keep data processing on-device only',
                    icon: 'security',
                    action: () => setPrivacyMode(!privacyMode),
                    showSwitch: true,
                    switchValue: privacyMode,
                },
                {
                    id: 'units',
                    title: 'Units & Measurements',
                    subtitle: 'Metric or Imperial system',
                    icon: 'straighten',
                    action: () => showComingSoon('Units & Measurements'),
                    showChevron: true,
                },
                {
                    id: 'language',
                    title: 'Language',
                    subtitle: 'Change app language',
                    icon: 'language',
                    action: () => showComingSoon('Language Settings'),
                    showChevron: true,
                },
            ],
        },
        {
            title: 'Data & Backup',
            items: [
                {
                    id: 'export',
                    title: 'Export Data',
                    subtitle: 'Download your data as CSV or JSON',
                    icon: 'download',
                    action: () => showComingSoon('Data Export'),
                    showChevron: true,
                },
                {
                    id: 'sync',
                    title: 'Sync Settings',
                    subtitle: 'Cloud backup and device sync',
                    icon: 'sync',
                    action: () => showComingSoon('Sync Settings'),
                    showChevron: true,
                },
                {
                    id: 'reset',
                    title: 'Reset All Data',
                    subtitle: 'Clear all app data and start fresh',
                    icon: 'refresh',
                    action: () => {
                        Alert.alert(
                            'Reset All Data',
                            'This will permanently delete all your data. This action cannot be undone.',
                            [
                                { text: 'Cancel', style: 'cancel' },
                                {
                                    text: 'Reset',
                                    style: 'destructive',
                                    onPress: () => console.log('Resetting data...'),
                                },
                            ]
                        );
                    },
                    showChevron: true,
                    color: colors.error,
                },
            ],
        },
        {
            title: 'Support & Info',
            items: [
                {
                    id: 'help',
                    title: 'Help & FAQ',
                    subtitle: 'Get help using the app',
                    icon: 'help',
                    action: () => showComingSoon('Help & FAQ'),
                    showChevron: true,
                },
                {
                    id: 'feedback',
                    title: 'Send Feedback',
                    subtitle: 'Report bugs or suggest features',
                    icon: 'feedback',
                    action: () => showComingSoon('Feedback'),
                    showChevron: true,
                },
                {
                    id: 'privacy-policy',
                    title: 'Privacy Policy',
                    icon: 'policy',
                    action: () => showComingSoon('Privacy Policy'),
                    showChevron: true,
                },
                {
                    id: 'terms',
                    title: 'Terms of Service',
                    icon: 'description',
                    action: () => showComingSoon('Terms of Service'),
                    showChevron: true,
                },
                {
                    id: 'about',
                    title: 'About CalAi',
                    subtitle: 'Version 1.0.0',
                    icon: 'info',
                    action: () => showComingSoon('About'),
                    showChevron: true,
                },
            ],
        },
        {
            title: 'Account',
            items: [
                {
                    id: 'profile',
                    title: 'Edit Profile',
                    subtitle: 'Personal information and preferences',
                    icon: 'person',
                    action: () => showComingSoon('Profile Settings'),
                    showChevron: true,
                },
                {
                    id: 'logout',
                    title: 'Log Out',
                    icon: 'logout',
                    action: handleLogout,
                    showChevron: true,
                    color: colors.error,
                },
            ],
        },
    ];

    const renderMenuItem = (item: MenuItem) => (
        <TouchableOpacity
            key={item.id}
            style={[styles.menuItem, { borderBottomColor: colors.border }]}
            onPress={item.action}
        >
            <View style={styles.menuItemLeft}>
                <MaterialIcons
                    name={item.icon as any}
                    size={24}
                    color={item.color || colors.text}
                />
                <View style={styles.menuItemText}>
                    <ThemedText
                        style={[
                            styles.menuItemTitle,
                            item.color && { color: item.color },
                        ]}
                    >
                        {item.title}
                    </ThemedText>
                    {item.subtitle && (
                        <ThemedText style={styles.menuItemSubtitle}>
                            {item.subtitle}
                        </ThemedText>
                    )}
                </View>
            </View>

            <View style={styles.menuItemRight}>
                {item.showSwitch && (
                    <Switch
                        value={item.switchValue}
                        onValueChange={item.action}
                        thumbColor={colors.primary}
                        trackColor={{
                            false: colors.textSecondary,
                            true: colors.primary,
                        }}
                    />
                )}
                {item.showChevron && (
                    <MaterialIcons
                        name="chevron-right"
                        size={24}
                        color={colors.textSecondary}
                    />
                )}
            </View>
        </TouchableOpacity>
    );

    const renderSection = (section: MenuSection) => (
        <ThemedView key={section.title} style={styles.section}>
            <ThemedText style={styles.sectionTitle}>{section.title}</ThemedText>
            <ThemedView style={[styles.sectionContent, { backgroundColor: colors.backgroundSecondary }]}>
                {section.items.map(renderMenuItem)}
            </ThemedView>
        </ThemedView>
    );

    return (
        <SafeAreaView style={styles.container}>
            <ThemedView style={styles.header}>
                <ThemedText style={styles.title}>More</ThemedText>
                <ThemedText style={styles.subtitle}>
                    Settings, preferences, and account options
                </ThemedText>
            </ThemedView>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {menuSections.map(renderSection)}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
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
        opacity: 0.7,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 20,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 12,
    },
    sectionContent: {
        borderRadius: 12,
        overflow: 'hidden',
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderBottomWidth: 0.5,
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
    },
    menuItemSubtitle: {
        fontSize: 14,
        opacity: 0.7,
        marginTop: 2,
    },
    menuItemRight: {
        alignItems: 'center',
        justifyContent: 'center',
    },
});
