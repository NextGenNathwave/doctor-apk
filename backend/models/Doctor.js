const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const DoctorSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
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
    required: [true, 'Clinic name is required'],
    trim: true
  },
  clinicLocation: {
    type: String,
    required: [true, 'Clinic location is required'],
    trim: true
  },
  specialization: {
    type: String,
    required: [true, 'Specialization is required'],
    trim: true
  },
  age: {
    type: Number,
    required: [true, 'Age is required']
  },
  yearsOfExperience: {
    type: Number,
    required: [true, 'Years of experience is required']
  },
  gender: {
    type: String,
    required: [true, 'Gender is required'],
    enum: ['Male', 'Female', 'Other']
  },
  qualification: {
    type: String,
    required: [true, 'Qualification is required'],
    trim: true
  },
  clinicNumber: {
    type: String,
    required: [true, 'Clinic number is required'],
    trim: true
  },
  governmentId: {
    type: String,
    required: [true, 'Government ID is required']
  },
  medicalLicense: {
    type: String,
    required: [true, 'Medical license is required']
  },
  signature: {
    type: String,
    required: [true, 'Signature is required']
  },
  profileImage: {
    type: String,
    required: [true, 'Profile image is required']
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
