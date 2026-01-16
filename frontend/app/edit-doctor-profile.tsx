import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Dimensions
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { getUserData, updateUserData } from '../src/utils/authUtils';
import api from '../src/services/api';
import { getProfileUpdateErrorMessage } from '../src/utils/errorHandler';
import { Picker } from '@react-native-picker/picker';

// Define interface for user data
interface UserData {
  firstName?: string;
  lastName?: string;
  email?: string;
  clinicName?: string;
  clinicLocation?: string;
  specialization?: string;
  age?: string;
  yearsOfExperience?: string;
  gender?: string;
  qualification?: string;
  clinicNumber?: string;
  [key: string]: any;
}

// Define types for form errors
interface FormErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  clinicName?: string;
  clinicLocation?: string;
  specialization?: string;
  age?: string;
  yearsOfExperience?: string;
  qualification?: string;
  clinicNumber?: string;
}

export default function EditDoctorProfileScreen() {
  // Form state
  const [userData, setUserData] = useState<UserData>({});
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [clinicName, setClinicName] = useState('');
  const [clinicLocation, setClinicLocation] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [age, setAge] = useState('');
  const [yearsOfExperience, setYearsOfExperience] = useState('');
  const [gender, setGender] = useState('Male');
  const [qualification, setQualification] = useState('');
  const [clinicNumber, setClinicNumber] = useState('');
  
  // Document state
  const [governmentId, setGovernmentId] = useState<string | null>(null);
  const [medicalLicense, setMedicalLicense] = useState<string | null>(null);
  const [signature, setSignature] = useState<string | null>(null);
  
  // Document modal state
  const [selectedDocument, setSelectedDocument] = useState<string | null>(null);
  const [documentModalVisible, setDocumentModalVisible] = useState(false);
  const [documentTitle, setDocumentTitle] = useState('');
  
  // UI state
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  useEffect(() => {
    const fetchDoctorData = async () => {
      try {
        // First get the basic user data from storage
        const basicData = await getUserData() as UserData;
        
        // Then fetch complete profile data from API
        const response = await api.get('/doctors/me');
        
        if (response.data && response.data.success) {
          const data = response.data.data as UserData;
          setUserData(data);
          
          // Set individual form fields
          setFirstName(data.firstName || '');
          setLastName(data.lastName || '');
          setEmail(data.email || '');
          setClinicName(data.clinicName || '');
          setClinicLocation(data.clinicLocation || '');
          setSpecialization(data.specialization || '');
          setAge(data.age?.toString() || '');
          setYearsOfExperience(data.yearsOfExperience?.toString() || '');
          setGender(data.gender || 'Male');
          setQualification(data.qualification || '');
          setClinicNumber(data.clinicNumber || '');
          
          // Set document fields
          setGovernmentId(data.governmentId || null);
          setMedicalLicense(data.medicalLicense || null);
          setSignature(data.signature || null);
        } else {
          // If API fails, use the basic data
          setUserData(basicData);
          setFirstName(basicData.firstName || '');
          setLastName(basicData.lastName || '');
          setEmail(basicData.email || '');
          setClinicName(basicData.clinicName || '');
          setClinicLocation(basicData.clinicLocation || '');
          setSpecialization(basicData.specialization || '');
          setAge(basicData.age?.toString() || '');
          setYearsOfExperience(basicData.yearsOfExperience?.toString() || '');
          setGender(basicData.gender || 'Male');
          setQualification(basicData.qualification || '');
          setClinicNumber(basicData.clinicNumber || '');
          
          // Set document fields from basic data if available
          setGovernmentId(basicData.governmentId || null);
          setMedicalLicense(basicData.medicalLicense || null);
          setSignature(basicData.signature || null);
        }
      } catch (error) {
        // Fallback to basic data from storage
        const basicData = await getUserData() as UserData;
        setUserData(basicData);
        setFirstName(basicData.firstName || '');
        setLastName(basicData.lastName || '');
        setEmail(basicData.email || '');
        setClinicName(basicData.clinicName || '');
        setClinicLocation(basicData.clinicLocation || '');
        setSpecialization(basicData.specialization || '');
        setAge(basicData.age?.toString() || '');
        setYearsOfExperience(basicData.yearsOfExperience?.toString() || '');
        setGender(basicData.gender || 'Male');
        setQualification(basicData.qualification || '');
        setClinicNumber(basicData.clinicNumber || '');
        Alert.alert('Error', 'Failed to fetch profile data');
      } finally {
        setLoading(false);
      }
    };

    fetchDoctorData();
  }, []);

  // Form validation
  const validateForm = () => {
    const newErrors: FormErrors = {};
    
    // Basic validations
    if (!firstName?.trim()) newErrors.firstName = 'First name is required';
    if (!lastName?.trim()) newErrors.lastName = 'Last name is required';
    if (!clinicName?.trim()) newErrors.clinicName = 'Clinic name is required';
    if (!clinicLocation?.trim()) newErrors.clinicLocation = 'Clinic location is required';
    if (!specialization?.trim()) newErrors.specialization = 'Specialization is required';
    if (!age) newErrors.age = 'Age is required';
    if (!yearsOfExperience) newErrors.yearsOfExperience = 'Years of experience is required';
    if (!qualification?.trim()) newErrors.qualification = 'Qualification is required';
    if (!clinicNumber?.trim()) newErrors.clinicNumber = 'Clinic number is required';
    
    // Age validation
    if (age && (isNaN(Number(age)) || Number(age) < 1 || Number(age) > 120)) {
      newErrors.age = 'Please enter a valid age';
    }
    
    // Years of experience validation
    if (yearsOfExperience && (isNaN(Number(yearsOfExperience)) || Number(yearsOfExperience) < 0 || Number(yearsOfExperience) > 100)) {
      newErrors.yearsOfExperience = 'Please enter valid years of experience';
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
        clinicName,
        clinicLocation,
        specialization,
        age: Number(age),
        yearsOfExperience: Number(yearsOfExperience),
        gender,
        qualification,
        clinicNumber
      };
      
      console.log('Sending update data to backend:', updateData);
      
      // Call API to update profile
      const response = await api.put('/doctors/update-profile', updateData);
      
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
              <Text style={styles.title}>Edit Doctor Profile</Text>
              <View style={{width: 40}} />
            </View>

            <View style={styles.profileImageSection}>
              <View style={styles.profileImageContainer}>
                {userData?.profileImage ? (
                  <Image 
                    source={{ uri: userData.profileImage }} 
                    style={styles.profileImage} 
                    resizeMode="cover"
                  />
                ) : (
                  gender === 'Female' ? (
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
                  )
                )}
              </View>
            </View>

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
                <Text style={styles.label}>Email</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: '#1A1F3D', color: '#8E8E93' }]}
                  value={email}
                  editable={false}
                />
                <Text style={styles.helperText}>Email cannot be changed</Text>
              </View>
              
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Age</Text>
                <TextInput
                  style={[styles.input, errors.age && styles.inputError]}
                  placeholder="Enter your age"
                  placeholderTextColor="#8E8E93"
                  value={age}
                  onChangeText={(text) => {
                    // Only allow numbers
                    if (/^\d*$/.test(text)) {
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
                    onValueChange={(itemValue) => setGender(itemValue)}
                    style={styles.picker}
                    dropdownIconColor="#FFFFFF"
                  >
                    <Picker.Item label="Male" value="Male" />
                    <Picker.Item label="Female" value="Female" />
                    <Picker.Item label="Other" value="Other" />
                  </Picker>
                </View>
              </View>

              <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Professional Information</Text>
              
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
                  onChangeText={(text) => {
                    // Only allow numbers
                    if (/^\d*$/.test(text)) {
                      setYearsOfExperience(text);
                    }
                  }}
                  keyboardType="number-pad"
                />
                {errors.yearsOfExperience && <Text style={styles.errorText}>{errors.yearsOfExperience}</Text>}
              </View>

              <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Clinic Information</Text>
              
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
                <Text style={styles.label}>Clinic Number</Text>
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
                <Text style={styles.label}>Clinic Location</Text>
                <TextInput
                  style={[styles.input, errors.clinicLocation && styles.inputError, { height: 100, textAlignVertical: 'top' }]}
                  placeholder="Enter your clinic address"
                  placeholderTextColor="#8E8E93"
                  value={clinicLocation}
                  onChangeText={setClinicLocation}
                  multiline
                  numberOfLines={4}
                />
                {errors.clinicLocation && <Text style={styles.errorText}>{errors.clinicLocation}</Text>}
              </View>
              
              <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Documents</Text>
              
              {/* Medical License Document */}
              <View style={styles.documentSection}>
                <Text style={styles.label}>Medical License</Text>
                {medicalLicense ? (
                  <TouchableOpacity 
                    style={styles.documentPreviewContainer}
                    onPress={() => {
                      setSelectedDocument(medicalLicense);
                      setDocumentTitle('Medical License');
                      setDocumentModalVisible(true);
                    }}
                  >
                    <Image 
                      source={{ uri: medicalLicense }} 
                      style={styles.documentPreview} 
                      resizeMode="contain"
                    />
                  </TouchableOpacity>
                ) : (
                  <View style={styles.noDocumentContainer}>
                    <Text style={styles.noDocumentText}>No license document available</Text>
                  </View>
                )}
              </View>
              
              {/* Government ID Document */}
              <View style={styles.documentSection}>
                <Text style={styles.label}>Government ID</Text>
                {governmentId ? (
                  <TouchableOpacity 
                    style={styles.documentPreviewContainer}
                    onPress={() => {
                      setSelectedDocument(governmentId);
                      setDocumentTitle('Government ID');
                      setDocumentModalVisible(true);
                    }}
                  >
                    <Image 
                      source={{ uri: governmentId }} 
                      style={styles.documentPreview} 
                      resizeMode="contain"
                    />
                  </TouchableOpacity>
                ) : (
                  <View style={styles.noDocumentContainer}>
                    <Text style={styles.noDocumentText}>No government ID available</Text>
                  </View>
                )}
              </View>
              
              {/* Signature */}
              <View style={styles.documentSection}>
                <Text style={styles.label}>Signature</Text>
                {signature ? (
                  <TouchableOpacity 
                    style={styles.signaturePreviewContainer}
                    onPress={() => {
                      setSelectedDocument(signature);
                      setDocumentTitle('Signature');
                      setDocumentModalVisible(true);
                    }}
                  >
                    <Image 
                      source={{ uri: signature }} 
                      style={styles.signaturePreview} 
                      resizeMode="contain"
                    />
                  </TouchableOpacity>
                ) : (
                  <View style={styles.noDocumentContainer}>
                    <Text style={styles.noDocumentText}>No signature available</Text>
                  </View>
                )}
              </View>

              <TouchableOpacity 
                style={styles.saveButton}
                onPress={handleSaveChanges}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <Text style={styles.saveButtonText}>Save Changes</Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
          
          {/* Document Viewing Modal */}
          <Modal
            visible={documentModalVisible}
            transparent={true}
            animationType="fade"
            onRequestClose={() => setDocumentModalVisible(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContainer}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>{documentTitle}</Text>
                  <TouchableOpacity 
                    style={styles.closeButton}
                    onPress={() => setDocumentModalVisible(false)}
                  >
                    <Text style={styles.closeButtonText}>×</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.modalContent}>
                  {selectedDocument && (
                    <Image
                      source={{ uri: selectedDocument }}
                      style={styles.fullDocumentImage}
                      resizeMode="contain"
                    />
                  )}
                </View>
              </View>
            </View>
          </Modal>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0B1426',
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
    marginBottom: 30,
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
    shadowColor: '#3498db',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 8,
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  formContainer: {
    width: '100%',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#3498db',
    marginBottom: 15,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    color: 'white',
    fontSize: 16,
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
    padding: 15,
    color: 'white',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  inputError: {
    borderWidth: 1,
    borderColor: '#FF3B30',
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 14,
    marginTop: 5,
  },
  helperText: {
    color: '#8E8E93',
    fontSize: 12,
    marginTop: 5,
    fontStyle: 'italic',
  },
  pickerContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  picker: {
    color: 'white',
    height: 50,
  },
  saveButton: {
    backgroundColor: '#ffffffff',
    borderRadius: 30,
    padding: 18,
    alignItems: 'center',
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  saveButtonText: {
    color: '#000049ff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  documentSection: {
    marginBottom: 20,
  },
  documentPreviewContainer: {
    width: '100%',
    height: 180,
    backgroundColor: '#1A1F3D',
    borderRadius: 10,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  documentPreview: {
    width: '100%',
    height: '100%',
  },
  signaturePreviewContainer: {
    width: '100%',
    height: 100,
    backgroundColor: '#1A1F3D',
    borderRadius: 10,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
    position: 'relative',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  signaturePreview: {
    width: '100%',
    height: '100%',
  },
  noDocumentContainer: {
    width: '100%',
    height: 100,
    backgroundColor: '#1A1F3D',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noDocumentText: {
    color: '#A0A0B0',
    fontStyle: 'italic',
  },
  viewFullText: {
    color: '#3498db',
    fontSize: 12,
    fontStyle: 'italic',
    position: 'absolute',
    bottom: 10,
    alignSelf: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '90%',
    height: '80%',
    backgroundColor: '#1A1F3D',
    borderRadius: 15,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  modalContent: {
    flex: 1,
    padding: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullDocumentImage: {
    width: '100%',
    height: '100%',
  },
});
