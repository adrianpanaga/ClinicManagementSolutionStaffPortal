// src/api/axiosauth.js
import axios from 'axios';
import { authStore } from '../stores/auth.js'; // Import authStore for logout on 401
import router from '../router/index.js'; // Import router for redirection

const apiClient = axios.create({
  baseURL: 'https://localhost:7215/api', // !!! ADJUST THIS TO YOUR BACKEND API BASE URL !!!
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Add JWT to Authorization header
apiClient.interceptors.request.use(
  config => {
    const token = localStorage.getItem('jwtToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Handle 401 Unauthorized errors
apiClient.interceptors.response.use(
  response => response,
  async error => {
    if (error.response && error.response.status === 401) {
      console.warn('API Client: 401 Unauthorized response. Clearing auth and redirecting to login.');
      authStore.clearAuth(); // Clear authentication state
      router.push({ name: 'login' }); // Redirect to login page
    }
    return Promise.reject(error);
  }
);

export default apiClient;