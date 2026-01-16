import React, { useEffect, useState } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  StatusBar,
  SafeAreaView,
  Image,
  Dimensions,
  ActivityIndicator
} from 'react-native';
import { router } from 'expo-router';
import { checkAuth } from '../src/utils/authUtils';

import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

export default function WelcomeScreen() {
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkAuthentication = async () => {
      try {
        const userType = await checkAuth();
        if (userType === 'doctor') {
          router.replace('/doctor-home');
        } else if (userType === 'patient') {
          router.replace('/patient-home');
        } else {
          // Not authenticated, show welcome screen
          setChecking(false);
        }
      } catch (error) {
        setChecking(false);
      }
    };

    checkAuthentication();
  }, []);

  if (checking) {
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
        <View style={styles.topSection}>
          <Text style={styles.welcomeText}>Welcome</Text>
        </View>
        
        <View style={styles.logoContainer}>
          <Image
            source={require('../assets/images/icon.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.appName}>MediCare</Text>
          <Text style={styles.tagline}>Your Health, Our Priority</Text>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={styles.userButton}
            onPress={() => router.push('/doctor-login')}
          >
            <Text style={styles.buttonText}>Doctor</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.userButton}
            onPress={() => router.push('/patient-login')}
          >
            <Text style={styles.buttonText}>Patient</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.footer}>© 2025 MediCare. All rights reserved.</Text>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#050A30',
  },
  loadingText: {
    color: 'white',
    marginTop: 10,
    fontSize: 16,
  },
  background: {
    flex: 1,
    backgroundColor: '#050A30',
    padding: 20,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 50,
  },
  topSection: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 20,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginVertical: 30,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 20,
  },
  appName: {
    fontSize: 36,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 10,
  },
  tagline: {
    fontSize: 18,
    color: '#e0e0e0',
    marginBottom: 20,
  },
  buttonContainer: {
    width: '100%',
    paddingHorizontal: 40,
    marginBottom: 40,
  },
  userButton: {
     backgroundColor: '#1A1F3D',// Darker input background like in the image
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 30,
    padding: 16,
    marginVertical: 10,
    width: '100%',
    alignItems: 'center',
   
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  footer: {
    color: '#a0a0a0',
    fontSize: 12,
    marginBottom: 10,
  }
});
