import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
  Alert,
  FlatList,
  Image,
  TextInput
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { getUserData } from '../src/utils/authUtils';
import api from '../src/services/api';
import PrescriptionCard, { Prescription } from '../src/components/PrescriptionCard';

// Define user data type
interface UserData {
  _id?: string;
  id?: string;
  firstName: string;
  lastName: string;
  email?: string;
  specialization?: string;
  profileImage?: string;
}

export default function PrescriptionHistoryScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [filteredPrescriptions, setFilteredPrescriptions] = useState<Prescription[]>([]);
  const [isOffline, setIsOffline] = useState(false);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  // Load prescriptions from local storage
  const loadFromLocalStorage = async () => {
    try {
      const storedPrescriptions = await AsyncStorage.getItem('localPrescriptions');
      if (storedPrescriptions) {
        const parsedPrescriptions = JSON.parse(storedPrescriptions) as Prescription[];
        console.log('Loaded', parsedPrescriptions.length, 'prescriptions from local storage');
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
      
      // Fetch from API
      setIsOffline(false);
      
      // Get user data
      const data = await getUserData();
      // Get user data from storage
      if (data) {
        setUserData(data as UserData);
      }
      
      // Use proper type assertion to avoid TypeScript errors
      const typedData = data as UserData;
      
      // Get the doctor ID from either _id or id field
      const doctorId = typedData?._id || typedData?.id;
      
      if (!typedData || !doctorId) {
        setLoading(false);
        setRefreshing(false);
        return;
      }
      
      // Make API call to get prescriptions
      const apiUrl = `/prescriptions/doctor/${doctorId}`;
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
            setPrescriptions(prescriptionsArray);
            
            // Save to local storage for offline access
            await AsyncStorage.setItem('localPrescriptions', JSON.stringify(prescriptionsArray));
          } else {
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
  
  // Filter prescriptions based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      // Show all prescriptions when no search query
      setFilteredPrescriptions(prescriptions);
    } else {
      // Filter prescriptions by patient ID, patient name, or prescription ID
      const filtered = prescriptions.filter((prescription) => {
        const searchLower = searchQuery.toLowerCase();
        
        // Search by patient ID
        if (prescription.patientDetails?.patientId?.toLowerCase().includes(searchLower)) {
          return true;
        }
        
        // Search by patient name
        if (prescription.patientName?.toLowerCase().includes(searchLower)) {
          return true;
        }
        
        // Search by prescription ID
        if (prescription.prescriptionId?.toLowerCase().includes(searchLower)) {
          return true;
        }
        
        // Search by medicine names
        if (prescription.medicines?.some(medicine => 
          medicine.name?.toLowerCase().includes(searchLower)
        )) {
          return true;
        }
        
        return false;
      });
      
      setFilteredPrescriptions(filtered);
    }
  }, [prescriptions, searchQuery]);

  // Handle search input
  const handleSearch = (text: string) => {
    setSearchQuery(text);
    setIsSearching(text.length > 0);
  };

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
        <Text style={styles.loadingText}>Loading prescriptions...</Text>
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
          <Text style={styles.headerTitle}>Prescription History</Text>
          <View style={styles.headerRight} />
        </View>
        
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search by Patient ID, Name, or Medicine..."
            placeholderTextColor="#6B7280"
            value={searchQuery}
            onChangeText={handleSearch}
          />
          {isSearching && (
            <TouchableOpacity 
              style={styles.clearButton}
              onPress={() => handleSearch('')}
            >
              <Text style={styles.clearButtonText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
        
        {/* Search Results Info */}
        {searchQuery.trim() && (
          <View style={styles.searchResultsInfo}>
            <Text style={styles.searchResultsText}>
              {filteredPrescriptions.length} prescription(s) found for "{searchQuery}"
            </Text>
          </View>
        )}
        
        
        
        {filteredPrescriptions.length > 0 ? (
          <FlatList
            data={filteredPrescriptions}
            renderItem={renderPrescriptionItem}
            keyExtractor={item => item.id || item.prescriptionId || String(Math.random())}
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
            <Text style={styles.emptyText}>No prescriptions found</Text>
            <TouchableOpacity
              style={styles.createButton}
              onPress={() => router.push('/create-prescription')}
            >
              <Text style={styles.createButtonText}>Create Prescription</Text>
            </TouchableOpacity>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0B1426',
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
  emptyText: {
    fontSize: 18,
    color: '#A0A0B0',
    marginBottom: 20,
  },
  createButton: {
    backgroundColor: '#bec8ffff',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
  },
  createButtonText: {
    color: '#000049ff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 15,
    backgroundColor: '#bec8ffff',
    borderRadius: 25,
    paddingHorizontal: 15,
  },
  searchInput: {
    flex: 1,
    height: 45,
    color: '#000049ff',
    fontSize: 16,
    paddingVertical: 10,
  },
  clearButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#000049ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  clearButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  searchResultsInfo: {
    marginHorizontal: 20,
    marginBottom: 10,
  },
  searchResultsText: {
    color: '#A0A0B0',
    fontSize: 14,
    fontStyle: 'italic',
  },
});