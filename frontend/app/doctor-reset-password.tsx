import React, { useState } from 'react';
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
import { router } from 'expo-router';
import api from '../src/services/api';
import { getPasswordResetErrorMessage } from '../src/utils/errorHandler';
import {LinearGradient} from 'expo-linear-gradient';

export default function DoctorResetPasswordScreen() {
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleResetPassword = async () => {
    // Validation
    if (!resetCode.trim()) {
      Alert.alert('Error', 'Please enter the reset code from your email');
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    setIsLoading(true);
    try {
      const endpoint = `/doctors/reset-password/${resetCode.trim()}`;
      const response = await api.post(endpoint, { password: newPassword });

      Alert.alert(
        'Success',
        'Password reset successful! You can now login with your new password.',
        [
          {
            text: 'OK',
            onPress: () => router.replace('/doctor-login')
          }
        ]
      );
    } catch (error: any) {
      Alert.alert('Error', getPasswordResetErrorMessage(error));
    } finally {
      setIsLoading(false);
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
              <Image
                source={require('../assets/images/icon.png')}
                style={styles.logo}
                resizeMode="contain"
              />
              <Text style={styles.title}>Reset Password</Text>
              <Text style={styles.subtitle}>Doctor Account</Text>
              <Text style={styles.description}>Enter the code from your email and create a new password</Text>
            </View>
            
            <View style={styles.formContainer}>
              {/* Reset Code Input */}
              <View style={styles.inputWrapper}>
                <View style={styles.iconContainer}>
                  <Text style={styles.inputIcon}>🔑</Text>
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="Enter reset code from email"
                  placeholderTextColor="#8E8E93"
                  value={resetCode}
                  onChangeText={setResetCode}
                  autoCapitalize="characters"
                  autoCorrect={false}
                />
              </View>

              {/* New Password Input */}
              <View style={styles.inputWrapper}>
                <View style={styles.iconContainer}>
                  <Text style={styles.inputIcon}>🔒</Text>
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="New password (min 6 char)"
                  placeholderTextColor="#8E8E93"
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity 
                  style={styles.eyeButton}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Text style={styles.eyeIcon}>{showPassword ? '👁️' : '👁️‍🗨️'}</Text>
                </TouchableOpacity>
              </View>

              {/* Confirm Password Input */}
              <View style={styles.inputWrapper}>
                <View style={styles.iconContainer}>
                  <Text style={styles.inputIcon}>🔒</Text>
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="Confirm new password"
                  placeholderTextColor="#8E8E93"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity 
                  style={styles.eyeButton}
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  <Text style={styles.eyeIcon}>{showConfirmPassword ? '👁️' : '👁️‍🗨️'}</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity 
                style={styles.resetButton}
                onPress={handleResetPassword}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={styles.resetButtonText}>Reset Password</Text>
                )}
              </TouchableOpacity>
              
              {/* Powered by Nathwave NexGen */}
              <View style={styles.poweredByContainer}>
                <Text style={styles.poweredByText}>
                  Powered by <Text style={styles.poweredByBrand}>Nathwave NexGen</Text>
                </Text>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
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
    backgroundColor: '#070B34',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollView: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
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
    width: 80,
    height: 80,
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 18,
    color: '#4CD964',
    fontWeight: '600',
    marginBottom: 10,
  },
  description: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  formContainer: {
    flex: 1,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    marginBottom: 16,
     backgroundColor: '#1A1F3D',// Darker input background like in the image
    borderWidth: 1,
    borderColor: '#CBD5E1',
    height: 56,
  },
  iconContainer: {
    width: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputIcon: {
    fontSize: 20,
  },
  input: {
    flex: 1,
    color: 'white',
    fontSize: 16,
    height: '100%',
  },
  eyeButton: {
    paddingHorizontal: 16,
  },
  eyeIcon: {
    fontSize: 20,
  },
  resetButton: {
    backgroundColor: '#ffffffff',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 20,
  },
  resetButtonText: {
    color: 'black',
    fontSize: 18,
    fontWeight: 'bold',
  },
  helpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 5,
  },
  helpText: {
    color: '#8E8E93',
    fontSize: 14,
  },
  helpLink: {
    color: '#ffffffff',
    fontSize: 14,
    fontWeight: '600',
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
