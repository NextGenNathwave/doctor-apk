import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Alert,
  Image,
  ScrollView
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { getUserData } from '../src/utils/authUtils';
import NearbyDoctors from '../src/components/NearbyDoctors';

interface UserData {
  _id?: string;
  id?: string;
  firstName: string;
  lastName: string;
  areaId?: string;
  coordinates?: {
    lat: number;
    lon: number;
  };
}

export default function NearbyDoctorsScreen() {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const data = await getUserData() as UserData;
      setUserData(data);
    } catch (error) {
      console.error('Error loading user data:', error);
      Alert.alert('Error', 'Failed to load user data');
    } finally {
      setLoading(false);
    }
  };

  const handleDoctorSelect = (doctor: any) => {
    Alert.alert(
      'Doctor Selected',
      `You selected Dr. ${doctor.firstName} ${doctor.lastName}`,
      [
        {
          text: 'View Profile',
          onPress: () => {
            // Navigate to doctor profile or booking screen
            console.log('Navigate to doctor profile:', doctor._id);
          }
        },
        {
          text: 'Book Appointment',
          onPress: () => {
            // Navigate to appointment booking
            console.log('Book appointment with:', doctor._id);
          }
        },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient
          colors={['#0B1426', '#1A2332', '#000000']}
          locations={[0.0, 0.5, 1.0]}
          style={styles.background}
        >
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  if (!userData?.areaId) {
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
            <Text style={styles.headerTitle}>Nearby Doctors</Text>
            <View style={styles.headerRight} />
          </View>

          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>
              Location information not available. Please update your profile with your area.
            </Text>
            <TouchableOpacity 
              style={styles.updateButton}
              onPress={() => router.push('/edit-patient-profile')}
            >
              <Text style={styles.updateButtonText}>Update Profile</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </SafeAreaView>
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
          <Text style={styles.headerTitle}>Nearby Doctors</Text>
          <View style={styles.headerRight} />
        </View>

        <View style={styles.content}>
          <NearbyDoctors
            patientAreaId={userData.areaId}
            maxDistance={15} // 15km radius
            onDoctorSelect={handleDoctorSelect}
          />
        </View>
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
  content: {
    flex: 1,
  },
  infoContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    margin: 20,
    padding: 15,
    borderRadius: 15,
  },
  infoText: {
    color: 'white',
    fontSize: 14,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: 'white',
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  updateButton: {
    backgroundColor: '#bec8ffff',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
  },
  updateButtonText: {
    color: '#000049ff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
