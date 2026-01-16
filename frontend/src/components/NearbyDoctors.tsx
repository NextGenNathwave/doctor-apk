import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  TextInput
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  kolhapurAreas, 
  KolhapurArea, 
  calculateDistance, 
  getAreaById 
} from '../utils/locationUtils';
import api from '../services/api';

interface Doctor {
  _id: string;
  firstName: string;
  lastName: string;
  specialization: string;
  clinicName: string;
  clinicLocation: string;
  clinicAreaId?: string;
  clinicCoordinates?: {
    lat: number;
    lon: number;
  };
  yearsOfExperience: number;
  profileImage?: string;
  distance?: number;
}

interface NearbyDoctorsProps {
  patientAreaId: string;
  maxDistance?: number;
  onDoctorSelect?: (doctor: Doctor) => void;
}

const NearbyDoctors: React.FC<NearbyDoctorsProps> = ({
  patientAreaId,
  maxDistance = 10,
  onDoctorSelect
}) => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [filteredDoctors, setFilteredDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchNearbyDoctors();
  }, [patientAreaId]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredDoctors(doctors);
      return;
    }

    const filtered = doctors.filter(doctor => {
      const searchLower = searchQuery.toLowerCase();
      return (
        doctor.firstName.toLowerCase().includes(searchLower) ||
        doctor.lastName.toLowerCase().includes(searchLower) ||
        doctor.specialization.toLowerCase().includes(searchLower) ||
        doctor.clinicName.toLowerCase().includes(searchLower) ||
        doctor.clinicLocation.toLowerCase().includes(searchLower)
      );
    });

    setFilteredDoctors(filtered);
  }, [searchQuery, doctors]);

  const fetchNearbyDoctors = async () => {
    try {
      setLoading(true);
      setError(null);

      const patientArea = getAreaById(patientAreaId);
      if (!patientArea) {
        setError('Patient area not found');
        return;
      }

      const response = await api.get('/doctors/all');
      if (!response.data || !response.data.success) {
        setError('Failed to fetch doctors');
        return;
      }

      const allDoctors: Doctor[] = Array.isArray(response.data.doctors) ? response.data.doctors : [];

      const nearbyDoctors = allDoctors
        .filter(doctor => {
          if (!doctor || !doctor._id || !doctor.clinicCoordinates || !doctor.clinicAreaId) {
            return false;
          }

          const distance = calculateDistance(
            patientArea.coordinates.lat,
            patientArea.coordinates.lon,
            doctor.clinicCoordinates.lat,
            doctor.clinicCoordinates.lon
          );

          return distance <= maxDistance;
        })
        .map(doctor => ({
          ...doctor,
          distance: calculateDistance(
            patientArea.coordinates.lat,
            patientArea.coordinates.lon,
            doctor.clinicCoordinates!.lat,
            doctor.clinicCoordinates!.lon
          )
        }))
        .sort((a, b) => (a.distance || 0) - (b.distance || 0));

      setDoctors(nearbyDoctors);
      setFilteredDoctors(nearbyDoctors);
    } catch (error: any) {
      console.error('Error fetching nearby doctors:', error);
      setError('Failed to load nearby doctors. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderDoctorCard = (doctor: Doctor) => (
    <TouchableOpacity
      key={doctor._id}
      style={styles.doctorCard}
      onPress={() => onDoctorSelect?.(doctor)}
    >
      <LinearGradient
        colors={['#bec8ffff', '#e8ecff']}
        style={styles.cardGradient}
      >
        <View style={styles.doctorInfo}>
          <View style={styles.doctorImageContainer}>
            {doctor.profileImage ? (
              <Image
                source={{ uri: doctor.profileImage }}
                style={styles.doctorImage}
              />
            ) : (
              <View style={styles.defaultImage}>
                <Text style={styles.defaultImageText}>
                  {(doctor.firstName || 'D').charAt(0)}{(doctor.lastName || 'R').charAt(0)}
                </Text>
              </View>
            )}
          </View>
          
          <View style={styles.doctorDetails}>
            <Text style={styles.doctorName}>
              Dr. {doctor.firstName || 'Unknown'} {doctor.lastName || 'Doctor'}
            </Text>
            <Text style={styles.specialization}>{doctor.specialization || 'General Physician'}</Text>
            <Text style={styles.clinicName}>{doctor.clinicName || 'Clinic'}</Text>
            <Text style={styles.location}>{doctor.clinicLocation || 'Location'}</Text>
            <Text style={styles.experience}>
              {doctor.yearsOfExperience || 0} years experience
            </Text>
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3498db" />
        <Text style={styles.loadingText}>Finding nearby doctors...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchNearbyDoctors}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name, specialization, or location..."
          placeholderTextColor="#8E8E93"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>
      
      <Text style={styles.title}>
        Doctors ({filteredDoctors.length} found)
      </Text>
      
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {filteredDoctors.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {searchQuery ? 'No doctors found matching your search.' : 'No doctors found in your area.'}
            </Text>
            <TouchableOpacity 
              style={styles.expandButton} 
              onPress={() => {
                setSearchQuery('');
                fetchNearbyDoctors();
              }}
            >
              <Text style={styles.expandButtonText}>Clear Search</Text>
            </TouchableOpacity>
          </View>
        ) : (
          filteredDoctors.map(doctor => renderDoctorCard(doctor))
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 15,
    textAlign: 'center',
  },
  listContainer: {
    paddingBottom: 20,
  },
  doctorCard: {
    marginBottom: 15,
    borderRadius: 15,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardGradient: {
    padding: 15,
  },
  doctorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  doctorImageContainer: {
    marginRight: 15,
  },
  doctorImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  defaultImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#000049ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  defaultImageText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  doctorDetails: {
    flex: 1,
  },
  doctorName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000049ff',
    marginBottom: 4,
  },
  specialization: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 2,
  },
  clinicName: {
    fontSize: 14,
    color: '#000049ff',
    fontWeight: '500',
    marginBottom: 2,
  },
  location: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 8,
  },
  distanceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  distance: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '600',
  },
  experience: {
    fontSize: 12,
    color: '#6B7280',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    color: 'white',
    marginTop: 10,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#3498db',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  expandButton: {
    backgroundColor: '#bec8ffff',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  expandButtonText: {
    color: '#000049ff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  searchContainer: {
    marginBottom: 15,
  },
  searchInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
});

export default NearbyDoctors;
