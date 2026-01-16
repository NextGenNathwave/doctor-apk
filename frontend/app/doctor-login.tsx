import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { authService } from '../src/services/api';
import api from '../src/services/api';
import { getLoginErrorMessage, getPasswordResetErrorMessage } from '../src/utils/errorHandler';

export default function DoctorLoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [isEmailValid, setIsEmailValid] = useState(true);
  const [isPasswordValid, setIsPasswordValid] = useState(true);

  const validateEmail = (text: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(text);
  };

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetEmailValid, setResetEmailValid] = useState(true);
  const [resetLoading, setResetLoading] = useState(false);

  // Load saved credentials on component mount
  useEffect(() => {
    loadSavedCredentials();
  }, []);

  const loadSavedCredentials = async () => {
    try {
      const savedEmail = await AsyncStorage.getItem('doctor_saved_email');
      const savedPassword = await AsyncStorage.getItem('doctor_saved_password');
      const savedRememberMe = await AsyncStorage.getItem('doctor_remember_me');
      
      if (savedRememberMe === 'true' && savedEmail && savedPassword) {
        setEmail(savedEmail);
        setPassword(savedPassword);
        setRememberMe(true);
      }
    } catch (error) {
      // Silently handle credential loading errors
    }
  };

  const handleLogin = async () => {
    const validEmail = validateEmail(email);
    const validPassword = password.length >= 6;
    
    setIsEmailValid(validEmail);
    setIsPasswordValid(validPassword);
    setErrorMessage('');
    
    if (validEmail && validPassword) {
      setIsLoading(true);
      try {
        // Call the login API
        await authService.doctorLogin(email, password);
        
        // Handle Remember Me functionality
        if (rememberMe) {
          // Save credentials
          await AsyncStorage.setItem('doctor_saved_email', email);
          await AsyncStorage.setItem('doctor_saved_password', password);
          await AsyncStorage.setItem('doctor_remember_me', 'true');
        } else {
          // Clear saved credentials
          await AsyncStorage.removeItem('doctor_saved_email');
          await AsyncStorage.removeItem('doctor_saved_password');
          await AsyncStorage.removeItem('doctor_remember_me');
        }
        
        // If successful, navigate to the doctor home page
        router.replace('/doctor-home');
      } catch (error: any) {
        // Handle different types of errors - production-friendly
        if (error.response && error.response.data && error.response.data.message) {
          setErrorMessage(error.response.data.message);
        } else if (error.response && error.response.status === 401) {
          setErrorMessage('Invalid email or password. Please try again.');
        } else if (error.response && error.response.status >= 500) {
          setErrorMessage('Server error. Please try again later.');
        } else if (!error.response) {
          setErrorMessage('Network error. Please check your connection.');
        } else {
          setErrorMessage('Login failed. Please try again.');
        }
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleForgotPassword = () => {
    setResetEmail(email); // Pre-fill with current email if any
    setResetEmailValid(true);
    setShowForgotPasswordModal(true);
  };

  const handleSendResetEmail = async () => {
    const valid = validateEmail(resetEmail);
    setResetEmailValid(valid);
    
    if (!valid) return;

    setResetLoading(true);
    try {
      const response = await api.post('/doctors/forgot-password', { email: resetEmail });
      
      // Close modal and navigate to reset password screen
      setShowForgotPasswordModal(false);
      
      Alert.alert(
        'Success',
        'Password reset code sent to your email! Check your inbox.',
        [
          {
            text: 'OK',
            onPress: () => router.push('/doctor-reset-password')
          }
        ]
      );
    } catch (error: any) {
      Alert.alert('Error', getPasswordResetErrorMessage(error));
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={['#0B1426', '#1A2332', '#000000']}
        locations={[0.0, 0.5, 1.0]}
        style={styles.background}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoidingView}
        >
          <ScrollView contentContainerStyle={styles.scrollView}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Image 
                source={require('../assets/images/left-arrow.png')} 
                style={styles.backButtonImage}
              />
            </TouchableOpacity>
            
            <View style={styles.headerContainer}>
              <Text style={styles.title}>Sign In</Text>
              <Image
                source={require('../assets/images/icon.png')}
                style={styles.logo}
                resizeMode="contain"
              />
              <Text style={styles.welcomeText}>Welcome to MediCare</Text>
              <Text style={styles.subtitle}>Enter your Email & Password to Sign in</Text>
            </View>
            
            <View style={styles.formContainer}>
              <View style={styles.inputWrapper}>
                <View style={styles.iconContainer}>
                  <Text style={styles.inputIcon}>✉️</Text>
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="doctor@example.com"
                  placeholderTextColor="#8E8E93"
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    setIsEmailValid(true);
                  }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                {isEmailValid && email.length > 0 && (
                  <View style={styles.checkmarkContainer}>
                    <Text style={styles.checkmark}>✓</Text>
                  </View>
                )}
              </View>
              {!isEmailValid && (
                <Text style={styles.errorText}>Please enter a valid email</Text>
              )}
              
              <View style={styles.inputWrapper}>
                <View style={styles.iconContainer}>
                  <Text style={styles.inputIcon}>🔒</Text>
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="••••••••••"
                  placeholderTextColor="#8E8E93"
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    setIsPasswordValid(true);
                  }}
                  secureTextEntry
                />
                {isPasswordValid && password.length > 0 && (
                  <View style={styles.checkmarkContainer}>
                    <Text style={styles.checkmark}>✓</Text>
                  </View>
                )}
              </View>
              {!isPasswordValid && (
                <Text style={styles.errorText}>Password must be at least 6 characters</Text>
              )}
              
              <View style={styles.rememberForgotRow}>
                <TouchableOpacity 
                  style={styles.rememberMeContainer}
                  onPress={() => setRememberMe(!rememberMe)}
                >
                  <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
                    {rememberMe && <Text style={styles.checkboxCheck}>✓</Text>}
                  </View>
                  <Text style={styles.rememberMeText}>Remember me</Text>
                </TouchableOpacity>
                
                <TouchableOpacity onPress={handleForgotPassword}>
                  <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                </TouchableOpacity>
              </View>
              
              {errorMessage ? (
                <Text style={styles.errorMessageText}>{errorMessage}</Text>
              ) : null}
              
              <TouchableOpacity 
                style={styles.loginButton}
                onPress={handleLogin}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#070B34" size="small" />
                ) : (
                  <Text style={styles.loginButtonText}>Sign in</Text>
                )}
              </TouchableOpacity>
              
              <View style={styles.registerContainer}>
                <Text style={styles.registerText}>Don't have an account? </Text>
                <TouchableOpacity onPress={() => router.push('/doctor-register')}>
                  <Text style={styles.registerLink}>Register</Text>
                </TouchableOpacity>
              </View>
              
              {/* Powered by Nathwave NexGen */}
              <View style={styles.poweredByContainer}>
                <Text style={styles.poweredByText}>
                  Powered by <Text style={styles.poweredByBrand}>Nathwave NexGen</Text>
                </Text>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>

        {/* Forgot Password Modal */}
        {showForgotPasswordModal && (
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <Text style={styles.modalTitle}>Reset Password</Text>
              <Text style={styles.modalSubtitle}>Enter your email address and we'll send you a password reset link.</Text>
              
              <View style={styles.modalInputWrapper}>
                <TextInput
                  style={[styles.modalInput, !resetEmailValid && styles.inputError]}
                  placeholder="Enter your email"
                  placeholderTextColor="#8E8E93"
                  value={resetEmail}
                  onChangeText={(text) => {
                    setResetEmail(text);
                    setResetEmailValid(true);
                  }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                {!resetEmailValid && (
                  <Text style={styles.errorText}>Please enter a valid email</Text>
                )}
              </View>
              
              <View style={styles.modalButtonsContainer}>
                <TouchableOpacity 
                  style={[styles.modalButton, styles.modalCancelButton]}
                  onPress={() => setShowForgotPasswordModal(false)}
                  disabled={resetLoading}
                >
                  <Text style={styles.modalCancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.modalButton, styles.modalSendButton]}
                  onPress={handleSendResetEmail}
                  disabled={resetLoading}
                >
                  {resetLoading ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text style={styles.modalSendButtonText}>Send Link</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    flex: 1,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollView: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 40,
  },
  backButton: {
    alignSelf: 'flex-start',
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  backButtonImage: {
    width: 20,
    height: 20,
    tintColor: 'white',
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    width: 100,
    height: 100,
    marginVertical: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 20,
    textAlign: 'center',
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#e0e0e0',
    textAlign: 'center',
    marginBottom: 30,
  },
  formContainer: {
    width: '100%',
  },
  inputWrapper: {
    flexDirection: 'row',
    borderRadius: 30,
    marginBottom: 16,
    alignItems: 'center',
    height: 56,
    backgroundColor: '#1A1F3D',// Darker input background like in the image
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  iconContainer: {
    paddingHorizontal: 16,
  },
  inputIcon: {
    fontSize: 18,
  },
  input: {
    flex: 1,
    color: 'white',
    fontSize: 16,
    height: '100%',
  },
  checkmarkContainer: {
    paddingHorizontal: 16,
  },
  checkmark: {
    color: '#4CD964',
    fontSize: 16,
  },
  errorText: {
    color: '#FF3B30',
    marginTop: -8,
    marginBottom: 16,
    marginLeft: 16,
    fontSize: 12,
  },
  errorMessageText: {
    color: '#FF3B30',
    textAlign: 'center',
    marginBottom: 16,
    fontSize: 14,
  },
  rememberForgotRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  rememberMeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#8E8E93',
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  checkboxCheck: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  rememberMeText: {
    color: '#8E8E93',
    fontSize: 14,
  },
  forgotPasswordText: {
    color: '#f8fbfdff',
    fontSize: 14,
  },
  loginButton: {
    backgroundColor: '#E9EAEB',
    borderRadius: 30,
    padding: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  loginButtonText: {
    color: '#050A30',
    fontSize: 16,
    fontWeight: 'bold',
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 10,
  },
  registerText: {
    color: '#8E8E93',
    fontSize: 14,
  },
  registerLink: {
    color: '#fdfeffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  inputError: {
    borderColor: '#FF3B30',
    borderWidth: 1,
  },
  // Forgot Password Modal Styles
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: '#1C1C1E',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 12,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 20,
  },
  modalInputWrapper: {
    marginBottom: 20,
  },
  modalInput: {
    backgroundColor: '#2C2C2E',
    borderRadius: 12,
    padding: 16,
    color: 'white',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#3A3A3C',
  },
  modalButtonsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalCancelButton: {
    backgroundColor: '#2C2C2E',
    borderWidth: 1,
    borderColor: '#3A3A3C',
  },
  modalCancelButtonText: {
    color: '#8E8E93',
    fontSize: 16,
    fontWeight: '600',
  },
  modalSendButton: {
    backgroundColor: '#3498db',
  },
  modalSendButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  poweredByContainer: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 10,
  },
  poweredByText: {
    color: '#8E8E93',
    fontSize: 12,
  },
  poweredByBrand: {
    color: '#3498db',
    fontWeight: 'bold',
  },
});
