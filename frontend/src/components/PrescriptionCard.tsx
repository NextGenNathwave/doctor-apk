import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Define prescription interface
export interface Prescription {
  id?: string;
  prescriptionId: string;
  date?: string;
  doctorId: string;
  doctorName: string;
  patientId: string;
  patientName: string;
  patientDetails?: {
    patientId: string;
    age: number;
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
  createdAt: string;
  status: 'active' | 'completed' | 'cancelled';
}

interface PrescriptionCardProps {
  prescription: Prescription;
  compact?: boolean; // For a more compact view in the doctor home screen
}

const PrescriptionCard: React.FC<PrescriptionCardProps> = ({ prescription, compact = false }) => {
  // Format date
  const createdDate = new Date(prescription.createdAt);
  const formattedDate = `${createdDate.toLocaleDateString()} ${createdDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  
  // Handle view prescription details
  const handleViewPrescription = () => {
    // Store the selected prescription in AsyncStorage for viewing
    AsyncStorage.setItem('selectedPrescription', JSON.stringify(prescription))
      .then(() => {
        router.push('/prescription-details');
      })
      .catch(error => {
        Alert.alert('Error', 'Failed to view prescription details.');
      });
  };

  return (
    <TouchableOpacity
      style={styles.prescriptionCard}
      onPress={handleViewPrescription}
    >
      <LinearGradient
        colors={['#1A1F3D', '#252B50']}
        style={styles.prescriptionCardGradient}
      >
        <View style={styles.prescriptionHeader}>
          <Text style={styles.patientName}>{prescription.patientName}</Text>
          <Text style={styles.prescriptionDate}>{formattedDate}</Text>
        </View>
        
        <View style={styles.prescriptionDetails}>
          <Text style={styles.prescriptionId}>ID: {prescription.prescriptionId}</Text>
          <Text style={styles.patientId}>Patient ID: {prescription.patientDetails?.patientId || 'N/A'}</Text>
        </View>
        
        <View style={styles.medicinesList}>
          <Text style={styles.medicinesTitle}>Medicines:</Text>
          {prescription.medicines && Array.isArray(prescription.medicines) ? (
            <>
              {prescription.medicines.slice(0, compact ? 1 : 2).map((medicine, index) => (
                <Text key={index} style={styles.medicineItem}>
                  • {medicine.name} ({medicine.dosage || 'Standard'}, {medicine.frequency || 'As directed'})
                </Text>
              ))}
              {prescription.medicines.length > (compact ? 1 : 2) && (
                <Text style={styles.moreItems}>+{prescription.medicines.length - (compact ? 1 : 2)} more</Text>
              )}
            </>
          ) : (
            <Text style={styles.medicineItem}>No medicines listed</Text>
          )}
        </View>
        
        {!compact && prescription.advice && (
          <View style={styles.adviceContainer}>
            <Text style={styles.adviceLabel}>Advice:</Text>
            <Text style={styles.adviceText}>{prescription.advice}</Text>
          </View>
        )}
        
        <View style={styles.prescriptionFooter}>
          <View style={[
            styles.statusBadge,
            prescription.status === 'active' ? styles.statusActive :
            prescription.status === 'completed' ? styles.statusCompleted :
            styles.statusCancelled
          ]}>
            <Text style={styles.statusText}>{prescription.status || 'active'}</Text>
          </View>
          <Text style={styles.viewDetails}>View Details →</Text>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  prescriptionCard: {
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
  },
  prescriptionCardGradient: {
    padding: 16,
  },
  prescriptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  patientName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  prescriptionDate: {
    fontSize: 12,
    color: '#A0A0B0',
  },
  prescriptionDetails: {
    marginBottom: 12,
  },
  prescriptionId: {
    fontSize: 14,
    color: '#3498db',
    marginBottom: 4,
  },
  patientId: {
    fontSize: 14,
    color: '#A0A0B0',
  },
  medicinesList: {
    marginBottom: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  medicinesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
    marginBottom: 6,
  },
  medicineItem: {
    fontSize: 14,
    color: '#A0A0B0',
    marginBottom: 4,
  },
  moreItems: {
    fontSize: 12,
    color: '#3498db',
    marginTop: 4,
  },
  adviceContainer: {
    marginBottom: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  adviceLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
    marginBottom: 6,
  },
  adviceText: {
    fontSize: 14,
    color: '#A0A0B0',
    fontStyle: 'italic',
  },
  prescriptionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
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
  viewDetails: {
    fontSize: 14,
    color: '#3498db',
  },
});

export default PrescriptionCard;
