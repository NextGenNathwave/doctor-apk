const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  searchPatient,
  createPrescription,
  getDoctorPrescriptions,
  getPatientPrescriptions,
  getPrescription,
  getMyPrescriptions,
  getDropdownOptions
} = require('../controllers/prescriptionController');

// Protected doctor routes
router.get('/dropdown-options', protect, authorize('doctor'), getDropdownOptions);
router.get('/search-patient', protect, authorize('doctor'), searchPatient);
router.post('/', protect, authorize('doctor'), createPrescription);
router.get('/', protect, authorize('doctor'), getDoctorPrescriptions);
router.get('/doctor/:doctorId', protect, getDoctorPrescriptions); // Added endpoint for frontend compatibility

// Protected patient routes
router.get('/my-prescriptions', protect, authorize('patient'), getMyPrescriptions);

// Shared routes (accessible by both doctor and patient)
router.get('/patient/:patientId', protect, getPatientPrescriptions); // Allow both doctor and patient
router.get('/:id', protect, getPrescription);

module.exports = router;
