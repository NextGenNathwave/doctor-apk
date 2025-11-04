const jwt = require('jsonwebtoken');
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');

// Protect routes
exports.protect = async (req, res, next) => {
  let token;

  // Check if token exists in headers
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  // Check if token exists
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route'
    });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check if user is a doctor
    let user = await Doctor.findById(decoded.id);
    
    // If not a doctor, check if user is a patient
    if (!user) {
      user = await Patient.findById(decoded.id);
    }

    // Check if user exists
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    // Set user in request object
    req.user = user;
    req.userType = user.constructor.modelName.toLowerCase();
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route'
    });
  }
};

// Grant access to specific roles
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.userType)) {
      return res.status(403).json({
        success: false,
        message: `User role ${req.userType} is not authorized to access this route`
      });
    }
    next();
  };
};
