import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Alert,
    Platform,
    Dimensions,
    StatusBar,
    ActivityIndicator,
} from 'react-native';
import { Camera, useCameraDevices } from 'react-native-vision-camera';
import { useIsFocused } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialIcons';
import * as Animatable from 'react-native-animatable';
import HapticFeedback from 'react-native-haptic-feedback';

// Services and Utils
import { analyzeFood } from '../../services/ai/foodRecognition';
import { createMeal } from '../../store/slices/mealsSlice';
import { useAppTheme } from '../../hooks/useAppTheme';
import { requestCameraPermission } from '../../utils/permissions';

// Types
import { RootState } from '../../store';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface CameraScreenProps {
    navigation: any;
}

const CameraScreen: React.FC<CameraScreenProps> = ({ navigation }) => {
    const dispatch = useDispatch();
    const { colors } = useAppTheme();
    const isFocused = useIsFocused();

    // Camera state
    const camera = useRef<Camera>(null);
    const devices = useCameraDevices();
    const device = devices.back;

    // Component state
    const [hasPermission, setHasPermission] = useState(false);
    const [isCapturing, setIsCapturing] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [flashMode, setFlashMode] = useState<'off' | 'on'>('off');
    const [analysisResult, setAnalysisResult] = useState<any>(null);

    // Redux state
    const { user } = useSelector((state: RootState) => state.auth);
    const { isOffline } = useSelector((state: RootState) => state.settings);

    useEffect(() => {
        checkCameraPermission();
    }, []);

    const checkCameraPermission = async () => {
        try {
            const granted = await requestCameraPermission();
            setHasPermission(granted);

            if (!granted) {
                Alert.alert(
                    'Camera Permission Required',
                    'Please grant camera permission to scan food items.',
                    [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'Settings', onPress: () => {/* Open settings */ } },
                    ]
                );
            }
        } catch (error) {
            console.error('Camera permission error:', error);
            setHasPermission(false);
        }
    };

    const capturePhoto = async () => {
        if (!camera.current || isCapturing) return;

        try {
            setIsCapturing(true);
            HapticFeedback.trigger('impactMedium');

            const photo = await camera.current.takePhoto({
                quality: 0.8,
                enableAutoStabilization: true,
                enableAutoRedEyeReduction: true,
            });

            console.log('Photo captured:', photo.path);

            // Start AI analysis
            await analyzePhoto(photo.path);

        } catch (error) {
            console.error('Failed to capture photo:', error);
            Alert.alert('Error', 'Failed to capture photo. Please try again.');
        } finally {
            setIsCapturing(false);
        }
    };

    const analyzePhoto = async (imagePath: string) => {
        try {
            setIsAnalyzing(true);

            // Analyze image with AI
            const analysis = await analyzeFood(imagePath, {
                includeNutrition: true,
                confidenceThreshold: 0.6,
                maxResults: 5,
            });

            if (analysis.foods && analysis.foods.length > 0) {
                setAnalysisResult(analysis);

                // Navigate to meal creation with analysis results
                navigation.navigate('MealDetail', {
                    analysis,
                    imagePath,
                    isNewMeal: true,
                });
            } else {
                Alert.alert(
                    'No Food Detected',
                    'We couldn\'t identify any food in this image. Try taking another photo with better lighting.',
                    [
                        { text: 'Try Again', onPress: () => setAnalysisResult(null) },
                        { text: 'Manual Entry', onPress: () => navigation.navigate('FoodSearch') },
                    ]
                );
            }

        } catch (error) {
            console.error('Food analysis error:', error);

            if (isOffline) {
                Alert.alert(
                    'Offline Mode',
                    'AI analysis requires internet connection. Your photo has been saved and will be processed when you\'re online.',
                    [
                        { text: 'OK', onPress: () => saveOfflinePhoto(imagePath) },
                    ]
                );
            } else {
                Alert.alert(
                    'Analysis Failed',
                    'Failed to analyze the image. Please check your internet connection and try again.',
                    [
                        { text: 'Retry', onPress: () => analyzePhoto(imagePath) },
                        { text: 'Manual Entry', onPress: () => navigation.navigate('FoodSearch') },
                    ]
                );
            }
        } finally {
            setIsAnalyzing(false);
        }
    };

    const saveOfflinePhoto = async (imagePath: string) => {
        // Save photo for later processing when online
        // This would integrate with the offline queue system
        console.log('Saving photo for offline processing:', imagePath);
    };

    const toggleFlash = () => {
        setFlashMode(flashMode === 'off' ? 'on' : 'off');
        HapticFeedback.trigger('impactLight');
    };

    const openGallery = () => {
        // TODO: Implement gallery picker
        console.log('Opening gallery...');
    };

    if (!hasPermission) {
        return (
            <View style={[styles.container, styles.centered, { backgroundColor: colors.background }]}>
                <Icon name="camera-alt" size={64} color={colors.textSecondary} />
                <Text style={[styles.permissionText, { color: colors.text }]}>
                    Camera permission is required to scan food
                </Text>
                <TouchableOpacity
                    style={[styles.permissionButton, { backgroundColor: colors.primary }]}
                    onPress={checkCameraPermission}>
                    <Text style={[styles.permissionButtonText, { color: colors.surface }]}>
                        Grant Permission
                    </Text>
                </TouchableOpacity>
            </View>
        );
    }

    if (!device) {
        return (
            <View style={[styles.container, styles.centered, { backgroundColor: colors.background }]}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={[styles.loadingText, { color: colors.text }]}>
                    Loading camera...
                </Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

            {isFocused && (
                <Camera
                    ref={camera}
                    style={styles.camera}
                    device={device}
                    isActive={true}
                    photo={true}
                    enableZoomGesture={true}
                />
            )}

            {/* Analysis Overlay */}
            {isAnalyzing && (
                <View style={styles.analysisOverlay}>
                    <Animatable.View
                        animation="pulse"
                        iterationCount="infinite"
                        style={styles.analysisIndicator}>
                        <ActivityIndicator size="large" color={colors.surface} />
                        <Text style={[styles.analysisText, { color: colors.surface }]}>
                            Analyzing food...
                        </Text>
                    </Animatable.View>
                </View>
            )}

            {/* Camera Controls */}
            <View style={styles.controlsContainer}>
                {/* Top Controls */}
                <View style={styles.topControls}>
                    <TouchableOpacity
                        style={styles.controlButton}
                        onPress={() => navigation.goBack()}>
                        <Icon name="close" size={24} color="white" />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.controlButton, flashMode === 'on' && styles.activeControl]}
                        onPress={toggleFlash}>
                        <Icon
                            name={flashMode === 'off' ? 'flash-off' : 'flash-on'}
                            size={24}
                            color="white"
                        />
                    </TouchableOpacity>
                </View>

                {/* Bottom Controls */}
                <View style={styles.bottomControls}>
                    <TouchableOpacity
                        style={styles.secondaryButton}
                        onPress={openGallery}>
                        <Icon name="photo-library" size={28} color="white" />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.captureButton, isCapturing && styles.capturingButton]}
                        onPress={capturePhoto}
                        disabled={isCapturing || isAnalyzing}>
                        {isCapturing ? (
                            <ActivityIndicator size="large" color="white" />
                        ) : (
                            <View style={styles.captureButtonInner} />
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.secondaryButton}
                        onPress={() => navigation.navigate('FoodSearch')}>
                        <Icon name="search" size={28} color="white" />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Scanning Guide */}
            <View style={styles.scanGuide}>
                <Text style={styles.scanGuideText}>
                    Point camera at food and tap capture
                </Text>
                <Text style={styles.scanGuideSubtext}>
                    Make sure food is well-lit and in focus
                </Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'black',
    },
    centered: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    camera: {
        flex: 1,
    },
    permissionText: {
        fontSize: 18,
        textAlign: 'center',
        marginTop: 20,
        marginHorizontal: 40,
    },
    permissionButton: {
        marginTop: 30,
        paddingHorizontal: 30,
        paddingVertical: 15,
        borderRadius: 25,
    },
    permissionButtonText: {
        fontSize: 16,
        fontWeight: '600',
    },
    loadingText: {
        fontSize: 16,
        marginTop: 15,
    },
    analysisOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    analysisIndicator: {
        alignItems: 'center',
    },
    analysisText: {
        fontSize: 18,
        fontWeight: '600',
        marginTop: 15,
    },
    controlsContainer: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'space-between',
    },
    topControls: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingTop: Platform.OS === 'ios' ? 50 : 30,
        paddingHorizontal: 20,
    },
    bottomControls: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        paddingBottom: Platform.OS === 'ios' ? 40 : 30,
        paddingHorizontal: 20,
    },
    controlButton: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    activeControl: {
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
    },
    captureButton: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 4,
        borderColor: 'white',
    },
    capturingButton: {
        backgroundColor: 'rgba(255, 255, 255, 0.5)',
    },
    captureButtonInner: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: 'white',
    },
    secondaryButton: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    scanGuide: {
        position: 'absolute',
        top: '45%',
        left: 0,
        right: 0,
        alignItems: 'center',
    },
    scanGuideText: {
        color: 'white',
        fontSize: 18,
        fontWeight: '600',
        textAlign: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 20,
    },
    scanGuideSubtext: {
        color: 'rgba(255, 255, 255, 0.8)',
        fontSize: 14,
        textAlign: 'center',
        marginTop: 10,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        paddingHorizontal: 15,
        paddingVertical: 5,
        borderRadius: 15,
    },
});

export default CameraScreen;
