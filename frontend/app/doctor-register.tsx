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
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { Picker } from '@react-native-picker/picker';
import * as ImagePicker from 'expo-image-picker';
import { authService } from '../src/services/api';
import { getRegistrationErrorMessage } from '../src/utils/errorHandler';
import { kolhapurAreas, KolhapurArea } from '../src/utils/locationUtils';

// Define types for form errors
interface FormErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  age?: string;
  gender?: string;
  clinicName?: string;
  clinicLocation?: string;
  clinicNumber?: string;
  specialization?: string;
  yearsOfExperience?: string;
  qualification?: string;
  profileImage?: string;
  governmentId?: string;
  medicalLicense?: string;
  signature?: string;
}

export default function DoctorRegisterScreen() {
  // Personal information
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('Male');
  
  // Professional information
  const [clinicName, setClinicName] = useState('');
  const [clinicLocation, setClinicLocation] = useState('');
  const [selectedArea, setSelectedArea] = useState<KolhapurArea | null>(null);
  const [clinicNumber, setClinicNumber] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [yearsOfExperience, setYearsOfExperience] = useState('');
  const [qualification, setQualification] = useState('');
  
  // Documents and images
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [governmentId, setGovernmentId] = useState<string | null>(null);
  const [medicalLicense, setMedicalLicense] = useState<string | null>(null);
  const [signature, setSignature] = useState<string | null>(null);
  
  // Form validation
  const [errors, setErrors] = useState<FormErrors>({});
  const [currentStep, setCurrentStep] = useState(1);
  
  // Handle image picking
  const pickImage = async (setter: React.Dispatch<React.SetStateAction<string | null>>) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant permission to access your media library');
      return;
    }
    
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });
    
    if (!result.canceled) {
      setter(result.assets[0].uri);
    }
  };
  
  // Validate first step - Only email and password required for testing
  const validateStep1 = () => {
    const newErrors: FormErrors = {};
    
    // Email is required and must be valid
    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        newErrors.email = 'Please provide a valid email';
      }
    }
    
    // Password is required and must be at least 6 characters
    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    // Confirm password must match if provided
    if (confirmPassword && password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    // Age validation only if provided
    if (age.trim() && (isNaN(Number(age)) || Number(age) < 18 || Number(age) > 100)) {
      newErrors.age = 'Please enter a valid age between 18 and 100';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Validate second step - All fields optional for testing
  const validateStep2 = () => {
    const newErrors: FormErrors = {};
    
    // Years of experience validation only if provided
    if (yearsOfExperience.trim() && (isNaN(Number(yearsOfExperience)) || Number(yearsOfExperience) < 0)) {
      newErrors.yearsOfExperience = 'Please enter a valid number';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Validate third step - All files optional for testing
  const validateStep3 = () => {
    const newErrors: FormErrors = {};
    
    // All file uploads are optional for testing
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Handle next step
  const handleNextStep = () => {
    if (currentStep === 1 && validateStep1()) {
      setCurrentStep(2);
    } else if (currentStep === 2 && validateStep2()) {
      setCurrentStep(3);
    }
  };
  
  // Handle previous step
  const handlePrevStep = () => {
    setCurrentStep(currentStep - 1);
  };
  
  // Handle registration
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleRegister = async () => {
    if (validateStep3()) {
      setIsLoading(true);
      setErrorMessage('');
      
      try {
        // Prepare the form data for the API call
        const formData = {
          firstName,
          lastName,
          email,
          password,
          age,
          gender,
          clinicName,
          clinicLocation,
          clinicAreaId: selectedArea?.id,
          clinicCoordinates: selectedArea ? {
            lat: selectedArea.coordinates.lat,
            lon: selectedArea.coordinates.lon
          } : null,
          clinicNumber,
          specialization,
          yearsOfExperience,
          qualification,
          profileImage,
          governmentId,
          medicalLicense,
          signature
        };
        
        // Call the doctor registration API
        await authService.doctorRegister(formData);
        
        // If successful, show success message and navigate to the doctor home page
        Alert.alert(
          'Registration Successful',
          'Your account has been created successfully!',
          [{ text: 'OK', onPress: () => router.replace('/doctor-home') }]
        );
      } catch (error: any) {
        setErrorMessage(getRegistrationErrorMessage(error));
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
            
            <Text style={styles.title}>Doctor Registration</Text>
            <Text style={styles.subtitle}>Step {currentStep} of 3</Text>
            
            {currentStep === 1 && (
              <View style={styles.formContainer}>
                <Text style={styles.sectionTitle}>Personal Information</Text>
                
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
                  <Text style={styles.label}>Confirm Password</Text>
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
                  <Text style={styles.label}>Age</Text>
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
                  <Text style={styles.label}>Gender</Text>
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
                
                <TouchableOpacity 
                  style={styles.nextButton}
                  onPress={handleNextStep}
                >
                  <Text style={styles.buttonText}>Next</Text>
                </TouchableOpacity>
              </View>
            )}
            
            {currentStep === 2 && (
              <View style={styles.formContainer}>
                <Text style={styles.sectionTitle}>Professional Information</Text>
                
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Clinic Name</Text>
                  <TextInput
                    style={[styles.input, errors.clinicName && styles.inputError]}
                    placeholder="Enter your clinic name"
                    placeholderTextColor="#8E8E93"
                    value={clinicName}
                    onChangeText={setClinicName}
                  />
                  {errors.clinicName && <Text style={styles.errorText}>{errors.clinicName}</Text>}
                </View>
                
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Clinic Location</Text>
                  <View style={[styles.pickerContainer, errors.clinicLocation && styles.inputError]}>
                    <Picker
                      selectedValue={selectedArea?.id || ''}
                      onValueChange={(itemValue) => {
                        if (itemValue) {
                          const area = kolhapurAreas.find(a => a.id === itemValue);
                          if (area) {
                            setSelectedArea(area);
                            setClinicLocation(`${area.name}, ${area.pincode}`);
                          }
                        } else {
                          setSelectedArea(null);
                          setClinicLocation('');
                        }
                      }}
                      style={styles.picker}
                    >
                      <Picker.Item label="Select your clinic area..." value="" />
                      {kolhapurAreas.map((area) => (
                        <Picker.Item
                          key={area.id}
                          label={`${area.name} - ${area.pincode} (${area.type})`}
                          value={area.id}
                        />
                      ))}
                    </Picker>
                  </View>
                  {errors.clinicLocation && <Text style={styles.errorText}>{errors.clinicLocation}</Text>}
                </View>
                
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Clinic Contact Number</Text>
                  <TextInput
                    style={[styles.input, errors.clinicNumber && styles.inputError]}
                    placeholder="Enter your clinic contact number"
                    placeholderTextColor="#8E8E93"
                    value={clinicNumber}
                    onChangeText={setClinicNumber}
                    keyboardType="phone-pad"
                  />
                  {errors.clinicNumber && <Text style={styles.errorText}>{errors.clinicNumber}</Text>}
                </View>
                
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Specialization</Text>
                  <TextInput
                    style={[styles.input, errors.specialization && styles.inputError]}
                    placeholder="Enter your specialization"
                    placeholderTextColor="#8E8E93"
                    value={specialization}
                    onChangeText={setSpecialization}
                  />
                  {errors.specialization && <Text style={styles.errorText}>{errors.specialization}</Text>}
                </View>
                
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Years of Experience</Text>
                  <TextInput
                    style={[styles.input, errors.yearsOfExperience && styles.inputError]}
                    placeholder="Enter your years of experience"
                    placeholderTextColor="#8E8E93"
                    value={yearsOfExperience}
                    onChangeText={setYearsOfExperience}
                    keyboardType="numeric"
                  />
                  {errors.yearsOfExperience && <Text style={styles.errorText}>{errors.yearsOfExperience}</Text>}
                </View>
                
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Qualification</Text>
                  <TextInput
                    style={[styles.input, errors.qualification && styles.inputError]}
                    placeholder="Enter your qualification"
                    placeholderTextColor="#8E8E93"
                    value={qualification}
                    onChangeText={setQualification}
                  />
                  {errors.qualification && <Text style={styles.errorText}>{errors.qualification}</Text>}
                </View>
                
                <View style={styles.buttonRow}>
                  <TouchableOpacity 
                    style={[styles.button, styles.backStepButton]}
                    onPress={handlePrevStep}
                  >
                    <Text style={styles.buttonTex}>Back</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[styles.button, styles.nextButton]}
                    onPress={handleNextStep}
                  >
                    <Text style={styles.buttonText}>Next</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
            
            {currentStep === 3 && (
              <View style={styles.formContainer}>
                <View style={styles.sectionTitleContainer}>
                  <Text style={styles.sectionTitle}>Documents & Images</Text>
                  <View style={styles.sectionTitleLine}></View>
                </View>
                
                <View style={styles.imageContainer}>
                  <Text style={styles.imageLabel}>Profile Image</Text>
                  <TouchableOpacity 
                    style={[styles.imagePicker, errors.profileImage && styles.imagePickerError]}
                    onPress={() => pickImage(setProfileImage)}
                  >
                    {profileImage ? (
                      <Image source={{ uri: profileImage }} style={styles.previewImage} />
                    ) : (
                      <View style={styles.imagePickerContent}>
                        <Text style={{fontSize: 24, color: '#3498db', marginBottom: 8}}>📤</Text>
                        <Text style={styles.imagePickerText}>Tap to select an image</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                  {errors.profileImage && <Text style={styles.errorText}>{errors.profileImage}</Text>}
                </View>
                
                <View style={styles.imageContainer}>
                  <Text style={styles.imageLabel}>Government ID</Text>
                  <TouchableOpacity 
                    style={[styles.imagePicker, errors.governmentId && styles.imagePickerError]}
                    onPress={() => pickImage(setGovernmentId)}
                  >
                    {governmentId ? (
                      <Image source={{ uri: governmentId }} style={styles.previewImage} />
                    ) : (
                      <View style={styles.imagePickerContent}>
                        <Text style={{fontSize: 24, color: '#3498db', marginBottom: 8}}>📜</Text>
                        <Text style={styles.imagePickerText}>Tap to select an image</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                  {errors.governmentId && <Text style={styles.errorText}>{errors.governmentId}</Text>}
                </View>
                
                <View style={styles.imageContainer}>
                  <Text style={styles.imageLabel}>Medical License</Text>
                  <TouchableOpacity 
                    style={[styles.imagePicker, errors.medicalLicense && styles.imagePickerError]}
                    onPress={() => pickImage(setMedicalLicense)}
                  >
                    {medicalLicense ? (
                      <Image source={{ uri: medicalLicense }} style={styles.previewImage} />
                    ) : (
                      <View style={styles.imagePickerContent}>
                        <Text style={{fontSize: 24, color: '#3498db', marginBottom: 8}}>⚕</Text>
                        <Text style={styles.imagePickerText}>Tap to select an image</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                  {errors.medicalLicense && <Text style={styles.errorText}>{errors.medicalLicense}</Text>}
                </View>
                
                <View style={styles.imageContainer}>
                  <Text style={styles.imageLabel}>Signature</Text>
                  <TouchableOpacity 
                    style={[styles.imagePicker, errors.signature && styles.imagePickerError]}
                    onPress={() => pickImage(setSignature)}
                  >
                    {signature ? (
                      <Image source={{ uri: signature }} style={styles.previewImage} />
                    ) : (
                      <View style={styles.imagePickerContent}>
                        <Text style={{fontSize: 24, color: '#3498db', marginBottom: 8}}>✍</Text>
                        <Text style={styles.imagePickerText}>Tap to select an image</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                  {errors.signature && <Text style={styles.errorText}>{errors.signature}</Text>}
                </View>
                
                <View style={styles.buttonRow}>
                  <TouchableOpacity 
                    style={[styles.button1, styles.backStepButton1]}
                    onPress={handlePrevStep}
                  >
                    <Text style={styles.buttonTex}>Back</Text>
                  </TouchableOpacity>
                  
                  {errorMessage ? (
                    <Text style={styles.errorMessageText}>{errorMessage}</Text>
                  ) : null}
                  
                  <TouchableOpacity 
                    style={[styles.button, styles.registerButton]}
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
              </View>
            )}
            
            <View style={styles.loginContainer}>
              <Text style={styles.loginText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => router.push('/doctor-login')}>
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
  buttonTex: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
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
    backgroundColor: 'rgba(255, 255, 255, 0.1)', // Semi-transparent like in the image
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
  imageLabel: {
    color: '#3498db',
    marginBottom: 8,
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 4,
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
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  button: {
    flex: 1,
    padding: 15,
    borderRadius: 30, // More rounded corners like in the image
    alignItems: 'center',
    justifyContent: 'center',
    height: 56, // Consistent height with inputs
  },
  button1:{
    flex: 1,
    marginTop:0,
    padding: 0,
    borderRadius: 30, // More rounded corners like in the image
    alignItems: 'center',
    justifyContent: 'center',
    height: 56, // Consistent height with inputs
  },
  backStepButton: {
    backgroundColor: '#1A1F3D', // Darker button
    marginRight: 10,
    marginTop: 20,
    padding: 15,
    color:'white',
    borderColor:'white',
    borderWidth:1,
    borderRadius:30,
  },
  backStepButton1: {
    backgroundColor: '#1A1F3D', // Darker button
    marginRight: 10,
    marginTop: 0,
    padding: 15,
    color:'white',
    borderColor:'white',
    borderWidth:1,
    borderRadius:30,
  },
  nextButton: {
    backgroundColor: '#ffffffff',
    padding: 18,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    height: 56,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  registerButton: {
    backgroundColor: '#ffffffff',
    marginLeft: 10,
  },
  buttonText: {
    color: '#000049ff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  imageContainer: {
    marginBottom: 25,
    backgroundColor: 'rgba(26, 31, 61, 0.4)',
    padding: 15,
    borderRadius: 10,
  },
  imagePicker: {
    backgroundColor: '#1A1F3D', // Match input field color
    borderRadius: 20, // Slightly rounded corners
    height: 150,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#3498db',
    borderStyle: 'dashed',
    marginTop: 5,
    overflow: 'hidden',
  },
  imagePickerError: {
    borderColor: '#FF3B30',
  },
  imagePickerText: {
    color: '#3498db',
    fontSize: 16,
    fontWeight: '500',
  },
  imagePickerContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
    resizeMode: 'cover',
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
    color: '#ffffffff', // Royal blue like in the image
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
