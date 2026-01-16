import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Base URL for API calls - Production EC2 Server
// const API_URL = 'http://3.110.119.108:5000/api'; // Production EC2 server/
const API_URL = 'http://192.168.0.103:5000/api'; // For local development
// const API_URL = 'http://localhost:5000/api'; // For iOS simulator

// Create axios instance with base URL
const api = axios.create({
  baseURL: API_URL,
  timeout: 10000, // 10 second timeout to prevent hanging requests
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to add auth token to requests
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle network errors gracefully
    if (!error.response) {
      console.log('Network error detected - server unreachable');
      // You could dispatch to a global state manager here
      // or set a flag in AsyncStorage to show offline mode
      AsyncStorage.setItem('networkStatus', 'offline');
    } else {
      AsyncStorage.setItem('networkStatus', 'online');
    }
    return Promise.reject(error);
  }
);

// Auth services
export const authService = {
  // Doctor authentication
  doctorLogin: async (email, password) => {
    const response = await api.post('/doctors/login', { email, password });
    if (response.data.token) {
      await AsyncStorage.setItem('token', response.data.token);
      await AsyncStorage.setItem('userType', 'doctor');
      await AsyncStorage.setItem('userData', JSON.stringify(response.data.data));
    }
    return response.data;
  },

  doctorRegister: async (formData) => {
    // For doctor registration, we need to use FormData for file uploads
    console.log('Doctor registration formData:', formData);
    const data = new FormData();
    
    // Add text fields
    Object.keys(formData).forEach(key => {
      if (key !== 'profileImage' && key !== 'governmentId' && key !== 'medicalLicense' && key !== 'signature') {
        // Handle coordinates object by converting to JSON string
        if (key === 'clinicCoordinates' && formData[key]) {
          data.append(key, JSON.stringify(formData[key]));
        } else if (formData[key] !== null && formData[key] !== undefined) {
          data.append(key, formData[key]);
        }
      }
    });
    
    // Add file fields
    if (formData.profileImage) {
      const uriParts = formData.profileImage.split('.');
      const fileType = uriParts[uriParts.length - 1];
      
      data.append('profileImage', {
        uri: formData.profileImage,
        name: `profileImage.${fileType}`,
        type: `image/${fileType}`,
      });
    }
    
    if (formData.governmentId) {
      const uriParts = formData.governmentId.split('.');
      const fileType = uriParts[uriParts.length - 1];
      
      data.append('governmentId', {
        uri: formData.governmentId,
        name: `governmentId.${fileType}`,
        type: `image/${fileType}`,
      });
    }
    
    if (formData.medicalLicense) {
      const uriParts = formData.medicalLicense.split('.');
      const fileType = uriParts[uriParts.length - 1];
      
      data.append('medicalLicense', {
        uri: formData.medicalLicense,
        name: `medicalLicense.${fileType}`,
        type: `image/${fileType}`,
      });
    }
    
    if (formData.signature) {
      const uriParts = formData.signature.split('.');
      const fileType = uriParts[uriParts.length - 1];
      
      data.append('signature', {
        uri: formData.signature,
        name: `signature.${fileType}`,
        type: `image/${fileType}`,
      });
    }
    
    console.log('Sending FormData to backend...');
    const response = await api.post('/doctors/register', data, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    if (response.data.token) {
      await AsyncStorage.setItem('token', response.data.token);
      await AsyncStorage.setItem('userType', 'doctor');
      await AsyncStorage.setItem('userData', JSON.stringify(response.data.data));
    }
    
    return response.data;
  },

  // Patient authentication
  patientLogin: async (email, password) => {
    const response = await api.post('/patients/login', { email, password });
    if (response.data.token) {
      await AsyncStorage.setItem('token', response.data.token);
      await AsyncStorage.setItem('userType', 'patient');
      await AsyncStorage.setItem('userData', JSON.stringify(response.data.data));
    }
    return response.data;
  },

  patientRegister: async (formData) => {
    const response = await api.post('/patients/register', formData);
    if (response.data.token) {
      await AsyncStorage.setItem('token', response.data.token);
      await AsyncStorage.setItem('userType', 'patient');
      await AsyncStorage.setItem('userData', JSON.stringify(response.data.data));
    }
    return response.data;
  },

  // Logout (works for both doctor and patient)
  logout: async () => {
    const userType = await AsyncStorage.getItem('userType');
    if (userType) {
      await api.get(`/${userType}s/logout`);
    }
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('userType');
    await AsyncStorage.removeItem('userData');
  },

  // Check if user is logged in
  isLoggedIn: async () => {
    const token = await AsyncStorage.getItem('token');
    return !!token;
  },

  // Get user type (doctor or patient)
  getUserType: async () => {
    return await AsyncStorage.getItem('userType');
  },

  // Get user data
  getUserData: async () => {
    const userData = await AsyncStorage.getItem('userData');
    return userData ? JSON.parse(userData) : null;
  },
};

export default api;
