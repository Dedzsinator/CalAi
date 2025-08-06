import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { MaterialIcons as Icon } from '@expo/vector-icons';

import { RootState, AppDispatch } from '../../store';
import { register } from '../../store/slices/authSlice';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

const RegisterScreen: React.FC = () => {
    const navigation = useNavigation();
    const dispatch = useDispatch<AppDispatch>();
    const { isLoading, error } = useSelector((state: RootState) => state.auth);

    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        confirmPassword: '',
        acceptTerms: false,
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isFormValid, setIsFormValid] = useState(false);

    React.useEffect(() => {
        const { firstName, lastName, email, password, confirmPassword, acceptTerms } = formData;
        setIsFormValid(
            firstName.length >= 2 &&
            lastName.length >= 2 &&
            email.includes('@') &&
            email.includes('.') &&
            password.length >= 6 &&
            password === confirmPassword &&
            acceptTerms
        );
    }, [formData]);

    const updateFormData = (field: string, value: string | boolean) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleRegister = async () => {
        if (!isFormValid) return;

        try {
            await dispatch(register({
                firstName: formData.firstName,
                lastName: formData.lastName,
                email: formData.email,
                password: formData.password,
                acceptTerms: formData.acceptTerms,
            })).unwrap();
            // Navigation will be handled by App.tsx based on auth state
        } catch (error: any) {
            Alert.alert('Registration Failed', error || 'Please try again.');
        }
    };

    const navigateToLogin = () => {
        navigation.navigate('Login' as never);
    };

    if (isLoading) {
        return (
            <SafeAreaView style={styles.container}>
                <LoadingSpinner />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardAvoid}
            >
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    {/* Header */}
                    <View style={styles.header}>
                        <View style={styles.logoContainer}>
                            <Icon name="restaurant" size={48} color="#007AFF" />
                        </View>
                        <Text style={styles.title}>Create Account</Text>
                        <Text style={styles.subtitle}>Join CalAi to start your nutrition journey</Text>
                    </View>

                    {/* Form */}
                    <View style={styles.form}>
                        <View style={styles.nameRow}>
                            <View style={[styles.inputContainer, styles.nameInput]}>
                                <Icon name="person" size={20} color="#666" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="First name"
                                    value={formData.firstName}
                                    onChangeText={(value) => updateFormData('firstName', value)}
                                    autoCapitalize="words"
                                    placeholderTextColor="#999"
                                />
                            </View>

                            <View style={[styles.inputContainer, styles.nameInput]}>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Last name"
                                    value={formData.lastName}
                                    onChangeText={(value) => updateFormData('lastName', value)}
                                    autoCapitalize="words"
                                    placeholderTextColor="#999"
                                />
                            </View>
                        </View>

                        <View style={styles.inputContainer}>
                            <Icon name="email" size={20} color="#666" style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="Email address"
                                value={formData.email}
                                onChangeText={(value) => updateFormData('email', value)}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                autoCorrect={false}
                                placeholderTextColor="#999"
                            />
                        </View>

                        <View style={styles.inputContainer}>
                            <Icon name="lock" size={20} color="#666" style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="Password (min. 6 characters)"
                                value={formData.password}
                                onChangeText={(value) => updateFormData('password', value)}
                                secureTextEntry={!showPassword}
                                autoCapitalize="none"
                                placeholderTextColor="#999"
                            />
                            <TouchableOpacity
                                style={styles.eyeIcon}
                                onPress={() => setShowPassword(!showPassword)}
                            >
                                <Icon
                                    name={showPassword ? "visibility-off" : "visibility"}
                                    size={20}
                                    color="#666"
                                />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.inputContainer}>
                            <Icon name="lock" size={20} color="#666" style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="Confirm password"
                                value={formData.confirmPassword}
                                onChangeText={(value) => updateFormData('confirmPassword', value)}
                                secureTextEntry={!showConfirmPassword}
                                autoCapitalize="none"
                                placeholderTextColor="#999"
                            />
                            <TouchableOpacity
                                style={styles.eyeIcon}
                                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                            >
                                <Icon
                                    name={showConfirmPassword ? "visibility-off" : "visibility"}
                                    size={20}
                                    color="#666"
                                />
                            </TouchableOpacity>
                        </View>

                        {formData.password !== formData.confirmPassword && formData.confirmPassword.length > 0 && (
                            <Text style={styles.errorText}>Passwords don't match</Text>
                        )}

                        <View style={styles.termsContainer}>
                            <TouchableOpacity
                                style={styles.checkbox}
                                onPress={() => updateFormData('acceptTerms', !formData.acceptTerms)}
                            >
                                <Icon
                                    name={formData.acceptTerms ? "check-box" : "check-box-outline-blank"}
                                    size={20}
                                    color={formData.acceptTerms ? "#007AFF" : "#999"}
                                />
                            </TouchableOpacity>
                            <View style={styles.termsTextContainer}>
                                <Text style={styles.termsText}>
                                    I agree to the{' '}
                                    <Text style={styles.linkText}>Terms of Service</Text>
                                    {' '}and{' '}
                                    <Text style={styles.linkText}>Privacy Policy</Text>
                                </Text>
                            </View>
                        </View>

                        <TouchableOpacity
                            style={[styles.registerButton, !isFormValid && styles.registerButtonDisabled]}
                            onPress={handleRegister}
                            disabled={!isFormValid || isLoading}
                        >
                            <Text style={[styles.registerButtonText, !isFormValid && styles.registerButtonTextDisabled]}>
                                Create Account
                            </Text>
                        </TouchableOpacity>

                        {error && (
                            <View style={styles.errorContainer}>
                                <Text style={styles.errorText}>{error}</Text>
                            </View>
                        )}
                    </View>

                    {/* Footer */}
                    <View style={styles.footer}>
                        <Text style={styles.footerText}>Already have an account? </Text>
                        <TouchableOpacity onPress={navigateToLogin}>
                            <Text style={styles.signInText}>Sign In</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    keyboardAvoid: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: 24,
    },
    header: {
        alignItems: 'center',
        marginBottom: 32,
    },
    logoContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#f0f8ff',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#1a1a1a',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        lineHeight: 22,
    },
    form: {
        marginBottom: 24,
    },
    nameRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    nameInput: {
        flex: 0.48,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#e0e0e0',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 4,
        marginBottom: 16,
        backgroundColor: '#f8f9fa',
    },
    inputIcon: {
        marginRight: 12,
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: '#333',
        paddingVertical: 16,
    },
    eyeIcon: {
        padding: 4,
    },
    termsContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 24,
    },
    checkbox: {
        marginRight: 12,
        marginTop: 2,
    },
    termsTextContainer: {
        flex: 1,
    },
    termsText: {
        fontSize: 14,
        color: '#666',
        lineHeight: 20,
    },
    linkText: {
        color: '#007AFF',
        fontWeight: '500',
    },
    registerButton: {
        backgroundColor: '#007AFF',
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    registerButtonDisabled: {
        backgroundColor: '#e0e0e0',
    },
    registerButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
    registerButtonTextDisabled: {
        color: '#999',
    },
    errorContainer: {
        backgroundColor: '#ffebee',
        borderRadius: 8,
        padding: 12,
        marginTop: 16,
    },
    errorText: {
        color: '#d32f2f',
        fontSize: 14,
        textAlign: 'center',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    footerText: {
        fontSize: 16,
        color: '#666',
    },
    signInText: {
        fontSize: 16,
        color: '#007AFF',
        fontWeight: '600',
    },
});

export default RegisterScreen;
