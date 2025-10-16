import Button from '@/components/Button';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { useUser } from '@/contexts/UserContext';
import { apiService } from '@/services/api';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

// Get API base URL from environment
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';

const OTPVerificationScreen = () => {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors.light; // Using light theme directly to avoid type issues
  const { login } = useUser();
  const [otp, setOtp] = useState<string[]>(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [timer, setTimer] = useState(30);
  
  // Create refs for each OTP input field
  const otpInputRefs = useRef<Array<TextInput | null>>([]);
  
  // Get user data from previous screen
  const params = useLocalSearchParams();
  const { 
    fullName, 
    email, 
    phone, 
    password,
    userData 
  } = params as { 
    fullName: string; 
    email: string; 
    phone: string; 
    password: string;
    userData: string;
  };

  // Timer for resend OTP
  React.useEffect(() => {
    let interval: number | null = null;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timer]);

  const handleOtpChange = (text: string, index: number) => {
    // Only allow numeric input
    if (text && !/^\d$/.test(text)) return;
    
    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);
    
    // Auto focus to next input if a digit is entered
    if (text && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyPress = (e: any, index: number) => {
    // Handle backspace to move to previous input
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOTP = async () => {
    const otpString = otp.join('');
    
    if (otpString.length !== 6) {
      Alert.alert('Error', 'Please enter a 6-digit OTP.');
      return;
    }
    
    setIsLoading(true);
    try {
      // Verify OTP with backend
      const response = await fetch(`${API_BASE_URL}/otp/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email: email, // Changed from phone to email
          otp: otpString
        }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        // If we have userData, it means user is already created, just login
        if (userData) {
          const parsedUserData = JSON.parse(userData as string);
          login(parsedUserData);
          router.replace('/(tabs)');
        } else {
          // Create user account
          const user = await apiService.createUser({
            name: fullName,
            email,
            phone,
            password,
          });
          
          login(user);
          router.replace('/(tabs)');
        }
      } else {
        Alert.alert('Error', result.error || 'Invalid OTP. Please try again.');
      }
    } catch (error: any) {
      console.error('OTP verification error:', error);
      Alert.alert('Error', error.message || 'Failed to verify OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (timer > 0) return;
    
    try {
      // Request new OTP
      const response = await fetch(`${API_BASE_URL}/otp/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }), // Changed from phone to email
      });
      
      const result = await response.json();
      
      if (result.success) {
        Alert.alert('Success', 'New OTP has been sent to your email address.');
        setTimer(30); // Reset timer
      } else {
        Alert.alert('Error', result.error || 'Failed to send OTP. Please try again.');
      }
    } catch (error: any) {
      console.error('Resend OTP error:', error);
      Alert.alert('Error', error.message || 'Failed to resend OTP. Please try again.');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <Text style={styles.headerTitle}>Verify Your Email</Text>
        <Text style={styles.headerSubtitle}>Enter the 6-digit code sent to {email}</Text>
      </View>
      
      <View style={styles.content}>
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          {/* OTP Input Fields */}
          <View style={styles.otpContainer}>
            {otp.map((digit, index) => (
              <TextInput
                key={index}
                ref={(ref) => { otpInputRefs.current[index] = ref; }}
                value={digit}
                onChangeText={(text: string) => handleOtpChange(text, index)}
                onKeyPress={(e) => handleOtpKeyPress(e, index)}
                style={[styles.otpInput, { backgroundColor: colors.background, color: colors.text }]}
                keyboardType="numeric"
                maxLength={1}
                textAlign="center"
                autoFocus={index === 0}
              />
            ))}
          </View>
          
          {/* Timer and Resend Button */}
          <View style={styles.resendContainer}>
            {timer > 0 ? (
              <Text style={[styles.timerText, { color: colors.gray }]}>
                Resend OTP in {timer} seconds
              </Text>
            ) : (
              <TouchableOpacity onPress={handleResendOTP}>
                <Text style={[styles.resendText, { color: colors.primary }]}>
                  Resend OTP
                </Text>
              </TouchableOpacity>
            )}
          </View>
          
          <Button 
            title={isLoading ? "Verifying..." : "Verify & Continue"} 
            onPress={handleVerifyOTP} 
            disabled={isLoading}
            style={styles.verifyButton}
          />
          
          <TouchableOpacity 
            style={styles.changeNumberButton}
            onPress={() => router.back()}
          >
            <Text style={[styles.changeNumberText, { color: colors.primary }]}>
              Change Email Address
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 40,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 10,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.9,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    marginTop: -30,
    marginHorizontal: 20,
  },
  card: {
    borderRadius: 20,
    padding: 25,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  otpInput: {
    width: 50,
    height: 60,
    borderRadius: 12,
    fontSize: 24,
    fontWeight: '700',
  },
  resendContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  timerText: {
    fontSize: 16,
  },
  resendText: {
    fontSize: 16,
    fontWeight: '600',
  },
  verifyButton: {
    borderRadius: 16,
    paddingVertical: 18,
    marginBottom: 15,
  },
  changeNumberButton: {
    alignItems: 'center',
  },
  changeNumberText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default OTPVerificationScreen;