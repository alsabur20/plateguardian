import axios from 'axios';
import { ApiResponse } from '../types';

// This would be replaced with your actual API URL
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// Create an axios instance with common config
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export const loginUser = async (email: string, password: string): Promise<ApiResponse<any>> => {
  try {
    // This is a mock implementation - replace with actual API call
    // const response = await api.post('/auth/login', { email, password });
    // return response.data;
    
    // Mock implementation for demo purposes
    return new Promise((resolve) => {
      setTimeout(() => {
        // Mock successful login with sample user data
        if (email && password) {
          resolve({
            success: true,
            data: {
              user: {
                id: '1',
                email,
                name: email.split('@')[0],
              },
              token: 'mock-jwt-token',
            },
          });
        } else {
          resolve({
            success: false,
            error: 'Invalid credentials',
          });
        }
      }, 800);
    });
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      return {
        success: false,
        error: error.response.data.message || 'Login failed',
      };
    }
    return {
      success: false,
      error: 'An error occurred during login',
    };
  }
};

export const registerUser = async (
  email: string,
  password: string,
  name: string
): Promise<ApiResponse<any>> => {
  try {
    // This is a mock implementation - replace with actual API call
    // const response = await api.post('/auth/register', { email, password, name });
    // return response.data;
    
    // Mock implementation for demo purposes
    return new Promise((resolve) => {
      setTimeout(() => {
        // Mock successful registration
        if (email && password && name) {
          resolve({
            success: true,
            data: {
              user: {
                id: '1',
                email,
                name,
              },
              token: 'mock-jwt-token',
            },
          });
        } else {
          resolve({
            success: false,
            error: 'Invalid registration data',
          });
        }
      }, 800);
    });
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      return {
        success: false,
        error: error.response.data.message || 'Registration failed',
      };
    }
    return {
      success: false,
      error: 'An error occurred during registration',
    };
  }
};

export const logoutUser = async (): Promise<void> => {
  // Any cleanup needed on logout
  // e.g., invalidate token on server
  // await api.post('/auth/logout');
  
  // For demo, we don't need to do anything here
  return;
};

export const getCurrentUser = async (): Promise<ApiResponse<any>> => {
  try {
    // This is a mock implementation - replace with actual API call
    // const response = await api.get('/auth/me');
    // return response.data;
    
    // Mock implementation
    return {
      success: true,
      data: {
        user: {
          id: '1',
          email: 'user@example.com',
          name: 'User',
        },
      },
    };
  } catch (error) {
    return {
      success: false,
      error: 'Failed to get current user',
    };
  }
};