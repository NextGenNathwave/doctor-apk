const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const DoctorSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: false,
    trim: true
  },
  lastName: {
    type: String,
    required: false,
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  clinicName: {
    type: String,
    required: false,
    trim: true
  },
  clinicLocation: {
    type: String,
    required: false,
    trim: true
  },
  clinicAreaId: {
    type: String,
    required: false,
    trim: true
  },
  clinicCoordinates: {
    lat: {
      type: Number,
      required: false
    },
    lon: {
      type: Number,
      required: false
    }
  },
  specialization: {
    type: String,
    required: false,
    trim: true
  },
  age: {
    type: Number,
    required: false
  },
  yearsOfExperience: {
    type: Number,
    required: false
  },
  gender: {
    type: String,
    required: false,
    enum: ['Male', 'Female', 'Other']
  },
  qualification: {
    type: String,
    required: false,
    trim: true
  },
  clinicNumber: {
    type: String,
    required: false,
    trim: true
  },
  governmentId: {
    type: String,
    required: false
  },
  medicalLicense: {
    type: String,
    required: false
  },
  signature: {
    type: String,
    required: false
  },
  profileImage: {
    type: String,
    required: false
  },
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Encrypt password before saving
DoctorSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    next();
  }
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Sign JWT and return
DoctorSchema.methods.getSignedJwtToken = function() {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
    expiresIn: '30d'
  });
};

// Match user entered password to hashed password in database
DoctorSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('Doctor', DoctorSchema);
