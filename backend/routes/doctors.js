const express = require('express');
const router = express.Router();

// Mock data for demonstration - In production, this would come from your database
const mockDoctors = [
  {
    _id: 'doc1',
    firstName: 'Rajesh',
    lastName: 'Sharma',
    specialization: 'Cardiologist',
    clinicName: 'Heart Care Clinic',
    clinicLocation: 'Shahupuri, 416001',
    clinicAreaId: 'kol_city_002',
    clinicCoordinates: {
      lat: 16.7078,
      lon: 74.2431
    },
    yearsOfExperience: 15,
    profileImage: null
  },
  {
    _id: 'doc2',
    firstName: 'Priya',
    lastName: 'Patil',
    specialization: 'Pediatrician',
    clinicName: 'Child Care Center',
    clinicLocation: 'Tarabai Park, 416003',
    clinicAreaId: 'kol_city_003',
    clinicCoordinates: {
      lat: 16.6877,
      lon: 74.251
    },
    yearsOfExperience: 8,
    profileImage: null
  },
  {
    _id: 'doc3',
    firstName: 'Amit',
    lastName: 'Desai',
    specialization: 'General Physician',
    clinicName: 'Family Health Clinic',
    clinicLocation: 'Laxmipuri, 416002',
    clinicAreaId: 'kol_city_004',
    clinicCoordinates: {
      lat: 16.7014,
      lon: 74.2409
    },
    yearsOfExperience: 12,
    profileImage: null
  },
  {
    _id: 'doc4',
    firstName: 'Sunita',
    lastName: 'Joshi',
    specialization: 'Dermatologist',
    clinicName: 'Skin Care Clinic',
    clinicLocation: 'Rajarampuri, 416008',
    clinicAreaId: 'kol_city_005',
    clinicCoordinates: {
      lat: 16.704,
      lon: 74.2439
    },
    yearsOfExperience: 10,
    profileImage: null
  },
  {
    _id: 'doc5',
    firstName: 'Vikram',
    lastName: 'Kulkarni',
    specialization: 'Orthopedic',
    clinicName: 'Bone & Joint Clinic',
    clinicLocation: 'Mangalwar Peth, 416012',
    clinicAreaId: 'kol_city_006',
    clinicCoordinates: {
      lat: 16.7023,
      lon: 74.235
    },
    yearsOfExperience: 18,
    profileImage: null
  }
];

// Get all doctors
router.get('/all', async (req, res) => {
  try {
    // In production, this would query your database
    // const doctors = await Doctor.find({}).select('-password');
    
    res.json({
      success: true,
      doctors: mockDoctors,
      message: 'Doctors fetched successfully'
    });
  } catch (error) {
    console.error('Error fetching doctors:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch doctors'
    });
  }
});

// Get doctors by area
router.get('/by-area/:areaId', async (req, res) => {
  try {
    const { areaId } = req.params;
    
    // In production, this would query your database
    // const doctors = await Doctor.find({ clinicAreaId: areaId }).select('-password');
    
    const doctorsInArea = mockDoctors.filter(doctor => doctor.clinicAreaId === areaId);
    
    res.json({
      success: true,
      doctors: doctorsInArea,
      message: 'Doctors in area fetched successfully'
    });
  } catch (error) {
    console.error('Error fetching doctors by area:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch doctors by area'
    });
  }
});

// Get nearby doctors within radius
router.post('/nearby', async (req, res) => {
  try {
    const { coordinates, maxDistance = 10 } = req.body;
    
    if (!coordinates || !coordinates.lat || !coordinates.lon) {
      return res.status(400).json({
        success: false,
        message: 'Patient coordinates are required'
      });
    }
    
    // Calculate distance using Haversine formula
    const calculateDistance = (lat1, lon1, lat2, lon2) => {
      const R = 6371; // Radius of the Earth in kilometers
      const dLat = (lat2 - lat1) * (Math.PI / 180);
      const dLon = (lon2 - lon1) * (Math.PI / 180);
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) *
          Math.cos(lat2 * (Math.PI / 180)) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distance = R * c;
      return Math.round(distance * 100) / 100;
    };
    
    // Filter and sort doctors by distance
    const nearbyDoctors = mockDoctors
      .filter(doctor => {
        if (!doctor.clinicCoordinates) return false;
        
        const distance = calculateDistance(
          coordinates.lat,
          coordinates.lon,
          doctor.clinicCoordinates.lat,
          doctor.clinicCoordinates.lon
        );
        
        return distance <= maxDistance;
      })
      .map(doctor => ({
        ...doctor,
        distance: calculateDistance(
          coordinates.lat,
          coordinates.lon,
          doctor.clinicCoordinates.lat,
          doctor.clinicCoordinates.lon
        )
      }))
      .sort((a, b) => a.distance - b.distance);
    
    res.json({
      success: true,
      doctors: nearbyDoctors,
      message: `Found ${nearbyDoctors.length} doctors within ${maxDistance}km`
    });
  } catch (error) {
    console.error('Error fetching nearby doctors:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch nearby doctors'
    });
  }
});

module.exports = router;
