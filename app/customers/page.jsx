'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { debounce } from 'lodash';
import api from '../../lib/api';
import Link from 'next/link';
import { formatCurrency } from '../utils/helpers';
import TransactionModal from '../../components/TransactionModal';
import Chart from '../../components/Chart';

// Animation variants
const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
};

const itemVariants = {
  hidden: { opacity: 0, x: -10 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.3 } },
};

const errorVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.3 } },
};

const REPORT_FORMATS = [
  { value: 'pdf', label: 'PDF' },
  { value: 'excel', label: 'Excel' },
  { value: 'json', label: 'Summary' }, // Added JSON format for inline summary
];

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [formData, setFormData] = useState({ name: '', phone: '', address: '' });
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [reportFormat, setReportFormat] = useState('pdf');
  const [selectedCustomers, setSelectedCustomers] = useState(new Set());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [userId, setUserId] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [customerSummaries, setCustomerSummaries] = useState({}); // New state for summaries
  const [expandedCustomer, setExpandedCustomer] = useState(null); // Track expanded customer for summary

  // Initialize userId
  useEffect(() => {
    const id = localStorage.getItem('userid');
    if (id) setUserId(id);
  }, []);

  // Fetch customers with debounced search
  const fetchCustomers = useCallback(
    async (searchQuery) => {
      setLoading(true);
      setError('');
      try {
        const { data } = await api.get(`/customers?search=${searchQuery}`);
        setCustomers(data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load customers.');
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const debouncedFetchCustomers = useCallback(debounce(fetchCustomers, 300), [fetchCustomers]);

  useEffect(() => {
    debouncedFetchCustomers(search);
    return () => debouncedFetchCustomers.cancel();
  }, [search, refreshTrigger, debouncedFetchCustomers]);

  // Handle customer form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/customers', { ...formData, user: userId });
      setFormData({ name: '', phone: '', address: '' });
      setRefreshTrigger((prev) => prev + 1);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add customer.');
    }
  };

  // Handle customer deletion
  const handleDeleteCustomer = async (customerId) => {
    if (!confirm('Are you sure you want to delete this customer?')) return;
    try {
      await api.delete(`/customers/${customerId}`);
      setRefreshTrigger((prev) => prev + 1);
      setSelectedCustomers((prev) => {
        const updated = new Set(prev);
        updated.delete(customerId);
        return updated;
      });
      setCustomerSummaries((prev) => {
        const updated = { ...prev };
        delete updated[customerId];
        return updated;
      });
    } catch (err) {
      setError(
        err.response?.data?.message || 'Failed to delete customer. Ensure no transactions are associated.'
      );
    }
  };

  // Handle bulk deletion
  const handleBulkDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${selectedCustomers.size} customer(s)?`)) return;
    try {
      setLoading(true);
      await Promise.all([...selectedCustomers].map((id) => api.delete(`/customers/${id}`)));
      setRefreshTrigger((prev) => prev + 1);
      setSelectedCustomers(new Set());
      setCustomerSummaries((prev) => {
        const updated = { ...prev };
        [...selectedCustomers].forEach((id) => delete updated[id]);
        return updated;
      });
    } catch (err) {
      setError(
        err.response?.data?.message || 'Failed to delete selected customers. Some may have associated transactions.'
      );
    } finally {
      setLoading(false);
    }
  };

  // Handle report generation
  const handleGenerateReport = async (customerId) => {
    setError('');
    try {
      const { data } = await api.get(`/reports/summary?customerId=${customerId}&format=${reportFormat}`);
      if (reportFormat === 'json') {
        // Store summary data for inline display
        setCustomerSummaries((prev) => ({
          ...prev,
          [customerId]: data,
        }));
        setExpandedCustomer(customerId); // Expand the customer's summary
      } else {
        // Download PDF or Excel
        window.open(data.url, '_blank');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate report.');
    }
  };

  // Handle transaction submission
  const handleTransactionSubmit = async (form) => {
    try {
      await api.post('/transactions', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setRefreshTrigger((prev) => prev + 1); // Refresh customers to update balances
      setCustomerSummaries((prev) => {
        const updated = { ...prev };
        delete updated[form.customerId]; // Clear summary to force refresh
        return updated;
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Error submitting transaction.');
      throw err;
    }
  };

  // Toggle customer selection
  const toggleCustomerSelection = (customerId) => {
    setSelectedCustomers((prev) => {
      const updated = new Set(prev);
      if (updated.has(customerId)) updated.delete(customerId);
      else updated.add(customerId);
      return updated;
    });
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value: rawValue } = e.target;
    const value = name === 'phone' ? rawValue.replace(/[^0-9+\-()\s]/g, '') : rawValue;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Open transaction modal
  const openTransactionModal = (customer) => {
    setSelectedCustomer({ customerId: customer._id, customerName: customer.name });
    setIsModalOpen(true);
  };

  // Chart options for category summary
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
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
    <section className="bg-gradient-to-br from-gray-900 via-indigo-950 to-purple-950 py-10 px-4 sm:px-6 lg:px-8">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="w-full max-w-7xl mx-auto space-y-6"
      >
        {/* Header */}
        <header className="text-center">
          <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
            Customer Management
          </h1>
          <p className="mt-2 text-base md:text-lg text-gray-300">
            Efficiently manage your customer relationships and financials.
          </p>
        </header>

        {/* Error Message */}
        <AnimatePresence>
          {error && (
            <motion.div
              variants={errorVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              className="bg-red-900 bg-opacity-50 text-red-200 p-4 rounded-lg text-center"
              role="alert"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Customer Summary */}
        {!loading && (
          <motion.div
            variants={containerVariants}
            className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-800 bg-opacity-60 backdrop-blur-lg p-6 rounded-xl shadow-xl"
          >
            <div className="text-center">
              <p className="text-sm font-semibold text-gray-300 uppercase">Total Customers</p>
              <p className="text-2xl font-bold text-indigo-400 mt-2">{customers.length}</p>
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-gray-300 uppercase">Total Balance</p>
              <p className="text-2xl font-bold text-indigo-400 mt-2">
                {formatCurrency(customers.reduce((sum, c) => sum + (c.balance || 0), 0).toFixed(2))}
              </p>
            </div>
          </motion.div>
        )}

        {/* Add Customer Form */}
        <motion.div variants={containerVariants}>
          <form
            onSubmit={handleSubmit}
            className="bg-gray-800 bg-opacity-60 backdrop-blur-lg p-6 rounded-xl shadow-xl space-y-5"
          >
            <h2 className="text-xl font-semibold text-white mb-4">Add New Customer</h2>
            <div className="grid grid-cols-1 gap-4">
              <input
                type="text"
                name="name"
                placeholder="Customer Name"
                value={formData.name}
                onChange={handleInputChange}
                className="p-3 bg-gray-700 text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
                required
                aria-label="Customer Name"
              />
              <input
                type="text"
                name="phone"
                placeholder="Phone (optional)"
                value={formData.phone}
                onChange={handleInputChange}
                className="p-3 bg-gray-700 text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
                aria-label="Customer Phone"
              />
              <input
                type="text"
                name="address"
                placeholder="Address (optional)"
                value={formData.address}
                onChange={handleInputChange}
                className="p-3 bg-gray-700 text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
                aria-label="Customer Address"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white p-3 rounded-lg font-semibold hover:from-indigo-600 hover:to-purple-600 transition"
              aria-label="Add Customer"
            >
              Add Customer
            </button>
          </form>
        </motion.div>

        {/* Search and Report Format */}
        <motion.div variants={containerVariants} className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by name or phone"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full p-3 bg-gray-700 text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
              aria-label="Search Customers"
            />
          </div>
          <div className="w-full md:w-36">
            <select
              value={reportFormat}
              onChange={(e) => setReportFormat(e.target.value)}
              className="w-full p-3 bg-gray-700 text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
              aria-label="Report Format"
            >
              {REPORT_FORMATS.map(({ value, label }) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </motion.div>

        {/* Bulk Actions */}
        {selectedCustomers.size > 0 && (
          <motion.div
            variants={containerVariants}
            className="bg-gray-800 bg-opacity-60 backdrop-blur-lg p-4 rounded-xl shadow-xl flex flex-col md:flex-row md:justify-between md:items-center gap-4"
          >
            <p className="text-white">{selectedCustomers.size} customer(s) selected</p>
            <button
              onClick={handleBulkDelete}
              className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition"
              aria-label="Delete Selected Customers"
            >
              Delete Selected
            </button>
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
              aria-label="Loading"
            >
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v8h8a8 8 0 01-8 8 8 8 0 01-8-8z"
              />
            </svg>
            <p className="text-white mt-2">Loading customers...</p>
          </div>
        )}

        {/* Customer List */}
        {!loading && (
          <motion.div variants={containerVariants} className="space-y-4">
            {customers.length === 0 ? (
              <p className="text-center text-gray-300">No customers found.</p>
            ) : (
              customers.map((customer) => {
                const summary = customerSummaries[customer._id];
                const chartData = summary && {
                  labels: Object.keys(summary.categorySummary || {}),
                  datasets: [
                    {
                      label: 'Category Summary',
                      data: Object.values(summary.categorySummary || {}),
                      backgroundColor: ['#4f46e5', '#ef4444', '#10b981', '#f59e0b', '#6b7280'],
                      hoverBackgroundColor: ['#4338ca', '#dc2626', '#059669', '#d97706', '#4b5563'],
                      borderWidth: 2,
                      borderColor: '#ffffff',
                    },
                  ],
                };

                return (
                  <motion.div
                    key={customer._id}
                    variants={itemVariants}
                    className="p-0 bg-gray-800 bg-opacity-60 backdrop-blur-lg rounded-xl shadow-xl space-y-4 hover:bg-opacity-70 transition"
                  >
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div className="flex items-center space-x-4">
                        <input
                          type="checkbox"
                          checked={selectedCustomers.has(customer._id)}
                          onChange={() => toggleCustomerSelection(customer._id)}
                          className="text-indigo-400 focus:ring-indigo-400"
                          aria-label={`Select ${customer.name}`}
                        />
                        <div>
                          <Link href={`/transactions?customerId=${customer._id}`}>
                            <span className="text-indigo-400 hover:underline font-medium">{customer.name}</span>
                          </Link>
                          <p className="text-gray-300 text-sm">Phone: {customer.phone || 'N/A'}</p>
                          <p className="text-gray-300 text-sm">Address: {customer.address || 'N/A'}</p>
                          <p className="text-gray-300 text-sm">
                            Balance:{' '}
                            <span className={customer.balance >= 0 ? 'text-green-400' : 'text-red-400'}>
                              {formatCurrency((customer.balance || 0).toFixed(2))}
                            </span>
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => openTransactionModal(customer)}
                          className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition"
                          aria-label={`Add Transaction for ${customer.name}`}
                        >
                          Add Transaction
                        </button>
                        <button
                          onClick={() => handleGenerateReport(customer._id)}
                          className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition"
                          aria-label={`Generate Report for ${customer.name}`}
                        >
                          {reportFormat === 'json' ? 'View Summary' : 'Generate Report'}
                        </button>
                        <button
                          onClick={() => handleDeleteCustomer(customer._id)}
                          className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition"
                          aria-label={`Delete ${customer.name}`}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                    {/* Customer Summary Section */}
                    <AnimatePresence>
                      {summary && expandedCustomer === customer._id && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3 }}
                          className="bg-gray-700 bg-opacity-50 p-4 rounded-lg mt-4"
                        >
                          <h3 className="text-lg font-semibold text-white mb-4">Financial Summary</h3>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                            {[
                              { title: 'Opening Balance', value: summary.openingBalance || 0 },
                              { title: 'Total Receivables', value: summary.totalReceivables || 0 },
                              { title: 'Total Payables', value: summary.totalPayables || 0 },
                              { title: 'Balance', value: summary.balance || 0 },
                            ].map((metric, index) => (
                              <div key={index} className="text-center">
                                <p className="text-sm font-semibold text-gray-300 uppercase">{metric.title}</p>
                                <p className="text-xl font-bold text-indigo-400">{formatCurrency(metric.value)}</p>
                              </div>
                            ))}
                          </div>
                          {chartData && (
                            <div className="mt-4">
                              <h4 className="text-sm font-semibold text-white mb-2">Category Summary</h4>
                              <div className="relative h-96">
                                <Chart type="pie" data={chartData} options={chartOptions} />
                              </div>
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })
            )}
          </motion.div>
        )}

        {/* Transaction Modal */}
        <TransactionModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedCustomer(null);
            setError('');
          }}
          onSubmit={handleTransactionSubmit}
          initialCustomer={selectedCustomer}
          customers={customers}
          userId={userId}
          error={error}
          setError={setError}
        />
      </motion.div>
    </section>
  );
}