import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { UserProvider } from '../../contexts/UserContext';
import LoginScreen from '../../app/login';
import DashboardScreen from '../../app/(tabs)/index';
import DonateScreen from '../../app/(tabs)/donate';
import { apiService } from '../../services/api';

// Mock API service
jest.mock('../../services/api');

// Mock navigation
const mockNavigate = jest.fn();
const mockReplace = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: mockNavigate,
    replace: mockReplace,
    back: jest.fn(),
  }),
}));

// Test wrapper component
const TestWrapper = ({ children, initialUser = null }) => {
  const [user, setUser] = React.useState(initialUser);
  
  const contextValue = {
    user,
    setUser,
    refreshUser: jest.fn(),
    logout: jest.fn(() => setUser(null))
  };

  return (
    <NavigationContainer>
      <UserProvider value={contextValue}>
        {children}
      </UserProvider>
    </NavigationContainer>
  );
};

describe('App Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    apiService.loginUser.mockClear();
    apiService.createDonation.mockClear();
    apiService.getDonations.mockClear();
  });

  describe('User Authentication Flow', () => {
    test('should complete login flow successfully', async () => {
      const mockUser = {
        id: 'user-1',
        name: 'Test User',
        email: 'test@example.com',
        totalCredits: 100,
        totalDonations: 5,
        withdrawableCredits: 50,
        token: 'mock-token'
      };

      apiService.loginUser.mockResolvedValue(mockUser);

      const { getByPlaceholderText, getByText } = render(
        <TestWrapper>
          <LoginScreen />
        </TestWrapper>
      );

      // Fill login form
      const emailInput = getByPlaceholderText('Email');
      const passwordInput = getByPlaceholderText('Password');
      const loginButton = getByText('Login');

      fireEvent.changeText(emailInput, 'test@example.com');
      fireEvent.changeText(passwordInput, 'password123');

      await act(async () => {
        fireEvent.press(loginButton);
      });

      await waitFor(() => {
        expect(apiService.loginUser).toHaveBeenCalledWith(
          'test@example.com',
          'password123',
          undefined
        );
      });

      // Should navigate to dashboard after successful login
      expect(mockReplace).toHaveBeenCalledWith('/(tabs)');
    });

    test('should handle login failure', async () => {
      apiService.loginUser.mockRejectedValue(new Error('Invalid credentials'));

      const { getByPlaceholderText, getByText } = render(
        <TestWrapper>
          <LoginScreen />
        </TestWrapper>
      );

      const emailInput = getByPlaceholderText('Email');
      const passwordInput = getByPlaceholderText('Password');
      const loginButton = getByText('Login');

      fireEvent.changeText(emailInput, 'test@example.com');
      fireEvent.changeText(passwordInput, 'wrongpassword');

      await act(async () => {
        fireEvent.press(loginButton);
      });

      await waitFor(() => {
        expect(getByText('Invalid credentials')).toBeTruthy();
      });

      // Should not navigate on failed login
      expect(mockReplace).not.toHaveBeenCalled();
    });
  });

  describe('Dashboard Integration', () => {
    test('should display user data correctly', async () => {
      const mockUser = {
        id: 'user-1',
        name: 'Test User',
        email: 'test@example.com',
        totalCredits: 150,
        totalDonations: 3,
        withdrawableCredits: 100
      };

      const mockDonations = [
        {
          id: 'donation-1',
          title: 'Food Donation',
          status: 'approved',
          date: '2024-01-15',
          location: 'Local Shelter',
          type: 'food'
        },
        {
          id: 'donation-2',
          title: 'Clothes Donation',
          status: 'pending',
          date: '2024-01-14',
          location: 'Community Center',
          type: 'clothes'
        }
      ];

      apiService.getDonations.mockResolvedValue(mockDonations);

      const { getByText } = render(
        <TestWrapper initialUser={mockUser}>
          <DashboardScreen />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(getByText('Welcome back,')).toBeTruthy();
        expect(getByText('Test User')).toBeTruthy();
        expect(getByText('150')).toBeTruthy(); // Total credits
        expect(getByText('3')).toBeTruthy(); // Total donations
        expect(getByText('₹1')).toBeTruthy(); // Withdrawable amount (100/100)
      });

      // Should display recent donations
      expect(getByText('Food Donation')).toBeTruthy();
      expect(getByText('Clothes Donation')).toBeTruthy();
    });

    test('should handle empty donations state', async () => {
      const mockUser = {
        id: 'user-1',
        name: 'New User',
        totalCredits: 0,
        totalDonations: 0,
        withdrawableCredits: 0
      };

      apiService.getDonations.mockResolvedValue([]);

      const { getByText } = render(
        <TestWrapper initialUser={mockUser}>
          <DashboardScreen />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(getByText('No verifications yet')).toBeTruthy();
        expect(getByText('Start verifying donations today')).toBeTruthy();
      });
    });
  });

  describe('Donation Creation Flow', () => {
    test('should complete donation submission successfully', async () => {
      const mockUser = {
        id: 'user-1',
        name: 'Test User',
        email: 'test@example.com'
      };

      const mockCreatedDonation = {
        id: 'donation-1',
        title: 'Test Donation',
        status: 'pending',
        credits: 100
      };

      apiService.createDonation.mockResolvedValue(mockCreatedDonation);

      const { getByPlaceholderText, getByText } = render(
        <TestWrapper initialUser={mockUser}>
          <DonateScreen />
        </TestWrapper>
      );

      // Fill donation form
      fireEvent.changeText(getByPlaceholderText('Donation Title'), 'Food for Shelter');
      fireEvent.changeText(getByPlaceholderText('Description'), 'Fresh vegetables and fruits');
      fireEvent.changeText(getByPlaceholderText('Quantity'), '10 kg');
      fireEvent.changeText(getByPlaceholderText('Receiver Name'), 'Local Food Bank');

      // Select donation type
      const foodTypeButton = getByText('Food');
      fireEvent.press(foodTypeButton);

      // Submit form
      const submitButton = getByText('Submit Donation');
      
      await act(async () => {
        fireEvent.press(submitButton);
      });

      await waitFor(() => {
        expect(apiService.createDonation).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Food for Shelter',
            description: 'Fresh vegetables and fruits',
            quantity: '10 kg',
            receiver: 'Local Food Bank',
            type: 'food'
          })
        );
      });

      // Should show success message
      expect(getByText('Donation submitted successfully!')).toBeTruthy();
    });

    test('should handle donation submission failure', async () => {
      const mockUser = {
        id: 'user-1',
        name: 'Test User',
        email: 'test@example.com'
      };

      apiService.createDonation.mockRejectedValue(new Error('Network error'));

      const { getByPlaceholderText, getByText } = render(
        <TestWrapper initialUser={mockUser}>
          <DonateScreen />
        </TestWrapper>
      );

      // Fill and submit form
      fireEvent.changeText(getByPlaceholderText('Donation Title'), 'Test Donation');
      fireEvent.changeText(getByPlaceholderText('Description'), 'Test description');
      fireEvent.changeText(getByPlaceholderText('Quantity'), '1 item');

      const submitButton = getByText('Submit Donation');
      
      await act(async () => {
        fireEvent.press(submitButton);
      });

      await waitFor(() => {
        expect(getByText('Network error')).toBeTruthy();
      });
    });

    test('should validate required fields before submission', async () => {
      const mockUser = {
        id: 'user-1',
        name: 'Test User',
        email: 'test@example.com'
      };

      const { getByText } = render(
        <TestWrapper initialUser={mockUser}>
          <DonateScreen />
        </TestWrapper>
      );

      // Try to submit without filling required fields
      const submitButton = getByText('Submit Donation');
      fireEvent.press(submitButton);

      await waitFor(() => {
        expect(getByText('Title is required')).toBeTruthy();
      });

      // Should not call API with invalid data
      expect(apiService.createDonation).not.toHaveBeenCalled();
    });
  });

  describe('Real-time Updates', () => {
    test('should handle socket connection and updates', async () => {
      const mockUser = {
        id: 'user-1',
        name: 'Test User'
      };

      // Mock socket events
      const mockSocket = {
        on: jest.fn(),
        emit: jest.fn(),
        disconnect: jest.fn()
      };

      apiService.joinRoom = jest.fn();
      apiService.onDonationStatusUpdated = jest.fn();

      render(
        <TestWrapper initialUser={mockUser}>
          <DashboardScreen />
        </TestWrapper>
      );

      // Should join user room for real-time updates
      expect(apiService.joinRoom).toHaveBeenCalledWith('user-1');
    });
  });

  describe('Error Handling', () => {
    test('should handle network connectivity issues', async () => {
      const mockUser = {
        id: 'user-1',
        name: 'Test User'
      };

      // Mock network error
      apiService.getDonations.mockRejectedValue(new TypeError('Network request failed'));

      const { getByText } = render(
        <TestWrapper initialUser={mockUser}>
          <DashboardScreen />
        </TestWrapper>
      );

      // Should handle error gracefully and show empty state
      await waitFor(() => {
        expect(getByText('No verifications yet')).toBeTruthy();
      });
    });

    test('should handle API timeout errors', async () => {
      const mockUser = {
        id: 'user-1',
        name: 'Test User'
      };

      // Mock timeout error
      apiService.createDonation.mockRejectedValue(new Error('Request timeout'));

      const { getByPlaceholderText, getByText } = render(
        <TestWrapper initialUser={mockUser}>
          <DonateScreen />
        </TestWrapper>
      );

      // Fill and submit form
      fireEvent.changeText(getByPlaceholderText('Donation Title'), 'Test');
      fireEvent.changeText(getByPlaceholderText('Description'), 'Test');
      fireEvent.changeText(getByPlaceholderText('Quantity'), '1');

      const submitButton = getByText('Submit Donation');
      
      await act(async () => {
        fireEvent.press(submitButton);
      });

      await waitFor(() => {
        expect(getByText('Request timeout')).toBeTruthy();
      });
    });
  });
});