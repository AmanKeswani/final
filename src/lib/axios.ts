import axios, { AxiosError, AxiosResponse } from 'axios';
import { ApiResponse } from './validations';

const baseURL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

const api = axios.create({
  baseURL: `${baseURL}/api`,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add auth token if available
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('auth-token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response: AxiosResponse<ApiResponse>) => {
    return response;
  },
  (error: AxiosError<ApiResponse>) => {
    // Handle common errors
    if (error.response?.status === 401) {
      // Unauthorized - clear token and redirect to login
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth-token');
        window.location.href = '/login';
      }
    }

    // Create a standardized error response
    const errorResponse: ApiResponse = {
      success: false,
      error: error.response?.data?.error || error.message || 'An unexpected error occurred',
      message: error.response?.data?.message || 'Request failed',
    };

    return Promise.reject({
      ...error,
      response: {
        ...error.response,
        data: errorResponse,
      },
    });
  }
);

export { api };
export default api;