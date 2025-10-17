# Google Play Store Submission Guide for Donaro App

This guide provides step-by-step instructions for building and submitting the Donaro app to the Google Play Store.

## Prerequisites

1. Google Play Developer Account
2. Expo Account
3. Properly configured app assets

## Required Assets

All required assets have been created and are located in the `play-store-assets` directory:

- Feature Graphic: `play-store-assets/feature-graphic.png` (1024x500)
- Phone Screenshots: `play-store-assets/screenshots/phone/` (1080x1920)
- Tablet Screenshots: `play-store-assets/screenshots/tablet/` (1200x1920)

## Build Process

### Option 1: Using EAS Build (Recommended)

1. Ensure you're logged into your Expo account:
   ```
   eas login
   ```

2. Configure the project for building:
   ```
   eas build:configure
   ```

3. Build the app bundle for production:
   ```
   eas build -p android --profile production
   ```

4. Once the build is complete, download the AAB file.

### Option 2: Local Build (Requires Android Studio)

1. Install Android Studio
2. Set up ANDROID_HOME environment variable
3. Run:
   ```
   expo build:android
   ```

## Play Store Submission

1. Sign in to your Google Play Console
2. Create a new application
3. Fill in the app details:
   - Title: Donaro
   - Short description: Verify community donations and earn rewards
   - Full description: A world-class mobile application for verifying community donations and earning rewards. Built with React Native Expo for the frontend and Node.js with Prisma ORM for the backend.
4. Upload the required assets from the `play-store-assets` directory
5. Upload the AAB file generated from the build process
6. Complete the store listing information
7. Submit for review

## Troubleshooting Build Issues

If you encounter build issues:

1. Ensure all dependencies are properly installed:
   ```
   npm install
   ```

2. Check for configuration issues in `app.json` and `eas.json`

3. Verify all required assets are present:
   - `assets/images/icon.png` (192x192)
   - `assets/images/splash-icon.png` (512x512)
   - `assets/images/adaptive-icon.png` (108x108)

4. If dependency installation fails during cloud build, try:
   ```
   npm ci
   ```

## App Permissions

The app requires the following permissions:
- Camera: To capture photos of donations
- Location: To verify authenticity of donations
- Storage: To save photos to device

These permissions are declared in `app.json`.

## Version Management

The app version is managed in `app.json`. For each new release:
1. Update the version field
2. EAS will automatically increment the versionCode for Android builds

## Support

For issues with building or submitting to the Play Store, contact the development team.