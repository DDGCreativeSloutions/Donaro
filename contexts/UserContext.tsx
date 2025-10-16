import { apiService, User } from '@/services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';

interface UserContextType {
  user: User | null;
  loading: boolean;
  login: (userData: User) => void;
  logout: () => void;
  addCredits: (amount: number) => Promise<void>;
  getUser: () => User | null;
  refreshUser: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserFromStorage();
  }, []);

  const loadUserFromStorage = async () => {
    try {
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        
        // Set the token in the API service
        if (parsedUser.token) {
          apiService.setToken(parsedUser.token);
        }
        
        // Refresh user data from API
        await refreshUser();
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveUserToStorage = async (userData: User) => {
    try {
      await AsyncStorage.setItem('user', JSON.stringify(userData));
    } catch (error) {
      console.error('Error saving user data:', error);
    }
  };

  const login = async (userData: User) => {
    try {
      setUser(userData);
      await saveUserToStorage(userData);
      
      // Set the token in the API service
      if (userData.token) {
        apiService.setToken(userData.token);
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    AsyncStorage.removeItem('user');
    // Clear the token from the API service
    apiService.setToken('');
  };

  const addCredits = async (amount: number) => {
    if (user) {
      try {
        const updatedUser = await apiService.updateUser(user.id, {
          totalCredits: user.totalCredits + amount,
          lifetimeCredits: user.lifetimeCredits + amount,
          withdrawableCredits: user.withdrawableCredits + amount,
          totalDonations: user.totalDonations + 1,
        });
        
        if (updatedUser) {
          setUser(updatedUser);
          await saveUserToStorage(updatedUser);
        }
      } catch (error) {
        console.error('Error adding credits:', error);
      }
    }
  };

  const refreshUser = async () => {
    if (user && user.id) {
      try {
        const updatedUser = await apiService.getUser(user.id);
        if (updatedUser) {
          // Preserve the token from the existing user data
          const userWithToken = {
            ...updatedUser,
            token: user.token
          };
          
          setUser(userWithToken);
          await saveUserToStorage(userWithToken);
          
          // Set the token in the API service
          if (userWithToken.token) {
            apiService.setToken(userWithToken.token);
          }
        }
      } catch (error) {
        console.error('Error refreshing user:', error);
      }
    }
  };

  const getUser = () => user;

  return (
    <UserContext.Provider value={{ user, loading, login, logout, addCredits, getUser, refreshUser }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};