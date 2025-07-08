// api/index.js
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://digital-cashbook.vercel.app/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Authentication
export const login = (data) => api.post('/auth/login', data);
export const register = (data) => api.post('/auth/register', data);

// Dashboard
export const getDashboardData = (params) => api.get('/dashboard/summary', { params });

// Transactions (replacing Receipts and Payments)
export const createTransaction = (data) => api.post('/transactions', data);
export const getTransactions = (params) => api.get('/transactions', { params });
export const getUserTransactions = (params) => api.get('/transactions/user', { params });
export const updateTransaction = (id, data) => api.put(`/transactions/${id}`, data);
export const deleteTransaction = (id) => api.delete(`/transactions/${id}`);
export const getRecurringSuggestions = (params = {}) => api.get('/transactions/recurring', { params });

// Reports
export const getSummaryReport = (params) => api.get('/reports/summary', { params });

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

export default api;