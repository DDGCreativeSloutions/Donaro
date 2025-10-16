# Donaro App

A world-class mobile application for verifying community donations and earning rewards. Built with React Native Expo for the frontend and Node.js with Prisma ORM for the backend.

## Features

- **World-Class UI/UX**: Modern, engaging interface with smooth animations and transitions
- Geo-tagging and timestamp metadata for verification photos
- Point-based reward system and withdrawal functionality
- Security features (GPS spoofing protection, watermarking)
- Admin panel for verification
- Fraud detection system
- Real-time updates with Socket.IO
- Cross-platform compatibility (iOS, Android, Web)

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Expo CLI
- SQLite (for development)

## Installation

### Backend Setup

1. Navigate to the backend directory:
   ```
   cd backend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Set up the database:
   ```
   npx prisma generate
   npx prisma migrate dev --name init
   ```

4. Start the backend server:
   ```
   npm run dev
   ```

   The backend server will start on http://localhost:3000

### Frontend Setup

1. Navigate to the root directory:
   ```
   cd ..
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the Expo development server:
   ```
   npx expo start
   ```

4. To run on an emulator or physical device:
   - Press `a` to run on Android
   - Press `i` to run on iOS (Mac only)
   - Press `w` to run on web

### Admin Panel

The admin panel is accessible at:
```
http://localhost:3000/admin
```

Use the following credentials to log in as admin:
- Email: admin@donaro.com
- Password: admin123

## World-Class UI Features

### Onboarding Experience
- Beautifully designed onboarding flow with smooth animations
- Engaging illustrations and clear value propositions
- Interactive pagination with animated indicators
- Responsive design for all device sizes

### Authentication System
- Modern login/signup screens with elegant form design
- Password visibility toggle for better UX
- Smooth transitions between auth states
- Welcome screen with clear call-to-action buttons

### Dashboard
- Personalized welcome experience with user name
- Visually appealing stat cards with icons and shadows
- Quick action buttons for core functionality
- Recent verifications list with status indicators
- Pull-to-refresh functionality

### Verification Flow
- Step-by-step verification process with clear progress indicators
- Intuitive form design with proper validation
- Photo capture with metadata display
- Security information badges
- Loading states with activity indicators

### Rewards System
- Beautiful balance display with currency conversion
- Withdrawal form with payment method selection
- Progress tracking with visual progress bar
- Reward tiers with clear unlock criteria
- History navigation

### Profile Management
- Personalized profile header with avatar
- Stats overview for user engagement
- Settings navigation with clear options
- Logout functionality

### Verification History
- Filterable verification list (all, pending, approved, rejected)
- Detailed verification cards with comprehensive information
- Status badges with color coding
- Pull-to-refresh for real-time updates
- Empty states with clear calls to action

## Project Structure

```
Donaro/
├── admin/                 # Admin panel HTML files
├── app/                   # Expo app screens and navigation
│   ├── (tabs)/            # Tab-based navigation screens
│   │   ├── index.tsx        # Dashboard screen
│   │   ├── donate.tsx       # Verification flow
│   │   ├── history.tsx      # Verification history
│   │   ├── rewards.tsx      # Rewards system
│   │   └── profile.tsx      # User profile
│   ├── _layout.tsx        # Main app layout
│   ├── onboarding.tsx     # Onboarding flow
│   ├── login.tsx          # Login screen
│   └── signup.tsx         # Signup screen
├── backend/               # Node.js backend with Express and Prisma
│   ├── prisma/            # Prisma schema and migrations
│   ├── src/               # Backend source code
│   │   ├── routes/        # API routes
│   │   ├── utils/         # Utility functions
│   │   └── server.js      # Main server file
│   ├── uploads/           # Uploaded images
│   ├── .env               # Environment variables
│   ├── package.json       # Backend dependencies
│   └── README.md          # Backend API documentation
├── components/            # React components
├── constants/             # App constants
├── contexts/              # React contexts
├── services/              # API service files
├── utils/                 # Utility functions
├── README.md              # This file
├── package.json           # Frontend dependencies
├── babel.config.js        # Babel configuration
└── metro.config.js        # Metro bundler configuration
```

## API Documentation

For detailed API documentation, see [backend/README.md](backend/README.md)

## Environment Variables

### Frontend (.env file in root directory)
```
EXPO_PUBLIC_API_URL=http://localhost:3000
```

### Backend (.env file in backend directory)
```
PORT=3000
JWT_SECRET=your_jwt_secret_key
DATABASE_URL=file:./dev.db
```

## Development

### Backend Development

The backend uses:
- Node.js with Express
- Prisma ORM with SQLite
- Socket.IO for real-time communication
- JWT for authentication

To run the backend in development mode:
```
cd backend
npm run dev
```

### Frontend Development

The frontend uses:
- React Native with Expo
- TypeScript
- React Navigation
- Socket.IO client for real-time communication

To run the frontend:
```
npx expo start
```

## Building for Production

### Backend

To build the backend for production:
```
cd backend
npm start
```

### Frontend

To build the frontend for production:
```
npx expo build
```

## Testing

### Backend Testing

To run backend tests:
```
cd backend
npm test
```

### Frontend Testing

To run frontend tests:
```
npm test
```

## Troubleshooting

1. **Port already in use**: Change the PORT in the backend [.env](backend/.env) file
2. **Database connection issues**: Ensure Prisma is properly configured and the database file exists
3. **Missing dependencies**: Run `npm install` in both the root and backend directories
4. **Expo issues**: Try clearing the Expo cache with `npx expo start -c`
5. **Android/iOS not loading**: Ensure you have the correct Expo Go app version and that your device is on the same network as your development machine

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a pull request

## License

This project is licensed under the MIT License.