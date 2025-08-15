// lib/api/index.js
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://digital-cashbook.vercel.app/api',
  timeout: 10000, // Increased timeout for better reliability
});

// Request Interceptor
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  const shopId = localStorage.getItem('shopId');
  const role = localStorage.getItem('role');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  // Add shopId to params for relevant endpoints, except for superadmin
  if (shopId && role !== 'superadmin') {
    config.params = { ...config.params, shopId };
  }
  return config;
});

// Response Interceptor for Token Refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url.includes('/auth/')
    ) {
      originalRequest._retry = true;
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        const response = await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL}/auth/refresh-token`,
          { refreshToken },
          { headers: { 'Content-Type': 'application/json' } }
        );

        const { accessToken, refreshToken: newRefreshToken } = response.data;
        localStorage.setItem('token', accessToken);
        localStorage.setItem('refreshToken', newRefreshToken);

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('userid');
        localStorage.removeItem('role');
        localStorage.removeItem('shopId');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

// Authentication
export const login = (data) => api.post('/auth/login', data);
export const register = (data) => api.post('/auth/register', data);
export const refreshToken = (refreshToken) =>
  api.post('/auth/refresh-token', { refreshToken });
export const logout = (refreshToken) => api.post('/auth/logout', { refreshToken });


// Dashboard
export const getDashboardData = (params) => api.get('/dashboard/summary', { params });

// Transactions
export const createTransaction = (data) => {
  const formData = new FormData();
  for (const key in data) {
    if (data[key] !== null && data[key] !== '') {
      formData.append(key === 'paymentMethod' ? 'type' : key, data[key]);
    }
  }
  return api.post('/transactions', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};
export const getTransactions = (params) => api.get('/transactions', { params });
export const getUserTransactions = (params) => api.get('/transactions/user', { params });
export const updateTransaction = (id, data) => {
  const formData = new FormData();
  for (const key in data) {
    if (data[key] !== null && data[key] !== '') {
      formData.append(key === 'paymentMethod' ? 'type' : key, data[key]);
    }
  }
  return api.put(`/transactions/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};
export const deleteTransaction = (id) => api.delete(`/transactions/${id}`);
export const getRecurringSuggestions = (params = {}) =>
  api.get('/transactions/recurring', { params });
export const getDailyReport = (params) => api.get('/transactions/daily-report', { params });
export const getPDFReport = (params) => api.get('/transactions/generate-pdf', { params });

// Categories
export const createCategory = (data) => api.post('/categories', data);
export const getCategories = () => api.get('/categories');
export const updateCategory = (id, data) => api.put(`/categories/${id}`, data);
export const deleteCategory = (id) => api.delete(`/categories/${id}`);

// Settings
export const getSettings = () => api.get('/settings');
export const updateSettings = (data) => {
  const formData = new FormData();
  for (const key in data) {
    if (data[key] !== null && data[key] !== undefined) {
      formData.append(key, data[key]);
    }
  }
  return api.post('/settings', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

// Backups
export const createBackup = (shopId = null) => api.post('/backup/create', { shopId });
export const getBackups = (shopId = null) => api.get('/backup/list', { params: { shopId } });
export const restoreBackup = (data) => api.post('/backup/restore', data);
export const getShops = () => api.get('/shops');
export const getSummaryReport = (params) => api.get('/reports/summary', { params });

// Comprehensive API object
const apiMethods = {
  ...api,
  login,
    logout, // Add logout to apiMethods

  register,
  refreshToken,
  getDashboardData,
  createTransaction,
  getTransactions,
  getUserTransactions,
  updateTransaction,
  deleteTransaction,
  getRecurringSuggestions,
  getDailyReport,
  getPDFReport,
  createCategory,
  getCategories,
  updateCategory,
  deleteCategory,
  getSettings,
  updateSettings,
  createBackup,
  getBackups,
  restoreBackup,
  getShops,
  getSummaryReport,
};

export default apiMethods;