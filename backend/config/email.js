const nodemailer = require('nodemailer');

// Create email transporter
const createTransporter = () => {
  // Using Gmail as example - you can use any email service
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER, // Your email
      pass: process.env.EMAIL_PASSWORD // Your email password or app password
    }
  });
};

// Send password reset email
const sendPasswordResetEmail = async (email, resetToken, userType) => {
  const transporter = createTransporter();
  
  // For mobile app: Just send the token, user enters it manually in the app
  // No URL needed for APK apps
  
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Password Reset Request - MediCare',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #3498db;">Password Reset Request</h2>
        <p>You requested to reset your password for your MediCare ${userType} account.</p>
        <p>Copy this reset code and paste it in the app:</p>
        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 10px; text-align: center; margin: 20px 0;">
          <p style="color: #3498db; font-size: 18px; font-weight: bold; word-break: break-all; margin: 0;">${resetToken}</p>
        </div>
        <p><strong>This code will expire in 1 hour.</strong></p>
        <p>If you didn't request this, please ignore this email.</p>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
        <p style="color: #999; font-size: 12px;">MediCare - Your Health, Our Priority</p>
      </div>
    `
  };
  
  await transporter.sendMail(mailOptions);
};

module.exports = { sendPasswordResetEmail };
