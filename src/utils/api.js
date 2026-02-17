import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// API Base URL configuration
const getApiBaseUrl = () => {
  
    return 'https://lastversion-nine.vercel.app';
  


};

const API_BASE_URL = getApiBaseUrl();

// API helper function
export const apiCall = async (endpoint, options = {}) => {
  const token = await AsyncStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorData;
    try {
      errorData = await response.json();
    } catch (e) {
      // If response is not JSON, get text
      const text = await response.text().catch(() => 'Request failed');
      errorData = { message: text || `Request failed (${response.status})` };
    }
    
    // Include more details from error response
    const errorMessage = errorData.message || errorData.error || `Request failed (${response.status})`;
    const error = new Error(errorMessage);
    error.status = response.status;
    error.data = errorData;
    throw error;
  }

  return response.json();
};

export { API_BASE_URL };

