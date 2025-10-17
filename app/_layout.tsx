import SplashScreenComponent from '@/components/SplashScreen';
import { useColorScheme } from '@/components/useColorScheme';
import { UserProvider } from '@/contexts/UserContext';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { StatusBar, View } from 'react-native';
import OnboardingScreen from './onboarding';

export {
    // Catch any errors thrown by the Layout component.
    ErrorBoundary
} from 'expo-router';

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: 'login',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

/**
 * Root layout component that handles font loading and initial app setup
 */
export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return <RootLayoutNav />;
}

/**
 * Navigation layout component that handles splash screen, onboarding, and routing
 */
function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showSplash, setShowSplash] = useState(true);

  /**
   * Initialize the app by checking onboarding status and showing splash screen
   */
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Check if onboarding has been completed
        const hasOnboarded = await AsyncStorage.getItem('hasOnboarded');
        
        // Simulate loading time for splash screen
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        setShowSplash(false);
        
        if (!hasOnboarded) {
          setShowOnboarding(true);
        }
      } catch (error) {
        console.error('Error initializing app:', error);
        setShowSplash(false);
        setShowOnboarding(true);
      }
    };

    initializeApp();
  }, []);

  /**
   * Handle completion of onboarding flow
   */
  const handleOnboardingComplete = async () => {
    try {
      await AsyncStorage.setItem('hasOnboarded', 'true');
      setShowOnboarding(false);
    } catch (error) {
      console.error('Error saving onboarding status:', error);
    }
  };

  // Show splash screen if still loading
  if (showSplash) {
    return (
      <View style={{ flex: 1 }}>
        <StatusBar barStyle="light-content" backgroundColor="#6C63FF" />
        <SplashScreenComponent />
      </View>
    );
  }

  // Show onboarding if not completed
  if (showOnboarding) {
    return (
      <View style={{ flex: 1 }}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <OnboardingScreen />
      </View>
    );
  }

  // Main app navigation
  return (
    <UserProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="login" options={{ headerShown: false }} />
          <Stack.Screen name="signup" options={{ headerShown: false }} />
          <Stack.Screen name="terms" options={{ headerShown: false }} />
          <Stack.Screen name="privacy" options={{ headerShown: false }} />
          <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
        </Stack>
      </ThemeProvider>
    </UserProvider>
  );
}