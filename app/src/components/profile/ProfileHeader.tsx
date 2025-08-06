import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface User {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    heightCm?: number;
    weightKg?: number;
    dailyCalorieGoal?: number;
    streakDays: number;
    totalMealsLogged: number;
}

interface ProfileHeaderProps {
    user: User;
    profileImageUri?: string;
    onEditProfile: () => void;
    onEditPhoto: () => void;
}

const ProfileHeader: React.FC<ProfileHeaderProps> = ({
    user,
    profileImageUri,
    onEditProfile,
    onEditPhoto
}) => {
    const getInitials = () => {
        return `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase();
    };

    const renderProfileImage = () => {
        if (profileImageUri) {
            return (
                <Image source={{ uri: profileImageUri }} style={styles.profileImage} />
            );
        }

        return (
            <View style={styles.profileImagePlaceholder}>
                <Text style={styles.initialsText}>{getInitials()}</Text>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.imageContainer}>
                {renderProfileImage()}
                <TouchableOpacity style={styles.editPhotoButton} onPress={onEditPhoto}>
                    <Ionicons name="camera" size={16} color="#fff" />
                </TouchableOpacity>
            </View>

            <View style={styles.userInfo}>
                <Text style={styles.userName}>
                    {user.firstName} {user.lastName}
                </Text>
                <Text style={styles.userEmail}>{user.email}</Text>

                {(user.heightCm || user.weightKg) && (
                    <View style={styles.physicalStats}>
                        {user.heightCm && (
                            <Text style={styles.statText}>
                                {Math.round(user.heightCm)}cm
                            </Text>
                        )}
                        {user.weightKg && (
                            <Text style={styles.statText}>
                                {user.weightKg.toFixed(1)}kg
                            </Text>
                        )}
                    </View>
                )}
            </View>

            <TouchableOpacity style={styles.editButton} onPress={onEditProfile}>
                <Ionicons name="pencil" size={18} color="#2196F3" />
            </TouchableOpacity>

            <View style={styles.statsContainer}>
                <View style={styles.statItem}>
                    <Text style={styles.statNumber}>{user.streakDays}</Text>
                    <Text style={styles.statLabel}>Day Streak</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                    <Text style={styles.statNumber}>{user.totalMealsLogged}</Text>
                    <Text style={styles.statLabel}>Meals Logged</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                    <Text style={styles.statNumber}>
                        {user.dailyCalorieGoal ? Math.round(user.dailyCalorieGoal) : '-'}
                    </Text>
                    <Text style={styles.statLabel}>Daily Goal</Text>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#fff',
        padding: 20,
        paddingTop: 60,
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    imageContainer: {
        position: 'relative',
        marginBottom: 16,
    },
    profileImage: {
        width: 100,
        height: 100,
        borderRadius: 50,
    },
    profileImagePlaceholder: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#2196F3',
        justifyContent: 'center',
        alignItems: 'center',
    },
    initialsText: {
        fontSize: 36,
        fontWeight: 'bold',
        color: '#fff',
    },
    editPhotoButton: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#2196F3',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#fff',
    },
    userInfo: {
        alignItems: 'center',
        marginBottom: 16,
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
        marginBottom: 8,
    },
    physicalStats: {
        flexDirection: 'row',
        gap: 16,
    },
    statText: {
        fontSize: 14,
        color: '#666',
        backgroundColor: '#f5f5f5',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
    },
    editButton: {
        position: 'absolute',
        top: 70,
        right: 20,
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#f5f5f5',
        justifyContent: 'center',
        alignItems: 'center',
    },
    statsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
        borderRadius: 12,
        paddingVertical: 16,
        paddingHorizontal: 20,
        width: '100%',
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
    statDivider: {
        width: 1,
        height: 40,
        backgroundColor: '#e0e0e0',
        marginHorizontal: 16,
    },
});

export default ProfileHeader;
