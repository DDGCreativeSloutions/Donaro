# Donaro App Backend API

This is the backend API for the Donaro App, built with Node.js, Express, Prisma ORM, and SQLite.

## Table of Contents
- [Authentication](#authentication)
- [Users](#users)
- [Donations](#donations)
- [Withdrawals](#withdrawals)
- [Image Upload](#image-upload)
- [OTP Verification](#otp-verification)
- [Real-time Events](#real-time-events)

## Authentication

### Register a new user
```
POST /api/auth/register
```

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "password": "securePassword123!" // Example password - use a strong, unique password in production
}
```

**Response:**
```json
{
  "id": "user-id",
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "totalCredits": 0,
  "lifetimeCredits": 0,
  "withdrawableCredits": 0,
  "totalDonations": 0,
  "token": "jwt-token"
}
```

### Login
```
POST /api/auth/login
```

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "securePassword123!" // Example password - use a strong, unique password in production
}
```

**Response:**
```json
{
  "id": "user-id",
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "totalCredits": 0,
  "lifetimeCredits": 0,
  "withdrawableCredits": 0,
  "totalDonations": 0,
  "token": "jwt-token"
}
```

## Users

### Get user by ID
```
GET /api/users/:id
```

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Response:**
```json
{
  "id": "user-id",
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "totalCredits": 0,
  "lifetimeCredits": 0,
  "withdrawableCredits": 0,
  "totalDonations": 0
}
```

### Update user
```
PUT /api/users/:id
```

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Request Body:**
```json
{
  "name": "John Smith",
  "email": "johnsmith@example.com",
  "phone": "+1234567891"
}
```

**Response:**
```json
{
  "id": "user-id",
  "name": "John Smith",
  "email": "johnsmith@example.com",
  "phone": "+1234567891",
  "totalCredits": 0,
  "lifetimeCredits": 0,
  "withdrawableCredits": 0,
  "totalDonations": 0
}
```

## Donations

### Get all donations for a user
```
GET /api/donations/user/:userId
```

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Response:**
```json
[
  {
    "id": "donation-id",
    "userId": "user-id",
    "type": "food",
    "title": "Food Donation",
    "description": "Donated food items",
    "quantity": "5 bags",
    "receiver": "Local Shelter",
    "status": "approved",
    "credits": 100,
    "date": "2023-01-15",
    "time": "14:30",
    "location": "Mumbai, Maharashtra",
    "donationPhoto": "/uploads/donation-photo.jpg",
    "selfiePhoto": "/uploads/selfie-photo.jpg",
    "createdAt": "2023-01-15T14:30:00.000Z",
    "updatedAt": "2023-01-15T14:30:00.000Z"
  }
]
```

### Get donation by ID
```
GET /api/donations/:id
```

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Response:**
```json
{
  "id": "donation-id",
  "userId": "user-id",
  "type": "food",
  "title": "Food Donation",
  "description": "Donated food items",
  "quantity": "5 bags",
  "receiver": "Local Shelter",
  "status": "approved",
  "credits": 100,
  "date": "2023-01-15",
  "time": "14:30",
  "location": "Mumbai, Maharashtra",
  "donationPhoto": "/uploads/donation-photo.jpg",
  "selfiePhoto": "/uploads/selfie-photo.jpg",
    "createdAt": "2023-01-15T14:30:00.000Z",
  "updatedAt": "2023-01-15T14:30:00.000Z"
}
```

### Create a new donation
```
POST /api/donations
```

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Request Body:**
```json
{
  "userId": "user-id",
  "type": "food",
  "title": "Food Donation",
  "description": "Donated food items",
  "quantity": "5 bags",
  "receiver": "Local Shelter",
  "date": "2023-01-15",
  "time": "14:30",
  "location": "Mumbai, Maharashtra",
  "donationPhoto": "/uploads/donation-photo.jpg",
  "selfiePhoto": "/uploads/selfie-photo.jpg"
}
```

**Response:**
```json
{
  "id": "donation-id",
  "userId": "user-id",
  "type": "food",
  "title": "Food Donation",
  "description": "Donated food items",
  "quantity": "5 bags",
  "receiver": "Local Shelter",
  "status": "pending",
  "credits": 100,
  "date": "2023-01-15",
  "time": "14:30",
  "location": "Mumbai, Maharashtra",
  "donationPhoto": "/uploads/donation-photo.jpg",
  "selfiePhoto": "/uploads/selfie-photo.jpg",
  "createdAt": "2023-01-15T14:30:00.000Z",
  "updatedAt": "2023-01-15T14:30:00.000Z"
}
```

### Update donation status (Admin only)
```
PUT /api/donations/:id/status
```

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Request Body:**
```json
{
  "status": "approved"
}
```

**Response:**
```json
{
  "id": "donation-id",
  "userId": "user-id",
  "type": "food",
  "title": "Food Donation",
  "description": "Donated food items",
  "quantity": "5 bags",
  "receiver": "Local Shelter",
  "status": "approved",
  "credits": 100,
  "date": "2023-01-15",
  "time": "14:30",
  "location": "Mumbai, Maharashtra",
  "donationPhoto": "/uploads/donation-photo.jpg",
  "selfiePhoto": "/uploads/selfie-photo.jpg",
  "createdAt": "2023-01-15T14:30:00.000Z",
  "updatedAt": "2023-01-15T14:30:00.000Z"
}
```

### Get pending donations (Admin only)
```
GET /api/donations/status/pending
```

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Response:**
```json
[
  {
    "id": "donation-id",
    "userId": "user-id",
    "type": "food",
    "title": "Food Donation",
    "description": "Donated food items",
    "quantity": "5 bags",
    "receiver": "Local Shelter",
    "status": "pending",
    "credits": 100,
    "date": "2023-01-15",
    "time": "14:30",
    "location": "Mumbai, Maharashtra",
    "donationPhoto": "/uploads/donation-photo.jpg",
    "selfiePhoto": "/uploads/selfie-photo.jpg",
    "createdAt": "2023-01-15T14:30:00.000Z",
    "updatedAt": "2023-01-15T14:30:00.000Z",
    "user": {
      "name": "John Doe",
      "email": "john@example.com"
    }
  }
]
```

### Get approved donations (Admin only)
```
GET /api/donations/status/approved
```

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Response:**
```json
[
  {
    "id": "donation-id",
    "userId": "user-id",
    "type": "food",
    "title": "Food Donation",
    "description": "Donated food items",
    "quantity": "5 bags",
    "receiver": "Local Shelter",
    "status": "approved",
    "credits": 100,
    "date": "2023-01-15",
    "time": "14:30",
    "location": "Mumbai, Maharashtra",
    "donationPhoto": "/uploads/donation-photo.jpg",
    "selfiePhoto": "/uploads/selfie-photo.jpg",
    "createdAt": "2023-01-15T14:30:00.000Z",
    "updatedAt": "2023-01-15T14:30:00.000Z"
  }
]
```

### Get rejected donations (Admin only)
```
GET /api/donations/status/rejected
```

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Response:**
```json
[
  {
    "id": "donation-id",
    "userId": "user-id",
    "type": "food",
    "title": "Food Donation",
    "description": "Donated food items",
    "quantity": "5 bags",
    "receiver": "Local Shelter",
    "status": "rejected",
    "credits": 100,
    "date": "2023-01-15",
    "time": "14:30",
    "location": "Mumbai, Maharashtra",
    "donationPhoto": "/uploads/donation-photo.jpg",
    "selfiePhoto": "/uploads/selfie-photo.jpg",
    "createdAt": "2023-01-15T14:30:00.000Z",
    "updatedAt": "2023-01-15T14:30:00.000Z
  }
]
```

## Withdrawals

### Get all withdrawals for a user
```
GET /api/withdrawals/user/:userId
```

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Response:**
```json
[
  {
    "id": "withdrawal-id",
    "userId": "user-id",
    "amount": 100,
    "date": "2023-01-15",
    "status": "processed",
    "createdAt": "2023-01-15T14:30:00.000Z",
    "updatedAt": "2023-01-15T14:30:00.000Z"
  }
]
```

### Create a new withdrawal request
```
POST /api/withdrawals
```

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Request Body:**
```json
{
  "userId": "user-id",
  "amount": 100,
  "date": "2023-01-15"
}
```

**Response:**
```json
{
  "id": "withdrawal-id",
  "userId": "user-id",
  "amount": 100,
  "date": "2023-01-15",
  "status": "pending",
  "createdAt": "2023-01-15T14:30:00.000Z",
  "updatedAt": "2023-01-15T14:30:00.000Z"
}
```

### Get pending withdrawals (Admin only)
```
GET /api/withdrawals/status/pending
```

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Response:**
```json
[
  {
    "id": "withdrawal-id",
    "userId": "user-id",
    "amount": 100,
    "date": "2023-01-15",
    "status": "pending",
    "createdAt": "2023-01-15T14:30:00.000Z",
    "updatedAt": "2023-01-15T14:30:00.000Z",
    "user": {
      "name": "John Doe",
      "email": "john@example.com"
    }
  }
]
```

### Update withdrawal status (Admin only)
```
PUT /api/withdrawals/:id/status
```

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Request Body:**
```json
{
  "status": "processed"
}
```

**Response:**
```json
{
  "id": "withdrawal-id",
  "userId": "user-id",
  "amount": 100,
  "date": "2023-01-15",
  "status": "processed",
  "createdAt": "2023-01-15T14:30:00.000Z",
  "updatedAt": "2023-01-15T14:30:00.000Z"
}
```

## Image Upload

### Upload donation photo
```
POST /api/upload/donation-photo
```

**Headers:**
```
Content-Type: multipart/form-data
```

**Form Data:**
```
donationPhoto: <file>
userId: user-id
```

**Response:**
```json
{
  "imagePath": "/uploads/donation-photo-optimized.jpg"
}
```

### Upload selfie photo
```
POST /api/upload/selfie-photo
```

**Headers:**
```
Content-Type: multipart/form-data
```

**Form Data:**
```
selfiePhoto: <file>
```

**Response:**
```json
{
  "imagePath": "/uploads/selfie-photo-optimized.jpg"
}
```

## OTP Verification

The app now uses email-based OTP verification instead of SMS to eliminate costs. The OTP system uses Nodemailer with configurable email services.

### Configuration

To configure a real email service, update the `.env` file with your email service credentials:

```env
# Email Configuration
EMAIL_SERVICE=gmail
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
```

Supported email services:
- Gmail (requires App Password)
- Other services supported by Nodemailer

### Security Features

1. Rate limiting: Maximum 5 OTP requests per 15 minutes per IP
2. Failed attempt tracking: Maximum 3 failed attempts per OTP
3. Automatic cleanup: Expired OTPs are automatically invalidated
4. One-time use: OTPs are deleted after successful verification

### Generate OTP
```
POST /api/otp/generate
```

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "OTP sent successfully to your email"
}
```

### Verify OTP
```
POST /api/otp/verify
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "otp": "123456"
}
```

**Response:**
```json
{
  "success": true,
  "message": "OTP verified successfully",
  "verified": true
}
```

## Real-time Events

The backend uses Socket.IO for real-time communication. Clients can listen for the following events:

### Donation Events

- `donationCreated`: Emitted when a new donation is created
- `donationStatusUpdated`: Emitted when a donation's status is updated

### Withdrawal Events

- `withdrawalCreated`: Emitted when a new withdrawal is created
- `withdrawalStatusUpdated`: Emitted when a withdrawal's status is updated

### Socket.IO Connection

To connect to the Socket.IO server:

```javascript
const socket = io('http://localhost:3000');

// Join user room
socket.emit('joinRoom', userId);

// Join admin room (for admin users)
socket.emit('joinAdminRoom');

// Listen for events
socket.on('donationCreated', (donation) => {
  console.log('New donation created:', donation);
});

socket.on('donationStatusUpdated', (donation) => {
  console.log('Donation status updated:', donation);
});
```

