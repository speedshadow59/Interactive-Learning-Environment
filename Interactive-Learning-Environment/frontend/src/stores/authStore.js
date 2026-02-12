import create from 'zustand';
import { apiClient } from '../services/apiClient';

export const useAuthStore = create((set) => ({
  user: null,
  token: null,
  loading: true,
  error: null,

  initializeAuth: async () => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        // Verify token by fetching user profile
        const response = await apiClient.get('/users/profile');
        set({
          user: response.data,
          token,
          loading: false
        });
      } catch (error) {
        localStorage.removeItem('token');
        set({
          user: null,
          token: null,
          loading: false,
          error: 'Session expired. Please login again.'
        });
      }
    } else {
      set({ loading: false });
    }
  },

  login: async (email, password) => {
    try {
      set({ error: null });
      const response = await apiClient.post('/auth/login', { email, password });
      const { user, token } = response.data;
      
      localStorage.setItem('token', token);
      set({ user, token, error: null });
      
      return { success: true };
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Login failed';
      set({ error: errorMsg });
      return { success: false, error: errorMsg };
    }
  },

  register: async (userData) => {
    try {
      set({ error: null });
      const response = await apiClient.post('/auth/register', userData);
      const { user, token } = response.data;
      
      localStorage.setItem('token', token);
      set({ user, token, error: null });
      
      return { success: true };
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Registration failed';
      set({ error: errorMsg });
      return { success: false, error: errorMsg };
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    set({ user: null, token: null, error: null });
  },

  updateUser: (userData) => {
    set({ user: userData });
  },

  updateProfile: async (updates) => {
    try {
      const response = await apiClient.put('/users/profile', updates);
      set({ user: response.data.user });
      return { success: true };
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Update failed';
      set({ error: errorMsg });
      return { success: false, error: errorMsg };
    }
  }
}));
