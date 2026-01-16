import React, { useState, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
  RefreshControl
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import { getUserData } from '../src/utils/authUtils';
import { authService } from '../src/services/api';
import api from '../src/services/api';
import { LinearGradient } from 'expo-linear-gradient';

export default function PatientProfileScreen() {
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Function to fetch patient data
  const fetchPatientData = useCallback(async (isRefresh = false) => {
    try {
      // Only set loading to true for initial load, not for refreshes
      if (!isRefresh) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }
      
      // First get the basic user data from storage
      const basicData = await getUserData();
      
      // Then fetch complete profile data from API
      const response = await api.get('/patients/me');
      
      if (response.data && response.data.success) {
        console.log('Profile data refreshed from API');
        setUserData(response.data.data);
        setLastUpdated(new Date());
      } else {
        // If API fails, use the basic data
        console.log('Using local data:', basicData);
        setUserData(basicData);
        setLastUpdated(new Date());
      }
    } catch (error) {
      // Fallback to basic data from storage
      const basicData = await getUserData();
      setUserData(basicData);
      Alert.alert('Error', 'Failed to refresh profile data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Refresh data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      console.log('Profile screen focused - refreshing data');
      // Use refresh mode to avoid full loading screen
      fetchPatientData(true);
      return () => {
        // Cleanup function when screen is unfocused
        console.log('Profile screen unfocused');
      };
    }, [fetchPatientData])
  );

  const handleLogout = async () => {
    try {
      await authService.logout();
      router.replace('/');
    } catch (error) {
      // Silently handle logout errors
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

  // Add a manual refresh function
  const handleManualRefresh = () => {
    fetchPatientData(true);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
       <LinearGradient
  colors={['#0B1426', '#1A2332', '#000000']}
  locations={[0.0, 0.5, 1.0]}
  style={styles.background}
>
        <ScrollView 
          contentContainerStyle={styles.scrollView}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleManualRefresh}
              colors={['#3498db']}
              tintColor={'#3498db'}
            />
          }
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
            <Text style={styles.title}>My Profile</Text>
          </View>

          <View style={styles.profileImageSection}>
            <View style={styles.profileImageContainer}>
              {/* Debug info */}
              <Text style={{color: 'white', fontSize: 8, position: 'absolute', top: -10, right: 0}}>
                Gender: {userData?.gender || 'unknown'}
              </Text>
              
              {userData?.gender === 'Female' ? (
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
            <Text style={styles.patientName}>{userData?.firstName} {userData?.lastName}</Text>
            <View style={styles.patientIdContainer}>
              <Text style={styles.patientIdLabel}>Patient ID</Text>
              <Text style={styles.patientId}>{userData?.patientId || 'N/A'}</Text>
            </View>
          </View>

          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Personal Information</Text>
            <View style={styles.detailsContainer}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>First Name</Text>
                <Text style={styles.detailValue}>{userData?.firstName || 'N/A'}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Last Name</Text>
                <Text style={styles.detailValue}>{userData?.lastName || 'N/A'}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Email</Text>
                <Text style={styles.detailValue}>{userData?.email || 'N/A'}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Mobile</Text>
                <Text style={styles.detailValue}>{userData?.mobile || 'N/A'}</Text>
              </View>
            </View>
          </View>

          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Medical Information</Text>
            <View style={styles.detailsContainer}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Age</Text>
                <Text style={styles.detailValue}>{userData?.age || 'N/A'}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Gender</Text>
                <Text style={styles.detailValue}>{userData?.gender || 'N/A'}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Blood Group</Text>
                <Text style={styles.detailValue}>{userData?.bloodGroup || 'N/A'}</Text>
              </View>
            </View>
          </View>

          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Address</Text>
            <View style={styles.detailsContainer}>
              <Text style={styles.addressText}>{userData?.address || 'No address provided'}</Text>
            </View>
          </View>

          {lastUpdated && (
            <View style={styles.lastUpdatedContainer}>
              <Text style={styles.lastUpdatedText}>
                Last updated: {lastUpdated.toLocaleTimeString()} {lastUpdated.toLocaleDateString()}
              </Text>
            </View>
          )}

          <View style={styles.buttonsContainer}>
            <TouchableOpacity 
              style={styles.editButton}
              onPress={() => router.push('/edit-patient-profile')}
            >
              <Text style={styles.editButtonText}>Edit Profile</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.logoutButton}
              onPress={handleLogout}
            >
              <Text style={styles.logoutButtonText}>Logout</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
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
    marginBottom: 30,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
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
  patientName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 10,
  },
  patientIdContainer: {
    backgroundColor: '#1A1F3D',
    borderRadius: 10,
    padding: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '80%',
  },
  patientIdLabel: {
    color: '#A0A0B0',
    fontSize: 14,
  },
  patientId: {
    color: '#3498db',
    fontSize: 16,
    fontWeight: 'bold',
  },
  sectionContainer: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#3498db',
    marginBottom: 15,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  detailsContainer: {
    backgroundColor: '#1A1F3D',
    borderRadius: 15,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    borderWidth: 1,
    borderColor: 'rgba(52, 152, 219, 0.2)',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(160, 160, 176, 0.2)',
  },
  detailLabel: {
    color: '#A0A0B0',
    fontSize: 16,
    fontWeight: '400',
  },
  detailValue: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    textShadowColor: 'rgba(52, 152, 219, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  addressText: {
    color: 'white',
    fontSize: 16,
    lineHeight: 24,
  },
  buttonsContainer: {
    marginTop: 20,
  },
  editButton: {
    backgroundColor: '#ffffffff',
    borderRadius: 30,
    padding: 15,
    alignItems: 'center',
    marginBottom: 15,
  },
  editButtonText: {
    color: 'black',
    fontSize: 16,
    fontWeight: 'bold',
  },
  logoutButton: {
    backgroundColor: '#FF3B30',
    borderRadius: 30,
    padding: 15,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  lastUpdatedContainer: {
    alignItems: 'center',
    marginVertical: 10,
  },
  lastUpdatedText: {
    color: '#A0A0B0',
    fontSize: 12,
    fontStyle: 'italic',
  },
});
