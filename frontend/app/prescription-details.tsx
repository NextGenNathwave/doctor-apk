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
  Alert,
  Image
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';

// Define the prescription type
interface Prescription {
  prescriptionId: string;
  doctorId: string;
  doctorName: string;
  doctorSpecialization?: string;
  patientId: string;
  patientName: string;
  patientDetails: {
    age: number;
    patientId: string;
    gender?: string;
    bloodGroup?: string;
  };
  medicines: Array<{
    name: string;
    medicineType: string;
    dosage: string;
    frequency: string;
    duration: string;
    instructions?: string;
  }>;
  advice?: string;
  followUpDate?: string;
  extraInstructions?: string;
  clinicDetails?: {
    name: string;
    contact: string;
    doctorName: string;
    address?: string;
    doctorPhone?: string;
  };
  doctorSignature?: string;
  createdAt: string;
  status: 'active' | 'completed' | 'cancelled';
}

export default function PrescriptionDetailsScreen() {
  const [loading, setLoading] = useState(true);
  const [prescription, setPrescription] = useState<Prescription | null>(null);

  // Clean date formatting function to remove time info
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
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      }
    } catch (error) {
      console.log('Date formatting error:', error);
    }
    
    return dateString;
  };

  // Load prescription details
  useEffect(() => {
    const loadPrescription = async () => {
      try {
        setLoading(true);
        const prescriptionData = await AsyncStorage.getItem('selectedPrescription');
        
        if (prescriptionData) {
          setPrescription(JSON.parse(prescriptionData));
        } else {
          Alert.alert('Error', 'Prescription details not found');
          router.back();
        }
      } catch (error) {
        Alert.alert('Error', 'Failed to load prescription details');
        router.back();
      } finally {
        setLoading(false);
      }
    };

    loadPrescription();
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3498db" />
        <Text style={styles.loadingText}>Loading prescription details...</Text>
      </View>
    );
  }

  if (!prescription) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Prescription not found</Text>
        <TouchableOpacity
          style={styles.backToHistoryButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backToHistoryButtonText}>Back to History</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Format date
  const createdDate = new Date(prescription.createdAt);
  const formattedDate = `${createdDate.toLocaleDateString()} ${createdDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.background}>
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
          <Text style={styles.headerTitle}>Prescription Details</Text>
          <View style={styles.headerRight} />
        </View>

        <ScrollView style={styles.scrollView}>
          <LinearGradient
            colors={['#1A1F3D', '#252B50']}
            style={styles.prescriptionCard}
          >
            {/* Clinic Header */}
            {/* Clinic Name at Top Center */}
            {prescription.clinicDetails?.name && (
              <View style={styles.clinicNameContainer}>
                <Text style={styles.clinicName}>{prescription.clinicDetails.name}</Text>
              </View>
            )}
            
            {/* Doctor Info (Left) and Clinic Address (Right) */}
            <View style={styles.clinicHeader}>
              <View style={styles.clinicHeaderLeft}>
                <Text style={styles.doctorNameHeader}>{prescription.clinicDetails?.doctorName || prescription.doctorName}</Text>
                {prescription.doctorSpecialization && (
                  <Text style={styles.doctorSpecialization}>{prescription.doctorSpecialization}</Text>
                )}
                {prescription.clinicDetails?.doctorPhone && (
                  <Text style={styles.doctorPhone}>📞 {prescription.clinicDetails.doctorPhone}</Text>
                )}
              </View>
              
              <View style={styles.clinicHeaderRight}>
                {prescription.clinicDetails?.address && (
                  <Text style={styles.clinicAddress}>📍 {prescription.clinicDetails.address}</Text>
                )}
                {prescription.clinicDetails?.contact && (
                  <Text style={styles.clinicContact}>☎️ {prescription.clinicDetails.contact}</Text>
                )}
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.prescriptionHeader}>
              <View>
                <Text style={styles.prescriptionId}>ID: {prescription.prescriptionId}</Text>
                <Text style={styles.prescriptionDate}>Created: {formattedDate}</Text>
              </View>
              <View style={[
                styles.statusBadge,
                prescription.status === 'active' ? styles.statusActive :
                prescription.status === 'completed' ? styles.statusCompleted :
                styles.statusCancelled
              ]}>
                <Text style={styles.statusText}>{prescription.status}</Text>
              </View>
            </View>

            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>Patient Information</Text>
              <View style={styles.sectionContent}>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Name:</Text>
                  <Text style={styles.infoValue}>{prescription.patientName}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Patient ID:</Text>
                  <Text style={styles.infoValue}>{prescription.patientDetails.patientId}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Age:</Text>
                  <Text style={styles.infoValue}>{prescription.patientDetails.age}</Text>
                </View>
              </View>
            </View>

            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>Medicines</Text>
              {prescription.medicines.map((medicine, index) => (
                <View key={index} style={styles.medicineItem}>
                  <View style={styles.medicineHeader}>
                    <Text style={styles.medicineName}>{medicine.name}</Text>
                    <Text style={styles.medicineType}>{medicine.medicineType}</Text>
                  </View>
                  <View style={styles.medicineDetails}>
                    <View style={styles.medicineDetailItem}>
                      <Text style={styles.medicineDetailLabel}>Dosage:</Text>
                      <Text style={styles.medicineDetailValue}>{medicine.dosage}</Text>
                    </View>
                    <View style={styles.medicineDetailItem}>
                      <Text style={styles.medicineDetailLabel}>Frequency:</Text>
                      <Text style={styles.medicineDetailValue}>{medicine.frequency}</Text>
                    </View>
                    <View style={styles.medicineDetailItem}>
                      <Text style={styles.medicineDetailLabel}>Duration:</Text>
                      <Text style={styles.medicineDetailValue}>{medicine.duration}</Text>
                    </View>
                    {medicine.instructions && (
                      <View style={styles.medicineInstructions}>
                        <Text style={styles.medicineDetailLabel}>Instructions:</Text>
                        <Text style={styles.medicineDetailValue}>{medicine.instructions}</Text>
                      </View>
                    )}
                  </View>
                </View>
              ))}
            </View>

            {(prescription.advice || prescription.followUpDate || prescription.extraInstructions) && (
              <View style={styles.sectionContainer}>
                <Text style={styles.sectionTitle}>Additional Information</Text>
                <View style={styles.sectionContent}>
                  {prescription.advice && (
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Advice:</Text>
                      <Text style={styles.infoValue}>{prescription.advice}</Text>
                    </View>
                  )}
                  {prescription.followUpDate && (
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Follow-up:</Text>
                      <Text style={styles.infoValue}>{cleanDateFormat(prescription.followUpDate)}</Text>
                    </View>
                  )}
                  {prescription.extraInstructions && (
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Instructions:</Text>
                      <Text style={styles.infoValue}>{prescription.extraInstructions}</Text>
                    </View>
                  )}
                </View>
              </View>
            )}

            {/* Doctor Signature at Bottom Right */}
            <View style={styles.signatureContainer}>
              <View style={styles.signatureBox}>
                {prescription.doctorSignature ? (
                  <Image 
                    source={{ uri: prescription.doctorSignature }}
                    style={styles.signatureImage}
                    resizeMode="contain"
                  />
                ) : (
                  <Text style={styles.signaturePlaceholder}>___________________</Text>
                )}
                <Text style={styles.signatureLabel}>Doctor's Signature</Text>
                <Text style={styles.signatureDoctorName}>{prescription.clinicDetails?.doctorName || prescription.doctorName}</Text>
              </View>
            </View>
          </LinearGradient>
        </ScrollView>
      </View>
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#070B34',
    padding: 20,
  },
  errorText: {
    color: 'white',
    fontSize: 18,
    marginBottom: 20,
    textAlign: 'center',
  },
  backToHistoryButton: {
    backgroundColor: '#3498db',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
  },
  backToHistoryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
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
  scrollView: {
    flex: 1,
    padding: 16,
  },
  prescriptionCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  prescriptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  prescriptionId: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  prescriptionDate: {
    fontSize: 14,
    color: '#A0A0B0',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusActive: {
    backgroundColor: 'rgba(52, 152, 219, 0.2)',
  },
  statusCompleted: {
    backgroundColor: 'rgba(46, 204, 113, 0.2)',
  },
  statusCancelled: {
    backgroundColor: 'rgba(231, 76, 60, 0.2)',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
    textTransform: 'capitalize',
  },
  sectionContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    paddingBottom: 8,
  },
  sectionContent: {
    paddingHorizontal: 4,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  infoLabel: {
    width: 90,
    fontSize: 14,
    color: '#A0A0B0',
  },
  infoValue: {
    flex: 1,
    fontSize: 14,
    color: 'white',
  },
  medicineItem: {
    backgroundColor: 'rgba(26, 31, 61, 0.5)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  medicineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  medicineName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  medicineType: {
    fontSize: 12,
    color: '#3498db',
    backgroundColor: 'rgba(52, 152, 219, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  medicineDetails: {
    marginTop: 4,
  },
  medicineDetailItem: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  medicineDetailLabel: {
    width: 80,
    fontSize: 14,
    color: '#A0A0B0',
  },
  medicineDetailValue: {
    flex: 1,
    fontSize: 14,
    color: 'white',
  },
  medicineInstructions: {
    marginTop: 4,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  // Clinic Header Styles
  clinicNameContainer: {
    alignItems: 'center',
    marginBottom: 15,
    paddingBottom: 10,
    borderBottomWidth: 2,
    borderBottomColor: '#3498db',
  },
  clinicHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 15,
    marginBottom: 15,
  },
  clinicHeaderLeft: {
    flex: 1,
    alignItems: 'flex-start',
  },
  clinicHeaderRight: {
    flex: 1,
    alignItems: 'flex-end',
  },
  doctorNameHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  doctorSpecialization: {
    fontSize: 14,
    color: '#3498db',
    marginBottom: 4,
  },
  doctorPhone: {
    fontSize: 13,
    color: '#A0A0B0',
  },
  clinicName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#3498db',
    textAlign: 'center',
  },
  clinicAddress: {
    fontSize: 13,
    color: '#A0A0B0',
    textAlign: 'right',
    marginBottom: 4,
  },
  clinicContact: {
    fontSize: 13,
    color: '#A0A0B0',
    textAlign: 'right',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginBottom: 15,
  },
  // Signature Styles
  signatureContainer: {
    marginTop: 30,
    alignItems: 'flex-end',
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  signatureBox: {
    alignItems: 'center',
    minWidth: 200,
  },
  signatureImage: {
    width: 150,
    height: 80,
    marginBottom: 5,
  },
  signatureText: {
    fontSize: 24,
    fontFamily: 'cursive',
    color: 'white',
    marginBottom: 5,
  },
  signaturePlaceholder: {
    fontSize: 18,
    color: '#A0A0B0',
    marginBottom: 5,
  },
  signatureLabel: {
    fontSize: 12,
    color: '#A0A0B0',
    marginTop: 5,
  },
  signatureDoctorName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 5,
  },
});
