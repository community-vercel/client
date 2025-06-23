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

export default api;