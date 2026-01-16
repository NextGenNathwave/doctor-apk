import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { View, Text } from 'react-native';

// Import screens
import WelcomeScreen from './src/screens/WelcomeScreen';
import DoctorLoginScreen from './src/screens/DoctorLoginScreen';
import PatientLoginScreen from './src/screens/PatientLoginScreen';

// Placeholder screens for registration
const DoctorRegisterScreen = () => <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}><Text>Doctor Registration</Text></View>;
const PatientRegisterScreen = () => <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}><Text>Patient Registration</Text></View>;

const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Welcome" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Welcome" component={WelcomeScreen} />
        <Stack.Screen name="DoctorLogin" component={DoctorLoginScreen} />
        <Stack.Screen name="PatientLogin" component={PatientLoginScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
