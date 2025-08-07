'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { formatCurrency } from '../app/utils/helpers';
import api from '@/lib/api';

const dashboardVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.5 } },
};

export default function SummaryDashboard({ filters, refresh }) {
  const [dashboardData, setDashboardData] = useState({
    totalPayables: 0,
    totalReceivables: 0,
    balance: 0,
    alerts: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch dashboard data
 useEffect(() => {
  const fetchDashboardData = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await api.get('/dashboard/summary', {
        params: filters, // ✅ filters is passed as query params
      });

      const data = response.data;

      setDashboardData({
        totalPayables: data.totalPayables || 0,
        totalReceivables: data.totalReceivables || 0,
        balance: data.balance || 0,
        alerts: data.alerts || [],
      });

    } catch (err) {
      console.error('Fetch error:', err);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  fetchDashboardData();
}, [filters, refresh]);

  return (
    <motion.div
      variants={dashboardVariants}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-1 sm:grid-cols-3 gap-4"
    >
      {/* Loading State */}
      {loading && (
        <div className="col-span-full text-center py-4">
          <svg
            className="animate-spin h-8 w-8 text-indigo-400 mx-auto"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-label="Loading"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v8h8a8 8 0 01-8 8 8 8 0 01-8-8z"
            />
          </svg>
          <p className="text-white mt-2">Loading dashboard...</p>
        </div>
      )}

      {/* Error Message */}
      {error && !loading && (
        <div className="col-span-full bg-red-900 bg-opacity-70 text-red-100 p-4 rounded-lg text-center">
          {error}
        </div>
      )}

      {/* Dashboard Cards */}
      {!loading && !error && (
        <>
          <div className="bg-gray-800 bg-opacity-60 backdrop-blur-lg p-6 rounded-xl shadow-xl text-center">
            <h4 className="text-sm font-semibold text-gray-300 uppercase">Total Debits</h4>
            <p className="text-2xl font-bold text-red-400 mt-2">
              {formatCurrency(dashboardData.totalPayables.toFixed(2))}
            </p>
          </div>
          <div className="bg-gray-800 bg-opacity-60 backdrop-blur-lg p-6 rounded-xl shadow-xl text-center">
            <h4 className="text-sm font-semibold text-gray-300 uppercase">Total Credits</h4>
            <p className="text-2xl font-bold text-green-400 mt-2">
              {formatCurrency(dashboardData.totalReceivables.toFixed(2))}
            </p>
          </div>
          <div className="bg-gray-800 bg-opacity-60 backdrop-blur-lg p-6 rounded-xl shadow-xl text-center">
            <h4 className="text-sm font-semibold text-gray-300 uppercase">Net Balance</h4>
            <p
              className={`text-2xl font-bold mt-2 ${
                dashboardData.balance >= 0 ? 'text-green-400' : 'text-red-400'
              }`}
            >
              {formatCurrency(dashboardData.balance.toFixed(2))}
            </p>
          </div>
          {/* Alerts */}
          {dashboardData.alerts.length > 0 && (
            <div className="col-span-full bg-yellow-900 bg-opacity-70 text-yellow-100 p-4 rounded-lg text-center">
              {dashboardData.alerts.join(' ')}
            </div>
          )}
        </>
      )}
    </motion.div>
  );
}