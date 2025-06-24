'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Chart from '../../components/Chart';
import { getDashboardData } from '../../lib/api';
import TransactionTable from '@/components/TransactionTable';

export default function Dashboard() {
  const [data, setData] = useState({});
  const [filters, setFilters] = useState({ startDate: '', endDate: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await getDashboardData(filters);
        setData(res.data);
      } catch (error) {
        setError('Failed to fetch dashboard data. Please try again.');
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [filters]);

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const barChartData = {
    labels: ['Credit', 'Debit', 'Balance'],
    datasets: [
      {
        label: 'Financial Overview',
        data: [data.totalReceipts || 0, data.totalPayments || 0, data.balance || 0],
        backgroundColor: ['#4f46e5', '#ef4444', '#10b981'],
        borderRadius: 8,
        hoverBackgroundColor: ['#4338ca', '#dc2626', '#059669'],
      },
    ],
  };

  const pieChartData = {
    labels: ['Credit', 'Debit'],
    datasets: [
      {
        data: [data.totalReceipts || 0, data.totalPayments || 0],
        backgroundColor: ['#4f46e5', '#ef4444'],
        hoverBackgroundColor: ['#4338ca', '#dc2626'],
        borderWidth: 2,
        borderColor: '#ffffff',
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'top', labels: { color: '#e5e7eb' } },
      tooltip: { backgroundColor: '#1f2937', titleColor: '#ffffff', bodyColor: '#ffffff' },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { color: '#e5e7eb' },
        grid: { color: '#374151' },
      },
      x: {
        ticks: { color: '#e5e7eb' },
        grid: { display: false },
      },
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-indigo-900 to-purple-900 py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-7xl mx-auto"
      >
        <h1 className="text-4xl font-extrabold text-white text-center mb-8">
          Financial Dashboard
        </h1>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-8 bg-gray-800 bg-opacity-50 backdrop-blur-lg p-6 rounded-xl shadow-lg"
        >
          <h3 className="text-lg font-semibold text-white mb-4">Filter Transactions</h3>
          <div className="flex flex-col sm:flex-row gap-4">
            <input
              type="date"
              name="startDate"
              value={filters.startDate}
              onChange={handleFilterChange}
              className="p-3 bg-gray-700 text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <input
              type="date"
              name="endDate"
              value={filters.endDate}
              onChange={handleFilterChange}
              className="p-3 bg-gray-700 text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </motion.div>

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-red-900 bg-opacity-50 text-red-200 p-4 rounded-lg mb-6 text-center"
          >
            {error}
          </motion.div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="text-center py-10">
            <svg
              className="animate-spin h-8 w-8 text-indigo-400 mx-auto"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v8h8a8 8 0 01-8 8 8 8 0 01-8-8z"
              ></path>
            </svg>
            <p className="text-white mt-2">Loading...</p>
          </div>
        )}

        {/* Alerts */}
        {!loading && data.alerts?.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-red-900 bg-opacity-50 text-red-200 p-4 rounded-lg mb-6"
          >
            {data.alerts.map((alert, index) => (
              <p key={index} className="text-sm">{alert}</p>
            ))}
          </motion.div>
        )}

        {/* Financial Metrics */}
        {!loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
          >
            {[
              { title: 'Opening Balance', value: data.openingBalance || 0 },
              { title: 'Total Credits', value: data.totalReceipts || 0 },
              { title: 'Total Debits', value: data.totalPayments || 0 },
              { title: 'Closing Balance', value: data.balance || 0 },
            ].map((metric, index) => (
              <motion.div
                key={index}
                whileHover={{ scale: 1.05 }}
                className="bg-gray-800 bg-opacity-50 backdrop-blur-lg p-6 rounded-xl shadow-lg text-center"
              >
                <h3 className="text-lg font-semibold text-gray-300">{metric.title}</h3>
                <p className="text-3xl font-bold text-indigo-400">${metric.value}</p>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Charts */}
        {!loading && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-gray-800 bg-opacity-50 backdrop-blur-lg p-6 rounded-xl shadow-lg"
            >
              <h3 className="text-lg font-semibold text-white mb-4">Financial Overview</h3>
              <Chart type="bar" data={barChartData} options={chartOptions} />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-gray-800 bg-opacity-50 backdrop-blur-lg p-6 rounded-xl shadow-lg"
            >
              <h3 className="text-lg font-semibold text-white mb-4">Credit vs Receipt</h3>
              <Chart type="pie" data={pieChartData} options={chartOptions} />
            </motion.div>
          </div>
        )}

        {/* Transaction Table */}
        {!loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="bg-gray-800 bg-opacity-50 backdrop-blur-lg p-6 rounded-xl shadow-lg"
          >
            <h3 className="text-lg font-semibold text-white mb-4">Recent Transactions</h3>
            <TransactionTable
              transactions={data.recentTransactions || []}
              onEdit={(tx) => console.log('Edit:', tx)}
              onDelete={(id, type) => console.log('Delete:', id, type)}
            />
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}