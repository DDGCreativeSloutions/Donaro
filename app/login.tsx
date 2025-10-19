import Button from '@/components/Button';
import Input from '@/components/Input';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { useUser } from '@/contexts/UserContext';
import { apiService } from '@/services/api';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import React, { useCallback, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const LoginScreen = () => {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme || 'light'];
  const { login } = useUser();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  const handleLogin = useCallback(async () => {
    // Clear previous errors
    setLoginError('');
    
    if (!email || !password) {
      setLoginError('Please enter both email and password.');
      return;
    }
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setLoginError('Please enter a valid email address.');
      return;
    }
    
    setIsLoading(true);
    try {
      // Call the actual API to login
      const userData = await apiService.loginUser(email, password);
      
      // Login the user with the returned data
      login(userData);
      
      // Check if user is admin and redirect accordingly
      if (userData.isAdmin) {
        // Open admin panel in browser for admin users
        // Remove /api from the base URL to get the correct admin panel URL
        const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';
        const adminPanelUrl = API_BASE_URL.replace('/api', '');
        WebBrowser.openBrowserAsync(`${adminPanelUrl}/`);
      } else {
        // Redirect to regular user tabs
        router.replace('/(tabs)');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      // Set specific error message based on the error
      if (error.message && error.message.includes('Invalid credentials')) {
        setLoginError('Invalid email or password. Please try again.');
      } else if (error.message && error.message.includes('Network')) {
        setLoginError('Network connection failed. Please check your internet and try again.');
      } else if (error.message && error.message.includes('timeout')) {
        setLoginError('Request timeout. The server is taking too long to respond. Please try again.');
      } else {
        setLoginError(error.message || 'Login failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [email, password, login, router]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <Text style={styles.headerTitle}>Welcome Back</Text>
        <Text style={styles.headerSubtitle}>Sign in to continue your journey</Text>
      </View>
      
      <View style={styles.content}>
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          {/* Display login error */}
          {loginError ? (
            <View style={[styles.errorContainer, { backgroundColor: `${colors.danger}10` }]}>
              <Text style={[styles.errorText, { color: colors.danger }]}>{loginError}</Text>
            </View>
          ) : null}
          
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
          
          <TouchableOpacity style={styles.forgotPassword}>
            <Text style={[styles.forgotPasswordText, { color: colors.primary }]}>Forgot Password?</Text>
          </TouchableOpacity>
          
          <Button 
            title={isLoading ? "Signing In..." : "Login"} 
            onPress={handleLogin} 
            disabled={isLoading}
            style={styles.loginButton}
          />
        </View>
        
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.gray }]}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => router.push('/signup')}>
            <Text style={[styles.footerLink, { color: colors.primary }]}>Sign Up</Text>
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
  },
  card: {
    borderRadius: 20,
    padding: 25,
    elevation: 5,
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
  },
  errorContainer: {
    padding: 10,
    borderRadius: 8,
    marginBottom: 15,
  },
  errorText: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
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
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 25,
  },
  forgotPasswordText: {
    fontSize: 16,
    fontWeight: '600',
  },
  loginButton: {
    borderRadius: 16,
    paddingVertical: 18,
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

export default LoginScreen;