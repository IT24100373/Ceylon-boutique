import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from '../api/client';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true); // true while checking stored session

  // --- On app start: load saved token & user from AsyncStorage ---
  useEffect(() => {
    const loadSession = async () => {
      try {
        const storedToken = await AsyncStorage.getItem('ceylon_token');
        const storedUser = await AsyncStorage.getItem('ceylon_user');
        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
        }
      } catch (error) {
        console.error('Failed to load session:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadSession();
  }, []);

  // --- Register (Customer) ---
  const register = async (fullName, email, phone, password, confirmPassword) => {
    const response = await apiClient.post('/api/users/register', {
      fullName,
      email,
      phone,
      password,
      confirmPassword,
    });
    const { token: newToken, user: newUser } = response.data;
    await _saveSession(newToken, newUser);
    return response.data;
  };

  // --- Login (Customer) ---
  const login = async (email, password) => {
    const response = await apiClient.post('/api/users/login', { email, password });
    const { token: newToken, user: newUser } = response.data;
    await _saveSession(newToken, newUser);
    return response.data;
  };

  // --- Seller Login ---
  const sellerLoginAction = async (email, password) => {
    const response = await apiClient.post('/api/sellers/login', { email, password });
    const { token: newToken, user: newUser, seller } = response.data;

    // Merge seller info into user object for navigation decisions
    const enrichedUser = {
      ...newUser,
      verificationStatus: seller.verificationStatus,
      shopName: seller.shopName,
      sellerId: seller.id,
      rejectionReason: seller.rejectionReason,
    };

    await _saveSession(newToken, enrichedUser);
    return response.data;
  };

  // --- Seller Login (from registration — token already obtained) ---
  const sellerLogin = async (newToken, enrichedUser) => {
    await _saveSession(newToken, enrichedUser);
  };

  // --- Logout ---
  const logout = async () => {
    await AsyncStorage.removeItem('ceylon_token');
    await AsyncStorage.removeItem('ceylon_user');
    setToken(null);
    setUser(null);
  };

  // --- Update local user state after profile edit ---
  const updateLocalUser = (updatedUser) => {
    setUser(updatedUser);
    AsyncStorage.setItem('ceylon_user', JSON.stringify(updatedUser));
  };

  // --- Internal helper: persist session ---
  const _saveSession = async (newToken, newUser) => {
    await AsyncStorage.setItem('ceylon_token', newToken);
    await AsyncStorage.setItem('ceylon_user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        register,
        login,
        sellerLoginAction,
        sellerLogin,
        logout,
        updateLocalUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook for easy access
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};
