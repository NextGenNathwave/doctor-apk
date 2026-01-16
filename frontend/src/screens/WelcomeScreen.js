import React from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  ImageBackground, 
  StatusBar,
  SafeAreaView,
  Image
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const WelcomeScreen = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={['#0a2463', '#1e3a8a', '#001845']}
        style={styles.background}
      >
        <View style={styles.logoContainer}>
          <Image
            source={require('../../assets/images/icon.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.appName}>MediCare</Text>
          <Text style={styles.tagline}>Your Health, Our Priority</Text>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={[styles.button, styles.doctorButton]}
            onPress={() => navigation.navigate('DoctorLogin')}
          >
            <View style={styles.buttonContent}>
              <Image 
                source={require('../../assets/images/splash-icon.png')} 
                style={styles.buttonIcon} 
                tintColor="white"
              />
              <Text style={styles.buttonText}>Doctor</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.button, styles.patientButton]}
            onPress={() => navigation.navigate('PatientLogin')}
          >
            <View style={styles.buttonContent}>
              <Image 
                source={require('../../assets/images/splash-icon.png')} 
                style={styles.buttonIcon} 
                tintColor="white"
              />
              <Text style={styles.buttonText}>Patient</Text>
            </View>
          </TouchableOpacity>
        </View>

        <Text style={styles.footer}>© 2025 MediCare. All rights reserved.</Text>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 50,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 20,
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
  button: {
    borderRadius: 12,
    padding: 16,
    marginVertical: 10,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  doctorButton: {
    backgroundColor: '#3498db',
  },
  patientButton: {
    backgroundColor: '#2ecc71',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonIcon: {
    width: 24,
    height: 24,
    marginRight: 10,
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
  },
});

export default WelcomeScreen;
