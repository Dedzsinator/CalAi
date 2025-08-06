import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Switch,
    Alert,
    Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { RootState, AppDispatch } from '../../store';
import {
    loadSettings,
    saveSettings,
    toggleNotification,
    setTheme,
    setUnits,
    exportData,
    resetSettings,
} from '../../store/slices/settingsSlice';

interface SettingsItemProps {
    icon: string;
    title: string;
    subtitle?: string;
    onPress?: () => void;
    rightComponent?: React.ReactNode;
    showArrow?: boolean;
}

const SettingsItem: React.FC<SettingsItemProps> = ({
    icon,
    title,
    subtitle,
    onPress,
    rightComponent,
    showArrow = false,
}) => (
    <TouchableOpacity
        style={styles.settingsItem}
        onPress={onPress}
        disabled={!onPress && !rightComponent}
    >
        <View style={styles.settingsItemLeft}>
            <Icon name={icon} size={24} color="#007AFF" style={styles.settingsIcon} />
            <View style={styles.settingsTextContainer}>
                <Text style={styles.settingsTitle}>{title}</Text>
                {subtitle && <Text style={styles.settingsSubtitle}>{subtitle}</Text>}
            </View>
        </View>
        <View style={styles.settingsItemRight}>
            {rightComponent}
            {showArrow && <Icon name="chevron-right" size={24} color="#999" />}
        </View>
    </TouchableOpacity>
);

const SettingsScreen: React.FC = () => {
    const navigation = useNavigation();
    const dispatch = useDispatch<AppDispatch>();
    const { settings, isLoading, isSaving } = useSelector((state: RootState) => state.settings);

    const [showUnitsModal, setShowUnitsModal] = useState(false);
    const [showThemeModal, setShowThemeModal] = useState(false);

    useEffect(() => {
        dispatch(loadSettings());
    }, [dispatch]);

    const handleToggleNotification = (key: string) => {
        dispatch(toggleNotification(key as any));
        if (settings) {
            dispatch(saveSettings({
                notifications: {
                    ...settings.notifications,
                    [key]: !settings.notifications[key as keyof typeof settings.notifications],
                },
            }));
        }
    };

    const handleUnitsChange = (units: 'metric' | 'imperial') => {
        dispatch(setUnits(units));
        if (settings) {
            dispatch(saveSettings({
                preferences: {
                    ...settings.preferences,
                    units,
                },
            }));
        }
        setShowUnitsModal(false);
    };

    const handleThemeChange = (theme: 'light' | 'dark' | 'auto') => {
        dispatch(setTheme(theme));
        if (settings) {
            dispatch(saveSettings({
                preferences: {
                    ...settings.preferences,
                    theme,
                },
            }));
        }
        setShowThemeModal(false);
    };

    const handleExportData = (format: 'json' | 'csv') => {
        Alert.alert(
            'Export Data',
            `Export your data in ${format.toUpperCase()} format?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Export',
                    onPress: () => dispatch(exportData(format)),
                },
            ]
        );
    };

    const handleResetSettings = () => {
        Alert.alert(
            'Reset Settings',
            'Are you sure you want to reset all settings to their default values?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Reset',
                    style: 'destructive',
                    onPress: () => dispatch(resetSettings()),
                },
            ]
        );
    };

    if (!settings) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <Text>Loading settings...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView style={styles.scrollView}>
                {/* Notifications Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Notifications</Text>

                    <SettingsItem
                        icon="notifications"
                        title="Meal Reminders"
                        subtitle="Get reminded to log your meals"
                        rightComponent={
                            <Switch
                                value={settings.notifications.mealReminders}
                                onValueChange={() => handleToggleNotification('mealReminders')}
                                trackColor={{ false: '#e0e0e0', true: '#007AFF40' }}
                                thumbColor={settings.notifications.mealReminders ? '#007AFF' : '#fff'}
                            />
                        }
                    />

                    <SettingsItem
                        icon="water-drop"
                        title="Water Reminders"
                        subtitle="Stay hydrated throughout the day"
                        rightComponent={
                            <Switch
                                value={settings.notifications.waterReminders}
                                onValueChange={() => handleToggleNotification('waterReminders')}
                                trackColor={{ false: '#e0e0e0', true: '#007AFF40' }}
                                thumbColor={settings.notifications.waterReminders ? '#007AFF' : '#fff'}
                            />
                        }
                    />

                    <SettingsItem
                        icon="insights"
                        title="Weekly Reports"
                        subtitle="Get weekly nutrition insights"
                        rightComponent={
                            <Switch
                                value={settings.notifications.weeklyReports}
                                onValueChange={() => handleToggleNotification('weeklyReports')}
                                trackColor={{ false: '#e0e0e0', true: '#007AFF40' }}
                                thumbColor={settings.notifications.weeklyReports ? '#007AFF' : '#fff'}
                            />
                        }
                    />

                    <SettingsItem
                        icon="emoji-events"
                        title="Achievement Alerts"
                        subtitle="Celebrate your milestones"
                        rightComponent={
                            <Switch
                                value={settings.notifications.achievementAlerts}
                                onValueChange={() => handleToggleNotification('achievementAlerts')}
                                trackColor={{ false: '#e0e0e0', true: '#007AFF40' }}
                                thumbColor={settings.notifications.achievementAlerts ? '#007AFF' : '#fff'}
                            />
                        }
                    />
                </View>

                {/* Preferences Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Preferences</Text>

                    <SettingsItem
                        icon="straighten"
                        title="Units"
                        subtitle={`${settings.preferences.units === 'metric' ? 'Metric (kg, cm)' : 'Imperial (lbs, ft)'}`}
                        onPress={() => setShowUnitsModal(true)}
                        showArrow
                    />

                    <SettingsItem
                        icon="palette"
                        title="Theme"
                        subtitle={`${settings.preferences.theme.charAt(0).toUpperCase() + settings.preferences.theme.slice(1)}`}
                        onPress={() => setShowThemeModal(true)}
                        showArrow
                    />

                    <SettingsItem
                        icon="language"
                        title="Language"
                        subtitle="English"
                        onPress={() => { }}
                        showArrow
                    />
                </View>

                {/* Privacy Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Privacy & Data</Text>

                    <SettingsItem
                        icon="share"
                        title="Data Sharing"
                        subtitle="Help improve CalAi"
                        rightComponent={
                            <Switch
                                value={settings.privacy.dataSharing}
                                onValueChange={() => {
                                    if (settings) {
                                        dispatch(saveSettings({
                                            privacy: {
                                                ...settings.privacy,
                                                dataSharing: !settings.privacy.dataSharing,
                                            },
                                        }));
                                    }
                                }}
                                trackColor={{ false: '#e0e0e0', true: '#007AFF40' }}
                                thumbColor={settings.privacy.dataSharing ? '#007AFF' : '#fff'}
                            />
                        }
                    />

                    <SettingsItem
                        icon="analytics"
                        title="Analytics"
                        subtitle="Anonymous usage statistics"
                        rightComponent={
                            <Switch
                                value={settings.privacy.analytics}
                                onValueChange={() => {
                                    if (settings) {
                                        dispatch(saveSettings({
                                            privacy: {
                                                ...settings.privacy,
                                                analytics: !settings.privacy.analytics,
                                            },
                                        }));
                                    }
                                }}
                                trackColor={{ false: '#e0e0e0', true: '#007AFF40' }}
                                thumbColor={settings.privacy.analytics ? '#007AFF' : '#fff'}
                            />
                        }
                    />

                    <SettingsItem
                        icon="file-download"
                        title="Export Data"
                        subtitle="Download your nutrition data"
                        onPress={() => {
                            Alert.alert(
                                'Export Format',
                                'Choose the format for your data export:',
                                [
                                    { text: 'Cancel', style: 'cancel' },
                                    { text: 'JSON', onPress: () => handleExportData('json') },
                                    { text: 'CSV', onPress: () => handleExportData('csv') },
                                ]
                            );
                        }}
                        showArrow
                    />
                </View>

                {/* About Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>About</Text>

                    <SettingsItem
                        icon="info"
                        title="App Version"
                        subtitle="1.0.0"
                    />

                    <SettingsItem
                        icon="help"
                        title="Help & Support"
                        onPress={() => { }}
                        showArrow
                    />

                    <SettingsItem
                        icon="privacy-tip"
                        title="Privacy Policy"
                        onPress={() => { }}
                        showArrow
                    />

                    <SettingsItem
                        icon="description"
                        title="Terms of Service"
                        onPress={() => { }}
                        showArrow
                    />
                </View>

                {/* Reset Section */}
                <View style={styles.section}>
                    <SettingsItem
                        icon="restore"
                        title="Reset Settings"
                        subtitle="Restore default settings"
                        onPress={handleResetSettings}
                    />
                </View>
            </ScrollView>

            {/* Units Modal */}
            <Modal
                visible={showUnitsModal}
                transparent
                animationType="slide"
                onRequestClose={() => setShowUnitsModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Choose Units</Text>

                        <TouchableOpacity
                            style={[
                                styles.modalOption,
                                settings.preferences.units === 'metric' && styles.modalOptionSelected
                            ]}
                            onPress={() => handleUnitsChange('metric')}
                        >
                            <Text style={[
                                styles.modalOptionText,
                                settings.preferences.units === 'metric' && styles.modalOptionTextSelected
                            ]}>
                                Metric (kg, cm)
                            </Text>
                            {settings.preferences.units === 'metric' && (
                                <Icon name="check" size={20} color="#007AFF" />
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[
                                styles.modalOption,
                                settings.preferences.units === 'imperial' && styles.modalOptionSelected
                            ]}
                            onPress={() => handleUnitsChange('imperial')}
                        >
                            <Text style={[
                                styles.modalOptionText,
                                settings.preferences.units === 'imperial' && styles.modalOptionTextSelected
                            ]}>
                                Imperial (lbs, ft)
                            </Text>
                            {settings.preferences.units === 'imperial' && (
                                <Icon name="check" size={20} color="#007AFF" />
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.modalCancelButton}
                            onPress={() => setShowUnitsModal(false)}
                        >
                            <Text style={styles.modalCancelText}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Theme Modal */}
            <Modal
                visible={showThemeModal}
                transparent
                animationType="slide"
                onRequestClose={() => setShowThemeModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Choose Theme</Text>

                        {['light', 'dark', 'auto'].map((theme) => (
                            <TouchableOpacity
                                key={theme}
                                style={[
                                    styles.modalOption,
                                    settings.preferences.theme === theme && styles.modalOptionSelected
                                ]}
                                onPress={() => handleThemeChange(theme as any)}
                            >
                                <Text style={[
                                    styles.modalOptionText,
                                    settings.preferences.theme === theme && styles.modalOptionTextSelected
                                ]}>
                                    {theme.charAt(0).toUpperCase() + theme.slice(1)}
                                </Text>
                                {settings.preferences.theme === theme && (
                                    <Icon name="check" size={20} color="#007AFF" />
                                )}
                            </TouchableOpacity>
                        ))}

                        <TouchableOpacity
                            style={styles.modalCancelButton}
                            onPress={() => setShowThemeModal(false)}
                        >
                            <Text style={styles.modalCancelText}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    scrollView: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    section: {
        backgroundColor: 'white',
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        padding: 16,
        paddingBottom: 8,
        backgroundColor: '#f8f9fa',
    },
    settingsItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    settingsItemLeft: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
    },
    settingsIcon: {
        marginRight: 12,
    },
    settingsTextContainer: {
        flex: 1,
    },
    settingsTitle: {
        fontSize: 16,
        fontWeight: '500',
        color: '#333',
    },
    settingsSubtitle: {
        fontSize: 14,
        color: '#666',
        marginTop: 2,
    },
    settingsItemRight: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: 'white',
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        paddingBottom: 34,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
        textAlign: 'center',
    },
    modalOption: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    modalOptionSelected: {
        backgroundColor: '#f0f8ff',
    },
    modalOptionText: {
        fontSize: 16,
        color: '#333',
    },
    modalOptionTextSelected: {
        color: '#007AFF',
        fontWeight: '500',
    },
    modalCancelButton: {
        paddingVertical: 16,
        alignItems: 'center',
    },
    modalCancelText: {
        fontSize: 16,
        color: '#007AFF',
        fontWeight: '500',
    },
});

export default SettingsScreen;
