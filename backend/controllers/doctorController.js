const Doctor = require('../models/Doctor');
const { uploadToImageKit } = require('../utils/fileUpload');
const { sendPasswordResetEmail } = require('../config/email');
const crypto = require('crypto');
const path = require('path');

// @desc    Register a doctor
// @route   POST /api/doctors/register
// @access  Public
exports.registerDoctor = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      password,
      clinicName,
      clinicLocation,
      clinicAreaId,
      clinicCoordinates,
      specialization,
      age,
      yearsOfExperience,
      gender,
      qualification,
      clinicNumber,
      governmentId,
      medicalLicense
    } = req.body;

    // Check if doctor already exists
    const doctorExists = await Doctor.findOne({ email });

    if (doctorExists) {
      return res.status(400).json({
        success: false,
        message: 'Doctor with this email already exists'
      });
    }

    // Upload signature file to ImageKit (optional for testing)
    let signatureUrl = '';
    if (req.files && req.files.signature) {
      const signatureFile = req.files.signature[0];
      const signatureResponse = await uploadToImageKit(
        signatureFile.path,
        `signature_${Date.now()}${path.extname(signatureFile.originalname)}`
      );
      signatureUrl = signatureResponse.url;
    }

    // Upload profile image to ImageKit (optional for testing)
    let profileImageUrl = '';
    if (req.files && req.files.profileImage) {
      const profileImageFile = req.files.profileImage[0];
      const profileImageResponse = await uploadToImageKit(
        profileImageFile.path,
        `profile_${Date.now()}${path.extname(profileImageFile.originalname)}`
      );
      profileImageUrl = profileImageResponse.url;
    }
    
    // Upload government ID to ImageKit (optional for testing)
    let governmentIdUrl = '';
    if (req.files && req.files.governmentId) {
      const governmentIdFile = req.files.governmentId[0];
      const governmentIdResponse = await uploadToImageKit(
        governmentIdFile.path,
        `govid_${Date.now()}${path.extname(governmentIdFile.originalname)}`
      );
      governmentIdUrl = governmentIdResponse.url;
    }
    
    // Upload medical license to ImageKit (optional for testing)
    let medicalLicenseUrl = '';
    if (req.files && req.files.medicalLicense) {
      const medicalLicenseFile = req.files.medicalLicense[0];
      const medicalLicenseResponse = await uploadToImageKit(
        medicalLicenseFile.path,
        `license_${Date.now()}${path.extname(medicalLicenseFile.originalname)}`
      );
      medicalLicenseUrl = medicalLicenseResponse.url;
    }

    // Parse coordinates if provided
    let parsedCoordinates = null;
    if (clinicCoordinates) {
      try {
        parsedCoordinates = typeof clinicCoordinates === 'string' 
          ? JSON.parse(clinicCoordinates) 
          : clinicCoordinates;
      } catch (error) {
        console.log('Error parsing coordinates:', error);
      }
    }

    // Create doctor
    const doctor = await Doctor.create({
      firstName,
      lastName,
      email,
      password,
      clinicName,
      clinicLocation,
      clinicAreaId,
      clinicCoordinates: parsedCoordinates,
      specialization,
      age,
      yearsOfExperience,
      gender,
      qualification,
      clinicNumber,
      governmentId: governmentIdUrl,
      medicalLicense: medicalLicenseUrl,
      signature: signatureUrl,
      profileImage: profileImageUrl
    });

    // Generate token
    const token = doctor.getSignedJwtToken();

    res.status(201).json({
      success: true,
      token,
      data: {
        id: doctor._id,
        firstName: doctor.firstName,
        lastName: doctor.lastName,
        email: doctor.email,
        profileImage: doctor.profileImage
      }
    });
  } catch (error) {
    console.error('Error registering doctor:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Login doctor
// @route   POST /api/doctors/login
// @access  Public
exports.loginDoctor = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate email & password
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    // Check for doctor
    const doctor = await Doctor.findOne({ email }).select('+password');

    if (!doctor) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if password matches
    const isMatch = await doctor.matchPassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Generate token
    const token = doctor.getSignedJwtToken();

    res.status(200).json({
      success: true,
      token,
      data: {
        id: doctor._id,
        firstName: doctor.firstName,
        lastName: doctor.lastName,
        email: doctor.email,
        profileImage: doctor.profileImage
      }
    });
  } catch (error) {
    console.error('Error logging in doctor:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get current logged in doctor
// @route   GET /api/doctors/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.user.id);

    res.status(200).json({
      success: true,
      data: doctor
    });
  } catch (error) {
    console.error('Error getting doctor profile:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Update doctor profile
// @route   PUT /api/doctors/update-profile
// @access  Private
exports.updateProfile = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      clinicName,
      clinicLocation,
      specialization,
      age,
      yearsOfExperience,
      gender,
      qualification,
      clinicNumber
    } = req.body;

    // Find the doctor by ID
    const doctor = await Doctor.findById(req.user.id);

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }

    // Update basic information
    if (firstName) doctor.firstName = firstName;
    if (lastName) doctor.lastName = lastName;
    if (clinicName) doctor.clinicName = clinicName;
    if (clinicLocation) doctor.clinicLocation = clinicLocation;
    if (specialization) doctor.specialization = specialization;
    if (age) doctor.age = age;
    if (yearsOfExperience) doctor.yearsOfExperience = yearsOfExperience;
    if (gender) doctor.gender = gender;
    if (qualification) doctor.qualification = qualification;
    if (clinicNumber) doctor.clinicNumber = clinicNumber;

    // Handle file uploads if provided
    // Upload signature file if provided
    if (req.files && req.files.signature) {
      const signatureFile = req.files.signature[0];
      const signatureResponse = await uploadToImageKit(
        signatureFile.path,
        `signature_${Date.now()}${path.extname(signatureFile.originalname)}`
      );
      doctor.signature = signatureResponse.url;
    }

    // Upload profile image if provided
    if (req.files && req.files.profileImage) {
      const profileImageFile = req.files.profileImage[0];
      const profileImageResponse = await uploadToImageKit(
        profileImageFile.path,
        `profile_${Date.now()}${path.extname(profileImageFile.originalname)}`
      );
      doctor.profileImage = profileImageResponse.url;
    }

    // Upload government ID if provided
    if (req.files && req.files.governmentId) {
      const governmentIdFile = req.files.governmentId[0];
      const governmentIdResponse = await uploadToImageKit(
        governmentIdFile.path,
        `govid_${Date.now()}${path.extname(governmentIdFile.originalname)}`
      );
      doctor.governmentId = governmentIdResponse.url;
    }

    // Upload medical license if provided
    if (req.files && req.files.medicalLicense) {
      const medicalLicenseFile = req.files.medicalLicense[0];
      const medicalLicenseResponse = await uploadToImageKit(
        medicalLicenseFile.path,
        `license_${Date.now()}${path.extname(medicalLicenseFile.originalname)}`
      );
      doctor.medicalLicense = medicalLicenseResponse.url;
    }

    // Save the updated doctor profile
    await doctor.save();

    res.status(200).json({
      success: true,
      data: doctor
    });
  } catch (error) {
    console.error('Error updating doctor profile:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get patient history for doctor
// @route   GET /api/doctors/patient-history
// @access  Private
exports.getPatientHistory = async (req, res) => {
  try {
    // Get all prescriptions created by this doctor
    const Prescription = require('../models/Prescription');
    
    // Get all unique patients this doctor has treated
    const prescriptions = await Prescription.find({ doctor: req.user.id })
      .populate({
        path: 'patient',
        select: 'firstName lastName patientId age gender bloodGroup mobile email'
      })
      .sort('-createdAt');
    
    // Group prescriptions by patient
    const patientMap = new Map();
    
    prescriptions.forEach(prescription => {
      const patient = prescription.patient;
      if (!patient) return; // Skip if patient data is missing
      
      const patientId = patient._id.toString();
      
      if (!patientMap.has(patientId)) {
        // First time seeing this patient, create entry
        patientMap.set(patientId, {
          patientInfo: {
            id: patient._id,
            patientId: patient.patientId,
            name: `${patient.firstName} ${patient.lastName}`,
            age: patient.age,
            gender: patient.gender,
            bloodGroup: patient.bloodGroup,
            contact: patient.mobile,
            email: patient.email
          },
          prescriptionCount: 1,
          lastVisit: prescription.createdAt,
          prescriptions: [{
            id: prescription._id,
            prescriptionId: prescription.prescriptionId,
            date: prescription.date,
            medicines: prescription.medicines.map(med => med.name).join(', '),
            followUpDate: prescription.followUpDate
          }]
        });
      } else {
        // Update existing patient entry
        const patientEntry = patientMap.get(patientId);
        patientEntry.prescriptionCount += 1;
        
        // Update last visit if this prescription is more recent
        if (new Date(prescription.createdAt) > new Date(patientEntry.lastVisit)) {
          patientEntry.lastVisit = prescription.createdAt;
        }
        
        // Add prescription summary to the list
        patientEntry.prescriptions.push({
          id: prescription._id,
          prescriptionId: prescription.prescriptionId,
          date: prescription.date,
          medicines: prescription.medicines.map(med => med.name).join(', '),
          followUpDate: prescription.followUpDate
        });
      }
    });
    
    // Convert map to array and sort by last visit date (most recent first)
    const patientHistory = Array.from(patientMap.values())
      .sort((a, b) => new Date(b.lastVisit) - new Date(a.lastVisit));
    
    res.status(200).json({
      success: true,
      count: patientHistory.length,
      data: patientHistory
    });
  } catch (error) {
    console.error('Error getting patient history:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Logout doctor / clear cookie
// @route   GET /api/doctors/logout
// @access  Private
exports.logout = async (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Successfully logged out'
  });
};

// @desc    Forgot password - send reset email
// @route   POST /api/doctors/forgot-password
// @access  Public
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an email address'
      });
    }

    const doctor = await Doctor.findOne({ email });

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'No account found with that email address'
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');

    // Hash token and set to resetPasswordToken field
    doctor.resetPasswordToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    // Set expire time (1 hour)
    doctor.resetPasswordExpire = Date.now() + 3600000; // 1 hour

    await doctor.save();

    // Send email
    try {
      await sendPasswordResetEmail(doctor.email, resetToken, 'doctor');

      res.status(200).json({
        success: true,
        message: 'Password reset email sent successfully'
      });
    } catch (emailError) {
      console.error('Email send error:', emailError);
      doctor.resetPasswordToken = undefined;
      doctor.resetPasswordExpire = undefined;
      await doctor.save();

      return res.status(500).json({
        success: false,
        message: 'Email could not be sent. Please try again later.'
      });
    }
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Reset password
// @route   POST /api/doctors/reset-password/:resetToken
// @access  Public
exports.resetPassword = async (req, res) => {
  try {
    const { password } = req.body;

    if (!password || password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters'
      });
    }

    // Get hashed token
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(req.params.resetToken)
      .digest('hex');

    const doctor = await Doctor.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!doctor) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token'
      });
    }

    // Set new password
    doctor.password = password;
    doctor.resetPasswordToken = undefined;
    doctor.resetPasswordExpire = undefined;
    await doctor.save();

    res.status(200).json({
      success: true,
      message: 'Password reset successful'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get all doctors
// @route   GET /api/doctors/all
// @access  Public
exports.getAllDoctors = async (req, res) => {
  try {
    const doctors = await Doctor.find({})
      .select('-password -resetPasswordToken -resetPasswordExpire')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      doctors,
      message: 'Doctors fetched successfully'
    });
  } catch (error) {
    console.error('Get all doctors error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch doctors'
    });
  }
};
