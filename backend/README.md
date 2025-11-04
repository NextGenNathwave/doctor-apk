# Doctor App Backend

A Node.js backend for a Doctor Appointment Application with separate authentication for doctors and patients.

## Features

- Doctor authentication (signup, login, logout)
- Patient authentication (signup with auto-generated ID, login, logout)
- File uploads using ImageKit for doctor profile images and signatures
- MongoDB database integration
- JWT authentication
- RESTful API endpoints

## Tech Stack

- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT for authentication
- ImageKit for file storage
- Multer for file uploads

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or Atlas)
- ImageKit account for file uploads

## Installation

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Create a `.env` file in the root directory with the following variables:
   ```
   PORT=5000
   MONGO_URI=mongodb://localhost:27017/doctor-app
   JWT_SECRET=your_jwt_secret_key
   IMAGEKIT_PUBLIC_KEY=your_imagekit_public_key
   IMAGEKIT_PRIVATE_KEY=your_imagekit_private_key
   IMAGEKIT_URL_ENDPOINT=your_imagekit_url_endpoint
   ```
4. Start the server:
   ```
   npm start
   ```

## API Endpoints

### Doctor Routes

- **POST /api/doctors/register** - Register a new doctor
- **POST /api/doctors/login** - Login a doctor
- **GET /api/doctors/me** - Get current doctor profile (protected)
- **GET /api/doctors/logout** - Logout doctor (protected)

### Patient Routes

- **POST /api/patients/register** - Register a new patient
- **POST /api/patients/login** - Login a patient
- **GET /api/patients/me** - Get current patient profile (protected)
- **GET /api/patients/logout** - Logout patient (protected)

## Doctor Registration Fields

- First Name
- Last Name
- Email
- Password
- Clinic Name
- Clinic Location
- Specialization
- Age
- Years of Experience
- Gender
- Qualification
- Clinic Number
- Government ID
- Medical License
- Signature (file upload)
- Profile Image (file upload)

## Patient Registration Fields

- First Name
- Last Name
- Email
- Mobile
- Password
- Age
- Gender
- Blood Group
- Address
- Patient ID (auto-generated)

## Authentication

The API uses JWT (JSON Web Tokens) for authentication. Protected routes require a valid token to be included in the Authorization header:

```
Authorization: Bearer <token>
```

## File Uploads

File uploads are handled using Multer and stored in ImageKit. The following files can be uploaded:

- Doctor signature
- Doctor profile image
