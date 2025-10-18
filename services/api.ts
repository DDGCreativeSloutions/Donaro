// Real API service connecting to backend with Prisma
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';

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

    // Allow Vercel deployments
    if (hostname.endsWith('.vercel.app')) {
      return true;
    }

    // Allow Supabase
    if (hostname.endsWith('.supabase.co')) {
      return true;
    }

    // Allow custom domains (add your actual domain here)
    if (hostname === 'yourdomain.com') {
      return true;
    }

    // Allow common development domains
    if (hostname.includes('.expo.') || hostname.includes('expo.dev')) {
      return true;
    }

    return false;
  } catch (error) {
    console.error('URL validation error:', error);
    return false;
  }
};

// Ensure API_BASE_URL is valid
if (!isValidUrl(API_BASE_URL)) {
  console.warn('API base URL may be invalid, but continuing for development');
}

import { io, Socket } from 'socket.io-client';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  totalCredits: number;
  lifetimeCredits: number;
  withdrawableCredits: number;
  totalDonations: number;
  profilePicture?: string;
  token?: string;
  isAdmin?: boolean;
}

// Interface for user registration that includes password
export interface UserRegistrationData {
  name: string;
  email: string;
  phone: string;
  password: string;
}

export interface Donation {
  id: string;
  userId: string;
  type: string;
  title: string;
  description: string;
  quantity: string;
  receiver: string;
  status: 'pending' | 'approved' | 'rejected';
  credits: number;
  date: string;
  time: string;
  location: string;
  donationPhoto: string;
  selfiePhoto: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Withdrawal {
  id: string;
  userId: string;
  amount: number;
  date: string;
  status: 'pending' | 'processed' | 'rejected';
  createdAt?: string;
  updatedAt?: string;
}

class ApiService {
  private static instance: ApiService;
  private token: string | null = null;
  private socket: Socket | null = null;

  private constructor() {}

  public static getInstance(): ApiService {
    if (!ApiService.instance) {
      ApiService.instance = new ApiService();
    }
    return ApiService.instance;
  }

  public setToken(token: string) {
    this.token = token;
    // Initialize socket connection when token is set (only if not Vercel deployment)
    if (token && !this.socket) {
      // Check if we're running against a Vercel deployment
      const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';
      const isVercelDeployment = API_URL.includes('.vercel.app');

      if (!isVercelDeployment) {
        this.initializeSocket();
      } else {
        console.log('Vercel deployment detected - Socket.IO disabled');
      }
    }
  }

  private initializeSocket() {
    if (!this.token) return;

    // Check if we're running against a Vercel deployment (Socket.IO not supported)
    const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';
    const isVercelDeployment = API_URL.includes('.vercel.app');

    if (isVercelDeployment) {
      console.log('Running against Vercel deployment - Socket.IO disabled, using polling fallback');
      this.socket = null;
      return;
    }

    try {
      this.socket = io(API_URL, {
        auth: {
          token: this.token
        }
      });

      this.socket.on('connect', () => {
        console.log('Connected to Socket.IO server');
      });

      this.socket.on('disconnect', () => {
        console.log('Disconnected from Socket.IO server');
      });

      this.socket.on('connect_error', (error) => {
        console.log('Socket.IO connection error:', error.message);
        console.log('Falling back to polling for real-time updates');
        this.socket = null;
      });
    } catch (error) {
      console.log('Socket.IO initialization failed, using polling fallback:', error);
      this.socket = null;
    }
  }

  public joinRoom(userId: string) {
    if (this.socket) {
      this.socket.emit('joinRoom', userId);
    } else {
      console.log('Socket.IO not available - real-time features disabled');
    }
  }

  public joinAdminRoom() {
    if (this.socket) {
      this.socket.emit('joinAdminRoom');
    } else {
      console.log('Socket.IO not available - real-time features disabled');
    }
  }

  public onDonationCreated(callback: (donation: Donation) => void) {
    if (this.socket) {
      this.socket.on('donationCreated', callback);
    } else {
      console.log('Socket.IO not available - real-time donation updates disabled');
    }
  }

  public onDonationStatusUpdated(callback: (donation: Donation) => void) {
    if (this.socket) {
      this.socket.on('donationStatusUpdated', callback);
    } else {
      console.log('Socket.IO not available - real-time donation status updates disabled');
    }
  }

  public onWithdrawalCreated(callback: (withdrawal: Withdrawal) => void) {
    if (this.socket) {
      this.socket.on('withdrawalCreated', callback);
    } else {
      console.log('Socket.IO not available - real-time withdrawal updates disabled');
    }
  }

  public onWithdrawalStatusUpdated(callback: (withdrawal: Withdrawal) => void) {
    if (this.socket) {
      this.socket.on('withdrawalStatusUpdated', callback);
    } else {
      console.log('Socket.IO not available - real-time withdrawal status updates disabled');
    }
  }

  private getHeaders() {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    
    return headers;
  }

  // User methods
  async getUser(id: string): Promise<User | null> {
    try {
      // Validate API URL before making requests
      if (!isValidUrl(API_BASE_URL)) {
        console.warn('API URL validation failed, but continuing');
      }
      
      const response = await fetch(`${API_BASE_URL}/users/${id}`, {
        headers: this.getHeaders(),
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch user');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching user:', error);
      return null;
    }
  }

  async createUser(userData: UserRegistrationData): Promise<User> {
    try {
      // Validate API URL before making requests
      if (!isValidUrl(API_BASE_URL)) {
        console.warn('API URL validation failed, but continuing');
      }
      
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(userData),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Registration failed with status ${response.status}`);
      }
      
      const user = await response.json();
      this.setToken(user.token);
      return user;
    } catch (error) {
      console.error('Error creating user:', error);
      // If it's a network error, provide a user-friendly message
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Network connection failed. Please check your internet and try again.');
      }
      throw error;
    }
  }

  async loginUser(email: string, password: string, isAdmin?: boolean): Promise<User> {
    try {
      // Validate API URL before making requests
      if (!isValidUrl(API_BASE_URL)) {
        console.warn('API URL validation failed, but continuing');
      }
      
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ email, password, isAdmin }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Login failed with status ${response.status}`);
      }
      
      const user = await response.json();
      this.setToken(user.token);
      return user;
    } catch (error) {
      console.error('Error logging in:', error);
      // If it's a network error, provide a user-friendly message
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Network connection failed. Please check your internet and try again.');
      }
      throw error;
    }
  }

  async updateUser(userId: string, updates: Partial<User>): Promise<User | null> {
    try {
      // Validate API URL before making requests
      if (!isValidUrl(API_BASE_URL)) {
        console.warn('API URL validation failed, but continuing');
      }
      
      const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify(updates),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update user');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error updating user:', error);
      return null;
    }
  }

  // Donation methods
  async getDonations(userId: string): Promise<Donation[]> {
    try {
      // Validate API URL before making requests
      if (!isValidUrl(API_BASE_URL)) {
        return [];
      }
      
      const response = await fetch(`${API_BASE_URL}/donations/user/${userId}`, {
        headers: this.getHeaders(),
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch donations');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching donations:', error);
      return [];
    }
  }

  async createDonation(donationData: Omit<Donation, 'id' | 'createdAt' | 'updatedAt'>): Promise<Donation> {
    try {
      console.log('Sending donation data to API:', donationData);
      
      // Validate API URL before making requests
      if (!isValidUrl(API_BASE_URL)) {
        console.warn('API URL validation failed, but continuing');
      }
      
      // Create a timeout promise
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout after 30 seconds')), 30000); // 30 second timeout
      });
      
      // Create the fetch promise
      const fetchPromise = fetch(`${API_BASE_URL}/donations`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(donationData),
      });
      
      // Race the fetch promise against the timeout
      const response = await Promise.race([fetchPromise, timeoutPromise]) as Response;
      
      console.log('API response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.log('API error response:', errorText);
        let error;
        try {
          error = JSON.parse(errorText);
        } catch (e) {
          // If parsing fails, create a generic error object
          error = { error: errorText || `Failed to create donation: ${response.status} ${response.statusText}` };
        }
        throw new Error(error.error || `Failed to create donation: ${response.status} ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log('API response data:', result);
      return result;
    } catch (error: any) {
      console.error('Error creating donation:', error);
      // Provide more specific error information
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error('Network error: Please check your internet connection and try again.');
      } else if (error.message.includes('timeout')) {
        throw new Error('Request timeout: The server is taking too long to respond. Please try again.');
      }
      throw error;
    }
  }

  async getPendingDonations(): Promise<Donation[]> {
    try {
      // Validate API URL before making requests
      if (!isValidUrl(API_BASE_URL)) {
        return [];
      }
      
      const response = await fetch(`${API_BASE_URL}/donations/status/pending`, {
        headers: this.getHeaders(),
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch pending donations');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching pending donations:', error);
      return [];
    }
  }

  async getAllDonations(): Promise<Donation[]> {
    try {
      // Validate API URL before making requests
      if (!isValidUrl(API_BASE_URL)) {
        return [];
      }
      
      const response = await fetch(`${API_BASE_URL}/donations`, {
        headers: this.getHeaders(),
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch donations');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching donations:', error);
      return [];
    }
  }

  async updateDonationStatus(donationId: string, status: 'approved' | 'rejected'): Promise<Donation | null> {
    try {
      // Validate API URL before making requests
      if (!isValidUrl(API_BASE_URL)) {
        console.warn('API URL validation failed, but continuing');
      }
      
      const response = await fetch(`${API_BASE_URL}/donations/${donationId}/status`, {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify({ status }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update donation status');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error updating donation status:', error);
      return null;
    }
  }

  async getApprovedDonations(): Promise<Donation[]> {
    try {
      // Validate API URL before making requests
      if (!isValidUrl(API_BASE_URL)) {
        return [];
      }
      
      const response = await fetch(`${API_BASE_URL}/donations/status/approved`, {
        headers: this.getHeaders(),
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch approved donations');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching approved donations:', error);
      return [];
    }
  }

  async getRejectedDonations(): Promise<Donation[]> {
    try {
      // Validate API URL before making requests
      if (!isValidUrl(API_BASE_URL)) {
        return [];
      }
      
      const response = await fetch(`${API_BASE_URL}/donations/status/rejected`, {
        headers: this.getHeaders(),
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch rejected donations');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching rejected donations:', error);
      return [];
    }
  }

  // Withdrawal methods
  async getWithdrawals(userId: string): Promise<Withdrawal[]> {
    try {
      // Validate API URL before making requests
      if (!isValidUrl(API_BASE_URL)) {
        return [];
      }
      
      const response = await fetch(`${API_BASE_URL}/withdrawals/user/${userId}`, {
        headers: this.getHeaders(),
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch withdrawals');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching withdrawals:', error);
      return [];
    }
  }

  async createWithdrawal(withdrawalData: Omit<Withdrawal, 'id' | 'createdAt' | 'updatedAt'>): Promise<Withdrawal> {
    try {
      // Validate API URL before making requests
      if (!isValidUrl(API_BASE_URL)) {
        throw new Error('Invalid API configuration');
      }
      
      const response = await fetch(`${API_BASE_URL}/withdrawals`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(withdrawalData),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create withdrawal');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error creating withdrawal:', error);
      throw error;
    }
  }

  async getPendingWithdrawals(): Promise<Withdrawal[]> {
    try {
      // Validate API URL before making requests
      if (!isValidUrl(API_BASE_URL)) {
        return [];
      }
      
      const response = await fetch(`${API_BASE_URL}/withdrawals/status/pending`, {
        headers: this.getHeaders(),
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch pending withdrawals');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching pending withdrawals:', error);
      return [];
    }
  }

  async updateWithdrawalStatus(withdrawalId: string, status: 'processed' | 'rejected'): Promise<Withdrawal | null> {
    try {
      // Validate API URL before making requests
      if (!isValidUrl(API_BASE_URL)) {
        throw new Error('Invalid API configuration');
      }
      
      const response = await fetch(`${API_BASE_URL}/withdrawals/${withdrawalId}/status`, {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify({ status }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update withdrawal status');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error updating withdrawal status:', error);
      return null;
    }
  }
}

// Export singleton instance
export const apiService = ApiService.getInstance();
