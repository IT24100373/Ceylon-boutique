import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ----------------------------------------------------------
// IMPORTANT: Replace this with your actual backend URL.
// During local development: use your machine's local IP.
// After Render deployment: replace with your Render URL.
// Example: 'https://ceylon-boutique-api.onrender.com'
// ----------------------------------------------------------
const BASE_URL = 'https://ceylon-boutique-api.onrender.com'; // ← change to your IP or Render URL

const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 15000, // 15 seconds
  headers: {
    'Content-Type': 'application/json',
  },
});

// --- Request Interceptor: attach JWT token to every request ---
apiClient.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('ceylon_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// --- Response Interceptor: handle global errors ---
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid — clear storage
      await AsyncStorage.removeItem('ceylon_token');
      await AsyncStorage.removeItem('ceylon_user');
    }
    return Promise.reject(error);
  }
);

export default apiClient;
