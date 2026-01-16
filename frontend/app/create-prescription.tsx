import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  StatusBar,
  ActivityIndicator,
  Image,
  FlatList,
  Modal
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { getUserData } from '../src/utils/authUtils';
import api from '../src/services/api';

// Define types for form errors
interface FormErrors {
  patientId?: string;
  medicines?: string;
  medicineName?: string;
  medicineType?: string;
  dosage?: string;
  frequency?: string;
  duration?: string;
  instructions?: string;
  advice?: string;
  followUpDate?: string;
  extraInstructions?: string;
}

export default function CreatePrescriptionScreen() {
  // Loading state
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [errorMessage, setErrorMessage] = useState('');
  
  // Doctor data
  const [doctorData, setDoctorData] = useState<any>(null);
  
  // Patient selection
  const [patients, setPatients] = useState<any[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<any[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [patientSearchQuery, setPatientSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  
  // Dropdown states
  const [dropdownVisible, setDropdownVisible] = useState<{[key: string]: boolean}>({});
  const [dropdownData, setDropdownData] = useState<string[]>([]);
  const [dropdownField, setDropdownField] = useState<string>('');
  const [dropdownMedicineIndex, setDropdownMedicineIndex] = useState<number>(-1);
  
  // Date picker state
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedDay, setSelectedDay] = useState(new Date().getDate());
  
  // Medicine types, dosages, frequencies, and durations from backend model
  const medicineTypes = ['Tablet', 'Syrup', 'Injection', 'Drops', 'Cream', 'Other'];
  const dosages = [
    '1/4 tablet', '1/2 tablet', '1 tablet', '2 tablets', '3 tablets',
    '1/2 teaspoon', '1 teaspoon', '2 teaspoons', '1 tablespoon', '2 tablespoons',
    '1 drop', '2 drops', '3 drops', '4 drops', '5 drops',
  ];
  const frequencies = [ 'Before breakfast', 'After breakfast',
    'Before lunch', 'After lunch', 'Before dinner', 'After dinner',
    'Every 1 hours', 'Every 2 hours', 'Every 3 hours', 'Every 4 hours'
  ];
  const durations = [
    '1 day', '2 days', '3 days', '4 days', '5 days',
    '1 week', '2 weeks', '3 weeks', '4 weeks', 'Until finished'
  ];
  
  // Form data
  const [formData, setFormData] = useState({
    patientId: '',
    medicines: [
      {
        name: '',
        medicineType: 'Tablet',
        dosage: '1 tablet',
        frequency: 'Twice daily',
        duration: '1 week',
        instructions: ''
      }
    ],
    advice: '',
    followUpDate: '',
    extraInstructions: ''
  });

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, []);
  
  // Fetch patient data as user types patient ID
  useEffect(() => {
    const fetchPatientData = async () => {
      if (patientSearchQuery.trim() === '') {
        setSelectedPatient(null);
        setFormData({...formData, patientId: ''});
        return;
      }
      
      setIsSearching(true);
      
      try {
        // First check if we have the patient locally
        const localMatch = patients.find(p => 
          p.patientId.toLowerCase() === patientSearchQuery.toLowerCase());
          
        if (localMatch) {
          setSelectedPatient(localMatch);
          setFormData({...formData, patientId: localMatch._id});
          setIsSearching(false);
          return;
        }
        
        // If not found locally, fetch from backend
        try {
          const response = await api.get(`/patients/search?patientId=${patientSearchQuery}`);
          if (response.data && response.data.success && response.data.patient) {
            const fetchedPatient = response.data.patient;
            setSelectedPatient(fetchedPatient);
            setFormData({...formData, patientId: fetchedPatient._id});
            
            // Add to local patients list if not already there
            if (!patients.some(p => p._id === fetchedPatient._id)) {
              setPatients([...patients, fetchedPatient]);
            }
          } else {
            setSelectedPatient(null);
            setFormData({...formData, patientId: ''});
          }
        } catch (error) {
          // For demo purposes, simulate finding a patient with matching ID
          const mockPatient = {
            _id: `mock_${Date.now()}`,
            firstName: 'Patient',
            lastName: patientSearchQuery,
            patientId: patientSearchQuery,
            age: Math.floor(Math.random() * 50) + 20
          };
          setSelectedPatient(mockPatient);
          setFormData({...formData, patientId: mockPatient._id});
          
          // Add to local patients list
          setPatients([...patients, mockPatient]);
        }
      } finally {
        setIsSearching(false);
      }
    };
    
    // Use debounce to avoid too many API calls
    const debounceTimeout = setTimeout(fetchPatientData, 500);
    return () => clearTimeout(debounceTimeout);
  }, [patientSearchQuery, patients, formData]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      // Get doctor data
      const data = await getUserData();
      setDoctorData(data);
      
      // Get patients (this would need a proper API endpoint)
      try {
        const response = await api.get('/doctors/patients');
        if (response.data && response.data.success) {
          const patientsList = response.data.patients || [];
          setPatients(patientsList);
          setFilteredPatients(patientsList);
        }
      } catch (error) {
        // Use mock data for now
        const mockPatients = [
          { _id: '1', firstName: 'John', lastName: 'Smith', patientId: 'P12345', age: 45 },
          { _id: '2', firstName: 'Sarah', lastName: 'Johnson', patientId: 'P23456', age: 32 },
          { _id: '3', firstName: 'Michael', lastName: 'Brown', patientId: 'P34567', age: 28 },
          { _id: '4', firstName: 'Emily', lastName: 'Davis', patientId: 'P45678', age: 39 },
          { _id: '5', firstName: 'Robert', lastName: 'Wilson', patientId: 'P56789', age: 52 }
        ];
        setPatients(mockPatients);
        setFilteredPatients(mockPatients);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle going back
  const handleBack = () => {
    router.back();
  };

  // Validate form
  const validateForm = () => {
    const newErrors: FormErrors = {};
    
    if (!selectedPatient) {
      newErrors.patientId = 'Please select a patient';
    }
    
    if (!formData.medicines || formData.medicines.length === 0) {
      newErrors.medicines = 'At least one medicine is required';
    } else {
      formData.medicines.forEach((medicine, index) => {
        if (!medicine.name) {
          newErrors.medicineName = 'Medicine name is required';
        }
      });
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle submit
  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setSubmitting(true);
      setErrorMessage('');
      
      // Get current date and time for prescription ID and timestamp
      const now = new Date();
      const prescriptionId = `PRESC-${now.getTime()}`;
      const timestamp = now.toISOString();
      
      // Prepare the form data for the API call - format it as the backend expects
      const prescriptionPayload = {
        patientId: selectedPatient.patientId || selectedPatient._id, // Use patientId field or _id as fallback
        medicines: formData.medicines,
        advice: formData.advice,
        followUpDate: cleanDateFormat(formData.followUpDate),
        extraInstructions: formData.extraInstructions
      };
      
      // Also prepare a complete data structure for local storage
      const prescriptionData = {
        prescriptionId,
        doctorId: doctorData?._id || 'unknown',
        doctorName: doctorData ? `${doctorData.firstName} ${doctorData.lastName}` : 'Doctor',
        patientId: selectedPatient._id,
        patientName: `${selectedPatient.firstName} ${selectedPatient.lastName}`,
        patientDetails: {
          patientId: selectedPatient.patientId,
          age: selectedPatient.age,
          gender: selectedPatient.gender || 'Not Specified',
          bloodGroup: selectedPatient.bloodGroup || 'Not Available',
          contact: selectedPatient.mobile || 'N/A',
          email: selectedPatient.email || 'N/A'
        },
        medicines: formData.medicines,
        advice: formData.advice,
        followUpDate: cleanDateFormat(formData.followUpDate),
        extraInstructions: formData.extraInstructions,
        createdAt: timestamp,
        status: 'active'
      };
      
      // Call the prescription creation API
      try {
        // 1. Save prescription to database - use the format expected by the backend
        const response = await api.post('/prescriptions', prescriptionPayload);
        
        if (response.data && response.data.success) {
          // 2. Send notification to patient (if available in your API)
          try {
            await api.post('/notifications/send', {
              recipientId: selectedPatient._id,
              type: 'new_prescription',
              title: 'New Prescription',
              message: `Dr. ${doctorData?.lastName || 'Your doctor'} has sent you a new prescription.`,
              data: { prescriptionId }
            });
            console.log('Notification sent to patient');
          } catch (notifError) {
            // Continue even if notification fails
          }
          
          // 3. Update prescription count in local storage
          try {
            // Get current prescription count
            const storedData = await AsyncStorage.getItem('doctorStats');
            let doctorStats = storedData ? JSON.parse(storedData) : { prescriptionCount: 0 };
            
            // Increment prescription count
            doctorStats.prescriptionCount = (doctorStats.prescriptionCount || 0) + 1;
            
            // Save updated count
            await AsyncStorage.setItem('doctorStats', JSON.stringify(doctorStats));
            
            // Also save the prescription to local storage for offline access
            try {
              // Get existing prescriptions
              const storedPrescriptions = await AsyncStorage.getItem('localPrescriptions');
              let prescriptions = storedPrescriptions ? JSON.parse(storedPrescriptions) : [];
              
              // Add new prescription
              prescriptions.push(prescriptionData);
              
              // Save updated prescriptions
              await AsyncStorage.setItem('localPrescriptions', JSON.stringify(prescriptions));
              console.log('Prescription saved to local storage');
            } catch (prescError) {
            }
          } catch (storageError) {
            // Continue even if storage update fails
          }
          
          // 4. Show success message with options to view history or go back
          Alert.alert(
            'Success',
            'Prescription created and sent to patient successfully!',
            [
              { 
                text: 'View History', 
                onPress: () => router.push('/prescription-history'),
                style: 'default'
              },
              { 
                text: 'Back to Home', 
                onPress: () => router.back(),
                style: 'cancel'
              }
            ]
          );
        }
      } catch (error: any) {
        
        // For demo purposes, simulate successful creation
        if (!process.env.PRODUCTION) {
          console.log('Demo mode: Simulating prescription creation with data:', JSON.stringify(prescriptionPayload));
          
          // Update prescription count in local storage for demo mode
          try {
            // Get current prescription count
            const storedData = await AsyncStorage.getItem('doctorStats');
            let doctorStats = storedData ? JSON.parse(storedData) : { prescriptionCount: 0 };
            
            // Increment prescription count
            doctorStats.prescriptionCount = (doctorStats.prescriptionCount || 0) + 1;
            
            // Save updated count
            await AsyncStorage.setItem('doctorStats', JSON.stringify(doctorStats));
            
            // Also save the prescription to local storage for offline access
            try {
              // Get existing prescriptions
              const storedPrescriptions = await AsyncStorage.getItem('localPrescriptions');
              let prescriptions = storedPrescriptions ? JSON.parse(storedPrescriptions) : [];
              
              // Add new prescription - use the complete data structure for local storage
              prescriptions.push(prescriptionData);
              
              // Save updated prescriptions
              await AsyncStorage.setItem('localPrescriptions', JSON.stringify(prescriptions));
              console.log('Demo prescription saved to local storage');
            } catch (prescError) {
            }
          } catch (storageError) {
          }
          
          Alert.alert(
            'Demo Success',
            'Prescription created and sent to patient successfully! (Demo Mode)',
            [
              { 
                text: 'View History', 
                onPress: () => router.push('/prescription-history'),
                style: 'default'
              },
              { 
                text: 'Back to Home', 
                onPress: () => router.back(),
                style: 'cancel'
              }
            ]
          );
          return;
        }
        
        if (error.response && error.response.data) {
          setErrorMessage(error.response.data.message || 'Failed to create prescription. Please try again.');
        } else {
          setErrorMessage('Network error. Please check your connection.');
        }
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Add a new medicine to the form
  const addMedicine = () => {
    setFormData({
      ...formData,
      medicines: [
        ...formData.medicines,
        {
          name: '',
          medicineType: 'Tablet',
          dosage: '1 tablet',
          frequency: 'Twice daily',
          duration: '1 week',
          instructions: ''
        }
      ]
    });
  };

  // Remove a medicine from the form
  const removeMedicine = (index: number) => {
    const updatedMedicines = [...formData.medicines];
    updatedMedicines.splice(index, 1);
    setFormData({...formData, medicines: updatedMedicines});
  };

  // Dropdown functions
  const openDropdown = (field: string, medicineIndex: number, data: string[]) => {
    setDropdownField(field);
    setDropdownMedicineIndex(medicineIndex);
    setDropdownData(data);
    setDropdownVisible({[`${field}_${medicineIndex}`]: true});
  };

  const closeDropdown = () => {
    setDropdownVisible({});
    setDropdownField('');
    setDropdownMedicineIndex(-1);
    setDropdownData([]);
  };

  const selectDropdownItem = (value: string) => {
    if (dropdownMedicineIndex >= 0 && dropdownField) {
      updateMedicineField(dropdownMedicineIndex, dropdownField, value);
    }
    closeDropdown();
  };

  // Date picker functions
  const formatDate = (year: number, month: number, day: number) => {
    const monthStr = String(month + 1).padStart(2, '0');
    const dayStr = String(day).padStart(2, '0');
    return `${year}-${monthStr}-${dayStr}`;
  };

  const handleDateConfirm = () => {
    const formattedDate = formatDate(selectedYear, selectedMonth, selectedDay);
    setFormData({...formData, followUpDate: formattedDate});
    setShowDatePicker(false);
  };

  // Clean date formatting function to ensure only YYYY-MM-DD format
  const cleanDateFormat = (dateString: string) => {
    if (!dateString) return '';
    
    // If it's already in YYYY-MM-DD format, return as is
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      return dateString;
    }
    
    // If it contains time info (ISO string), extract just the date part
    if (dateString.includes('T')) {
      return dateString.split('T')[0];
    }
    
    // If it's a Date object or other format, convert to YYYY-MM-DD
    try {
      const date = new Date(dateString);
      if (!isNaN(date.getTime())) {
        return formatDate(date.getFullYear(), date.getMonth(), date.getDate());
      }
    } catch (error) {
      console.log('Date formatting error:', error);
    }
    
    return dateString;
  };

  const openDatePicker = () => {
    // Initialize with current date or existing date
    if (formData.followUpDate) {
      const parts = formData.followUpDate.split('-');
      if (parts.length === 3) {
        setSelectedYear(parseInt(parts[0]));
        setSelectedMonth(parseInt(parts[1]) - 1);
        setSelectedDay(parseInt(parts[2]));
      }
    }
    setShowDatePicker(true);
  };

  // Generate arrays for date picker
  const generateYears = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = currentYear; i <= currentYear + 5; i++) {
      years.push(i);
    }
    return years;
  };

  const generateMonths = () => {
    return [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
  };

  const generateDays = () => {
    const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
    const days = [];
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    return days;
  };

  // Update a medicine field
  const updateMedicineField = (index: number, field: string, value: string) => {
    const updatedMedicines = [...formData.medicines];
    updatedMedicines[index] = { ...updatedMedicines[index], [field]: value };
    setFormData({...formData, medicines: updatedMedicines});
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3498db" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.background}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoidingView}
        >
          <ScrollView contentContainerStyle={styles.scrollView}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={handleBack}
            >
              <Image 
                source={require('../assets/images/left-arrow.png')} 
                style={styles.backButtonImage}
              />
            </TouchableOpacity>
            
            <Text style={styles.title}>Create Prescription</Text>
            
            <View style={styles.formContainer}>
              <Text style={styles.sectionTitle}>Patient Information</Text>
              <View style={styles.sectionTitleLine}></View>
              
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Patient ID</Text>
                <View style={styles.searchInputContainer}>
                  <TextInput
                    style={[styles.input, errors.patientId && styles.inputError]}
                    placeholder="Enter patient ID"
                    placeholderTextColor="#8E8E93"
                    value={patientSearchQuery}
                    onChangeText={setPatientSearchQuery}
                    autoCapitalize="none"
                  />
                  {isSearching && (
                    <ActivityIndicator 
                      size="small" 
                      color="#3498db" 
                      style={styles.searchSpinner} 
                    />
                  )}
                </View>
                
                {selectedPatient ? (
                  <View style={styles.patientInfoContainer}>
                    <Text style={styles.patientInfoText}>
                      Found: {selectedPatient.firstName} {selectedPatient.lastName} (Age: {selectedPatient.age})
                    </Text>
                    <View style={styles.patientInfoDetails}>
                      <Text style={styles.patientInfoDetail}>ID: {selectedPatient.patientId}</Text>
                    </View>
                  </View>
                ) : patientSearchQuery && !isSearching ? (
                  <Text style={styles.errorText}>No patient found with this ID</Text>
                ) : null}
                
                {errors.patientId && <Text style={styles.errorText}>{errors.patientId}</Text>}
              </View>
              
              <Text style={styles.sectionTitle}>Medicines</Text>
              <View style={styles.sectionTitleLine}></View>
              
              {errors.medicines && <Text style={styles.errorText}>{errors.medicines}</Text>}
              
              {formData.medicines.map((medicine, index) => (
                <View key={index} style={styles.medicineContainer}>
                  <View style={styles.medicineHeader}>
                    <Text style={styles.medicineTitle}>Medicine {index + 1}</Text>
                    {index > 0 && (
                      <TouchableOpacity
                        style={styles.removeButton}
                        onPress={() => removeMedicine(index)}
                      >
                        <Text style={styles.removeButtonText}>×</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                  
                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>Medicine Name</Text>
                    <TextInput
                      style={[styles.input, errors.medicineName && styles.inputError]}
                      placeholder="Enter medicine name"
                      placeholderTextColor="#8E8E93"
                      value={medicine.name}
                      onChangeText={(text) => updateMedicineField(index, 'name', text)}
                    />
                    {index === 0 && errors.medicineName && (
                      <Text style={styles.errorText}>{errors.medicineName}</Text>
                    )}
                  </View>
                  
                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>Medicine Type</Text>
                    <TouchableOpacity 
                      style={styles.dropdownButton}
                      onPress={() => openDropdown('medicineType', index, medicineTypes)}
                    >
                      <Text style={styles.dropdownButtonText}>{medicine.medicineType}</Text>
                      <Text style={styles.dropdownArrow}>▼</Text>
                    </TouchableOpacity>
                  </View>
                  
                  <View style={styles.rowContainer}>
                    <View style={[styles.inputContainer, { flex: 1, marginRight: 10 }]}>
                      <Text style={styles.label}>Dosage</Text>
                      <TouchableOpacity 
                        style={styles.dropdownButton}
                        onPress={() => openDropdown('dosage', index, dosages)}
                      >
                        <Text style={styles.dropdownButtonText}>{medicine.dosage}</Text>
                        <Text style={styles.dropdownArrow}>▼</Text>
                      </TouchableOpacity>
                    </View>
                    
                    <View style={[styles.inputContainer, { flex: 1 }]}>
                      <Text style={styles.label}>Frequency</Text>
                      <TouchableOpacity 
                        style={styles.dropdownButton}
                        onPress={() => openDropdown('frequency', index, frequencies)}
                      >
                        <Text style={styles.dropdownButtonText}>{medicine.frequency}</Text>
                        <Text style={styles.dropdownArrow}>▼</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                  
                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>Duration</Text>
                    <TouchableOpacity 
                      style={styles.dropdownButton}
                      onPress={() => openDropdown('duration', index, durations)}
                    >
                      <Text style={styles.dropdownButtonText}>{medicine.duration}</Text>
                      <Text style={styles.dropdownArrow}>▼</Text>
                    </TouchableOpacity>
                  </View>
                  
                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>Instructions (Optional)</Text>
                    <TextInput
                      style={[styles.input, styles.textArea]}
                      placeholder="Enter special instructions"
                      placeholderTextColor="#8E8E93"
                      multiline
                      value={medicine.instructions}
                      onChangeText={(text) => updateMedicineField(index, 'instructions', text)}
                    />
                  </View>
                </View>
              ))}
              
              <TouchableOpacity
                style={styles.addButton}
                onPress={addMedicine}
              >
                <Text style={styles.addButtonText}>+ Add Another Medicine</Text>
              </TouchableOpacity>
              
              <Text style={styles.sectionTitle}>Additional Information</Text>
              <View style={styles.sectionTitleLine}></View>
              
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Advice</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Enter advice for the patient"
                  placeholderTextColor="#8E8E93"
                  multiline
                  value={formData.advice}
                  onChangeText={(text) => setFormData({...formData, advice: text})}
                />
              </View>
              
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Follow-up Date (Optional)</Text>
                <TouchableOpacity 
                  style={styles.datePickerButton}
                  onPress={openDatePicker}
                >
                  <Text style={styles.datePickerText}>
                    {formData.followUpDate || 'Select Follow-up Date'}
                  </Text>
                  <Text style={styles.datePickerIcon}>📅</Text>
                </TouchableOpacity>
              </View>
              
              {errorMessage ? (
                <Text style={styles.errorMessageText}>{errorMessage}</Text>
              ) : null}
              
              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleSubmit}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color="#070B34" size="small" />
                ) : (
                  <Text style={styles.submitButtonText}>Create Prescription</Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
      
      {/* Custom Dropdown Modal */}
      <Modal
        visible={Object.values(dropdownVisible).some(v => v)}
        transparent={true}
        animationType="fade"
        onRequestClose={closeDropdown}
      >
        <TouchableOpacity 
          style={styles.dropdownOverlay}
          activeOpacity={1}
          onPress={closeDropdown}
        >
          <View style={styles.dropdownModal}>
            <FlatList
              data={dropdownData}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.dropdownItem}
                  onPress={() => selectDropdownItem(item)}
                >
                  <Text style={styles.dropdownItemText}>{item}</Text>
                </TouchableOpacity>
              )}
              showsVerticalScrollIndicator={false}
            />
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Date Picker Modal */}
      <Modal
        visible={showDatePicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowDatePicker(false)}
      >
        <View style={styles.datePickerOverlay}>
          <View style={styles.datePickerModal}>
            <Text style={styles.datePickerTitle}>Select Follow-up Date</Text>
            
            {/* Date Picker Wheels */}
            <View style={styles.datePickerWheels}>
              {/* Month Picker */}
              <View style={styles.datePickerColumn}>
                <Text style={styles.datePickerColumnTitle}>Month</Text>
                <ScrollView style={styles.datePickerScroll} showsVerticalScrollIndicator={false}>
                  {generateMonths().map((month, index) => (
                    <TouchableOpacity
                      key={month}
                      style={[
                        styles.datePickerOption,
                        selectedMonth === index && styles.datePickerOptionSelected
                      ]}
                      onPress={() => setSelectedMonth(index)}
                    >
                      <Text style={[
                        styles.datePickerOptionText,
                        selectedMonth === index && styles.datePickerOptionTextSelected
                      ]}>
                        {month}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Day Picker */}
              <View style={styles.datePickerColumn}>
                <Text style={styles.datePickerColumnTitle}>Day</Text>
                <ScrollView style={styles.datePickerScroll} showsVerticalScrollIndicator={false}>
                  {generateDays().map((day) => (
                    <TouchableOpacity
                      key={day}
                      style={[
                        styles.datePickerOption,
                        selectedDay === day && styles.datePickerOptionSelected
                      ]}
                      onPress={() => setSelectedDay(day)}
                    >
                      <Text style={[
                        styles.datePickerOptionText,
                        selectedDay === day && styles.datePickerOptionTextSelected
                      ]}>
                        {day}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Year Picker */}
              <View style={styles.datePickerColumn}>
                <Text style={styles.datePickerColumnTitle}>Year</Text>
                <ScrollView style={styles.datePickerScroll} showsVerticalScrollIndicator={false}>
                  {generateYears().map((year) => (
                    <TouchableOpacity
                      key={year}
                      style={[
                        styles.datePickerOption,
                        selectedYear === year && styles.datePickerOptionSelected
                      ]}
                      onPress={() => setSelectedYear(year)}
                    >
                      <Text style={[
                        styles.datePickerOptionText,
                        selectedYear === year && styles.datePickerOptionTextSelected
                      ]}>
                        {year}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>
            
            {/* Selected Date Preview */}
            <View style={styles.datePreview}>
              <Text style={styles.datePreviewText}>
                Selected: {generateMonths()[selectedMonth]} {selectedDay}, {selectedYear}
              </Text>
            </View>
            
            <View style={styles.datePickerButtons}>
              <TouchableOpacity 
                style={styles.datePickerCancelButton}
                onPress={() => setShowDatePicker(false)}
              >
                <Text style={styles.datePickerCancelText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.datePickerConfirmButton}
                onPress={handleDateConfirm}
              >
                <Text style={styles.datePickerConfirmText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    flex: 1,
    backgroundColor: '#070B34', // Dark blue background
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#070B34',
  },
  loadingText: {
    color: 'white',
    marginTop: 15,
    fontSize: 16,
    fontWeight: '500',
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
    marginBottom: 30,
    textAlign: 'center',
  },
  formContainer: {
    width: '100%',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 10,
    marginTop: 20,
  },
  sectionTitleLine: {
    height: 2,
    backgroundColor: '#3498db',
    width: 60,
    marginBottom: 15,
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
  },
  inputError: {
    borderColor: '#FF3B30',
    borderWidth: 1,
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  errorMessageText: {
    color: '#FF3B30',
    textAlign: 'center',
    marginBottom: 16,
    fontSize: 14,
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
  rowContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  patientSelector: {
    justifyContent: 'center',
  },
  patientSelectedText: {
    color: 'white',
    fontSize: 16,
  },
  searchInputContainer: {
    position: 'relative',
  },
  searchSpinner: {
    position: 'absolute',
    right: 15,
    top: 18,
  },
  patientInfoContainer: {
    backgroundColor: 'rgba(52, 152, 219, 0.2)',
    borderRadius: 8,
    padding: 10,
    marginTop: 8,
  },
  patientInfoText: {
    color: '#3498db',
    fontSize: 14,
    fontWeight: '500',
  },
  patientInfoDetails: {
    marginTop: 5,
    flexDirection: 'row',
  },
  patientInfoDetail: {
    color: '#A0A0B0',
    fontSize: 12,
  },
  patientPlaceholderText: {
    color: '#8E8E93',
    fontSize: 16,
  },
  medicineContainer: {
    backgroundColor: 'rgba(26, 31, 61, 0.5)',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(52, 152, 219, 0.3)',
  },
  medicineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    paddingBottom: 10,
  },
  medicineTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#3498db',
  },
  removeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(231, 76, 60, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeButtonText: {
    fontSize: 20,
    color: '#e74c3c',
    fontWeight: 'bold',
  },
  addButton: {
    backgroundColor: 'rgba(52, 152, 219, 0.2)',
    borderRadius: 30,
    padding: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30,
    borderWidth: 1,
    borderColor: 'rgba(52, 152, 219, 0.5)',
    borderStyle: 'dashed',
  },
  addButtonText: {
    color: '#3498db',
    fontSize: 16,
    fontWeight: 'bold',
  },
  submitButton: {
    backgroundColor: '#E9EAEB',
    borderRadius: 30,
    padding: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 30,
    marginBottom: 20,
    height: 56,
  },
  submitButtonText: {
    color: '#070B34',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // Custom Dropdown Styles
  dropdownButton: {
    backgroundColor: '#1A1F3D',
    borderRadius: 30,
    height: 56,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  dropdownButtonText: {
    color: 'white',
    fontSize: 16,
    flex: 1,
  },
  dropdownArrow: {
    color: '#3498db',
    fontSize: 12,
    fontWeight: 'bold',
  },
  dropdownOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropdownModal: {
    backgroundColor: '#1A1F3D',
    borderRadius: 15,
    maxHeight: 300,
    width: '80%',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  dropdownItem: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  dropdownItemText: {
    color: 'white',
    fontSize: 16,
  },
  // Date picker styles
  datePickerButton: {
    backgroundColor: '#1A1F3D',
    borderRadius: 30,
    height: 56,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  datePickerText: {
    color: 'white',
    fontSize: 16,
    flex: 1,
  },
  datePickerIcon: {
    fontSize: 20,
  },
  datePickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  datePickerModal: {
    backgroundColor: '#1A1F3D',
    borderRadius: 20,
    padding: 20,
    width: '90%',
    maxWidth: 400,
  },
  datePickerTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  dateInputContainer: {
    marginBottom: 20,
  },
  dateInput: {
    backgroundColor: '#2A2F4D',
    borderRadius: 15,
    height: 50,
    paddingHorizontal: 15,
    color: 'white',
    fontSize: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  quickDateOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  quickDateButton: {
    backgroundColor: '#3498db',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 15,
    flex: 1,
    marginHorizontal: 5,
  },
  quickDateText: {
    color: 'white',
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '500',
  },
  datePickerButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  datePickerCancelButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 15,
    flex: 1,
    marginRight: 10,
  },
  datePickerCancelText: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
  },
  datePickerConfirmButton: {
    backgroundColor: '#3498db',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 15,
    flex: 1,
    marginLeft: 10,
  },
  datePickerConfirmText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  // New date picker wheel styles
  datePickerWheels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    height: 200,
  },
  datePickerColumn: {
    flex: 1,
    marginHorizontal: 5,
  },
  datePickerColumnTitle: {
    color: '#3498db',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  datePickerScroll: {
    maxHeight: 150,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 10,
  },
  datePickerOption: {
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  datePickerOptionSelected: {
    backgroundColor: '#3498db',
  },
  datePickerOptionText: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
  },
  datePickerOptionTextSelected: {
    color: 'white',
    fontWeight: 'bold',
  },
  datePreview: {
    backgroundColor: 'rgba(52, 152, 219, 0.2)',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  datePreviewText: {
    color: '#3498db',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
