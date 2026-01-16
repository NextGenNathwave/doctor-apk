import React, { useEffect, useState, useCallback } from 'react';
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
  Dimensions,
  RefreshControl,
  Alert,
  TextInput,
  Modal,
  Platform
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { getUserData } from '../src/utils/authUtils';
import { authService } from '../src/services/api';
import api from '../src/services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Get screen dimensions for responsive design
const { width, height } = Dimensions.get('window');

// Fake data for UI demonstration
const healthTips = [
  { id: 1, title: 'Stay Hydrated', content: 'Drink at least 8 glasses of water daily for optimal health.', icon: '💧' },
  { id: 2, title: 'Regular Exercise', content: 'Aim for at least 30 minutes of moderate activity daily.', icon: '🏃' },
  { id: 3, title: 'Balanced Diet', content: 'Include fruits, vegetables, and proteins in every meal.', icon: '🥗' },
];

const medications = [
  { id: 1, name: 'Amoxicillin', dosage: '500mg', frequency: 'Twice daily', remaining: 6 },
  { id: 2, name: 'Lisinopril', dosage: '10mg', frequency: 'Once daily', remaining: 12 },
];

// Health tracking data
// Step tracking - Commented out for future enhancement
// const todaySteps = 6248;
// const dailyStepGoal = 10000;
// const stepProgress = (todaySteps / dailyStepGoal) * 100;

const waterIntake = 0; // Default to 0 for new users
const defaultWaterGoal = 8;
const waterProgress = (waterIntake / defaultWaterGoal) * 100;

export default function PatientHomeScreen() {
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeHealthTip, setActiveHealthTip] = useState(0);
  const [recentPrescriptions, setRecentPrescriptions] = useState<any[]>([]);

  // Health tracking state
  // Step tracking - Commented out for future enhancement
  // const [steps, setSteps] = useState(todaySteps);
  // const [stepGoal, setStepGoal] = useState(dailyStepGoal);
  // const [showStepGoalModal, setShowStepGoalModal] = useState(false);
  // const [newStepGoal, setNewStepGoal] = useState(dailyStepGoal.toString());

  // Step tracking (manual) - Commented out for future enhancement
  // const [isStepTrackingActive, setIsStepTrackingActive] = useState(false);
  // const [showStartTrackingModal, setShowStartTrackingModal] = useState(false);
  // const [stepIncrement, setStepIncrement] = useState(1); // Number of steps to add per tap
  // const [showStepCongratulations, setShowStepCongratulations] = useState(false);

  const [water, setWater] = useState(waterIntake);
  const [waterGoal, setWaterGoal] = useState(defaultWaterGoal);
  const [showWaterTargetModal, setShowWaterTargetModal] = useState(false);
  const [newWaterGoal, setNewWaterGoal] = useState(defaultWaterGoal.toString());
  const [showCongratulations, setShowCongratulations] = useState(false);

  // Function to fetch recent prescriptions
  const fetchRecentPrescriptions = useCallback(async () => {
    try {
      const data = await getUserData();
      console.log('Patient data for prescriptions:', data);

      // Check for both _id and id fields
      const patientId = (data as any)._id || (data as any).id;

      if (data && patientId) {
        console.log('Fetching prescriptions for patient:', patientId);

        const response = await api.get(`/prescriptions/patient/${patientId}`);
        console.log('Prescriptions API response:', response.data);

        if (response.data && response.data.success && response.data.prescriptions) {
          // Get the 2 most recent prescriptions
          const recent = response.data.prescriptions.slice(0, 2);
          setRecentPrescriptions(recent);
          console.log('Loaded', recent.length, 'recent prescriptions');
        } else {
          console.log('No prescriptions found or invalid response');
          setRecentPrescriptions([]);
        }
      } else {
        console.log('No patient ID found in user data');
      }
    } catch (error) {
      setRecentPrescriptions([]);
    }
  }, []);

  // Function to fetch user data
  const fetchUserData = useCallback(async (isRefresh = false) => {
    try {
      if (!isRefresh) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      const data = await getUserData();
      console.log('User data loaded:', data);
      setUserData(data);

      // Fetch recent prescriptions
      await fetchRecentPrescriptions();
    } catch (error) {
      Alert.alert('Error', 'Failed to load profile data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [fetchRecentPrescriptions]);

  // Step tracking functions - Commented out for future enhancement
  /*
  // Add steps manually
  const addSteps = () => {
    if (!isStepTrackingActive) return;
    
    setSteps((prev: number) => {
      const newSteps = Math.min(prev + stepIncrement, stepGoal);
      // Show congratulations if goal reached
      if (prev < stepGoal && newSteps >= stepGoal) {
        setShowStepCongratulations(true);
        // Hide congratulations after 3 seconds
        setTimeout(() => setShowStepCongratulations(false), 3000);
      }
      return newSteps;
    });
  };
  
  // Start step tracking (manual mode)
  const startStepTracking = () => {
    setIsStepTrackingActive(true);
    setShowStartTrackingModal(false);
    setSteps(0); // Reset steps when starting tracking
    
    Alert.alert(
      'Manual Step Tracking Started', 
      'Tap the + button to add steps as you walk. Tap the × button to stop tracking.'
    );
  };
  
  // Stop step tracking
  const stopStepTracking = () => {
    setIsStepTrackingActive(false);
    Alert.alert('Tracking Stopped', `Your final step count is ${steps}.`);
  };
  */

  // Initial data load
  useEffect(() => {
    fetchUserData();

    // Set up health tip rotation
    const interval = setInterval(() => {
      setActiveHealthTip(prev => (prev + 1) % healthTips.length);
    }, 5000);

    // Clean up interval
    return () => {
      clearInterval(interval);
    };
  }, [fetchUserData]);

  // Refresh data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchUserData(true);
      return () => { };
    }, [fetchUserData])
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
      <LinearGradient
        colors={['#070B34', '#1A1F3D', '#0D1854']}
        style={styles.loadingContainer}
      >
        <View style={styles.loadingContent}>
          <ActivityIndicator size="large" color="#3498db" />
          <Text style={styles.loadingText}>Loading your health dashboard...</Text>
        </View>
      </LinearGradient>
    );
  }

  // Function to handle water intake tracking
  const handleWaterChange = (increment: boolean) => {
    setWater(prev => {
      const newValue = increment ? Math.min(prev + 1, waterGoal) : Math.max(prev - 1, 0);

      // Show congratulations when target is reached
      if (increment && newValue === waterGoal && prev < waterGoal) {
        setShowCongratulations(true);
        // Hide congratulations after 3 seconds
        setTimeout(() => setShowCongratulations(false), 3000);
      }

      return newValue;
    });
  };

  // Step goal setting function - Commented out for future enhancement
  /*
  // Function to handle step goal setting
  const handleSetStepGoal = () => {
    const goal = parseInt(newStepGoal);
    if (!isNaN(goal) && goal > 0 && goal <= 50000) {
      setStepGoal(goal);
      // Reset step tracker to 0 when a new goal is set
      setSteps(0);
      setShowStepGoalModal(false);
      // Show confirmation toast
      Alert.alert('Goal Updated', `Step goal set to ${goal.toLocaleString()} steps. Tracker has been reset.`);
    } else {
      Alert.alert('Invalid Goal', 'Please enter a number between 1 and 50,000');
    }
  };
  */

  // Function to handle water goal setting
  const handleSetWaterGoal = () => {
    const goal = parseInt(newWaterGoal);
    if (!isNaN(goal) && goal > 0 && goal <= 20) {
      setWaterGoal(goal);
      // Reset water tracker to 0 when a new goal is set
      setWater(0);
      setShowWaterTargetModal(false);
      // Show confirmation toast
      Alert.alert('Goal Updated', `Water goal set to ${goal} glasses. Tracker has been reset.`);
    } else {
      Alert.alert('Invalid Goal', 'Please enter a number between 1 and 20');
    }
  };

  // Function to handle manual refresh
  const handleRefresh = () => {
    fetchUserData(true);
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
              onRefresh={handleRefresh}
              colors={['#3498db']}
              tintColor={'#3498db'}
            />
          }
        >
          <TouchableOpacity
            style={styles.profileNavIcon}
            onPress={() => router.push('/patient-profile')}
          >
            <Image
              source={require('../assets/images/user.png')}
              style={styles.navIconImage}
            />
          </TouchableOpacity>

          {/* Header with welcome message and profile */}
          <View style={styles.header}>

            <LinearGradient
              colors={['rgba(52, 152, 219, 0.2)', 'rgba(52, 152, 219, 0.05)']}
              style={styles.headerGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >

              <View style={styles.headerContent}>
                <View style={styles.headerTextContainer}>
                  <Text style={styles.greetingText}>Hello,</Text>
                  <Text style={styles.welcomeText}>{userData?.firstName || 'Patient'}</Text>
                  <View style={styles.patientIdContainer}>
                    <Text style={styles.patientIdLabel}>Patient ID</Text>
                    <Text style={styles.patientId}>{userData?.patientId || 'N/A'}</Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.profileImageContainer}
                  onPress={() => router.push('/patient-profile')}
                >
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
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </View>

          {/* Health Tip Card - Rotating tips */}
          <View style={styles.healthTipContainer}>
            <LinearGradient
              colors={['#3498db', '#2980b9']}
              style={styles.healthTipGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.healthTipIcon}>{healthTips[activeHealthTip].icon}</Text>
              <View style={styles.healthTipContent}>
                <Text style={styles.healthTipTitle}>{healthTips[activeHealthTip].title}</Text>
                <Text style={styles.healthTipText}>{healthTips[activeHealthTip].content}</Text>
              </View>
            </LinearGradient>
            <View style={styles.healthTipIndicators}>
              {healthTips.map((_, index) => (
                <View
                  key={index}
                  style={[styles.healthTipIndicator, index === activeHealthTip && styles.healthTipIndicatorActive]}
                />
              ))}
            </View>
          </View>

          {/* Quick Actions Section */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.statsContainer}>
              <TouchableOpacity 
                style={styles.statCard}
                onPress={() => router.push('/nearby-doctors')}
              >
                <Text style={styles.actionStatIcon}>🏥</Text>
                <Text style={styles.statLabel}>Find Nearby</Text>
                <Text style={styles.statSubLabel}>Doctors</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.statCard}
                onPress={() => router.push('/patient-prescription-history')}
              >
                <Text style={styles.actionStatIcon}>📋</Text>
                <Text style={styles.statLabel}>Prescription</Text>
                <Text style={styles.statSubLabel}>History</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Health Tracking Section */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Today's Health Tracking</Text>

            {/* Step Tracking - Commented out for future enhancement */}
            {/*
            <View style={styles.trackingCard}>
              <View style={styles.trackingHeader}>
                <View style={styles.trackingIconContainer}>
                  <Text style={styles.trackingIcon}>👣</Text>
                </View>
                <View style={styles.trackingInfo}>
                  <Text style={styles.trackingTitle}>Step Count</Text>
                  <Text style={styles.trackingSubtitle}>Daily Goal: {stepGoal.toLocaleString()} steps</Text>
                </View>
                {!isStepTrackingActive ? (
                  <TouchableOpacity 
                    style={[styles.addButton, { backgroundColor: 'rgba(46, 204, 113, 0.2)', borderColor: 'rgba(46, 204, 113, 0.5)' }]}
                    onPress={() => setShowStartTrackingModal(true)}
                  >
                    <Text style={styles.addButtonText}>+</Text>
                  </TouchableOpacity>
                ) : (
                  <View style={{flexDirection: 'row'}}>
                    <TouchableOpacity 
                      style={[styles.addButton, { marginRight: 5, backgroundColor: 'rgba(46, 204, 113, 0.2)', borderColor: 'rgba(46, 204, 113, 0.5)' }]}
                      onPress={addSteps}
                    >
                      <Text style={styles.addButtonText}>+</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.addButton, { backgroundColor: 'rgba(231, 76, 60, 0.2)', borderColor: 'rgba(231, 76, 60, 0.5)' }]}
                      onPress={stopStepTracking}
                    >
                      <Text style={[styles.addButtonText, { color: '#e74c3c' }]}>×</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
              
              <View style={styles.progressContainer}>
                <View style={styles.progressBackground}>
                  <View 
                    style={[styles.progressFill, { width: `${(steps / stepGoal) * 100}%` }]}
                  />
                </View>
                <View style={styles.progressLabels}>
                  <Text style={styles.progressCount}>{steps.toLocaleString()}</Text>
                  <View style={{flexDirection: 'row', alignItems: 'center'}}>
                    <Text style={styles.progressPercent}>{Math.round((steps / stepGoal) * 100)}%</Text>
                    <TouchableOpacity onPress={() => setShowStepGoalModal(true)}>
                      <Text style={styles.editGoalText}>Edit</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
              
              {isStepTrackingActive && (
                <View style={styles.activeTrackingIndicator}>
                  <Text style={styles.activeTrackingText}>Tracking Active</Text>
                  <View style={styles.pulsingDot} />
                </View>
              )}
            </View>
            */}

            {/* Water Tracking */}
            <View style={styles.trackingCard}>
              <View style={styles.trackingHeader}>
                <View style={[styles.trackingIconContainer, { backgroundColor: 'rgba(52, 152, 219, 0.2)' }]}>
                  <Text style={styles.trackingIcon}>💧</Text>
                </View>
                <View style={styles.trackingInfo}>
                  <Text style={styles.trackingTitle}>Water Intake</Text>
                  <TouchableOpacity
                    onPress={() => setShowWaterTargetModal(true)}
                    style={styles.goalButton}
                  >
                    <Text style={styles.trackingSubtitle}>Daily Goal: {waterGoal} glasses</Text>

                  </TouchableOpacity>
                </View>
                <View style={styles.waterControls}>
                  <TouchableOpacity
                    style={[styles.waterButton, water <= 0 && styles.waterButtonDisabled]}
                    onPress={() => handleWaterChange(false)}
                    disabled={water <= 0}
                  >
                    <Text style={styles.waterButtonText}>-</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.waterButton, water >= waterGoal && styles.waterButtonDisabled]}
                    onPress={() => handleWaterChange(true)}
                    disabled={water >= waterGoal}
                  >
                    <Text style={styles.waterButtonText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.waterGlassesContainer}>
                {Array.from({ length: waterGoal }).map((_, index) => (
                  <View
                    key={index}
                    style={[styles.waterGlass, index < water && styles.waterGlassFilled]}
                  >
                    <Text style={styles.waterGlassIcon}>{index < water ? '💧' : '⚪'}</Text>
                  </View>
                ))}
              </View>
              <Text style={styles.waterIntakeText}>
                {water} of {waterGoal} glasses consumed
                {water === waterGoal && ' - Goal achieved! 🎉'}
              </Text>

              {/* Progress bar for water */}
              <View style={styles.progressContainer}>
                <View style={styles.progressBackground}>
                  <View
                    style={[styles.progressFill, { width: `${(water / waterGoal) * 100}%`, backgroundColor: '#3498db' }]}
                  />
                </View>
                <View style={styles.progressLabels}>
                  <Text style={styles.progressCount}>{Math.round((water / waterGoal) * 100)}%</Text>
                  <TouchableOpacity onPress={() => setShowWaterTargetModal(true)}>
                    <Text style={styles.editGoalText}>Edit</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>



          {/* Recent Prescriptions */}
          <View style={styles.sectionContainer}>
            <View style={styles.sectionTitleContainer}>
              <Text style={styles.sectionTitle}>My Prescriptions</Text>
              <Text style={styles.sectionSubtitle}>(Last 2 prescriptions)</Text>
            </View>

            {recentPrescriptions.length > 0 ? (
              <View style={styles.medicationsContainer}>
                {recentPrescriptions.map((prescription, index) => (
                  <TouchableOpacity
                    key={prescription.id || prescription.prescriptionId || index}
                    onPress={() => {
                      // Store prescription and navigate to details
                      AsyncStorage.setItem('selectedPrescription', JSON.stringify(prescription))
                        .then(() => router.push('/prescription-details'))
                        .catch((err: any) => { });
                    }}
                  >
                    <LinearGradient
                      colors={['#1A1F3D', '#252B50']}
                      style={styles.medicationCard}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 0, y: 1 }}
                    >
                      <View style={styles.medicationHeader}>
                        <Text style={styles.medicationName}>Rx {prescription.prescriptionId}</Text>
                        <View style={styles.prescriptionDateContainer}>
                          <Text style={styles.prescriptionDate}>
                            {new Date(prescription.createdAt).toLocaleDateString()}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.medicationDetails}>
                        <View style={styles.medicationDetail}>
                          <Text style={styles.medicationDetailLabel}>Doctor</Text>
                          <Text style={styles.medicationDetailValue}>{prescription.doctorName}</Text>
                        </View>
                        <View style={styles.medicationDetail}>
                          <Text style={styles.medicationDetailLabel}>Medicines</Text>
                          <Text style={styles.medicationDetailValue}>
                            {prescription.medicines?.length || 0} items
                          </Text>
                        </View>
                      </View>
                    </LinearGradient>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <View style={styles.emptyStateContainer}>
                <Text style={styles.emptyStateIcon}>💊</Text>
                <Text style={styles.emptyStateText}>No prescriptions yet</Text>
              </View>
            )}
          </View>
          {/* View All button removed - patients can only see 2 most recent prescriptions */}
        </ScrollView>

        {/* Water Target Setting Modal */}
        {showWaterTargetModal && (
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <Text style={styles.modalTitle}>Set Water Goal</Text>
              <Text style={styles.modalSubtitle}>How many glasses of water do you want to drink today?</Text>

              <TextInput
                style={styles.modalInput}
                value={newWaterGoal}
                onChangeText={setNewWaterGoal}
                keyboardType="number-pad"
                placeholder="Enter number of glasses"
                placeholderTextColor="#A0A0B0"
              />

              <View style={styles.modalButtonsContainer}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalCancelButton]}
                  onPress={() => setShowWaterTargetModal(false)}
                >
                  <Text style={styles.modalCancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalSaveButton]}
                  onPress={handleSetWaterGoal}
                >
                  <Text style={styles.modalSaveButtonText}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* Step Tracking Modals - Commented out for future enhancement */}
        {/*
        {showStartTrackingModal && (
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <Text style={styles.modalTitle}>Start Step Tracking</Text>
              <Text style={styles.modalSubtitle}>Set your step goal. After starting, tap the + button to count your steps as you walk.</Text>
              
              <TextInput
                style={styles.modalInput}
                value={newStepGoal}
                onChangeText={setNewStepGoal}
                keyboardType="number-pad"
                placeholder="Enter your step goal"
                placeholderTextColor="#A0A0B0"
              />
              
              <View style={styles.modalButtonsContainer}>
                <TouchableOpacity 
                  style={[styles.modalButton, styles.modalCancelButton]}
                  onPress={() => setShowStartTrackingModal(false)}
                >
                  <Text style={styles.modalCancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.modalButton, styles.modalSaveButton]}
                  onPress={() => {
                    const goal = parseInt(newStepGoal);
                    if (!isNaN(goal) && goal > 0 && goal <= 50000) {
                      setStepGoal(goal);
                      setSteps(0); // Reset steps when starting tracking
                      startStepTracking();
                    } else {
                      Alert.alert('Invalid Goal', 'Please enter a number between 1 and 50,000');
                    }
                  }}
                >
                  <Text style={styles.modalSaveButtonText}>Start Tracking</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
        
        {showStepGoalModal && (
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <Text style={styles.modalTitle}>Set Step Goal</Text>
              <Text style={styles.modalSubtitle}>How many steps do you want to walk today?</Text>
              
              <TextInput
                style={styles.modalInput}
                value={newStepGoal}
                onChangeText={setNewStepGoal}
                keyboardType="number-pad"
                placeholder="Enter number of steps"
                placeholderTextColor="#A0A0B0"
              />
              
              <View style={styles.modalButtonsContainer}>
                <TouchableOpacity 
                  style={[styles.modalButton, styles.modalCancelButton]}
                  onPress={() => setShowStepGoalModal(false)}
                >
                  <Text style={styles.modalCancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.modalButton, styles.modalSaveButton]}
                  onPress={handleSetStepGoal}
                >
                  <Text style={styles.modalSaveButtonText}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
        */}

        {/* Water Congratulations Modal */}
        {showCongratulations && (
          <View style={styles.congratsContainer}>
            <LinearGradient
              colors={['#3498db', '#2ecc71']}
              style={styles.congratsContent}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.congratsIcon}>🎉</Text>
              <Text style={styles.congratsTitle}>Congratulations!</Text>
              <Text style={styles.congratsText}>You've reached your water intake goal for today!</Text>
            </LinearGradient>
          </View>
        )}

        {/* Steps Congratulations Modal - Commented out for future enhancement */}
        {/*
        {showStepCongratulations && (
          <View style={styles.congratsContainer}>
            <LinearGradient
              colors={['#f39c12', '#e74c3c']}
              style={styles.congratsContent}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.congratsIcon}>🎉</Text>
              <Text style={styles.congratsTitle}>Congratulations!</Text>
              <Text style={styles.congratsText}>You've reached your step goal for today!</Text>
            </LinearGradient>
          </View>
        )}
        */}
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
  },
  loadingContent: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loadingText: {
    color: 'white',
    marginTop: 15,
    fontSize: 16,
    fontWeight: '500',
  },
  // Header styles
  header: {
    marginTop: 20,
    marginBottom: 20,
    borderRadius: 20,
    overflow: 'hidden',
  },
  headerGradient: {
    borderRadius: 20,
    padding: 20,
  },
  profileNavIcon: {
    top: 5,
    left: 5,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgb(255, 255, 255)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    borderWidth: 1,
    borderColor: 'rgb(255, 255, 255))',
    elevation: 5,
  },
  navIconImage: {
    width: 24,
    height: 24,
    tintColor: '#000000ff',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTextContainer: {
    flex: 1,
    marginRight: 15,
  },
  greetingText: {
    fontSize: 16,
    color: '#A0A0B0',
    marginBottom: 5,
  },
  welcomeText: {
    fontSize: 26,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 10,
  },
  patientIdContainer: {
    backgroundColor: 'rgba(26, 31, 61, 0.7)',
    borderRadius: 10,
    padding: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '90%',
  },
  profileImageContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    overflow: 'hidden',
    backgroundColor: '#1A1F3D',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#3498db',
    shadowColor: '#3498db',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  profileImage: {
    width: '100%',
    height: '100%',
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
  // Health tip styles
  healthTipContainer: {
    marginBottom: 20,
    borderRadius: 15,
    overflow: 'hidden',
  },
  healthTipGradient: {
    flexDirection: 'row',
    padding: 15,
    alignItems: 'center',
    borderRadius: 15,
  },
  healthTipIcon: {
    fontSize: 30,
    marginRight: 15,
  },
  healthTipContent: {
    flex: 1,
  },
  healthTipTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5,
  },
  healthTipText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 20,
  },
  healthTipIndicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 10,
  },
  healthTipIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginHorizontal: 3,
  },
  healthTipIndicatorActive: {
    backgroundColor: '#3498db',
    width: 16,
  },
  // Stats styles
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 25,
  },
  statCard: {
    backgroundColor: '#bec8ffff',
    borderRadius: 15,
    padding: 15,
    width: '48%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(52, 152, 219, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  statIcon: {
    fontSize: 24,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#3498db',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 14,
    color: '#000049ff',
    textAlign: 'center',
    fontWeight: '500',
  },
  // Section styles
  sectionContainer: {
    marginBottom: 25,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#A0A0B0',
    marginTop: 4,
  },
  seeAllText: {
    color: '#3498db',
    fontSize: 14,
    fontWeight: '500',
  },
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
  // Quick actions styles
  actionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionButton: {
    width: '48%',
    alignItems: 'center',
    marginBottom: 15,
  },
  actionIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  actionButtonIcon: {
    fontSize: 24,
    color: 'white',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  // Medical info styles
  medicalInfoContainer: {
    borderRadius: 15,
    padding: 15,
  },
  medicalInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(160, 160, 176, 0.2)',
  },
  medicalInfoLabel: {
    color: '#A0A0B0',
    fontSize: 14,
  },
  medicalInfoValue: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  // Health tracking styles
  trackingCard: {
    backgroundColor: '#1A1F3D',
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  trackingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  trackingIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(46, 204, 113, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  trackingIcon: {
    fontSize: 24,
  },
  trackingInfo: {
    flex: 1,
  },
  trackingTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5,
  },
  trackingSubtitle: {
    fontSize: 12,
    color: '#A0A0B0',
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(46, 204, 113, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(46, 204, 113, 0.5)',
  },
  addButtonText: {
    color: '#2ecc71',
    fontSize: 20,
    fontWeight: 'bold',
  },
  trackingButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    minWidth: 80,
  },
  startButton: {
    backgroundColor: 'rgba(46, 204, 113, 0.3)',
    borderColor: '#2ecc71',
  },
  stopButton: {
    backgroundColor: 'rgba(231, 76, 60, 0.3)',
    borderColor: '#e74c3c',
  },
  trackingButtonText: {
    fontWeight: 'bold',
    fontSize: 16,
    color: 'white',
    textAlign: 'center',
  },
  activeTrackingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  activeTrackingText: {
    color: '#2ecc71',
    fontSize: 14,
    fontWeight: 'bold',
    marginRight: 10,
  },
  pulsingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#2ecc71',
    opacity: 0.8,
  },
  progressContainer: {
    marginTop: 5,
  },
  progressBackground: {
    height: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 10,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#2ecc71',
    borderRadius: 5,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',

  },
  progressCount: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  progressPercent: {
    color: '#2ecc71',
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 16,
  },
  waterControls: {
    flexDirection: 'row',
  },
  waterButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(52, 152, 219, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
    borderWidth: 1,
    borderColor: 'rgba(52, 152, 219, 0.5)',
  },
  waterButtonDisabled: {
    opacity: 0.5,
  },
  waterButtonText: {
    color: '#3498db',
    fontSize: 20,
    fontWeight: 'bold',
  },
  waterGlassesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 10,
  },
  waterGlass: {
    margin: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  waterGlassFilled: {
    transform: [{ scale: 1.2 }],
  },
  waterGlassIcon: {
    fontSize: 24,
  },
  waterIntakeText: {
    color: '#A0A0B0',
    fontSize: 14,
    textAlign: 'center',
  },
  goalButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  editGoalText: {
    color: '#fff',
    fontSize: 14,
    marginLeft: 10,
    fontWeight: 'bold',
    position: 'absolute',
    right: 0,
    bottom: 0,
    fontFamily: 'Poppins_600SemiBold',
    zIndex: 1,
  },
  // Modal styles
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContainer: {
    backgroundColor: '#1A1F3D',
    borderRadius: 15,
    padding: 20,
    width: '80%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
  modalTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  modalSubtitle: {
    color: '#A0A0B0',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
  },
  modalInput: {
    backgroundColor: '#252B50',
    borderRadius: 10,
    padding: 15,
    width: '100%',
    color: 'white',
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  modalButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  modalButton: {
    borderRadius: 30,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    width: '48%',
  },
  modalCancelButton: {
    backgroundColor: 'rgba(255, 59, 48, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 59, 48, 0.5)',
  },
  modalCancelButtonText: {
    color: '#FF3B30',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalSaveButton: {
    backgroundColor: 'rgba(52, 152, 219, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(52, 152, 219, 0.5)',
  },
  modalSaveButtonText: {
    color: '#3498db',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // Congratulations styles
  congratsContainer: {
    position: 'absolute',
    top: 100,
    left: 20,
    right: 20,
    alignItems: 'center',
    zIndex: 1000,
  },
  congratsContent: {
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
  congratsIcon: {
    fontSize: 40,
    marginBottom: 10,
  },
  congratsTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  congratsText: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
  },
  // Logout button
  logoutButton: {
    backgroundColor: '#FF3B30',
    borderRadius: 30,
    padding: 15,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 10,
    shadowColor: '#FF3B30',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  logoutButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  prescriptionDateContainer: {
    backgroundColor: 'rgba(52, 152, 219, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  prescriptionDate: {
    color: '#3498db',
    fontSize: 12,
    fontWeight: '600',
  },
  actionStatIcon: {
    fontSize: 32,
    marginBottom: 8,
    color: '#3498db',
  },
  statSubLabel: {
    color: '#000049ff',
    fontSize: 12,
    textAlign: 'center',
    opacity: 0.7,
  },
});
