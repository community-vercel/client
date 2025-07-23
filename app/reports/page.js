'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Chart from '../../components/Chart';
import TransactionTable from '../../components/TransactionTable';
import { getSummaryReport } from '../../lib/api';
import { formatCurrency } from '../utils/helpers';

export default function Reports() {
  const [report, setReport] = useState(null);
  const [filters, setFilters] = useState({ startDate: '', endDate: '', format: 'json', role: 'admin',category: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const today = new Date().toISOString().split('T')[0];

  const fetchReport = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await getSummaryReport(filters);
      if (filters.format === 'pdf' || filters.format === 'excel') {
        const url = res.data.url;
        const link = document.createElement('a');
        link.href = url;
        link.download = url.split('/').pop();
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        setReport(res.data);
      }
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to generate report');
      console.error('Error fetching report:', error);
    } finally {
      setLoading(false);
    }
  };

  const chartData = report && {
    labels: Object.keys(report.categorySummary || {}),
    datasets: [
      {
        label: 'Category Summary',
        data: Object.values(report.categorySummary || {}),
        backgroundColor: ['#4f46e5', '#ef4444', '#10b981', '#f59e0b', '#6b7280'],
        hoverBackgroundColor: ['#4338ca', '#dc2626', '#059669', '#d97706', '#4b5563'],
        borderWidth: 2,
        borderColor: '#ffffff',
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'top', labels: { color: '#e5e7eb' } },
      tooltip: {
        backgroundColor: '#1f2937',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        callbacks: {
          label: (context) => `${context.label}: ${formatCurrency(context.raw)}`,
        },
      },
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-indigo-900 to-purple-900 py-28 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-7xl mx-auto"
      >
        <h1 className="text-4xl font-extrabold text-white text-center mb-8">Financial Reports (All Users)</h1>

        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-red-900 bg-opacity-50 text-red-200 p-4 rounded-lg mb-6 text-center"
          >
            {error}
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex flex-col sm:flex-row justify-between items-center mb-8 bg-gray-800 bg-opacity-50 backdrop-blur-lg p-6 rounded-xl shadow-lg"
        >
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              className="p-3 bg-gray-700 text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              aria-label="Start Date"
              max={today}
            />
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              className="p-3 bg-gray-700 text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              aria-label="End Date"
              max={today}
            />
            <select
              value={filters.format}
              onChange={(e) => setFilters({ ...filters, format: e.target.value })}
              className="p-3 bg-gray-700 text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              aria-label="Report Format"
            >
              <option value="json">Summary</option>
              <option value="pdf">PDF</option>
              <option value="excel">Excel</option>
            </select>
          </div>
          <button
            onClick={fetchReport}
            disabled={loading}
            className={`mt-4 sm:mt-0 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-indigo-700 hover:to-purple-700 transition flex items-center justify-center ${
              loading ? 'opacity-75 cursor-not-allowed' : ''
            }`}
            aria-label="Generate Report"
          >
            {loading && (
              <svg
                className="animate-spin h-5 w-5 mr-2 text-white"
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
            )}
            {loading ? 'Generating...' : 'Generate Report'}
          </button>
        </motion.div>

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

        <AnimatePresence>
          {report && !loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {[
                  { title: 'Opening Balance', value: report.openingBalance || 0 },
                  { title: 'Total Receivables', value: report.totalReceivables || 0 },
                  { title: 'Total Payables', value: report.totalPayables || 0 },
                  { title: 'Balance', value: report.balance || 0 },
                ].map((metric, index) => (
                  <motion.div
                    key={index}
                    whileHover={{ scale: 1.05 }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-gray-800 bg-opacity-50 backdrop-blur-lg p-6 rounded-xl shadow-lg text-center"
                  >
                    <h3 className="text-lg font-semibold text-gray-300">{metric.title}</h3>
                    <p className="text-3xl font-bold text-indigo-400">{formatCurrency(metric.value)}</p>
                  </motion.div>
                ))}
              </div>
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-gray-800 bg-opacity-50 backdrop-blur-lg p-6 rounded-xl shadow-lg mb-8"
              >
                <h3 className="text-lg font-semibold text-white mb-4">Category Summary</h3>
                {chartData && (
                  <div className="relative h-64">
                    <Chart type="pie" data={chartData} options={chartOptions} />
                  </div>
                )}
              </motion.div>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="bg-gray-800 bg-opacity-50 backdrop-blur-lg p-6 rounded-xl shadow-lg"
              >
                <h3 className="text-lg font-semibold text-white mb-4">Transactions</h3>
                  <TransactionTable
                              filters={filters}
                              onEdit={()=> setIsEditModalOpen(true)}
                              onDelete={(id) => {
                                // Handle delete action
    }}
                              refresh={() => fetchReport()}
                            />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}