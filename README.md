# Donaro - Donation Verification Platform

Donaro is a mobile application that enables users to verify donations with geo-tagging, timestamps, and watermarking for authenticity. The platform includes a reward system where users earn points for verifications, track their progress, and request withdrawals.

## Key Features

### Core Functionality
- **Donation Verification**: Capture photos with geo-tagging, timestamps, and watermarking for authenticity
- **Reward System**: Earn points per verification, track progress, request withdrawals
- **Security**: GPS spoofing detection, image watermarking
- **Admin Panel**: HTML-based interface for verifying/rejecting donations
- **Real-time Updates**: Socket.IO enables live sync of donation status
- **User Experience**: Onboarding flow, smooth animations, responsive design across iOS, Android, Web

### Technical Features
- **World-Class UI**: Beautifully designed interfaces with smooth animations
- **Security**: JWT authentication, password strength requirements, GPS spoofing detection
- **Real-time Updates**: Live sync of donation status using Socket.IO
- **Responsive Design**: Works seamlessly across iOS, Android, and Web platforms
- **Performance**: Optimized for fast loading and smooth interactions

## Technology Stack

### Frontend
- **Mobile App**: React Native with Expo, TypeScript
- **Navigation**: React Navigation, Expo Router
- **UI Components**: Custom component library with buttons, inputs, cards
- **Styling**: Expo Linear Gradient, React Native Reanimated
- **Icons**: @expo/vector-icons

### Backend
- **Server**: Node.js with Express
- **Database**: Prisma ORM with SQLite (development) / PostgreSQL (production)
- **Authentication**: JWT
- **Real-time**: Socket.IO for live updates
- **Image Processing**: Jimp for server-side watermarking

### Utilities
- **Forms**: react-hook-form
- **Location**: expo-location
- **Camera**: expo-image-picker
- **Environment**: dotenv

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
EXPO_PUBLIC_API_URL=http://localhost:3001
```

### Backend (.env file in backend directory)
```env
PORT=3001
JWT_SECRET=[REDACTED] # Generate a strong secret key
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