import axios from 'axios';

/*
  Shared HTTP client for the frontend.
  Request interceptor injects JWT; response interceptor handles expired sessions.
*/

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Attach bearer token to every request after login.
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Redirect to login on unauthorized API calls (except login/register attempts).
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const requestUrl = `${error.config?.url || ''}`;
    const isAuthEndpoint = requestUrl.includes('/auth/login') || requestUrl.includes('/auth/register');

    if (error.response?.status === 401 && !isAuthEndpoint) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;
