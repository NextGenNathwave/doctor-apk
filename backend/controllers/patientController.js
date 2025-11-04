const Patient = require('../models/Patient');
const { sendPasswordResetEmail } = require('../config/email');
const crypto = require('crypto');

// @desc    Register a patient
// @route   POST /api/patients/register
// @access  Public
exports.registerPatient = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      mobile,
      password,
      age,
      gender,
      bloodGroup,
      address
    } = req.body;

    // Check if patient already exists
    const patientExists = await Patient.findOne({ email });

    if (patientExists) {
      return res.status(400).json({
        success: false,
        message: 'Patient with this email already exists'
      });
    }

    // Generate a shorter unique patient ID
    let patientId;
    let isUnique = false;
    
    // Keep generating IDs until we find a unique one
    while (!isUnique) {
      const randomNum = Math.floor(10 + Math.random() * 90); // 2-digit number
      patientId = `PAT${randomNum}`;
      
      // Check if this ID already exists
      const existingPatient = await Patient.findOne({ patientId });
      if (!existingPatient) {
        isUnique = true;
      }
    }
    
    // Create patient with the generated ID
    const patient = await Patient.create({
      patientId,
      firstName,
      lastName,
      email,
      mobile,
      password,
      age,
      gender,
      bloodGroup,
      address
    });

    // Generate token
    const token = patient.getSignedJwtToken();

    res.status(201).json({
      success: true,
      token,
      data: {
        id: patient._id,
        patientId: patient.patientId,
        firstName: patient.firstName,
        lastName: patient.lastName,
        email: patient.email
      }
    });
  } catch (error) {
    console.error('Error registering patient:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Login patient
// @route   POST /api/patients/login
// @access  Public
exports.loginPatient = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate email & password
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    // Check for patient
    const patient = await Patient.findOne({ email }).select('+password');

    if (!patient) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if password matches
    const isMatch = await patient.matchPassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Generate token
    const token = patient.getSignedJwtToken();

    res.status(200).json({
      success: true,
      token,
      data: {
        id: patient._id,
        patientId: patient.patientId,
        firstName: patient.firstName,
        lastName: patient.lastName,
        email: patient.email
      }
    });
  } catch (error) {
    console.error('Error logging in patient:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get current logged in patient
// @route   GET /api/patients/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const patient = await Patient.findById(req.user.id);

    res.status(200).json({
      success: true,
      data: patient
    });
  } catch (error) {
    console.error('Error getting patient profile:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Update patient profile
// @route   PUT /api/patients/update-profile
// @access  Private
exports.updateProfile = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      mobile,
      age,
      gender,
      bloodGroup,
      address
    } = req.body;

    // Find the patient by ID
    const patient = await Patient.findById(req.user.id);

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    // Update basic information
    if (firstName) patient.firstName = firstName;
    if (lastName) patient.lastName = lastName;
    if (mobile) patient.mobile = mobile;
    if (age) patient.age = age;
    if (gender) patient.gender = gender;
    if (bloodGroup) patient.bloodGroup = bloodGroup;
    if (address) patient.address = address;

    // Save the updated patient profile
    await patient.save();

    res.status(200).json({
      success: true,
      data: patient
    });
  } catch (error) {
    console.error('Error updating patient profile:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Logout patient / clear cookie
// @route   GET /api/patients/logout
// @access  Private
exports.logout = async (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Successfully logged out'
  });
};

// @desc    Forgot password - send reset email
// @route   POST /api/patients/forgot-password
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

    const patient = await Patient.findOne({ email });

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'No account found with that email address'
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');

    // Hash token and set to resetPasswordToken field
    patient.resetPasswordToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    // Set expire time (1 hour)
    patient.resetPasswordExpire = Date.now() + 3600000; // 1 hour

    await patient.save();

    // Send email
    try {
      await sendPasswordResetEmail(patient.email, resetToken, 'patient');

      res.status(200).json({
        success: true,
        message: 'Password reset email sent successfully'
      });
    } catch (emailError) {
      console.error('Email send error:', emailError);
      patient.resetPasswordToken = undefined;
      patient.resetPasswordExpire = undefined;
      await patient.save();

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
// @route   POST /api/patients/reset-password/:resetToken
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

    const patient = await Patient.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!patient) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token'
      });
    }

    // Set new password
    patient.password = password;
    patient.resetPasswordToken = undefined;
    patient.resetPasswordExpire = undefined;
    await patient.save();

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
