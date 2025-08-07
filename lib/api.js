// lib/api/index.js
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://digital-cashbook.vercel.app/api',
});

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

// Authentication
export const login = (data) => api.post('/auth/login', data);
export const register = (data) => api.post('/auth/register', data);

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
export const getRecurringSuggestions = (params = {}) => api.get('/transactions/recurring', { params });
// export const getDailyReport = (date) => api.get(`/transactions/daily-report?date=${date}`);
// export const getPDFReport = (date) => api.get(`/transactions/generate-pdf?date=${date}`);

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
    formData.append(key, data[key]);
  }
  return api.post('/settings', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

// Backups
export const createBackup = (shopId = null) => api.post('/backup/create', { shopId });
export const getBackups = (shopId = null) => api.get('/backup/list', { params: { shopId } });
export const restoreBackup = (data) => api.post('/backup/restore', data);
export const getShops = () => api.get('/shops'); // New endpoint to fetch shops
export const getSummaryReport = (params) => api.get('/reports/summary', { params });

// Create a comprehensive API object with all methods
const apiMethods = {
  // Core axios instance
  ...api,
  
  // Authentication
  login,
  register,
  
  // Dashboard
  getDashboardData,
  
  // Transactions
  createTransaction,
  getTransactions,
  getUserTransactions,
  updateTransaction,
  deleteTransaction,
  getRecurringSuggestions,
  getDailyReport,
  getPDFReport,
  getShops,
  getSummaryReport,
  
  // Categories
  createCategory,
  getCategories,
  updateCategory,
  deleteCategory,
  
  // Settings
  getSettings,
  updateSettings,
  
  // Backups
  createBackup,
  getBackups,
  restoreBackup,
};

export default apiMethods;