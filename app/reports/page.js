'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Chart from '../../components/Chart';
import TransactionTable from '../../components/TransactionTable';
import { getSummaryReport } from '../../lib/api';
import { formatCurrency } from '../utils/helpers';
import api from '@/lib/api';

export default function Reports() {
  const [report, setReport] = useState(null);
  const [filters, setFilters] = useState({ startDate: '', endDate: '', format: 'json', role: 'admin', category: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  

  // Edit Modal States
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [formData, setFormData] = useState({
    transactionType: '',
    customerId: '',
    customerName: '',
    phone: '',
    totalAmount: '',
    payable: '',
    receivable: '',
    description: '',
    category: '',
    paymentMethod: '',
    date: '',
    dueDate: '',
    isRecurring: false,
    image: null,
    user: ''
  });
  
  // Delete Modal States
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState(null);
  
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

  const handleEdit = (transaction) => {
    setEditingTransaction(transaction);
    setFormData({
      transactionType: transaction.transactionType,
      customerId: transaction.customerId._id || transaction.customerId,
      customerName: transaction.customerId?.name || '',
      phone: transaction.customerId?.phone || '',
      totalAmount: transaction.totalAmount || '',
      payable: transaction.payable || '',
      receivable: transaction.receivable || '',
      description: transaction.description || '',
      category: transaction.category || '',
      paymentMethod: transaction.paymentMethod || '',
      date: transaction.date ? transaction.date.split('T')[0] : today,
      dueDate: transaction.dueDate ? transaction.dueDate.split('T')[0] : today,
      isRecurring: transaction.isRecurring || false,
      image: null,
      user: transaction.user || ''
    });
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.put(`/transactions/${editingTransaction._id}`, formData);
      setIsEditModalOpen(false);
      setEditingTransaction(null);
      setRefreshTrigger(prev => prev + 1);
      // Refresh the report data
      fetchReport();
    } catch (err) {
      setError('Error updating transaction: ' + (err.response?.data?.message || err.message));
      console.error('Update error:', err);
    } finally {
      setLoading(false);
    }
  };
  

  const handleDelete = (id) => {
    setTransactionToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    setLoading(true);
    try {
      await api.delete(`/transactions/${transactionToDelete}`);
      setIsDeleteModalOpen(false);
      setTransactionToDelete(null);
      setRefreshTrigger(prev => prev + 1);
      // Refresh the report data
      fetchReport();
    } catch (err) {
      setError('Error deleting transaction: ' + (err.response?.data?.message || err.message));
      console.error('Delete error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
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
            <button 
              onClick={() => setError('')}
              className="ml-4 text-red-300 hover:text-red-100"
            >
              ×
            </button>
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
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  refresh={refreshTrigger}
                />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Edit Transaction Modal */}
        <AnimatePresence>
          {isEditModalOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
              >
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold text-white">Edit Transaction</h2>
                  <button
                    onClick={() => setIsEditModalOpen(false)}
                    className="text-gray-400 hover:text-white"
                  >
                    ×
                  </button>
                </div>
                
                <form onSubmit={handleSaveEdit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Transaction Type
                      </label>
                      <select
                        name="transactionType"
                        value={formData.transactionType}
                        onChange={handleInputChange}
                        className="w-full p-3 bg-gray-700 text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        required
                      >
                        <option value="">Select Type</option>
                        <option value="receivable">Credit</option>
                        <option value="payable">Debit</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Customer Name
                      </label>
                      <input
                        type="text"
                        name="customerName"
                        value={formData.customerName}
                        onChange={handleInputChange}
                        className="w-full p-3 bg-gray-700 text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Total Amount
                      </label>
                      <input
                        type="number"
                        name="totalAmount"
                        value={formData.totalAmount}
                        onChange={handleInputChange}
                        className="w-full p-3 bg-gray-700 text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        step="0.01"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Category
                      </label>
                      <input
                        type="text"
                        name="category"
                        value={formData.category}
                        onChange={handleInputChange}
                        className="w-full p-3 bg-gray-700 text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Date
                      </label>
                      <input
                        type="date"
                        name="date"
                        value={formData.date}
                        onChange={handleInputChange}
                        className="w-full p-3 bg-gray-700 text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Due Date
                      </label>
                      <input
                        type="date"
                        name="dueDate"
                        value={formData.dueDate}
                        onChange={handleInputChange}
                        className="w-full p-3 bg-gray-700 text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Description
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      rows="3"
                      className="w-full p-3 bg-gray-700 text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  
                  <div className="flex justify-end space-x-4 pt-4">
                    <button
                      type="button"
                      onClick={() => setIsEditModalOpen(false)}
                      className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={true}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
                    >
                      {loading ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Delete Confirmation Modal */}
        <AnimatePresence>
          {isDeleteModalOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-gray-800 rounded-lg p-6 w-full max-w-md"
              >
                <h2 className="text-xl font-bold text-white mb-4">Confirm Delete</h2>
                <p className="text-gray-300 mb-6">
                  Are you sure you want to delete this transaction? This action cannot be undone.
                </p>
                
                <div className="flex justify-end space-x-4">
                  <button
                    onClick={() => setIsDeleteModalOpen(false)}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmDelete}
                    disabled={loading}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50"
                  >
                    {loading ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}