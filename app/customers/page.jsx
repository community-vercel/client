'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { debounce } from 'lodash';
import api from '../../lib/api';
import Link from 'next/link';
import { formatCurrency } from '../utils/helpers';
import TransactionModal from '../../components/TransactionModal';

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

  // Initialize userId
  useEffect(() => {
    const id = localStorage.getItem('userid');
    if (id) setUserId(id);
  }, []);

  // Fetch customers with debounced search
  const fetchCustomers = useCallback(async (searchQuery) => {
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
  }, []);

  const debouncedFetchCustomers = useCallback(debounce(fetchCustomers, 300), [fetchCustomers]);

  useEffect(() => {
    debouncedFetchCustomers(search);
    return () => debouncedFetchCustomers.cancel();
  }, [search, debouncedFetchCustomers]);

  // Handle customer form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/customers', formData);
      setFormData({ name: '', phone: '', address: '' });
      await fetchCustomers(search);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add customer.');
    }
  };

  // Handle customer deletion
  const handleDeleteCustomer = async (customerId) => {
    if (!confirm('Are you sure you want to delete this customer?')) return;
    try {
      await api.delete(`/customers/${customerId}`);
      await fetchCustomers(search);
      setSelectedCustomers((prev) => {
        const updated = new Set(prev);
        updated.delete(customerId);
        return updated;
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete customer.');
    }
  };

  // Handle bulk deletion
  const handleBulkDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${selectedCustomers.size} customer(s)?`)) return;
    try {
      setLoading(true);
      await Promise.all([...selectedCustomers].map((id) => api.delete(`/customers/${id}`)));
      await fetchCustomers(search);
      setSelectedCustomers(new Set());
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete selected customers.');
    } finally {
      setLoading(false);
    }
  };

  // Handle report generation
  const handleGenerateReport = async (customerId) => {
    try {
      const { data } = await api.get(`/reports/summary?customerId=${customerId}&format=${reportFormat}`);
      window.open(data.url, '_blank');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate report.');
    }
  };

  // Handle transaction submission
  const handleTransactionSubmit = async (form) => {
    try {
      const transactionType = form.get('transactionType');
      await api.post(`/${transactionType}s`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      await fetchCustomers(search); // Refresh customers to update balances
    } catch (err) {
      setError(err.response?.data?.message || `Error submitting ${form.get('transactionType')}`);
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

  return (
    <section className="bg-gradient-to-br from-gray-900 via-indigo-950 to-purple-950 py-10 px-4 sm:px-6 md:px-6 lg:px-8">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="w-full max-w-7xl mx-auto space-y-6"
      >
        {/* Header */}
        <header className="text-center mt-15">
          <h1 className="text-3xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight">Customer Management</h1>
          <p className="mt-2 text-base sm:text-base md:text-lg text-gray-300">Efficiently manage your customer relationships and financials.</p>
        </header>

        {/* Error Message */}
        <AnimatePresence>
          {error && (
            <motion.div
              variants={errorVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              className="bg-red-600 text-white p-4 rounded-xl shadow-lg text-center"
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
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 gap-4 bg-gray-800 bg-opacity-60 backdrop-blur-lg p-4 sm:p-4 md:p-6 rounded-xl shadow-xl"
          >
            <div className="text-center">
              <p className="text-sm font-semibold text-gray-300 uppercase">Total Customers</p>
              <p className="text-xl sm:text-xl md:text-2xl font-bold text-indigo-400 mt-2">{customers.length}</p>
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-gray-300 uppercase">Total Balance</p>
              <p className="text-xl sm:text-xl md:text-2xl font-bold text-indigo-400 mt-2">
                {formatCurrency(customers.reduce((sum, c) => sum + (c.balance || 0), 0))}
              </p>
            </div>
          </motion.div>
        )}

        {/* Add Customer Form */}
        <motion.div variants={containerVariants}>
          <form
            onSubmit={handleSubmit}
            className="bg-gray-800 bg-opacity-60 backdrop-blur-lg p-4 sm:p-4 md:p-6 rounded-xl shadow-xl space-y-5"
          >
            <h2 className="text-lg sm:text-lg md:text-xl font-semibold text-white mb-4">Add New Customer</h2>
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
              className="mt-4 w-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white p-3 rounded-lg font-semibold hover:from-indigo-600 hover:to-purple-600 transition"
              aria-label="Add Customer"
            >
              Add Customer
            </button>
          </form>
        </motion.div>

        {/* Search and Report Format */}
        <motion.div variants={containerVariants} className="flex flex-col sm:flex-col md:flex-row gap-4">
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
          <div className="w-full sm:w-full md:w-36">
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
            className="bg-gray-800 bg-opacity-60 backdrop-blur-lg p-4 rounded-xl shadow-xl flex flex-col sm:flex-col md:flex-row md:justify-between md:items-center gap-4"
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
              customers.map((customer) => (
                <motion.div
                  key={customer._id}
                  variants={itemVariants}
                  className="p-4 bg-gray-800 bg-opacity-60 backdrop-blur-lg rounded-xl shadow-xl flex flex-col sm:flex-col md:flex-row md:items-center md:justify-between gap-4 hover:bg-opacity-70 transition"
                >
                  <div className="flex items-center space-x-4">
                    {/* <input
                      type="checkbox"
                      checked={selectedCustomers.has(customer._id)}
                      onChange={() => toggleCustomerSelection(customer._id)}
                      className="text-indigo-400 focus:ring-indigo-400"
                      aria-label={`Select ${customer.name}`}
                    /> */}
                    <div>
                      <Link href={`/transactions?customerId=${customer._id}`}>
                        <span className="text-indigo-400 hover:underline font-medium">{customer.name}</span>
                      </Link>
                      <p className="text-gray-300 text-sm">Phone: {customer.phone || 'N/A'}</p>
                      <p className="text-gray-300 text-sm">Address: {customer.address || 'N/A'}</p>
                      <p className="text-gray-300 text-sm">
                        Balance:{' '}
                        <span className={customer.balance >= 0 ? 'text-green-400' : 'text-red-400'}>
                          {formatCurrency(customer.balance)}
                        </span>
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => openTransactionModal(customer)}
                      className="bg-green-500 text-white px-3 sm:px-3 md:px-4 py-2 rounded-lg hover:bg-green-600 transition"
                      aria-label={`Add Transaction for ${customer.name}`}
                    >
                      Add Transaction
                    </button>
                    <button
                      onClick={() => handleGenerateReport(customer._id)}
                      className="bg-blue-500 text-white px-3 sm:px-3 md:px-4 py-2 rounded-lg hover:bg-blue-600 transition"
                      aria-label={`Generate Report for ${customer.name}`}
                    >
                      Generate Report
                    </button>
                    <button
                      onClick={() => handleDeleteCustomer(customer._id)}
                      className="bg-red-500 text-white px-3 sm:px-3 md:px-4 py-2 rounded-lg hover:bg-red-600 transition"
                      aria-label={`Delete ${customer.name}`}
                    >
                      Delete
                    </button>
                  </div>
                </motion.div>
              ))
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