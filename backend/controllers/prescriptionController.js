const mongoose = require('mongoose');
const Prescription = require('../models/Prescription');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');

// Medicine dropdown options
const medicineTypes = ['Tablet', 'Syrup', 'Capsule', 'Injection', 'Powder', 'Drops', 'Cream', 'Ointment', 'Other'];
const dosageOptions = [
  // For tablets/capsules
  '1/4 tablet', '1/2 tablet', '1 tablet', '2 tablets', '3 tablets',
  // For syrups
  '1/2 teaspoon', '1 teaspoon', '2 teaspoons', '1 tablespoon', '2 tablespoons',
  // For powders
  '1/2 scoop', '1 scoop', '2 scoops',
  // For drops
  '1 drop', '2 drops', '3 drops', '4 drops', '5 drops',
  // For creams/ointments
  'Apply thin layer', 'Apply liberally'
];
const frequencyOptions = [
  'Once daily', 'Twice daily', 'Three times a day', 'Four times a day',
  'Every morning', 'Every night', 'Before breakfast', 'After breakfast',
  'Before lunch', 'After lunch', 'Before dinner', 'After dinner',
  'Every 4 hours', 'Every 6 hours', 'Every 8 hours', 'Every 12 hours',
  'As needed', 'Once a week', 'Twice a week'
];
const durationOptions = [
  '1 day', '2 days', '3 days', '4 days', '5 days',
  '1 week', '2 weeks', '3 weeks', '4 weeks',
  '1 month', '2 months', '3 months', '6 months',
  'Continue indefinitely', 'Until finished'
];

// @desc    Get dropdown options for prescription form
// @route   GET /api/prescriptions/dropdown-options
// @access  Private (Doctor only)
exports.getDropdownOptions = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      data: {
        medicineTypes,
        dosageOptions,
        frequencyOptions,
        durationOptions
      }
    });
  } catch (error) {
    console.error('Error getting dropdown options:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Search patients by ID or name
// @route   GET /api/prescriptions/search-patient
// @access  Private (Doctor only)
exports.searchPatient = async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a search query'
      });
    }

    // Search by patient ID or name
    const patients = await Patient.find({
      $or: [
        { patientId: { $regex: query, $options: 'i' } },
        { firstName: { $regex: query, $options: 'i' } },
        { lastName: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } }
      ]
    }).select('patientId firstName lastName email mobile age gender bloodGroup');

    res.status(200).json({
      success: true,
      count: patients.length,
      data: patients
    });
  } catch (error) {
    console.error('Error searching patients:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Create a new prescription
// @route   POST /api/prescriptions
// @access  Private (Doctor only)
exports.createPrescription = async (req, res) => {
  try {
    const {
      patientId,
      medicines,
      advice,
      followUpDate,
      extraInstructions
    } = req.body;

    // Find the patient by patientId field (not MongoDB _id)
    let patient;
    
    // Check if patientId is a MongoDB ObjectId or a string ID
    if (patientId.match(/^[0-9a-fA-F]{24}$/)) {
      // It's a valid MongoDB ObjectId, try to find by _id first
      patient = await Patient.findById(patientId);
    }
    
    // If not found by _id or not an ObjectId, try to find by patientId field
    if (!patient) {
      patient = await Patient.findOne({ patientId: patientId });
    }
    
    if (!patient) {
      // Check if we're in development mode and create a mock patient for demo purposes
      if (process.env.NODE_ENV !== 'production') {
        console.log('Creating mock patient for demo mode');
        // Create a mock patient for demo purposes
        patient = {
          _id: new mongoose.Types.ObjectId(),
          firstName: 'Demo',
          lastName: 'Patient',
          patientId: patientId || `PAT${Date.now().toString().substring(6)}`,
          age: 35,
          gender: 'Other',
          email: 'demo@example.com',
          mobile: '1234567890'
        };
      } else {
        return res.status(404).json({
          success: false,
          message: 'Patient not found'
        });
      }
    }

    // Find the doctor (current user)
    const doctor = await Doctor.findById(req.user.id);
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }
    
    // Validate medicine entries
    if (!medicines || !Array.isArray(medicines) || medicines.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one medicine is required'
      });
    }
    
    // Check if all medicine entries have the required fields with valid values
    
    for (const medicine of medicines) {
      if (!medicine.name || !medicine.medicineType || !medicine.dosage || !medicine.frequency || !medicine.duration) {
        return res.status(400).json({
          success: false,
          message: 'All medicine fields (name, type, dosage, frequency, duration) are required'
        });
      }
      
      if (!medicineTypes.includes(medicine.medicineType)) {
        return res.status(400).json({
          success: false,
          message: `Invalid medicine type: ${medicine.medicineType}`
        });
      }
      
      if (!dosageOptions.includes(medicine.dosage)) {
        // For demo purposes, let's be more flexible with dosages
        console.log(`Warning: Non-standard dosage used: ${medicine.dosage}`);
        // Skip validation in development mode
        if (process.env.NODE_ENV === 'production') {
          return res.status(400).json({
            success: false,
            message: `Invalid dosage: ${medicine.dosage}`
          });
        }
      }
      
      if (!frequencyOptions.includes(medicine.frequency)) {
        // For demo purposes, let's be more flexible with frequencies
        console.log(`Warning: Non-standard frequency used: ${medicine.frequency}`);
        // Skip validation in development mode
        if (process.env.NODE_ENV === 'production') {
          return res.status(400).json({
            success: false,
            message: `Invalid frequency: ${medicine.frequency}`
          });
        }
      }
      
      if (!durationOptions.includes(medicine.duration)) {
        // For demo purposes, let's be more flexible with durations
        console.log(`Warning: Non-standard duration used: ${medicine.duration}`);
        // Skip validation in development mode
        if (process.env.NODE_ENV === 'production') {
          return res.status(400).json({
            success: false,
            message: `Invalid duration: ${medicine.duration}`
          });
        }
      }
    }

    // Check existing prescriptions for this patient and delete old ones if limit exceeded
    const MAX_PRESCRIPTIONS_PER_PATIENT = 2;
    const existingPrescriptions = await Prescription.find({ patient: patient._id })
      .sort('-createdAt');
    
    // If patient already has 2 or more prescriptions, delete the oldest ones
    if (existingPrescriptions.length >= MAX_PRESCRIPTIONS_PER_PATIENT) {
      // Keep only the most recent (MAX_PRESCRIPTIONS_PER_PATIENT - 1) prescriptions
      const prescriptionsToKeep = existingPrescriptions.slice(0, MAX_PRESCRIPTIONS_PER_PATIENT - 1);
      const prescriptionsToDelete = existingPrescriptions.slice(MAX_PRESCRIPTIONS_PER_PATIENT - 1);
      
      // Delete old prescriptions
      const idsToDelete = prescriptionsToDelete.map(p => p._id);
      await Prescription.deleteMany({ _id: { $in: idsToDelete } });
      
      console.log(`Deleted ${idsToDelete.length} old prescription(s) for patient ${patient.patientId || patient._id}`);
    }

    // Create prescription with clinic details auto-populated from doctor's profile
    const prescription = await Prescription.create({
      doctor: doctor._id,
      patient: patient._id, // Using the MongoDB _id of the patient
      medicines,
      advice,
      followUpDate,
      extraInstructions,
      clinicDetails: {
        name: doctor.clinicName || 'Medical Clinic', // Fallback if not available
        contact: doctor.clinicNumber || doctor.mobile || 'N/A', // Fallback if not available
        doctorName: `${doctor.firstName} ${doctor.lastName}`
      }
    });

    // Populate doctor and patient details
    await prescription.populate('doctor', 'firstName lastName specialization');
    await prescription.populate('patient', 'firstName lastName patientId');

    res.status(201).json({
      success: true,
      data: prescription
    });
  } catch (error) {
    console.error('Error creating prescription:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get all prescriptions by doctor with detailed patient info
// @route   GET /api/prescriptions or GET /api/prescriptions/doctor/:doctorId
// @access  Private (Doctor only or shared with doctorId parameter)
exports.getDoctorPrescriptions = async (req, res) => {
  try {
    // Get doctor ID either from params or from authenticated user
    const doctorId = req.params.doctorId || req.user.id;
    
    // Get the doctor info
    const doctor = await Doctor.findById(doctorId);
    
    // Get all prescriptions by this doctor
    const prescriptions = await Prescription.find({ doctor: doctorId })
      .populate({
        path: 'patient',
        select: 'firstName lastName patientId age gender bloodGroup mobile email'
      })
      .sort('-createdAt');

    // Format the response with more detailed information
    const formattedPrescriptions = prescriptions.map(prescription => {
      const patient = prescription.patient;
      return {
        id: prescription._id,
        prescriptionId: prescription.prescriptionId,
        date: prescription.date,
        doctorId: prescription.doctor,
        doctorName: prescription.clinicDetails?.doctorName || 'Doctor',
        doctorSpecialization: doctor?.specialization || '',
        patientId: patient?._id || 'unknown',
        patientName: patient ? `${patient.firstName} ${patient.lastName}` : 'Unknown Patient',
        patientDetails: {
          patientId: patient?.patientId || 'unknown',
          age: patient?.age || 0,
          gender: patient?.gender || 'Unknown',
          bloodGroup: patient?.bloodGroup || 'Unknown',
          contact: patient?.mobile || 'N/A',
          email: patient?.email || 'N/A'
        },
        medicines: prescription.medicines || [],
        advice: prescription.advice || '',
        followUpDate: prescription.followUpDate || null,
        extraInstructions: prescription.extraInstructions || '',
        clinicDetails: {
          ...prescription.clinicDetails,
          address: doctor?.clinicAddress || '',
          doctorPhone: doctor?.mobile || ''
        },
        doctorSignature: doctor?.signature || '',
        createdAt: prescription.createdAt,
        status: 'active' // Default status
      };
    });

    res.status(200).json({
      success: true,
      count: prescriptions.length,
      prescriptions: formattedPrescriptions
    });
  } catch (error) {
    console.error('Error getting prescriptions:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get patient's prescriptions
// @route   GET /api/prescriptions/patient/:patientId
// @access  Private (Doctor or Patient)
exports.getPatientPrescriptions = async (req, res) => {
  try {
    const { patientId } = req.params;

    // Find the patient
    const patient = await Patient.findById(patientId);
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    // Check authorization - patient can only view their own prescriptions
    if (req.userType === 'patient' && req.user.id !== patientId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view these prescriptions'
      });
    }

    // Get all prescriptions for this patient
    let query = { patient: patientId };
    
    // If doctor is requesting, only show prescriptions they created
    if (req.userType === 'doctor') {
      query.doctor = req.user.id;
    }
    
    let prescriptionQuery = Prescription.find(query)
      .populate({
        path: 'doctor',
        select: 'firstName lastName specialization clinicName clinicNumber clinicAddress mobile signature'
      })
      .sort('-createdAt');
    
    // If patient is requesting, limit to 2 most recent prescriptions
    if (req.userType === 'patient') {
      prescriptionQuery = prescriptionQuery.limit(2);
    }
    
    const prescriptions = await prescriptionQuery;

    // Format the response with detailed information
    const formattedPrescriptions = prescriptions.map(prescription => {
      const doctor = prescription.doctor;
      return {
        id: prescription._id,
        prescriptionId: prescription.prescriptionId,
        date: prescription.date,
        doctorId: doctor?._id || 'unknown',
        doctorName: doctor ? `Dr. ${doctor.firstName} ${doctor.lastName}` : 'Doctor',
        doctorSpecialization: doctor?.specialization || '',
        patientId: patient._id,
        patientName: `${patient.firstName} ${patient.lastName}`,
        patientDetails: {
          patientId: patient.patientId || 'unknown',
          age: patient.age || 0,
          gender: patient.gender || 'Unknown',
          bloodGroup: patient.bloodGroup || 'Unknown'
        },
        medicines: prescription.medicines || [],
        advice: prescription.advice || '',
        followUpDate: prescription.followUpDate || null,
        extraInstructions: prescription.extraInstructions || '',
        clinicDetails: {
          ...prescription.clinicDetails,
          address: doctor?.clinicAddress || prescription.clinicDetails?.address || '',
          doctorPhone: doctor?.mobile || ''
        },
        doctorSignature: doctor?.signature || '',
        createdAt: prescription.createdAt,
        status: 'active' // Default status
      };
    });

    res.status(200).json({
      success: true,
      count: prescriptions.length,
      prescriptions: formattedPrescriptions
    });
  } catch (error) {
    console.error('Error getting patient prescriptions:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get a single prescription
// @route   GET /api/prescriptions/:id
// @access  Private (Doctor or Patient)
exports.getPrescription = async (req, res) => {
  try {
    const prescription = await Prescription.findById(req.params.id)
      .populate('doctor', 'firstName lastName specialization profileImage signature')
      .populate('patient', 'firstName lastName patientId');

    if (!prescription) {
      return res.status(404).json({
        success: false,
        message: 'Prescription not found'
      });
    }

    // Check if the user is the doctor who created the prescription or the patient it's for
    if (
      req.userType === 'doctor' && prescription.doctor._id.toString() !== req.user.id &&
      req.userType === 'patient' && prescription.patient._id.toString() !== req.user.id
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this prescription'
      });
    }

    res.status(200).json({
      success: true,
      prescription: prescription
    });
  } catch (error) {
    console.error('Error getting prescription:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get my prescriptions (for patients)
// @route   GET /api/prescriptions/my-prescriptions
// @access  Private (Patient only)
exports.getMyPrescriptions = async (req, res) => {
  try {
    // Limit to 2 most recent prescriptions for patients
    const prescriptions = await Prescription.find({ patient: req.user.id })
      .populate('doctor', 'firstName lastName specialization')
      .sort('-createdAt')
      .limit(2);

    res.status(200).json({
      success: true,
      count: prescriptions.length,
      prescriptions: prescriptions
    });
  } catch (error) {
    console.error('Error getting my prescriptions:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};
