import Button from '@/components/Button';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Dimensions, Image, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const { width, height } = Dimensions.get('window');

const OnboardingScreen = () => {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme || 'light'];
  const [currentIndex, setCurrentIndex] = useState(0);

  const onboardingData = [
    {
      id: 1,
      title: 'Make a Difference',
      subtitle: 'Donate items you no longer need and help those in need',
      image: require('@/assets/images/onboarding-1.png'),
    },
    {
      id: 2,
      title: 'Earn Rewards',
      subtitle: 'Get credits for your donations that can be converted to cash',
      image: require('@/assets/images/onboarding-2.png'),
    },
    {
      id: 3,
      title: 'Track Impact',
      subtitle: 'See how your donations are helping the community',
      image: require('@/assets/images/onboarding-3.png'),
    },
  ];

  const handleOnboardingComplete = async () => {
    try {
      await AsyncStorage.setItem('hasOnboarded', 'true');
      router.replace('/login');
    } catch (error) {
      console.error('Error saving onboarding status:', error);
      router.replace('/login');
    }
  };

  const handleNext = () => {
    if (currentIndex < onboardingData.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      // Onboarding complete, navigate to login
      handleOnboardingComplete();
    }
  };

  const handleSkip = () => {
    handleOnboardingComplete();
  };

  const renderDots = () => {
    return onboardingData.map((_, index) => (
      <View
        key={index}
        style={[
          styles.dot,
          { backgroundColor: index === currentIndex ? colors.primary : colors.gray },
        ]}
      />
    ));
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Skip Button */}
      <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
        <Text style={[styles.skipText, { color: colors.gray }]}>Skip</Text>
      </TouchableOpacity>

      {/* Onboarding Content */}
      <View style={styles.content}>
        <View style={styles.imageContainer}>
          <Image 
            source={onboardingData[currentIndex].image} 
            style={styles.image}
            resizeMode="contain"
          />
        </View>
        
        <View style={styles.textContainer}>
          <Text style={[styles.title, { color: colors.text }]}>
            {onboardingData[currentIndex].title}
          </Text>
          <Text style={[styles.subtitle, { color: colors.gray }]}>
            {onboardingData[currentIndex].subtitle}
          </Text>
        </View>
      </View>

      {/* Pagination Dots */}
      <View style={styles.pagination}>{renderDots()}</View>

      {/* Action Button */}
      <View style={styles.buttonContainer}>
        <Button
          title={currentIndex === onboardingData.length - 1 ? "Get Started" : "Next"}
          onPress={handleNext}
          style={styles.button}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  skipButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    zIndex: 1,
  },
  skipText: {
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  imageContainer: {
    flex: 0.6,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  image: {
    width: width * 0.8,
    height: height * 0.4,
  },
  textContainer: {
    flex: 0.4,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 15,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginHorizontal: 5,
  },
  buttonContainer: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  button: {
    borderRadius: 16,
    paddingVertical: 18,
  },
});

export default OnboardingScreen;