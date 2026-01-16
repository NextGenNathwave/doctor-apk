import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';

/**
 * Redirects user to the appropriate home page based on user type
 */
export const redirectToHomePage = async () => {
  try {
    const userType = await AsyncStorage.getItem('userType');
    
    if (userType === 'doctor') {
      router.replace('/doctor-home');
    } else if (userType === 'patient') {
      router.replace('/patient-home');
    } else {
      // If no user type is found, redirect to welcome screen
      router.replace('/');
    }
  } catch (error) {
    // Default to welcome screen on error
    router.replace('/');
  }
};

/**
 * Checks if user is authenticated and returns user type
 * @returns {Promise<string|null>} User type ('doctor', 'patient') or null if not authenticated
 */
export const checkAuth = async () => {
  try {
    const token = await AsyncStorage.getItem('token');
    if (!token) return null;
    
    const userType = await AsyncStorage.getItem('userType');
    return userType;
  } catch (error) {
    return null;
  }
};

/**
 * Gets user data from AsyncStorage
 * @returns {Promise<Object|null>} User data or null if not found
 */
export const getUserData = async () => {
  try {
    const userData = await AsyncStorage.getItem('userData');
    return userData ? JSON.parse(userData) : null;
  } catch (error) {
    return null;
  }
};

/**
 * Updates user data in AsyncStorage
 * @param {Object} userData - The user data to store
 * @returns {Promise<boolean>} True if successful, false otherwise
 */
export const updateUserData = async (userData) => {
  try {
    await AsyncStorage.setItem('userData', JSON.stringify(userData));
    return true;
  } catch (error) {
    return false;
  }
};
