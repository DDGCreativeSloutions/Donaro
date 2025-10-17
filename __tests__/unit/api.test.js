import { apiService } from '../../services/api';

// Mock fetch globally
global.fetch = jest.fn();

describe('API Service', () => {
  beforeEach(() => {
    fetch.mockClear();
    apiService.setToken('test-token');
  });

  describe('User Authentication', () => {
    test('should login user successfully', async () => {
      const mockUser = {
        id: '1',
        name: 'Test User',
        email: 'test@example.com',
        token: 'mock-token'
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockUser,
      });

      const result = await apiService.loginUser('test@example.com', 'password');
      
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/auth/login'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
          body: JSON.stringify({ 
            email: 'test@example.com', 
            password: 'password',
            isAdmin: undefined 
          }),
        })
      );
      expect(result).toEqual(mockUser);
    });

    test('should handle login failure', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ error: 'Invalid credentials' }),
      });

      await expect(apiService.loginUser('test@example.com', 'wrong-password'))
        .rejects.toThrow('Invalid credentials');
    });

    test('should register user successfully', async () => {
      const userData = {
        name: 'New User',
        email: 'new@example.com',
        phone: '1234567890',
        password: 'password123'
      };

      const mockResponse = {
        ...userData,
        id: '2',
        token: 'new-token'
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await apiService.createUser(userData);
      
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/auth/register'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(userData),
        })
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe('Donations', () => {
    test('should create donation successfully', async () => {
      const donationData = {
        userId: '1',
        type: 'food',
        title: 'Test Donation',
        description: 'Test description',
        quantity: '5 items',
        receiver: 'Test Receiver',
        credits: 100,
        date: '2024-01-15',
        time: '10:00',
        location: 'Test Location',
        donationPhoto: 'photo1.jpg',
        selfiePhoto: 'photo2.jpg',
        status: 'pending'
      };

      const mockResponse = { ...donationData, id: 'donation-1' };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await apiService.createDonation(donationData);
      
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/donations'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(donationData),
        })
      );
      expect(result).toEqual(mockResponse);
    });

    test('should fetch user donations', async () => {
      const mockDonations = [
        { id: '1', title: 'Donation 1', status: 'approved' },
        { id: '2', title: 'Donation 2', status: 'pending' }
      ];

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockDonations,
      });

      const result = await apiService.getDonations('user-1');
      
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/donations/user/user-1'),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-token',
          }),
        })
      );
      expect(result).toEqual(mockDonations);
    });

    test('should handle network errors gracefully', async () => {
      fetch.mockRejectedValueOnce(new TypeError('Network request failed'));

      await expect(apiService.createDonation({}))
        .rejects.toThrow('Network error: Please check your internet connection and try again.');
    });

    test('should handle timeout errors', async () => {
      // Mock a slow response that times out
      fetch.mockImplementationOnce(() => 
        new Promise(resolve => setTimeout(resolve, 35000))
      );

      await expect(apiService.createDonation({}))
        .rejects.toThrow('Request timeout: The server is taking too long to respond. Please try again.');
    });
  });

  describe('Withdrawals', () => {
    test('should create withdrawal successfully', async () => {
      const withdrawalData = {
        userId: '1',
        amount: 500,
        date: '2024-01-15',
        status: 'pending'
      };

      const mockResponse = { ...withdrawalData, id: 'withdrawal-1' };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await apiService.createWithdrawal(withdrawalData);
      
      expect(result).toEqual(mockResponse);
    });

    test('should fetch user withdrawals', async () => {
      const mockWithdrawals = [
        { id: '1', amount: 500, status: 'processed' },
        { id: '2', amount: 300, status: 'pending' }
      ];

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockWithdrawals,
      });

      const result = await apiService.getWithdrawals('user-1');
      
      expect(result).toEqual(mockWithdrawals);
    });
  });

  describe('URL Validation', () => {
    test('should handle invalid API URLs', async () => {
      // Temporarily override the API URL
      const originalEnv = process.env.EXPO_PUBLIC_API_URL;
      process.env.EXPO_PUBLIC_API_URL = 'invalid-url';

      const result = await apiService.getDonations('user-1');
      
      expect(result).toEqual([]);
      
      // Restore original env
      process.env.EXPO_PUBLIC_API_URL = originalEnv;
    });
  });
});