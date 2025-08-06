import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { MaterialIcons as Icon } from '@expo/vector-icons';

import { RootState, AppDispatch } from '../../store';
import {
    searchFoods,
    clearSearchResults,
    setSearchQuery,
    getFavorites,
    getRecentlyUsed
} from '../../store/slices/foodsSlice';
import { SearchBar } from '../../components/common/SearchBar';
import { FoodCard } from '../../components/nutrition/FoodCard';
import { CategoryFilter } from '../../components/nutrition/CategoryFilter';
import { EmptyState } from '../../components/common/EmptyState';

const FOOD_CATEGORIES = [
    { id: 'all', name: 'All', icon: 'restaurant' },
    { id: 'fruits', name: 'Fruits', icon: 'local-florist' },
    { id: 'vegetables', name: 'Vegetables', icon: 'eco' },
    { id: 'proteins', name: 'Proteins', icon: 'fitness-center' },
    { id: 'grains', name: 'Grains', icon: 'grain' },
    { id: 'dairy', name: 'Dairy', icon: 'local-cafe' },
    { id: 'snacks', name: 'Snacks', icon: 'cookie' },
];

const FoodSearchScreen: React.FC = () => {
    const navigation = useNavigation();
    const dispatch = useDispatch<AppDispatch>();

    const {
        searchResults,
        favorites,
        recentlyUsed,
        isSearching,
        searchQuery,
        error
    } = useSelector((state: RootState) => state.foods);

    const [selectedCategory, setSelectedCategory] = useState('all');
    const [activeTab, setActiveTab] = useState<'search' | 'favorites' | 'recent'>('search');

    useFocusEffect(
        useCallback(() => {
            dispatch(getFavorites());
            dispatch(getRecentlyUsed());
        }, [dispatch])
    );

    const handleSearch = (query: string) => {
        dispatch(setSearchQuery(query));
        if (query.trim().length > 2) {
            dispatch(searchFoods(query));
        } else {
            dispatch(clearSearchResults());
        }
    };

    const handleFoodSelect = (food: any) => {
        navigation.navigate('AddMeal' as never, { selectedFood: food } as never);
    };

    const handleBarcodeScan = () => {
        navigation.navigate('BarcodeScanner' as never);
    };

    const renderFoodItem = ({ item }: { item: any }) => (
        <FoodCard
            food={item}
            onPress={() => handleFoodSelect(item)}
            showFavoriteButton
        />
    );

    const renderEmptyState = () => {
        if (activeTab === 'search' && searchQuery.length === 0) {
            return (
                <EmptyState
                    icon="search"
                    title="Search for foods"
                    description="Start typing to search our food database"
                />
            );
        }

        if (activeTab === 'search' && searchQuery.length > 0 && searchResults.length === 0) {
            return (
                <EmptyState
                    icon="search-off"
                    title="No foods found"
                    description={`No results for "${searchQuery}"`}
                    actionText="Scan Barcode"
                    onAction={handleBarcodeScan}
                />
            );
        }

        if (activeTab === 'favorites') {
            return (
                <EmptyState
                    icon="favorite-border"
                    title="No favorites yet"
                    description="Foods you favorite will appear here"
                />
            );
        }

        if (activeTab === 'recent') {
            return (
                <EmptyState
                    icon="history"
                    title="No recent foods"
                    description="Foods you've used recently will appear here"
                />
            );
        }

        return null;
    };

    const getDataSource = () => {
        switch (activeTab) {
            case 'favorites':
                return favorites;
            case 'recent':
                return recentlyUsed;
            default:
                return searchResults;
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <Icon name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.title}>Search Foods</Text>
                <TouchableOpacity style={styles.barcodeButton} onPress={handleBarcodeScan}>
                    <Icon name="qr-code-scanner" size={24} color="#007AFF" />
                </TouchableOpacity>
            </View>

            {/* Search Bar */}
            <View style={styles.searchSection}>
                <SearchBar
                    placeholder="Search foods..."
                    value={searchQuery}
                    onChangeText={handleSearch}
                    onClear={() => {
                        dispatch(clearSearchResults());
                        dispatch(setSearchQuery(''));
                    }}
                />
            </View>

            {/* Category Filter */}
            {activeTab === 'search' && (
                <CategoryFilter
                    categories={FOOD_CATEGORIES}
                    selectedCategory={selectedCategory}
                    onCategorySelect={setSelectedCategory}
                />
            )}

            {/* Tabs */}
            <View style={styles.tabContainer}>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'search' && styles.activeTab]}
                    onPress={() => setActiveTab('search')}
                >
                    <Icon
                        name="search"
                        size={20}
                        color={activeTab === 'search' ? '#007AFF' : '#666'}
                    />
                    <Text style={[
                        styles.tabText,
                        activeTab === 'search' && styles.activeTabText
                    ]}>
                        Search
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.tab, activeTab === 'favorites' && styles.activeTab]}
                    onPress={() => setActiveTab('favorites')}
                >
                    <Icon
                        name="favorite"
                        size={20}
                        color={activeTab === 'favorites' ? '#007AFF' : '#666'}
                    />
                    <Text style={[
                        styles.tabText,
                        activeTab === 'favorites' && styles.activeTabText
                    ]}>
                        Favorites
                    </Text>
                    {favorites.length > 0 && (
                        <View style={styles.badge}>
                            <Text style={styles.badgeText}>{favorites.length}</Text>
                        </View>
                    )}
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.tab, activeTab === 'recent' && styles.activeTab]}
                    onPress={() => setActiveTab('recent')}
                >
                    <Icon
                        name="history"
                        size={20}
                        color={activeTab === 'recent' ? '#007AFF' : '#666'}
                    />
                    <Text style={[
                        styles.tabText,
                        activeTab === 'recent' && styles.activeTabText
                    ]}>
                        Recent
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Content */}
            <View style={styles.content}>
                {error && (
                    <View style={styles.errorBanner}>
                        <Icon name="error-outline" size={20} color="#FF5722" />
                        <Text style={styles.errorText}>{error}</Text>
                    </View>
                )}

                <FlatList
                    data={getDataSource()}
                    renderItem={renderFoodItem}
                    keyExtractor={(item) => `${item.id}-${activeTab}`}
                    contentContainerStyle={styles.listContainer}
                    ListEmptyComponent={!isSearching ? renderEmptyState() : null}
                    showsVerticalScrollIndicator={false}
                    ListHeaderComponent={
                        isSearching && (
                            <View style={styles.loadingHeader}>
                                <ActivityIndicator size="small" color="#007AFF" />
                                <Text style={styles.loadingText}>Searching...</Text>
                            </View>
                        )
                    }
                />
            </View>

            {/* Quick Actions */}
            <View style={styles.quickActions}>
                <TouchableOpacity
                    style={styles.quickAction}
                    onPress={() => navigation.navigate('Camera' as never)}
                >
                    <Icon name="camera-alt" size={20} color="#007AFF" />
                    <Text style={styles.quickActionText}>Scan Food</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.quickAction}
                    onPress={() => navigation.navigate('CreateFood' as never)}
                >
                    <Icon name="add" size={20} color="#007AFF" />
                    <Text style={styles.quickActionText}>Add Custom</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
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
    barcodeButton: {
        padding: 4,
    },
    searchSection: {
        backgroundColor: 'white',
        paddingHorizontal: 20,
        paddingBottom: 16,
    },
    tabContainer: {
        flexDirection: 'row',
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    tab: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        position: 'relative',
    },
    activeTab: {
        borderBottomWidth: 2,
        borderBottomColor: '#007AFF',
    },
    tabText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#666',
        marginLeft: 6,
    },
    activeTabText: {
        color: '#007AFF',
    },
    badge: {
        position: 'absolute',
        top: 8,
        right: 20,
        backgroundColor: '#FF3B30',
        borderRadius: 10,
        minWidth: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    badgeText: {
        color: 'white',
        fontSize: 12,
        fontWeight: 'bold',
    },
    content: {
        flex: 1,
    },
    errorBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFEBEE',
        paddingHorizontal: 16,
        paddingVertical: 12,
        marginHorizontal: 16,
        marginTop: 16,
        borderRadius: 8,
    },
    errorText: {
        color: '#FF5722',
        fontSize: 14,
        marginLeft: 8,
        flex: 1,
    },
    listContainer: {
        padding: 16,
        paddingBottom: 100, // Space for quick actions
    },
    loadingHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
    },
    loadingText: {
        marginLeft: 8,
        color: '#666',
        fontSize: 14,
    },
    quickActions: {
        position: 'absolute',
        bottom: 20,
        left: 20,
        right: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    quickAction: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'white',
        borderRadius: 12,
        paddingVertical: 16,
        marginHorizontal: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    quickActionText: {
        color: '#007AFF',
        fontSize: 14,
        fontWeight: '500',
        marginLeft: 6,
    },
});

export default FoodSearchScreen;
