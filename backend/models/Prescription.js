const mongoose = require('mongoose');

// Medicine schema for individual medicines in a prescription
const MedicineSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Medicine name is required'],
    trim: true
  },
  medicineType: {
    type: String,
    required: [true, 'Medicine type is required'],
    enum: ['Tablet', 'Syrup', 'Capsule', 'Injection', 'Powder', 'Drops', 'Cream', 'Ointment', 'Other']
  },
  dosage: {
    type: String,
    required: [true, 'Dosage is required'],
    enum: [
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
    ]
  },
  frequency: {
    type: String,
    required: [true, 'Frequency is required'],
    enum: [
      'Once daily', 'Twice daily', 'Three times a day', 'Four times a day',
      'Every morning', 'Every night', 'Before breakfast', 'After breakfast',
      'Before lunch', 'After lunch', 'Before dinner', 'After dinner',
      'Every 4 hours', 'Every 6 hours', 'Every 8 hours', 'Every 12 hours',
      'As needed', 'Once a week', 'Twice a week'
    ]
  },
  duration: {
    type: String,
    required: [true, 'Duration is required'],
    enum: [
      '1 day', '2 days', '3 days', '4 days', '5 days',
      '1 week', '2 weeks', '3 weeks', '4 weeks',
      '1 month', '2 months', '3 months', '6 months',
      'Continue indefinitely', 'Until finished'
    ]
  },
  instructions: {
    type: String,
    trim: true
  }
});

const PrescriptionSchema = new mongoose.Schema({
  prescriptionId: {
    type: String,
    unique: true
  },
  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: true
  },
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  },
  medicines: [MedicineSchema],
  advice: {
    type: String,
    trim: true
  },
  followUpDate: {
    type: Date
  },
  extraInstructions: {
    type: String,
    trim: true
  },
  clinicDetails: {
    name: {
      type: String,
      required: true
    },
    contact: {
      type: String,
      required: true
    },
    doctorName: {
      type: String,
      required: true
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Generate prescription ID before saving
PrescriptionSchema.pre('save', async function(next) {
  try {
    // Only generate ID if it's a new prescription
    if (this.isNew) {
      // Generate a random 4-digit number
      const randomNum = Math.floor(1000 + Math.random() * 9000);
      // Create prescription ID with prefix 'RX' and current date
      const date = new Date();
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear().toString().substr(-2);
      this.prescriptionId = `RX${day}${month}${year}-${randomNum}`;
    }
    
    next();
  } catch (error) {
    next(error);
  }
});

module.exports = mongoose.model('Prescription', PrescriptionSchema);
