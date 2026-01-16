import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
  Alert,
  FlatList,
  Image
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { getUserData } from '../src/utils/authUtils';
import api from '../src/services/api';
import PrescriptionCard, { Prescription } from '../src/components/PrescriptionCard';
import { LinearGradient } from 'expo-linear-gradient';

// Define user data type
interface UserData {
  _id?: string;
  id?: string;
  firstName: string;
  lastName: string;
  email?: string;
  role?: string;
}

export default function PatientPrescriptionHistoryScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [isOffline, setIsOffline] = useState(false);
  const [userData, setUserData] = useState<UserData | null>(null);

  // Load prescriptions from local storage
  const loadFromLocalStorage = async () => {
    try {
      const storedPrescriptions = await AsyncStorage.getItem('patientPrescriptions');
      if (storedPrescriptions) {
        const parsedPrescriptions = JSON.parse(storedPrescriptions) as Prescription[];
        console.log('Loaded', parsedPrescriptions.length, 'patient prescriptions from local storage');
        setPrescriptions(parsedPrescriptions);
      } else {
        console.log('No prescriptions found in local storage');
        setPrescriptions([]);
      }
    } catch (error) {
      setPrescriptions([]);
    }
  };

  // Load prescriptions from API
  const loadPrescriptions = async (isRefresh = false) => {
    try {
      if (!isRefresh) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }
      
      // Always try to fetch from API first
      console.log('Fetching patient prescriptions from API');
      setIsOffline(false);
      
      // Get user data
      const data = await getUserData();
      if (data) {
        setUserData(data as UserData);
      }
      
      // Use proper type assertion
      const typedData = data as UserData;
      
      // Get the patient ID
      const patientId = typedData?._id || typedData?.id;
      
      if (!typedData || !patientId) {
        console.log('No patient data available');
        setLoading(false);
        setRefreshing(false);
        return;
      }
      
      console.log('Fetching prescriptions for patient:', patientId);
      
      // Make API call to get prescriptions for this patient
      const apiUrl = `/prescriptions/patient/${patientId}`;
      const response = await api.get(apiUrl);
      
      if (response.data && response.data.success) {
        if (response.data.prescriptions) {
          // Ensure we have an array to work with
          let prescriptionsArray;
          if (Array.isArray(response.data.prescriptions)) {
            prescriptionsArray = response.data.prescriptions;
          } else if (typeof response.data.prescriptions === 'object') {
            prescriptionsArray = Object.values(response.data.prescriptions);
          } else {
            prescriptionsArray = [];
          }
          
          if (prescriptionsArray.length > 0) {
            console.log(`Found ${prescriptionsArray.length} prescriptions for patient from API`);
            setPrescriptions(prescriptionsArray);
            
            // Save to local storage for offline access
            await AsyncStorage.setItem('patientPrescriptions', JSON.stringify(prescriptionsArray));
          } else {
            console.log('No prescriptions found for this patient');
            setPrescriptions([]);
          }
        } else {
          console.log('No prescriptions field in the response');
          setPrescriptions([]);
        }
      } else {
        console.log('Invalid API response or no prescriptions');
        setPrescriptions([]);
      }
    } catch (error) {
      // Only use local storage as fallback if API fails
      setIsOffline(true);
      await loadFromLocalStorage();
      
      // Show a more user-friendly error message
      Alert.alert(
        'Connection Error', 
        'Unable to connect to the server. Showing locally stored data as fallback.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  useEffect(() => {
    // Load prescriptions when component mounts
    loadPrescriptions();
  }, []);
  
  // Debug effect to log prescriptions when they change
  useEffect(() => {
    console.log('Patient prescriptions state updated:', prescriptions.length, 'items');
    if (prescriptions.length > 0) {
      console.log('First prescription:', prescriptions[0].prescriptionId);
    }
  }, [prescriptions]);

  // Handle refresh
  const handleRefresh = () => {
    loadPrescriptions(true);
  };
  
  // Handle view prescription details
  const handleViewPrescription = (prescription: Prescription) => {
    // Store the selected prescription in AsyncStorage for viewing
    AsyncStorage.setItem('selectedPrescription', JSON.stringify(prescription))
      .then(() => {
        router.push('/prescription-details');
      })
      .catch((error: unknown) => {
        Alert.alert('Error', 'Failed to view prescription details.');
      });
  };

  // Render prescription item
  const renderPrescriptionItem = ({ item }: { item: Prescription }) => {
    
    // Make sure the item has all required fields for PrescriptionCard
    const validPrescription: Prescription = {
      ...item,
      prescriptionId: item.prescriptionId || item.id || `rx-${Math.random().toString(36).substring(2, 9)}`,
      doctorId: item.doctorId || '',
      doctorName: item.doctorName || 'Doctor',
      patientId: item.patientId || '',
      patientName: item.patientName || 'Patient',
      medicines: Array.isArray(item.medicines) ? item.medicines : [],
      createdAt: item.createdAt || new Date().toISOString(),
      status: item.status || 'active'
    };
    
    // Use the shared PrescriptionCard component with onPress handler
    return (
      <TouchableOpacity onPress={() => handleViewPrescription(validPrescription)}>
        <PrescriptionCard prescription={validPrescription} />
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3498db" />
        <Text style={styles.loadingText}>Loading your prescriptions...</Text>
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
          <Text style={styles.headerTitle}>My Prescriptions</Text>
          <View style={styles.headerRight} />
        </View>
        
        
        {/* Info banner about prescription limit */}
        <View style={styles.infoBar}>
          <Text style={styles.infoIcon}>ℹ️</Text>
          <Text style={styles.infoText}>You can view your 2 most recent prescriptions</Text>
        </View>
        
        {prescriptions.length > 0 ? (
          <FlatList
            data={prescriptions}
            renderItem={renderPrescriptionItem}
            keyExtractor={item => item.prescriptionId || String(Math.random())}
            contentContainerStyle={styles.prescriptionsList}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                colors={["#3498db"]}
                tintColor="#3498db"
              />
            }
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyText}>No prescriptions yet</Text>
            <Text style={styles.emptySubtext}>
              Your doctor will send prescriptions here
            </Text>
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
    backgroundColor: '#070B34',
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 15,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonImage: {
    width: 20,
    height: 20,
    tintColor: 'white',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    flex: 1,
    textAlign: 'center',
  },
  headerRight: {
    width: 36,
  },
  prescriptionsList: {
    padding: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyIcon: {
    fontSize: 60,
    marginBottom: 20,
  },
  emptyText: {
    fontSize: 20,
    color: '#A0A0B0',
    marginBottom: 10,
    fontWeight: '600',
  },
  emptySubtext: {
    fontSize: 16,
    color: '#707080',
    textAlign: 'center',
  },
  infoBar: {
    backgroundColor: '#3498db',
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  infoIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  infoText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
});
