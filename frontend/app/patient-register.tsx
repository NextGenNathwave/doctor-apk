import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Platform,
  KeyboardAvoidingView,
  Alert,
  StatusBar,
  ActivityIndicator,
  Image
} from 'react-native';
import { router } from 'expo-router';
import { Picker } from '@react-native-picker/picker';
import { authService } from '../src/services/api';
import { LinearGradient } from 'expo-linear-gradient';
import { kolhapurAreas, KolhapurArea } from '../src/utils/locationUtils';

// Define types for form errors
interface FormErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  mobile?: string;
  password?: string;
  confirmPassword?: string;
  age?: string;
  gender?: string;
  bloodGroup?: string;
  address?: string;
}

export default function PatientRegisterScreen() {
  // Personal information
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('Male');
  const [bloodGroup, setBloodGroup] = useState('A+');
  const [address, setAddress] = useState('');
  const [selectedArea, setSelectedArea] = useState<KolhapurArea | null>(null);
  
  // Form validation
  const [errors, setErrors] = useState<FormErrors>({});
  
  // Validate form - All fields are required
  const validateForm = () => {
    const newErrors: FormErrors = {};
    
    // First name is required
    if (!firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }
    
    // Last name is required
    if (!lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }
    
    // Email is required and must be valid
    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        newErrors.email = 'Please provide a valid email';
      }
    }
    
    // Mobile is required and must be valid
    if (!mobile.trim()) {
      newErrors.mobile = 'Mobile number is required';
    } else if (mobile.length < 10) {
      newErrors.mobile = 'Please enter a valid 10-digit mobile number';
    }
    
    // Password is required and must be at least 6 characters
    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    // Confirm password must match
    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    // Age is required and must be valid
    if (!age.trim()) {
      newErrors.age = 'Age is required';
    } else if (isNaN(Number(age)) || Number(age) < 1 || Number(age) > 120) {
      newErrors.age = 'Please enter a valid age';
    }
    
    // Gender is required (already has default value)
    if (!gender) {
      newErrors.gender = 'Gender is required';
    }
    
    // Blood group is required (already has default value)
    if (!bloodGroup) {
      newErrors.bloodGroup = 'Blood group is required';
    }
    
    // Address is required
    if (!address.trim()) {
      newErrors.address = 'Address is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Handle registration
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleRegister = async () => {
    if (validateForm()) {
      setIsLoading(true);
      setErrorMessage('');
      
      try {
        // Prepare the form data
        const formData = {
          firstName,
          lastName,
          email,
          mobile,
          password,
          age,
          gender,
          bloodGroup,
          address,
          areaId: selectedArea?.id,
          coordinates: selectedArea ? {
            lat: selectedArea.coordinates.lat,
            lon: selectedArea.coordinates.lon
          } : null
        };
        
        // Call the patient registration API
        await authService.patientRegister(formData);
        
        // If successful, show success message and navigate to the patient home page
        Alert.alert(
          'Registration Successful',
          'Your account has been created successfully!',
          [{ text: 'OK', onPress: () => router.replace('/patient-home') }]
        );
      } catch (error: any) {
        // Handle different types of errors - production-friendly
        if (error.response && error.response.data && error.response.data.message) {
          setErrorMessage(error.response.data.message);
        } else if (error.response && error.response.status === 400) {
          setErrorMessage('Invalid registration data. Please check your information.');
        } else if (error.response && error.response.status === 409) {
          setErrorMessage('Email already exists. Please use a different email.');
        } else if (error.response && error.response.status >= 500) {
          setErrorMessage('Server error. Please try again later.');
        } else if (!error.response) {
          setErrorMessage('Network error. Please check your connection.');
        } else {
          setErrorMessage('Registration failed. Please try again.');
        }
      } finally {
        setIsLoading(false);
      }
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
            
            <Text style={styles.title}>Patient Registration</Text>
            <Text style={styles.subtitle}>Create your account</Text>
            
          
            <View style={styles.formContainer}>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>First Name <Text style={styles.required}>*</Text></Text>
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
                <Text style={styles.label}>Last Name <Text style={styles.required}>*</Text></Text>
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
                <Text style={styles.label}>Email <Text style={styles.required}>*</Text></Text>
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
                <Text style={styles.label}>Mobile Number <Text style={styles.required}>*</Text></Text>
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
                <Text style={styles.label}>Password <Text style={styles.required}>*</Text></Text>
                <TextInput
                  style={[styles.input, errors.password && styles.inputError]}
                  placeholder="Enter your password"
                  placeholderTextColor="#8E8E93"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                />
                {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
              </View>
              
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Confirm Password <Text style={styles.required}>*</Text></Text>
                <TextInput
                  style={[styles.input, errors.confirmPassword && styles.inputError]}
                  placeholder="Confirm your password"
                  placeholderTextColor="#8E8E93"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                />
                {errors.confirmPassword && <Text style={styles.errorText}>{errors.confirmPassword}</Text>}
              </View>
              
              
              
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Age <Text style={styles.required}>*</Text></Text>
                <TextInput
                  style={[styles.input, errors.age && styles.inputError]}
                  placeholder="Enter your age"
                  placeholderTextColor="#8E8E93"
                  value={age}
                  onChangeText={setAge}
                  keyboardType="numeric"
                />
                {errors.age && <Text style={styles.errorText}>{errors.age}</Text>}
              </View>
              
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Gender <Text style={styles.required}>*</Text></Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={gender}
                    onValueChange={(itemValue: string) => setGender(itemValue as 'Male' | 'Female' | 'Other')}
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
                <Text style={styles.label}>Blood Group <Text style={styles.required}>*</Text></Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={bloodGroup}
                    onValueChange={(itemValue: string) => setBloodGroup(itemValue as 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-')}
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
                <Text style={styles.label}>Address <Text style={styles.required}>*</Text></Text>
                <View style={[styles.pickerContainer, errors.address && styles.inputError]}>
                  <Picker
                    selectedValue={selectedArea?.id || ''}
                    onValueChange={(itemValue) => {
                      if (itemValue) {
                        const area = kolhapurAreas.find(a => a.id === itemValue);
                        if (area) {
                          setSelectedArea(area);
                          setAddress(`${area.name}, ${area.pincode}`);
                        }
                      } else {
                        setSelectedArea(null);
                        setAddress('');
                      }
                    }}
                    style={styles.picker}
                    dropdownIconColor="white"
                  >
                    <Picker.Item label="Select your area..." value="" />
                    {kolhapurAreas.map((area) => (
                      <Picker.Item
                        key={area.id}
                        label={`${area.name} - ${area.pincode} (${area.type})`}
                        value={area.id}
                      />
                    ))}
                  </Picker>
                </View>
                {errors.address && <Text style={styles.errorText}>{errors.address}</Text>}
              </View>
              
              {errorMessage ? (
                <Text style={styles.errorMessageText}>{errorMessage}</Text>
              ) : null}
              
              <TouchableOpacity 
                style={styles.registerButton}
                onPress={handleRegister}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#070B34" size="small" />
                ) : (
                  <Text style={styles.buttonText}>Register</Text>
                )}
              </TouchableOpacity>
            </View>
            
            <View style={styles.loginContainer}>
              <Text style={styles.loginText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => router.push('/patient-login')}>
                <Text style={styles.loginLink}>Login</Text>
              </TouchableOpacity>
            </View>
            
            {/* Powered by Nathwave NexGen */}
            <View style={styles.poweredByContainer}>
              <Text style={styles.poweredByText}>
                Powered by <Text style={styles.poweredByBrand}>Nathwave NexGen</Text>
              </Text>
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
    backgroundColor: '#070B34', // Darker blue from the image
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
    marginBottom: 30,
    marginTop: 10,
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
    marginBottom: 5,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#A0A0B0', // Lighter gray with slight blue tint like in the image
    marginBottom: 40,
    textAlign: 'center',
  },
  sectionTitleContainer: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 10,
  },
  sectionTitleLine: {
    height: 2,
    backgroundColor: '#3498db',
    width: 60,
    marginBottom: 15,
  },
  formContainer: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    color: '#A0A0B0', // Lighter gray with slight blue tint like in the image
    marginBottom: 8,
    fontSize: 14,
  },
  required: {
    color: '#FF3B30',
    fontWeight: 'bold',
  },
  input: {
    backgroundColor: '#1A1F3D',// Darker input background like in the image
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 30, // More rounded corners like in the image
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
  errorMessageText: {
    color: '#FF3B30',
    textAlign: 'center',
    marginBottom: 16,
    fontSize: 14,
  },
  pickerContainer: {
    backgroundColor: '#1A1F3D', // Match input field color
    borderRadius: 30, // Rounded corners like inputs
    overflow: 'hidden',
    height: 56,
    paddingLeft: 20,
  },
  picker: {
    color: 'white',
    height: 50,
  },
  registerButton: {
    backgroundColor: '#E9EAEB', // Light button like in the doctor registration
    padding: 15,
    borderRadius: 30, // More rounded corners
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    height: 56, // Consistent height
  },
  buttonText: {
    color: '#070B34', // Dark text on light buttons
    fontSize: 16,
    fontWeight: 'bold',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 30,
    marginBottom: 20,
  },
  loginText: {
    color: '#8E8E93',
    fontSize: 14,
  },
  loginLink: {
    color: '#ffffffff', // Royal blue like in the doctor registration
    fontSize: 14,
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
