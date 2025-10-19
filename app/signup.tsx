import Button from '@/components/Button';
import Input from '@/components/Input';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { useUser } from '@/contexts/UserContext';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import emailjs from '@emailjs/browser';

// Get API base URL from environment variables
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://donaro-production.up.railway.app/api';

// EmailJS Configuration - Replace with your actual credentials
const EMAILJS_CONFIG = {
  SERVICE_ID: 'service_undmw4c',     // Updated EmailJS service ID
  TEMPLATE_ID: 'template_mkx7s1d',   // Updated EmailJS template ID
  PUBLIC_KEY: 'bpWDQy63wlpfsWHk7'      // Get from EmailJS dashboard
};

// Validate URL to prevent SSRF
const isValidUrl = (url: string): boolean => {
  try {
    if (!url || url.trim() === '') {
      return false;
    }

    const parsedUrl = new URL(url);
    const hostname = parsedUrl.hostname.toLowerCase();

    // Allow localhost for development
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return true;
    }

    // Allow IP addresses for development
    if (hostname.match(/^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/)) {
      return true;
    }

    // Allow Vercel deployments
    if (hostname.endsWith('.vercel.app') || hostname === 'donaro-backend.vercel.app') {
      return true;
    }

    // Allow Railway deployments
    if (hostname.endsWith('.railway.app') || hostname.includes('.up.railway.app') || hostname.includes('railway.app')) {
      return true;
    }

    // Add your allowed hostnames here
    // if (hostname.endsWith('yourdomain.com')) {
    //   return true;
    // }

    return false;
  } catch {
    return false;
  }
};

// Ensure API_BASE_URL is valid
if (!isValidUrl(API_BASE_URL)) {
  console.error('Invalid API base URL detected');
}

const SignupScreen = () => {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme || 'light'];
  const { login } = useUser();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleTermsPress = () => {
    router.push('/terms');
  };

  const handlePrivacyPress = () => {
    router.push('/privacy');
  };

  const handleSignup = async () => {
    // Validate all fields are filled
    if (!fullName || !email || !password || !phone) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Error', 'Please enter a valid email address.');
      return;
    }

    // Validate phone number (10 digits for India)
    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(phone)) {
      Alert.alert('Error', 'Please enter a valid 10-digit Indian mobile number (starting with 6, 7, 8, or 9).');
      return;
    }

    // Validate password strength
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(password)) {
      Alert.alert('Error', 'Password must be at least 8 characters long and include at least one uppercase letter, one lowercase letter, one number, and one special character.');
      return;
    }

    // Check if terms are agreed (single checkbox now)
    if (!agreeToTerms) {
      Alert.alert('Error', 'Please agree to the Terms and Privacy Policy.');
      return;
    }
    
    // Validate API URL before making requests
    if (!isValidUrl(API_BASE_URL)) {
      Alert.alert('Error', 'Invalid API configuration. Please contact support.');
      return;
    }
    
    setIsLoading(true);
    try {
      // Generate OTP from backend
      const response = await fetch(`${API_BASE_URL}/otp/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const result = await response.json();

      if (result.success) {
        const otpCode = result.otp;

        // Send email using EmailJS
        try {
          console.log('EmailJS Signup Debug Info:', {
            serviceId: EMAILJS_CONFIG.SERVICE_ID,
            templateId: EMAILJS_CONFIG.TEMPLATE_ID,
            toEmail: email,
            otpCode: otpCode,
            userName: fullName,
            publicKey: EMAILJS_CONFIG.PUBLIC_KEY
          });

          await emailjs.send(
            EMAILJS_CONFIG.SERVICE_ID,
            EMAILJS_CONFIG.TEMPLATE_ID,
            {
              to_email: email,
              otp: otpCode,
              user_name: fullName,
              // Also try with different variable names to match template
              otp_code: otpCode,
            },
            EMAILJS_CONFIG.PUBLIC_KEY
          );

          // Navigate to OTP verification screen after successful email send
          router.push({
            pathname: '/otp-verification',
            params: {
              fullName,
              email,
              phone,
              password,
            }
          });
        } catch (emailError: any) {
          console.error('EmailJS signup error:', emailError);

          // Check if it's a Gmail authentication error
          if (emailError.text && emailError.text.includes('Invalid grant')) {
            Alert.alert(
              'Email Service Error',
              'Email service needs reconfiguration. Please contact support.',
              [
                { text: 'OK' }
              ]
            );
          } else {
            Alert.alert(
              'Email Service Issue',
              'We\'re having trouble sending the verification email. Please try again in a few minutes or contact support.',
              [
                { text: 'Try Again', onPress: () => handleSignup() },
                { text: 'Continue Anyway', onPress: () => router.push({
                  pathname: '/otp-verification',
                  params: { fullName, email, phone, password }
                })}
              ]
            );
          }
        }
      } else {
        Alert.alert('Error', result.error || 'Failed to generate OTP. Please try again.');
      }
    } catch (error: any) {
      console.error('Signup error:', error);
      // Provide more specific error messages
      if (error instanceof TypeError && error.message.includes('fetch')) {
        Alert.alert('Network Error', 'Network connection failed. Please check your internet and try again.');
      } else if (error.message && error.message.includes('timeout')) {
        Alert.alert('Timeout Error', 'Request timeout. The server is taking too long to respond. Please try again.');
      } else {
        Alert.alert('Signup Failed', error.message || 'Signup failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={[styles.header, { backgroundColor: colors.primary }]}>
            <Text style={styles.headerTitle}>Create Account</Text>
            <Text style={styles.headerSubtitle}>Start making a difference today</Text>
          </View>

          <View style={styles.content}>
            <View style={[styles.card, { backgroundColor: colors.card }]}>
              <View style={styles.inputContainer}>
                <Input
                  placeholder="Full Name"
                  value={fullName}
                  onChangeText={setFullName}
                  autoCapitalize="words"
                  icon="user"
                />
              </View>

              <View style={styles.inputContainer}>
                <Input
                  placeholder="Email"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  icon="mail"
                />
              </View>

              <View style={styles.inputContainer}>
                <Input
                  placeholder="10-digit Mobile Number"
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                  maxLength={10}
                  icon="phone"
                />
              </View>

              <View style={styles.inputContainer}>
                <Input
                  placeholder="Password"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  icon="lock"
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.showPasswordButton}
                >
                  <Feather name={showPassword ? 'eye-off' : 'eye'} size={20} color={colors.gray} />
                </TouchableOpacity>
              </View>

              {/* Single checkbox for both terms and privacy */}
              <View style={styles.checkboxContainer}>
                <TouchableOpacity
                  style={styles.checkbox}
                  onPress={() => setAgreeToTerms(!agreeToTerms)}
                >
                  <Feather
                    name={agreeToTerms ? 'check-square' : 'square'}
                    size={20}
                    color={agreeToTerms ? colors.primary : colors.gray}
                  />
                </TouchableOpacity>
                <Text style={[styles.checkboxText, { color: colors.text }]}>
                  I agree to the
                  <Text style={[styles.link, { color: colors.primary }]} onPress={handleTermsPress}> Terms of Service</Text>
                  {' '}and
                  <Text style={[styles.link, { color: colors.primary }]} onPress={handlePrivacyPress}> Privacy Policy</Text>
                </Text>
              </View>

              <Button
                title={isLoading ? 'Creating Account...' : 'Sign Up'}
                onPress={handleSignup}
                disabled={isLoading}
                style={styles.signupButton}
              />
            </View>

            <View style={styles.footer}>
              <Text style={[styles.footerText, { color: colors.gray }]}>Already have an account? </Text>
              <TouchableOpacity onPress={() => router.push('/login')}>
                <Text style={[styles.footerLink, { color: colors.primary }]}>Login</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
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
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  content: {
    flex: 1,
    marginTop: -30,
    marginHorizontal: 20,
    paddingBottom: 30,
  },
  card: {
    borderRadius: 20,
    padding: 25,
    elevation: 5,
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
  },
  inputContainer: {
    marginBottom: 20,
  },
  showPasswordButton: {
    position: 'absolute',
    right: 15,
    zIndex: 1,
    height: '100%',
    justifyContent: 'center',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  checkbox: {
    marginRight: 10,
  },
  checkboxText: {
    fontSize: 14,
    flex: 1,
  },
  link: {
    fontWeight: '600',
  },
  signupButton: {
    borderRadius: 16,
    paddingVertical: 18,
    marginTop: 10,
    width: '100%'
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  footerText: {
    fontSize: 16,
  },
  footerLink: {
    fontSize: 16,
    fontWeight: '700',
  },
});

export default SignupScreen;