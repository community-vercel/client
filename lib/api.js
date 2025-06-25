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


export const login = (data) => api.post('/auth/login', data);
export const register = (data) => api.post('/auth/register', data);
export const getDashboardData = (params) => api.get('/dashboard/summary', { params });
export const createReceipt = (data) => api.post('/receipts', data);
export const getReceipts = (params) => api.get('/receipts', { params });
export const updateReceipt = (id, data) => api.put(`/receipts/${id}`, data);
export const deleteReceipt = (id) => api.delete(`/receipts/${id}`);
export const createPayment = (data) => api.post('/payments', data);
export const getPayments = (params) => api.get('/payments', { params });
export const updatePayment = (id, data) => api.put(`/payments/${id}`, data);
export const deletePayment = (id) => api.delete(`/payments/${id}`);
export const getRecurringSuggestions = () => api.get('/payments/recurring-suggestions');
export const getSummaryReport = (params) => api.get('/reports/summary', { params });
export const createCategory = (data) => api.post('/categories', data);
export const getCategories = () => api.get('/categories');
export const updateCategory = (id, data) => api.put(`/categories/${id}`, data);
export const deleteCategory = (id) => api.delete(`/categories/${id}`);
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