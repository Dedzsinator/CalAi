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
import { login } from '../../store/slices/authSlice';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

const LoginScreen: React.FC = () => {
    const navigation = useNavigation();
    const dispatch = useDispatch<AppDispatch>();
    const { isLoading, error } = useSelector((state: RootState) => state.auth);

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isFormValid, setIsFormValid] = useState(false);

    React.useEffect(() => {
        setIsFormValid(
            email.includes('@') &&
            email.includes('.') &&
            password.length >= 6
        );
    }, [email, password]);

    const handleLogin = async () => {
        if (!isFormValid) return;

        try {
            await dispatch(login({ email, password })).unwrap();
            // Navigation will be handled by App.tsx based on auth state
        } catch (error: any) {
            Alert.alert('Login Failed', error || 'Please check your credentials and try again.');
        }
    };

    const navigateToRegister = () => {
        navigation.navigate('Register' as never);
    };

    const handleForgotPassword = () => {
        Alert.alert(
            'Forgot Password',
            'Password reset functionality will be available soon.',
            [{ text: 'OK' }]
        );
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
                        <Text style={styles.title}>Welcome Back</Text>
                        <Text style={styles.subtitle}>Sign in to continue tracking your nutrition</Text>
                    </View>

                    {/* Form */}
                    <View style={styles.form}>
                        <View style={styles.inputContainer}>
                            <Icon name="email" size={20} color="#666" style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="Email address"
                                value={email}
                                onChangeText={setEmail}
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
                                placeholder="Password"
                                value={password}
                                onChangeText={setPassword}
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

                        <TouchableOpacity
                            style={styles.forgotPassword}
                            onPress={handleForgotPassword}
                        >
                            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.loginButton, !isFormValid && styles.loginButtonDisabled]}
                            onPress={handleLogin}
                            disabled={!isFormValid || isLoading}
                        >
                            <Text style={[styles.loginButtonText, !isFormValid && styles.loginButtonTextDisabled]}>
                                Sign In
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
                        <Text style={styles.footerText}>Don't have an account? </Text>
                        <TouchableOpacity onPress={navigateToRegister}>
                            <Text style={styles.signUpText}>Sign Up</Text>
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
        marginBottom: 40,
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
        marginBottom: 32,
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
    forgotPassword: {
        alignSelf: 'flex-end',
        marginBottom: 24,
    },
    forgotPasswordText: {
        color: '#007AFF',
        fontSize: 14,
        fontWeight: '500',
    },
    loginButton: {
        backgroundColor: '#007AFF',
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    loginButtonDisabled: {
        backgroundColor: '#e0e0e0',
    },
    loginButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
    loginButtonTextDisabled: {
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
    signUpText: {
        fontSize: 16,
        color: '#007AFF',
        fontWeight: '600',
    },
});

export default LoginScreen;
