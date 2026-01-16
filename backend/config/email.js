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

// Send welcome email for new patient signup
const sendWelcomeEmail = async (email, firstName, patientId) => {
  const transporter = createTransporter();
  
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: '🎉 Welcome to MediCare - Your Health Journey Starts Here!',
    html: `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 650px; margin: 0 auto; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 20px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.2);">
        
        <!-- Header Section -->
        <div style="background: rgba(255,255,255,0.95); padding: 40px 30px; text-align: center; position: relative;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); width: 80px; height: 80px; border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center; box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);">
            <span style="color: white; font-size: 36px; font-weight: bold;">🏥</span>
          </div>
          <h1 style="color: #2c3e50; margin: 0; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">Welcome to MediCare!</h1>
          <p style="color: #7f8c8d; margin: 10px 0 0; font-size: 16px;">Your Health, Our Priority</p>
        </div>

        <!-- Main Content -->
        <div style="background: white; padding: 40px 30px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h2 style="color: #2c3e50; margin: 0 0 15px; font-size: 24px; font-weight: 600;">
              🎊 Congratulations, ${firstName}!
            </h2>
            <p style="color: #34495e; font-size: 18px; line-height: 1.6; margin: 0;">
              Your account has been successfully created. We're excited to have you join our healthcare community!
            </p>
          </div>

          <!-- Patient ID Card -->
          <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); border-radius: 15px; padding: 25px; margin: 30px 0; text-align: center; box-shadow: 0 8px 25px rgba(240, 147, 251, 0.2);">
            <h3 style="color: white; margin: 0 0 10px; font-size: 18px; font-weight: 600;">Your Patient ID</h3>
            <div style="background: rgba(255,255,255,0.2); border-radius: 10px; padding: 15px; backdrop-filter: blur(10px);">
              <span style="color: white; font-size: 24px; font-weight: bold; letter-spacing: 2px;">${patientId}</span>
            </div>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0; font-size: 14px;">Keep this ID handy for all your prescriptions</p>
          </div>

          <!-- Features Section -->
          <div style="margin: 30px 0;">
            <h3 style="color: #2c3e50; text-align: center; margin: 0 0 25px; font-size: 20px; font-weight: 600;">What you can do now:</h3>
            
            <div style="display: flex; flex-wrap: wrap; gap: 15px; justify-content: center;">
              <div style="flex: 1; min-width: 250px; background: #f8f9fa; border-radius: 12px; padding: 20px; text-align: center; border-left: 4px solid #3498db;">
                <div style="font-size: 24px; margin-bottom: 10px;">📅</div>
                <h4 style="color: #2c3e50; margin: 0 0 8px; font-size: 16px; font-weight: 600;">Prescriptions</h4>
                <p style="color: #7f8c8d; margin: 0; font-size: 14px; line-height: 1.4;">View your prescriptions anytime</p>
              </div>
              
              <div style="flex: 1; min-width: 250px; background: #f8f9fa; border-radius: 12px; padding: 20px; text-align: center; border-left: 4px solid #e74c3c;">
                <div style="font-size: 24px; margin-bottom: 10px;">📋</div>
                <h4 style="color: #2c3e50; margin: 0 0 8px; font-size: 16px; font-weight: 600;">Manage Profile</h4>
                <p style="color: #7f8c8d; margin: 0; font-size: 14px; line-height: 1.4;">Update your health information anytime</p>
              </div>
            </div>
            
            <div style="display: flex; flex-wrap: wrap; gap: 15px; justify-content: center; margin-top: 15px;">
              <div style="flex: 1; min-width: 250px; background: #f8f9fa; border-radius: 12px; padding: 20px; text-align: center; border-left: 4px solid #f39c12;">
                <div style="font-size: 24px; margin-bottom: 10px;">💊</div>
                <h4 style="color: #2c3e50; margin: 0 0 8px; font-size: 16px; font-weight: 600;">Track Medications</h4>
                <p style="color: #7f8c8d; margin: 0; font-size: 14px; line-height: 1.4;">Keep track of your prescriptions and dosages</p>
              </div>
              
              <div style="flex: 1; min-width: 250px; background: #f8f9fa; border-radius: 12px; padding: 20px; text-align: center; border-left: 4px solid #27ae60;">
                <div style="font-size: 24px; margin-bottom: 10px;">📱</div>
                <h4 style="color: #2c3e50; margin: 0 0 8px; font-size: 16px; font-weight: 600;">24/7 Access</h4>
                <p style="color: #7f8c8d; margin: 0; font-size: 14px; line-height: 1.4;">Access your health records anytime, anywhere</p>
              </div>
            </div>
          </div>

          <!-- Call to Action -->
          <div style="text-align: center; margin: 35px 0 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); display: inline-block; padding: 15px 35px; border-radius: 50px; text-decoration: none; box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3); transition: all 0.3s ease;">
              <span style="color: white; font-size: 16px; font-weight: 600; text-decoration: none;">🚀 Start Your Health Journey</span>
            </div>
            <p style="color: #7f8c8d; margin: 15px 0 0; font-size: 14px;">Open the MediCare app and log in with your credentials</p>
          </div>
        </div>

        <!-- Footer -->
        <div style="background: #2c3e50; padding: 25px 30px; text-align: center;">
          <div style="margin-bottom: 15px;">
            <span style="color: #ecf0f1; font-size: 18px; font-weight: 600;">MediCare Team</span>
          </div>
          <p style="color: #bdc3c7; margin: 0 0 10px; font-size: 14px; line-height: 1.5;">
            Thank you for choosing MediCare. We're committed to providing you with the best healthcare experience.
          </p>
          <p style="color: #95a5a6; margin: 0; font-size: 12px;">
            If you have any questions, feel free to contact our support team.
          </p>
          <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #34495e;">
            <p style="color: #7f8c8d; margin: 0 0 8px; font-size: 11px;">
              © 2024 MediCare. All rights reserved. | Your Health, Our Priority
            </p>
            <p style="color: #95a5a6; margin: 0; font-size: 10px;">
              Powered by <span style="color: #3498db; font-weight: 600;">Nathwave NexGen</span>
            </p>
          </div>
        </div>
      </div>
    `
  };
  
  await transporter.sendMail(mailOptions);
};

module.exports = { sendPasswordResetEmail, sendWelcomeEmail };
