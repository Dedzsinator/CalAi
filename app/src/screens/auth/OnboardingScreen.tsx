import React, { useState, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Dimensions,
    TouchableOpacity,
    Image,
    Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useDispatch } from 'react-redux';
import { MaterialIcons as Icon } from '@expo/vector-icons';

import { AppDispatch } from '../../store';
import { setFirstLaunch } from '../../store/slices/authSlice';

const { width, height } = Dimensions.get('window');

interface OnboardingStep {
    id: number;
    title: string;
    description: string;
    icon: keyof typeof Icon.glyphMap;
    color: string;
}

const onboardingSteps: OnboardingStep[] = [
    {
        id: 1,
        title: 'Track Your Nutrition',
        description: 'Use AI-powered food recognition to log meals instantly. Just take a photo and let our smart technology do the rest.',
        icon: 'camera-alt',
        color: '#4CAF50',
    },
    {
        id: 2,
        title: 'Privacy First',
        description: 'Your data stays on your device. We process everything locally using advanced AI models for complete privacy.',
        icon: 'security',
        color: '#2196F3',
    },
    {
        id: 3,
        title: 'Smart Insights',
        description: 'Get personalized nutrition insights and recommendations based on your eating patterns and health goals.',
        icon: 'insights',
        color: '#FF9800',
    },
    {
        id: 4,
        title: 'Ready to Start?',
        description: 'Join thousands of users who are already improving their health with CalAi. Start your journey today!',
        icon: 'play-arrow',
        color: '#9C27B0',
    },
];

const OnboardingScreen: React.FC = () => {
    const navigation = useNavigation();
    const dispatch = useDispatch<AppDispatch>();
    const [currentStep, setCurrentStep] = useState(0);
    const fadeAnim = useRef(new Animated.Value(1)).current;
    const slideAnim = useRef(new Animated.Value(0)).current;

    const animateTransition = (callback: () => void) => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: -50,
                duration: 200,
                useNativeDriver: true,
            }),
        ]).start(() => {
            callback();
            slideAnim.setValue(50);
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }),
                Animated.timing(slideAnim, {
                    toValue: 0,
                    duration: 300,
                    useNativeDriver: true,
                }),
            ]).start();
        });
    };

    const handleNext = () => {
        if (currentStep < onboardingSteps.length - 1) {
            animateTransition(() => {
                setCurrentStep(currentStep + 1);
            });
        } else {
            handleGetStarted();
        }
    };

    const handlePrevious = () => {
        if (currentStep > 0) {
            animateTransition(() => {
                setCurrentStep(currentStep - 1);
            });
        }
    };

    const handleSkip = () => {
        handleGetStarted();
    };

    const handleGetStarted = () => {
        dispatch(setFirstLaunch(false));
        navigation.navigate('Login' as never);
    };

    const currentStepData = onboardingSteps[currentStep];

    return (
        <SafeAreaView style={styles.container}>
            {/* Skip Button */}
            {currentStep < onboardingSteps.length - 1 && (
                <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
                    <Text style={styles.skipText}>Skip</Text>
                </TouchableOpacity>
            )}

            {/* Progress Indicators */}
            <View style={styles.progressContainer}>
                {onboardingSteps.map((_, index) => (
                    <View
                        key={index}
                        style={[
                            styles.progressDot,
                            index === currentStep && styles.progressDotActive,
                            { backgroundColor: index === currentStep ? currentStepData.color : '#e0e0e0' }
                        ]}
                    />
                ))}
            </View>

            {/* Content */}
            <Animated.View
                style={[
                    styles.content,
                    {
                        opacity: fadeAnim,
                        transform: [{ translateY: slideAnim }],
                    }
                ]}
            >
                <View
                    style={[
                        styles.iconContainer,
                        { backgroundColor: `${currentStepData.color}20` }
                    ]}
                >
                    <Icon
                        name={currentStepData.icon}
                        size={80}
                        color={currentStepData.color}
                    />
                </View>

                <Text style={styles.title}>{currentStepData.title}</Text>
                <Text style={styles.description}>{currentStepData.description}</Text>
            </Animated.View>

            {/* Navigation Buttons */}
            <View style={styles.navigationContainer}>
                {currentStep > 0 && (
                    <TouchableOpacity style={styles.backButton} onPress={handlePrevious}>
                        <Icon name="arrow-back" size={24} color="#666" />
                        <Text style={styles.backButtonText}>Back</Text>
                    </TouchableOpacity>
                )}

                <View style={styles.spacer} />

                <TouchableOpacity
                    style={[
                        styles.nextButton,
                        { backgroundColor: currentStepData.color }
                    ]}
                    onPress={handleNext}
                >
                    <Text style={styles.nextButtonText}>
                        {currentStep === onboardingSteps.length - 1 ? 'Get Started' : 'Next'}
                    </Text>
                    <Icon name="arrow-forward" size={24} color="white" />
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        paddingHorizontal: 24,
    },
    skipButton: {
        alignSelf: 'flex-end',
        paddingVertical: 12,
        paddingHorizontal: 16,
        marginTop: 16,
    },
    skipText: {
        fontSize: 16,
        color: '#666',
        fontWeight: '500',
    },
    progressContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 32,
        marginBottom: 60,
    },
    progressDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginHorizontal: 4,
    },
    progressDotActive: {
        width: 24,
        height: 8,
        borderRadius: 4,
    },
    content: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 24,
    },
    iconContainer: {
        width: 160,
        height: 160,
        borderRadius: 80,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 48,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#1a1a1a',
        textAlign: 'center',
        marginBottom: 16,
    },
    description: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        lineHeight: 24,
        maxWidth: width * 0.8,
    },
    navigationContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingBottom: 32,
        paddingTop: 16,
    },
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
    },
    backButtonText: {
        fontSize: 16,
        color: '#666',
        marginLeft: 8,
        fontWeight: '500',
    },
    spacer: {
        flex: 1,
    },
    nextButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 24,
        borderRadius: 12,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    nextButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
        marginRight: 8,
    },
});

export default OnboardingScreen;
