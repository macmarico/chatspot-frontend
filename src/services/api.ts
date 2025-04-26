import axios, { AxiosInstance, AxiosError } from 'axios';
import { getApiUrl, debugLog, isDevelopment } from '../utils/env';

// Get API URL from environment utility
const API_URL = getApiUrl();

// Create axios instance with default config
const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add a request interceptor to include auth token in requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add a response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    // Handle specific error cases
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      debugLog('Response error:', error.response.data);
    } else if (error.request) {
      // The request was made but no response was received
      debugLog('Request error:', error.request);
    } else {
      // Something happened in setting up the request that triggered an Error
      debugLog('Error:', error.message);
    }
    return Promise.reject(error);
  }
);

interface AuthResponse {
  access_token: string;
  [key: string]: any;
}

// Authentication API services
export const authService = {
  // Login with username and password
  login: async (username: string, password: string): Promise<AuthResponse> => {
    try {
      const response = await api.post('/auth/login', { username, password });
      return response.data;
    } catch (error: any) {
      throw error.response?.data?.message || error.message || 'Login failed';
    }
  },

  // Register with username and password
  register: async (username: string, password: string): Promise<AuthResponse> => {
    try {
      const response = await api.post('/auth/register', { username, password });
      return response.data;
    } catch (error: any) {
      throw error.response?.data?.message || error.message || 'Registration failed';
    }
  }
};

// Export the API instance for other services
export default api;
