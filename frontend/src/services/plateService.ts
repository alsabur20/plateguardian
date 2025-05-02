import axios from 'axios';
import { ApiResponse, PlateResult } from '../types';

// This would be your actual API URL
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
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

// Mock placeholder for plate recognition
// This will be replaced by your implementation
export const recognizePlate = async (imageFile: File): Promise<ApiResponse<PlateResult>> => {
  try {
    // This is where you would upload the image and get the plate text
    // In a real implementation, you would:
    // 1. Create a FormData object
    // 2. Append the image file
    // 3. Send it to your API
    
    // For now, we'll just mock the response
    return new Promise((resolve) => {
      setTimeout(() => {
        // Create a mock URL for the image preview
        const imageUrl = URL.createObjectURL(imageFile);
        
        resolve({
          success: true,
          data: {
            id: Math.random().toString(36).substring(2, 9),
            imageUrl,
            extractedText: 'ABC123', // Mock text
            confidence: 0.92,
            timestamp: new Date(),
            userId: '1',
          },
        });
      }, 1500); // Simulate processing time
    });
  } catch (error) {
    return {
      success: false,
      error: 'Failed to process the image',
    };
  }
};

// Get user's plate recognition history
export const getPlateHistory = async (): Promise<ApiResponse<PlateResult[]>> => {
  try {
    // This is a mock implementation
    return {
      success: true,
      data: [
        {
          id: '1',
          imageUrl: 'https://images.pexels.com/photos/4688260/pexels-photo-4688260.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
          extractedText: 'ABC123',
          confidence: 0.95,
          timestamp: new Date(Date.now() - 86400000), // 1 day ago
          userId: '1',
        },
        {
          id: '2',
          imageUrl: 'https://images.pexels.com/photos/4429141/pexels-photo-4429141.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
          extractedText: 'XYZ789',
          confidence: 0.88,
          timestamp: new Date(Date.now() - 172800000), // 2 days ago
          userId: '1',
        },
      ],
    };
  } catch (error) {
    return {
      success: false,
      error: 'Failed to fetch plate history',
    };
  }
};