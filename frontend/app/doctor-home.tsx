import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  StatusBar,
  Image,
  ActivityIndicator,
  RefreshControl,
  Alert
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { getUserData } from '../src/utils/authUtils';
import { authService } from '../src/services/api';
import api from '../src/services/api';
import PrescriptionCard, { Prescription } from '../src/components/PrescriptionCard';

// Using Prescription interface from PrescriptionCard component

export default function DoctorHomeScreen() {
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [prescriptionCount, setPrescriptionCount] = useState(0);
  const [patientCount, setPatientCount] = useState(0);
  const [recentPrescriptions, setRecentPrescriptions] = useState<Prescription[]>([]);


  const fetchDoctorData = async (isRefresh = false) => {
    try {
      // Only set loading to true for initial load, not for refreshes
      if (!isRefresh) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      // First get basic user data from storage
      const basicData = await getUserData() as { _id: string, firstName: string, lastName: string };

      if (!isRefresh) {
        // Only set basic data immediately if not refreshing
        setUserData(basicData);
      }

      // Then fetch complete profile data from API
      const response = await api.get('/doctors/me');

      if (response.data && response.data.success) {
        console.log('Doctor data refreshed from API');
        setUserData(response.data.data);
      } else {
        // If API fails, use the basic data
        setUserData(basicData);
      }

      // Fetch recent prescriptions from API only
      try {
        if (basicData && basicData._id) {
          console.log('Fetching prescriptions for doctor ID:', basicData._id);

          const prescriptionsResponse = await api.get(`/prescriptions/doctor/${basicData._id}`);
          console.log('Prescriptions API response:', prescriptionsResponse.data);

          if (prescriptionsResponse.data && prescriptionsResponse.data.success) {
            const prescriptions = prescriptionsResponse.data.prescriptions || [];
            
            // Get the 2 most recent prescriptions
            const recent = prescriptions
              .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
              .slice(0, 2) as Prescription[];

            setRecentPrescriptions(recent);
            setPrescriptionCount(prescriptions.length);
            
            // Count unique patients
            const uniquePatients = new Set(prescriptions.map((p: any) => p.patientId));
            setPatientCount(uniquePatients.size);
            
            console.log('API Data - Prescriptions:', prescriptions.length, 'Patients:', uniquePatients.size);
          } else {
            // No prescriptions found - set to 0
            setRecentPrescriptions([]);
            setPrescriptionCount(0);
            setPatientCount(0);
          }
        }
      } catch (prescError) {
        console.log('Failed to fetch prescriptions from API:', prescError);
        // For production, show 0 counts if API fails
        setRecentPrescriptions([]);
        setPrescriptionCount(0);
        setPatientCount(0);
      }
    } catch (error) {
      // Fallback to basic data from storage if needed
      if (isRefresh) {
        const basicData = await getUserData();
        setUserData(basicData);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };



  // Use the fetchDoctorData function in useEffect
  // Refresh all data from APIs
  const refreshDashboardData = async () => {
    if (userData && userData._id) {
      await fetchDoctorData(true); // This already fetches prescriptions and sets counts
      // No need for separate fetchPatientCount() since it's done in fetchDoctorData()
    }
  };

  // Initial data load
  useEffect(() => {
    fetchDoctorData();
  }, []);

  // Refresh data when userData is available
  useEffect(() => {
    if (userData && userData._id) {
      // Data is already fetched in fetchDoctorData(), no need for separate calls
    }
  }, [userData]);

  // Debug effect to log prescriptions when they change
  useEffect(() => {
    console.log('Recent prescriptions updated:', recentPrescriptions.length);
    if (recentPrescriptions.length > 0) {
      console.log('First prescription:', recentPrescriptions[0].prescriptionId);
    }
  }, [recentPrescriptions]);

  // Set up periodic refresh for production app
  useEffect(() => {
    // Refresh data every 60 seconds for production
    const refreshIntervalId = setInterval(() => {
      if (userData && userData._id) {
        refreshDashboardData();
      }
    }, 60000); // Refresh every 60 seconds

    return () => {
      clearInterval(refreshIntervalId);
    };
  }, []);

  // Handle manual refresh
  const handleRefresh = () => {
    refreshDashboardData();
  };

  const handleLogout = async () => {
    try {
      await authService.logout();
      router.replace('/');
    } catch (error) {
      // Silent error handling for logout
    }
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
              onRefresh={handleRefresh}
              colors={['#3498db']}
              tintColor={'#3498db'}
            />
          }
        >
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => router.push('/doctor-profile')}
            >
              <View style={styles.profileImageContainer}>
                <Image
                  source={require('../assets/images/user.png')}
                  style={styles.profileImage}
                />
              </View>
            </TouchableOpacity>
            <Text style={styles.welcomeText}>Welcome, Dr. {userData?.firstName || 'Doctor'}</Text>
          </View>

          {/* Doctor Profile Card */}
          <TouchableOpacity
            style={styles.doctorProfileCard}
            onPress={() => router.push('/doctor-profile')}
          >
            <View style={styles.doctorInfoContainer}>
              <Text style={styles.clinicName}>{userData?.clinicName || 'Medical Clinic'}</Text>
              <Text style={styles.doctorName}>Dr. {userData?.firstName || ''} {userData?.lastName || ''}</Text>
              <Text style={styles.doctorAge}>{userData?.age || '35'} years old</Text>
              <Text style={styles.doctorSpecialization}>{userData?.specialization || 'General Medicine'}</Text>
              <View style={styles.experienceContainer}>
                <Text style={styles.experienceLabel}>Experience</Text>
                <Text style={styles.experienceValue}>{userData?.yearsOfExperience || '10'} years</Text>
              </View>
            </View>
            <View style={styles.cardProfileImageContainer}>
              {userData?.profileImage ? (
                <Image
                  source={{ uri: userData.profileImage }}
                  style={styles.cardProfileImage}
                />
              ) : (
                userData?.gender === 'Female' ? (
                  <Image
                    source={require('../assets/images/woman.png')}
                    style={styles.cardProfileImage}
                  />
                ) : (
                  <Image
                    source={require('../assets/images/man.png')}
                    style={styles.cardProfileImage}
                  />
                )
              )}
            </View>
          </TouchableOpacity>

          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{patientCount}</Text>
              <Text style={styles.statLabel}>Patients</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{prescriptionCount}</Text>
              <Text style={styles.statLabel}>Prescriptions</Text>
            </View>
          </View>

          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.actionsContainer}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => router.push('/create-prescription')}
              >
                <Text style={styles.actionButtonIcon}>➕</Text>
                <Text style={styles.actionButtonText}>Create Prescription</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => router.push('/prescription-history')}
              >
                <Text style={styles.actionButtonIcon}>🗒</Text>
                <Text style={styles.actionButtonText}>Prescription History</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Prescriptions Section */}
          <View style={styles.sectionContainer}>
            <View style={styles.sectionTitleContainer}>
              <Text style={styles.sectionTitle}>Recent Prescriptions</Text>
              <TouchableOpacity
                onPress={refreshDashboardData}
                style={styles.refreshButton}
              >
                <Text style={styles.refreshButtonText}>
                  ↻ Refresh Now
                </Text>
              </TouchableOpacity>
            </View>

            {recentPrescriptions.length > 0 ? (
              <View style={styles.medicationsContainer}>
                {recentPrescriptions.map((prescription: Prescription) => (
                  <PrescriptionCard
                    key={prescription.id || prescription.prescriptionId}
                    prescription={prescription}
                    compact={true} // Use compact mode for home screen
                  />
                ))}
              </View>
            ) : (
              <View style={styles.emptyStateContainer}>
                <Text style={styles.emptyStateIcon}>💊</Text>
                <Text style={styles.emptyStateText}>No prescriptions available</Text>
              </View>
            )}
          </View>

          <TouchableOpacity
            style={styles.viewAllButton}
            onPress={() => router.push('/prescription-history')}
          >
            <Text style={styles.viewAllButtonText}>View All Prescriptions</Text>
          </TouchableOpacity>
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
    marginTop: 20,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    flex: 1,
    marginLeft: 15,
  },
  profileImageContainer: {
    width: 40,
    height: 40,
    borderRadius: 25,
    overflow: 'hidden',
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  profileImage: {
    width: '80%',
    height: '80%',
    resizeMode: 'contain',
  },
  // Doctor Profile Card Styles
  doctorProfileCard: {
    backgroundColor: '#1A1F3D',
    borderRadius: 20,
    padding: 20,
    marginBottom: 30,
    flexDirection: 'row',
    justifyContent: 'space-between',
    shadowColor: '#3498db',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'white',
    position: 'relative',
  },
  doctorInfoContainer: {
    flex: 1,
    paddingRight: 15,
  },
  clinicName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3498db',
    textAlign: 'center',
    letterSpacing: 0.5,
    position: 'absolute',
    top: 0,
    left: 100,
    zIndex: 10,
  },
  doctorName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 35,
  },
  doctorAge: {
    fontSize: 16,
    color: '#A0A0B0',
    marginBottom: 5,
  },
  doctorSpecialization: {
    fontSize: 18,
    fontWeight: '600',
    color: '#3498db',
    marginBottom: 10,
  },
  experienceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(52, 152, 219, 0.2)',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  experienceLabel: {
    fontSize: 14,
    color: '#A0A0B0',
    marginRight: 5,
  },
  experienceValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: 'white',
  },
  cardProfileImageContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    overflow: 'hidden',
    backgroundColor: '#3498db',
    borderWidth: 3,
    borderColor: 'white',
    marginTop: 40
  },
  cardProfileImage: {
    width: '100%',
    height: '100%',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  statCard: {
    backgroundColor: '#bec8ffff',
    borderRadius: 15,
    padding: 15,
    width: '48%',
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3498db',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000049ff',
    textAlign: 'center',
  },
  sectionContainer: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 15,
  },
  actionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionButton: {
    backgroundColor: '#bec8ffff',
    borderRadius: 15,
    padding: 15,
    width: '48%',
    alignItems: 'center',
    marginBottom: 15,
  },
  actionButtonIcon: {
    fontSize: 24,
    marginBottom: 10,
  },
  actionButtonText: {
    color: '#000049ff',
    fontSize: 14,
    fontWeight: '500',
  },
  logoutButton: {
    backgroundColor: '#FF3B30',
    borderRadius: 30,
    padding: 15,
    alignItems: 'center',
    marginTop: 20,
  },
  logoutButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // Section title container
  sectionTitleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  // Medications styles
  medicationsContainer: {
    marginBottom: 10,
  },
  medicationCard: {
    borderRadius: 15,
    padding: 15,
    marginBottom: 10,
  },
  medicationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  medicationName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  medicationRemainingContainer: {
    backgroundColor: 'rgba(52, 152, 219, 0.2)',
    borderRadius: 15,
    paddingVertical: 5,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  medicationRemainingNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#3498db',
    marginRight: 5,
  },
  medicationRemainingText: {
    fontSize: 12,
    color: '#A0A0B0',
  },
  medicationDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  medicationDetail: {
    flex: 1,
  },
  medicationDetailLabel: {
    fontSize: 12,
    color: '#A0A0B0',
    marginBottom: 5,
  },
  medicationDetailValue: {
    fontSize: 14,
    color: 'white',
    fontWeight: '500',
  },
  patientNameContainer: {
    backgroundColor: 'rgba(52, 152, 219, 0.1)',
    borderRadius: 10,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  patientNameLabel: {
    fontSize: 12,
    color: '#A0A0B0',
    marginRight: 5,
  },
  patientNameValue: {
    fontSize: 14,
    color: 'white',
    fontWeight: '500',
  },
  // Empty state styles
  emptyStateContainer: {
    backgroundColor: '#1A1F3D',
    borderRadius: 15,
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateIcon: {
    fontSize: 40,
    marginBottom: 15,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#A0A0B0',
    marginBottom: 20,
    textAlign: 'center',
  },
  // View all button
  viewAllButton: {
    borderWidth: 1,
    borderColor: 'white',
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginBottom: 15,
  },
  viewAllButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  // New styles for prescriptions
  prescriptionIdContainer: {
    backgroundColor: 'rgba(52, 152, 219, 0.2)',
    borderRadius: 15,
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  prescriptionIdText: {
    fontSize: 12,
    color: '#3498db',
    fontWeight: 'bold',
  },
  viewDetails: {
    fontSize: 14,
    color: '#3498db',
  },
  refreshButton: {
    backgroundColor: 'rgba(52, 152, 219, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: 'rgba(250, 252, 253, 1)',
  },
  refreshButtonText: {
    color: '#ffffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  autoUpdateText: {
    color: '#A0A0B0',
    fontSize: 12,
    marginTop: -5,
    marginBottom: 10,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  prescriptionDateContainer: {
    backgroundColor: 'rgba(52, 152, 219, 0.1)',
    borderRadius: 10,
    padding: 8,
    marginTop: 10,
  },
  prescriptionDateLabel: {
    fontSize: 12,
    color: '#A0A0B0',
    marginRight: 5,
  },
  prescriptionDateValue: {
    fontSize: 14,
    color: 'white',
    fontWeight: '500',
  },
});
