const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  registerPatient,
  loginPatient,
  getMe,
  updateProfile,
  logout,
  forgotPassword,
  resetPassword
} = require('../controllers/patientController');

// Public routes
router.post('/register', registerPatient);
router.post('/login', loginPatient);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:resetToken', resetPassword);

// Protected routes
router.get('/me', protect, authorize('patient'), getMe);
router.put('/update-profile', protect, authorize('patient'), updateProfile);
router.get('/logout', protect, authorize('patient'), logout);

module.exports = router;
