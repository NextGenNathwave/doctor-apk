# Prescription Limit Feature

## Overview
Implemented a feature to limit patients to only view their **2 most recent prescriptions**. When a new prescription is created, the oldest prescription(s) are automatically deleted.

## Changes Made

### 1. Auto-Delete Old Prescriptions (prescriptionController.js - createPrescription)

**Location**: Lines 216-232

**Functionality**:
- Before creating a new prescription, the system checks how many prescriptions the patient already has
- If the patient has 2 or more prescriptions, the oldest ones are automatically deleted
- Only the most recent prescription is kept before adding the new one
- This ensures patients never have more than 2 prescriptions at any time

**Code Logic**:
```javascript
const MAX_PRESCRIPTIONS_PER_PATIENT = 2;

// Get existing prescriptions sorted by newest first
const existingPrescriptions = await Prescription.find({ patient: patient._id })
  .sort('-createdAt');

// If patient has 2+ prescriptions, delete the oldest ones
if (existingPrescriptions.length >= MAX_PRESCRIPTIONS_PER_PATIENT) {
  // Keep only 1 prescription (to make room for the new one)
  const prescriptionsToDelete = existingPrescriptions.slice(MAX_PRESCRIPTIONS_PER_PATIENT - 1);
  
  // Delete old prescriptions from database
  await Prescription.deleteMany({ _id: { $in: idsToDelete } });
}
```

### 2. Limit Patient Prescription Retrieval (getMyPrescriptions)

**Location**: Lines 463-475

**Functionality**:
- When patients fetch their prescriptions via `/api/prescriptions/my-prescriptions`
- Results are limited to 2 most recent prescriptions using `.limit(2)`
- Sorted by creation date (newest first)

### 3. Limit Patient View in Shared Endpoint (getPatientPrescriptions)

**Location**: Lines 366-378

**Functionality**:
- When patients access `/api/prescriptions/patient/:patientId`
- Applies `.limit(2)` only for patient users
- Doctors can still see all prescriptions they created for a patient (no limit)

## How It Works

### Scenario 1: Patient Has 0-1 Prescriptions
- Doctor creates a new prescription
- No deletion occurs
- Patient now has 1-2 prescriptions

### Scenario 2: Patient Has 2 Prescriptions
- Doctor creates a new prescription
- System finds 2 existing prescriptions
- Oldest prescription is deleted
- New prescription is created
- Patient still has 2 prescriptions (the 2 most recent)

### Scenario 3: Patient Has 3+ Prescriptions (edge case)
- This shouldn't happen with the new logic, but if it does:
- System deletes all except the most recent 1
- New prescription is created
- Patient ends up with 2 prescriptions

## API Endpoints Affected

1. **POST /api/prescriptions** (Doctor only)
   - Auto-deletes old prescriptions before creating new one

2. **GET /api/prescriptions/my-prescriptions** (Patient only)
   - Returns max 2 prescriptions

3. **GET /api/prescriptions/patient/:patientId** (Both)
   - Patients: Limited to 2 prescriptions
   - Doctors: No limit (can see all their prescriptions for that patient)

## Benefits

✅ **Storage Optimization**: Prevents unlimited prescription accumulation  
✅ **Data Privacy**: Old medical records are automatically removed  
✅ **Simple UI**: Patients only see their 2 most recent prescriptions  
✅ **Automatic Cleanup**: No manual intervention needed  
✅ **Doctor Access**: Doctors can still view prescription history if needed  

## Configuration

To change the limit, modify this constant in `prescriptionController.js`:

```javascript
const MAX_PRESCRIPTIONS_PER_PATIENT = 2; // Change to desired limit
```

## Testing

1. **Test Case 1**: Create first prescription for a patient
   - Expected: Prescription created successfully
   - Patient sees 1 prescription

2. **Test Case 2**: Create second prescription for same patient
   - Expected: Prescription created successfully
   - Patient sees 2 prescriptions

3. **Test Case 3**: Create third prescription for same patient
   - Expected: Oldest prescription deleted, new one created
   - Patient sees 2 prescriptions (2nd and 3rd)

4. **Test Case 4**: Create fourth prescription
   - Expected: 2nd prescription deleted, new one created
   - Patient sees 2 prescriptions (3rd and 4th)

## Notes

- Deletion is permanent and cannot be undone
- Doctors can still see all prescriptions they created (no limit on doctor side)
- The limit only applies to patient-facing endpoints
- Console logs track when prescriptions are deleted for debugging
