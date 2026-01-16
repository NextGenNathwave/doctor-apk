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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { Picker } from '@react-native-picker/picker';
import { getUserData, updateUserData } from '../src/utils/authUtils';
import api from '../src/services/api';
import { getProfileUpdateErrorMessage } from '../src/utils/errorHandler';
import { LinearGradient } from 'expo-linear-gradient';

// Define interface for user data
interface UserData {
  firstName?: string;
  lastName?: string;
  email?: string;
  patientId?: string;
  gender?: string;
  age?: string;
  bloodGroup?: string;
  mobile?: string;
  address?: string;
  password?: string;
  [key: string]: any;
}

// Define types for form errors
interface FormErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  mobile?: string;
  age?: string;
  address?: string;
}

export default function EditPatientProfileScreen() {
  // Form state
  const [userData, setUserData] = useState<UserData>({});
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('Male');
  const [bloodGroup, setBloodGroup] = useState('A+');
  const [address, setAddress] = useState('');
  
  // UI state
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  useEffect(() => {
    const fetchPatientData = async () => {
      try {
        // First get the basic user data from storage
        const basicData = await getUserData() as UserData;
        
        // Then fetch complete profile data from API
        const response = await api.get('/patients/me');
        
        if (response.data && response.data.success) {
          const data = response.data.data as UserData;
          setUserData(data);
          
          // Set individual form fields
          setFirstName(data.firstName || '');
          setLastName(data.lastName || '');
          setEmail(data.email || '');
          setMobile(data.mobile || '');
          setAge(data.age || '');
          setGender(data.gender || 'Male');
          setBloodGroup(data.bloodGroup || 'A+');
          setAddress(data.address || '');
        } else {
          // If API fails, use the basic data
          setUserData(basicData);
          setFirstName(basicData.firstName || '');
          setLastName(basicData.lastName || '');
          setEmail(basicData.email || '');
          setMobile(basicData.mobile || '');
          setAge(basicData.age || '');
          setGender(basicData.gender || 'Male');
          setBloodGroup(basicData.bloodGroup || 'A+');
          setAddress(basicData.address || '');
        }
      } catch (error) {
        // Fallback to basic data from storage
        const basicData = await getUserData() as UserData;
        setUserData(basicData);
        setFirstName(basicData.firstName || '');
        setLastName(basicData.lastName || '');
        setEmail(basicData.email || '');
        setMobile(basicData.mobile || '');
        setAge(basicData.age || '');
        setGender(basicData.gender || 'Male');
        setBloodGroup(basicData.bloodGroup || 'A+');
        setAddress(basicData.address || '');
        Alert.alert('Error', 'Failed to fetch profile data');
      } finally {
        setLoading(false);
      }
    };

    fetchPatientData();
  }, []);

  // Form validation
  const validateForm = () => {
    const newErrors: FormErrors = {};
    
    // Basic validations
    if (!firstName?.trim()) newErrors.firstName = 'First name is required';
    if (!lastName?.trim()) newErrors.lastName = 'Last name is required';
    if (!email?.trim()) newErrors.email = 'Email is required';
    if (!mobile?.trim()) newErrors.mobile = 'Mobile number is required';
    if (!age) newErrors.age = 'Age is required';
    if (!address?.trim()) newErrors.address = 'Address is required';
    
    // Email validation
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Please enter a valid email';
    }
    
    // Age validation
    if (age && (isNaN(Number(age)) || Number(age) < 1 || Number(age) > 120)) {
      newErrors.age = 'Please enter a valid age';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveChanges = async () => {
    if (!validateForm()) {
      Alert.alert('Error', 'Please fix the errors in the form');
      return;
    }
    
    try {
      setSaving(true);
      
      // Prepare data for update - match exactly what the backend expects
      const updateData = {
        firstName,
        lastName,
        mobile,
        age: age ? age.toString() : undefined, // Ensure age is a string
        gender,
        bloodGroup,
        address
      };
      
      console.log('Sending update data to backend:', updateData);
      
      // Call API to update profile
      const response = await api.put('/patients/update-profile', updateData);
      
      if (response.data && response.data.success) {
        console.log('Profile updated successfully:', response.data);
        
        // Update local storage with new data
        const userData = response.data.data;
        await updateUserData(userData);
        
        Alert.alert('Success', 'Profile updated successfully', [
          { text: 'OK', onPress: () => router.back() }
        ]);
      } else {
        Alert.alert('Error', response.data?.message || 'Failed to update profile');
      }
    } catch (error: any) {
      Alert.alert('Error', getProfileUpdateErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3498db" />
        <Text style={styles.loadingText}>Loading profile data...</Text>
      </View>
    );
  }

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
            <View style={styles.header}>
              <TouchableOpacity 
                style={styles.backButton}
                onPress={() => router.back()}
              >
                <Image 
                  source={require('../assets/images/left-arrow.png')} 
                  style={styles.backButtonImage}
                />
              </TouchableOpacity>
              <Text style={styles.title}>Edit Profile</Text>
              <View style={{width: 40}} />
            </View>

            <View style={styles.profileImageSection}>
              <View style={styles.profileImageContainer}>
                {gender === 'Female' ? (
                  <Image 
                    source={require('../assets/images/woman.png')} 
                    style={styles.profileImage} 
                    resizeMode="cover"
                  />
                ) : (
                  <Image 
                    source={require('../assets/images/man.png')} 
                    style={styles.profileImage} 
                    resizeMode="cover"
                  />
                )}
              </View>
            </View>

            <View style={styles.formContainer}>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>First Name</Text>
                <TextInput
                  style={[styles.input, errors.firstName && styles.inputError]}
                  placeholder="Enter your first name"
                  placeholderTextColor="#8E8E93"
                  value={firstName}
                  onChangeText={setFirstName}
                />
                {errors.firstName && <Text style={styles.errorText}>{errors.firstName}</Text>}
              </View>
              
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Last Name</Text>
                <TextInput
                  style={[styles.input, errors.lastName && styles.inputError]}
                  placeholder="Enter your last name"
                  placeholderTextColor="#8E8E93"
                  value={lastName}
                  onChangeText={setLastName}
                />
                {errors.lastName && <Text style={styles.errorText}>{errors.lastName}</Text>}
              </View>
              
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                  style={[styles.input, errors.email && styles.inputError]}
                  placeholder="Enter your email"
                  placeholderTextColor="#8E8E93"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
              </View>
              
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Mobile Number</Text>
                <TextInput
                  style={[styles.input, errors.mobile && styles.inputError]}
                  placeholder="Enter your mobile number"
                  placeholderTextColor="#8E8E93"
                  value={mobile}
                  onChangeText={setMobile}
                  keyboardType="phone-pad"
                />
                {errors.mobile && <Text style={styles.errorText}>{errors.mobile}</Text>}
              </View>
              
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Age</Text>
                <TextInput
                  style={[styles.input, errors.age && styles.inputError]}
                  placeholder="Enter your age"
                  placeholderTextColor="#8E8E93"
                  value={age ? age.toString() : ''}
                  onChangeText={(text) => {
                    // Only allow numeric input
                    if (text === '' || /^\d+$/.test(text)) {
                      setAge(text);
                    }
                  }}
                  keyboardType="number-pad"
                />
                {errors.age && <Text style={styles.errorText}>{errors.age}</Text>}
              </View>
              
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Gender</Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={gender}
                    onValueChange={(itemValue: string) => setGender(itemValue)}
                    style={styles.picker}
                    dropdownIconColor="white"
                  >
                    <Picker.Item label="Male" value="Male" />
                    <Picker.Item label="Female" value="Female" />
                    <Picker.Item label="Other" value="Other" />
                  </Picker>
                </View>
              </View>
              
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Blood Group</Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={bloodGroup}
                    onValueChange={(itemValue: string) => setBloodGroup(itemValue)}
                    style={styles.picker}
                    dropdownIconColor="white"
                  >
                    <Picker.Item label="A+" value="A+" />
                    <Picker.Item label="A-" value="A-" />
                    <Picker.Item label="B+" value="B+" />
                    <Picker.Item label="B-" value="B-" />
                    <Picker.Item label="AB+" value="AB+" />
                    <Picker.Item label="AB-" value="AB-" />
                    <Picker.Item label="O+" value="O+" />
                    <Picker.Item label="O-" value="O-" />
                  </Picker>
                </View>
              </View>
              
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Address</Text>
                <TextInput
                  style={[styles.input, styles.textArea, errors.address && styles.inputError]}
                  placeholder="Enter your address"
                  placeholderTextColor="#8E8E93"
                  value={address}
                  onChangeText={setAddress}
                  multiline
                  numberOfLines={4}
                />
                {errors.address && <Text style={styles.errorText}>{errors.address}</Text>}
              </View>

              {saving ? (
                <ActivityIndicator color="#3498db" size="large" style={{marginTop: 20}} />
              ) : (
                <TouchableOpacity 
                  style={styles.saveButton}
                  onPress={handleSaveChanges}
                >
                  <Text style={styles.saveButtonText}>Save Changes</Text>
                </TouchableOpacity>
              )}
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
    paddingTop: 10,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#070B34',
  },
  loadingText: {
    color: 'white',
    marginTop: 10,
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    paddingBottom: 20,
    marginBottom: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonImage: {
    width: 20,
    height: 20,
    tintColor: 'white',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
  },
  profileImageSection: {
    alignItems: 'center',
    marginBottom: 30,
  },
  profileImageContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: 'hidden',
    backgroundColor: '#1A1F3D',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#3498db',
    marginBottom: 15,
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  formContainer: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    color: '#A0A0B0',
    marginBottom: 8,
    fontSize: 14,
    marginLeft: 4,
  },
  input: {
    backgroundColor: '#1A1F3D',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 30,
    padding: 15,
    paddingLeft: 20,
    color: 'white',
    fontSize: 16,
    height: 56,
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
    paddingTop: 15,
    borderRadius: 20,
  },
  inputError: {
    borderColor: '#FF3B30',
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 12,
    marginTop: 4,
  },
  pickerContainer: {
    backgroundColor: '#1A1F3D',
    borderRadius: 30,
    overflow: 'hidden',
    height: 56,
    paddingLeft: 20,
  },
  picker: {
    color: 'white',
    height: 50,
  },
  saveButton: {
    backgroundColor: '#E9EAEB',
    padding: 15,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    height: 56,
  },
  saveButtonText: {
    color: '#070B34',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
