import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    RefreshControl,
    Alert,
    Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../../store';
import { processOfflineQueue, retryFailedActions, clearFailedActions } from '../../store/slices/offlineSlice';
import LoadingSpinner from '../../components/common/LoadingSpinner';

interface Job {
    id: string;
    jobType: string;
    status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
    progress?: number;
    createdAt: Date;
    completedAt?: Date;
    errorMessage?: string;
}

interface QueuedAction {
    id: string;
    type: string;
    endpoint: string;
    method: string;
    retryCount: number;
    maxRetries: number;
    createdAt: Date;
    priority: number;
}

export default function SyncProgressScreen() {
    const dispatch = useDispatch<AppDispatch>();
    const {
        isOnline,
        queue,
        failedActions,
        syncInProgress,
        lastSyncAt,
        syncErrors
    } = useSelector((state: RootState) => state.offline);

    const [refreshing, setRefreshing] = useState(false);
    const [showFailedActions, setShowFailedActions] = useState(false);
    const [selectedAction, setSelectedAction] = useState<QueuedAction | null>(null);

    useEffect(() => {
        // Auto-refresh when coming back online
        if (isOnline && queue.length > 0 && !syncInProgress) {
            handleSync();
        }
    }, [isOnline]);

    const handleRefresh = async () => {
        setRefreshing(true);
        try {
            if (isOnline) {
                await dispatch(processOfflineQueue()).unwrap();
            }
        } catch (error) {
            console.error('Sync failed:', error);
        } finally {
            setRefreshing(false);
        }
    };

    const handleSync = async () => {
        if (!isOnline) {
            Alert.alert(
                'No Connection',
                'Please check your internet connection and try again.'
            );
            return;
        }

        try {
            await dispatch(processOfflineQueue()).unwrap();
        } catch (error) {
            Alert.alert('Sync Failed', 'Some items could not be synced. Please try again.');
        }
    };

    const handleRetryFailed = async () => {
        try {
            await dispatch(retryFailedActions()).unwrap();
            Alert.alert('Success', 'Failed actions have been added back to the queue.');
        } catch (error) {
            Alert.alert('Error', 'Failed to retry actions.');
        }
    };

    const handleClearFailed = async () => {
        Alert.alert(
            'Clear Failed Actions',
            'Are you sure you want to permanently remove all failed actions?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Clear',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await dispatch(clearFailedActions()).unwrap();
                        } catch (error) {
                            Alert.alert('Error', 'Failed to clear actions.');
                        }
                    }
                }
            ]
        );
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'pending': return 'time-outline';
            case 'processing': return 'sync-outline';
            case 'completed': return 'checkmark-circle-outline';
            case 'failed': return 'close-circle-outline';
            case 'cancelled': return 'stop-circle-outline';
            default: return 'help-circle-outline';
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending': return '#FF9800';
            case 'processing': return '#2196F3';
            case 'completed': return '#4CAF50';
            case 'failed': return '#F44336';
            case 'cancelled': return '#666';
            default: return '#666';
        }
    };

    const getActionDisplayName = (action: QueuedAction) => {
        const typeMap: Record<string, string> = {
            'meal/create': 'Create Meal',
            'meal/update': 'Update Meal',
            'meal/delete': 'Delete Meal',
            'food/create': 'Add Food',
            'reminder/create': 'Create Reminder',
            'reminder/update': 'Update Reminder',
            'user/update': 'Update Profile',
            'analytics/track': 'Track Event',
        };

        return typeMap[action.type] || action.type;
    };

    const renderQueueItem = ({ item }: { item: QueuedAction }) => (
        <TouchableOpacity
            style={styles.queueItem}
            onPress={() => setSelectedAction(item)}
        >
            <View style={styles.queueItemHeader}>
                <View style={styles.queueItemInfo}>
                    <Ionicons name="time-outline" size={16} color="#FF9800" />
                    <Text style={styles.queueItemTitle}>
                        {getActionDisplayName(item)}
                    </Text>
                </View>
                <Text style={styles.queueItemPriority}>
                    P{item.priority}
                </Text>
            </View>

            <Text style={styles.queueItemDetails}>
                {item.method} {item.endpoint}
            </Text>

            <View style={styles.queueItemFooter}>
                <Text style={styles.queueItemTime}>
                    {new Date(item.createdAt).toLocaleDateString()}
                </Text>
                {item.retryCount > 0 && (
                    <Text style={styles.retryCount}>
                        Retry {item.retryCount}/{item.maxRetries}
                    </Text>
                )}
            </View>
        </TouchableOpacity>
    );

    const renderFailedItem = ({ item }: { item: QueuedAction }) => (
        <TouchableOpacity
            style={[styles.queueItem, styles.failedItem]}
            onPress={() => setSelectedAction(item)}
        >
            <View style={styles.queueItemHeader}>
                <View style={styles.queueItemInfo}>
                    <Ionicons name="close-circle-outline" size={16} color="#F44336" />
                    <Text style={styles.queueItemTitle}>
                        {getActionDisplayName(item)}
                    </Text>
                </View>
                <Text style={styles.failedLabel}>FAILED</Text>
            </View>

            <Text style={styles.queueItemDetails}>
                {item.method} {item.endpoint}
            </Text>

            <Text style={styles.queueItemTime}>
                Failed after {item.retryCount} retries
            </Text>
        </TouchableOpacity>
    );

    const renderActionDetails = () => {
        if (!selectedAction) return null;

        return (
            <Modal
                visible={!!selectedAction}
                animationType="slide"
                presentationStyle="pageSheet"
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Action Details</Text>
                        <TouchableOpacity onPress={() => setSelectedAction(null)}>
                            <Ionicons name="close" size={24} color="#666" />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.actionDetails}>
                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>Type</Text>
                            <Text style={styles.detailValue}>
                                {getActionDisplayName(selectedAction)}
                            </Text>
                        </View>

                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>Endpoint</Text>
                            <Text style={styles.detailValue}>
                                {selectedAction.method} {selectedAction.endpoint}
                            </Text>
                        </View>

                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>Priority</Text>
                            <Text style={styles.detailValue}>
                                {selectedAction.priority}
                            </Text>
                        </View>

                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>Created</Text>
                            <Text style={styles.detailValue}>
                                {new Date(selectedAction.createdAt).toLocaleString()}
                            </Text>
                        </View>

                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>Retries</Text>
                            <Text style={styles.detailValue}>
                                {selectedAction.retryCount}/{selectedAction.maxRetries}
                            </Text>
                        </View>
                    </View>
                </View>
            </Modal>
        );
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.title}>Sync Status</Text>
                <View style={styles.connectionStatus}>
                    <Ionicons
                        name={isOnline ? 'wifi' : 'wifi-off'}
                        size={20}
                        color={isOnline ? '#4CAF50' : '#F44336'}
                    />
                    <Text style={[
                        styles.connectionText,
                        { color: isOnline ? '#4CAF50' : '#F44336' }
                    ]}>
                        {isOnline ? 'Online' : 'Offline'}
                    </Text>
                </View>
            </View>

            {/* Stats */}
            <View style={styles.statsContainer}>
                <View style={styles.statItem}>
                    <Text style={styles.statNumber}>{queue.length}</Text>
                    <Text style={styles.statLabel}>Queued</Text>
                </View>
                <View style={styles.statItem}>
                    <Text style={styles.statNumber}>{failedActions.length}</Text>
                    <Text style={styles.statLabel}>Failed</Text>
                </View>
                <View style={styles.statItem}>
                    <Text style={styles.statNumber}>
                        {lastSyncAt ? new Date(lastSyncAt).toLocaleDateString() : 'Never'}
                    </Text>
                    <Text style={styles.statLabel}>Last Sync</Text>
                </View>
            </View>

            {/* Sync Button */}
            {queue.length > 0 && (
                <TouchableOpacity
                    style={[styles.syncButton, !isOnline && styles.syncButtonDisabled]}
                    onPressed={handleSync}
                    disabled={!isOnline || syncInProgress}
                >
                    {syncInProgress ? (
                        <LoadingSpinner size="small" color="#fff" />
                    ) : (
                        <Ionicons name="sync" size={20} color="#fff" />
                    )}
                    <Text style={styles.syncButtonText}>
                        {syncInProgress ? 'Syncing...' : 'Sync Now'}
                    </Text>
                </TouchableOpacity>
            )}

            {/* Failed Actions */}
            {failedActions.length > 0 && (
                <View style={styles.failedSection}>
                    <View style={styles.failedHeader}>
                        <Text style={styles.failedTitle}>Failed Actions</Text>
                        <View style={styles.failedActions}>
                            <TouchableOpacity
                                style={styles.failedActionButton}
                                onPress={handleRetryFailed}
                            >
                                <Text style={styles.failedActionText}>Retry All</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.failedActionButton}
                                onPress={handleClearFailed}
                            >
                                <Text style={[styles.failedActionText, { color: '#F44336' }]}>
                                    Clear
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    <FlatList
                        data={failedActions.slice(0, 3)} // Show only first 3
                        keyExtractor={(item) => item.id}
                        renderItem={renderFailedItem}
                        style={styles.failedList}
                    />

                    {failedActions.length > 3 && (
                        <TouchableOpacity
                            style={styles.viewAllButton}
                            onPress={() => setShowFailedActions(true)}
                        >
                            <Text style={styles.viewAllText}>
                                View all {failedActions.length} failed actions
                            </Text>
                        </TouchableOpacity>
                    )}
                </View>
            )}

            {/* Queue */}
            <Text style={styles.sectionTitle}>Pending Actions</Text>
            <FlatList
                data={queue}
                keyExtractor={(item) => item.id}
                renderItem={renderQueueItem}
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Ionicons name="checkmark-circle-outline" size={48} color="#4CAF50" />
                        <Text style={styles.emptyStateText}>
                            All actions are synced!
                        </Text>
                    </View>
                }
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={handleRefresh}
                        colors={['#2196F3']}
                        tintColor="#2196F3"
                    />
                }
                showsVerticalScrollIndicator={false}
            />

            {/* Sync Errors */}
            {syncErrors.length > 0 && (
                <View style={styles.errorContainer}>
                    <Text style={styles.errorTitle}>Sync Errors</Text>
                    {syncErrors.map((error, index) => (
                        <Text key={index} style={styles.errorText}>
                            • {error}
                        </Text>
                    ))}
                </View>
            )}

            {renderActionDetails()}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        paddingTop: 60,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
    },
    connectionStatus: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    connectionText: {
        fontSize: 14,
        fontWeight: '600',
    },
    statsContainer: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        margin: 16,
        borderRadius: 12,
        paddingVertical: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
    },
    statNumber: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#2196F3',
    },
    statLabel: {
        fontSize: 12,
        color: '#666',
        marginTop: 4,
    },
    syncButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#2196F3',
        marginHorizontal: 16,
        marginBottom: 16,
        paddingVertical: 12,
        borderRadius: 8,
        gap: 8,
    },
    syncButtonDisabled: {
        backgroundColor: '#ccc',
    },
    syncButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    failedSection: {
        backgroundColor: '#fff',
        margin: 16,
        marginTop: 0,
        borderRadius: 12,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    failedHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    failedTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#F44336',
    },
    failedActions: {
        flexDirection: 'row',
        gap: 8,
    },
    failedActionButton: {
        paddingHorizontal: 8,
        paddingVertical: 4,
    },
    failedActionText: {
        fontSize: 12,
        color: '#2196F3',
        fontWeight: '600',
    },
    failedList: {
        maxHeight: 200,
    },
    viewAllButton: {
        paddingVertical: 8,
        alignItems: 'center',
    },
    viewAllText: {
        fontSize: 12,
        color: '#2196F3',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
        marginHorizontal: 16,
        marginBottom: 8,
    },
    queueItem: {
        backgroundColor: '#fff',
        marginHorizontal: 16,
        marginVertical: 4,
        padding: 12,
        borderRadius: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    failedItem: {
        borderLeftWidth: 3,
        borderLeftColor: '#F44336',
    },
    queueItemHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    queueItemInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        flex: 1,
    },
    queueItemTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
    },
    queueItemPriority: {
        fontSize: 12,
        color: '#666',
        backgroundColor: '#f0f0f0',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    failedLabel: {
        fontSize: 10,
        color: '#F44336',
        backgroundColor: '#ffebee',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        fontWeight: '600',
    },
    queueItemDetails: {
        fontSize: 12,
        color: '#666',
        marginBottom: 4,
    },
    queueItemFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    queueItemTime: {
        fontSize: 10,
        color: '#999',
    },
    retryCount: {
        fontSize: 10,
        color: '#FF9800',
        fontWeight: '600',
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 40,
    },
    emptyStateText: {
        fontSize: 16,
        color: '#666',
        marginTop: 8,
    },
    errorContainer: {
        backgroundColor: '#ffebee',
        margin: 16,
        padding: 12,
        borderRadius: 8,
    },
    errorTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#c62828',
        marginBottom: 4,
    },
    errorText: {
        fontSize: 12,
        color: '#c62828',
    },
    modalContainer: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        paddingTop: 60,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
    },
    actionDetails: {
        backgroundColor: '#fff',
        margin: 16,
        borderRadius: 12,
        padding: 16,
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    detailLabel: {
        fontSize: 14,
        color: '#666',
        fontWeight: '600',
    },
    detailValue: {
        fontSize: 14,
        color: '#333',
        flex: 1,
        textAlign: 'right',
    },
});
