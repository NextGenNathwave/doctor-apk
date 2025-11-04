const multer = require('multer');
const imagekit = require('../config/imagekit');
const fs = require('fs');
const path = require('path');

// Set up multer storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads');
    
    // Create the uploads directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Create unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter to accept only images
const fileFilter = (req, file, cb) => {
  // Accept only image files
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

// Initialize multer upload
const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max file size
  fileFilter: fileFilter
});

// Function to upload file to ImageKit
const uploadToImageKit = async (filePath, fileName) => {
  try {
    // Read file from disk
    const fileBuffer = fs.readFileSync(filePath);
    
    // Upload to ImageKit
    const response = await imagekit.upload({
      file: fileBuffer.toString('base64'),
      fileName: fileName,
      useUniqueFileName: true
    });
    
    // Delete local file after upload
    fs.unlinkSync(filePath);
    
    return response;
  } catch (error) {
    console.error('Error uploading to ImageKit:', error);
    throw new Error('File upload failed');
  }
};

module.exports = {
  upload,
  uploadToImageKit
};
