import Colors from '@/constants/Colors';
import { useEffect, useRef } from 'react';
import { Animated, Easing, Image, StyleSheet, Text, View } from 'react-native';
import { useColorScheme } from './useColorScheme';

const SplashScreen = () => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme || 'light'];
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 1200,
        easing: Easing.out(Easing.exp),
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 800,
        easing: Easing.out(Easing.exp),
        useNativeDriver: true,
      })
    ]).start();
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: colors.primary }]}>
      <Animated.View 
        style={[
          styles.content, 
          { 
            transform: [{ scale: scaleAnim }],
            opacity: opacityAnim
          }
        ]}
      >
        <View style={styles.iconContainer}>
          <Image 
            source={require('@/assets/images/favicon.png')} 
            style={styles.icon}
            resizeMode="contain"
          />
        </View>
        <Text style={[styles.appName, { color: colors.white }]}>Donaro</Text>
        <Text style={[styles.tagline, { color: colors.white }]}>Make a difference, earn rewards</Text>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  icon: {
    width: 80,
    height: 80,
  },
  appName: {
    fontSize: 36,
    fontWeight: '800',
    marginBottom: 10,
    letterSpacing: 1,
  },
  tagline: {
    fontSize: 16,
    fontWeight: '300',
    opacity: 0.9,
    letterSpacing: 0.5,
  },
});

export default SplashScreen;