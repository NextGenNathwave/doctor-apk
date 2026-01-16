const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { upload } = require('../utils/fileUpload');
const {
  registerDoctor,
  loginDoctor,
  getMe,
  updateProfile,
  getPatientHistory,
  logout,
  forgotPassword,
  resetPassword,
  getAllDoctors
} = require('../controllers/doctorController');

// Set up multer for file uploads
const uploadFields = upload.fields([
  { name: 'signature', maxCount: 1 },
  { name: 'profileImage', maxCount: 1 },
  { name: 'governmentId', maxCount: 1 },
  { name: 'medicalLicense', maxCount: 1 }
]);

// Public routes
router.post('/register', uploadFields, registerDoctor);
router.post('/login', loginDoctor);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:resetToken', resetPassword);

// Protected routes
router.get('/me', protect, authorize('doctor'), getMe);
router.put('/update-profile', protect, authorize('doctor'), uploadFields, updateProfile);
router.get('/patient-history', protect, authorize('doctor'), getPatientHistory);
router.get('/logout', protect, authorize('doctor'), logout);

// Public routes for nearby doctors functionality
router.get('/all', getAllDoctors);

module.exports = router;
